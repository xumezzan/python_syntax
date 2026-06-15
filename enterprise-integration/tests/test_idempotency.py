from app.services.bank_client import BankClient
from app.utils.retry import RetryError


def test_duplicate_idempotency_key_returns_same_payment(client, admin_headers):
    payload = {"amount": 500, "currency": "UZS", "idempotency_key": "same-key"}

    first = client.post("/payments", json=payload, headers=admin_headers)
    assert first.status_code == 201  # новый платёж создан

    second = client.post("/payments", json=payload, headers=admin_headers)
    assert second.status_code == 200  # дубль: вернули существующий, не создали новый

    assert first.json()["id"] == second.json()["id"]

    # в списке платежей — ровно один с этим ключом
    all_payments = client.get("/payments", headers=admin_headers).json()
    same_key = [p for p in all_payments if p["idempotency_key"] == "same-key"]
    assert len(same_key) == 1


def test_bank_retry_succeeds_after_transient_failures():
    # банк «моргнул» 2 раза, с 3-й попытки — успех
    client = BankClient(fail_times=2)

    class FakePayment:
        id = 7

    result = client.send_payment(FakePayment())
    assert result["external_bank_id"] == "BANK-7"
    assert result["status"] == "accepted"


def test_bank_retry_gives_up_after_limit():
    # банк падает больше лимита попыток → RetryError
    client = BankClient(fail_times=5)

    class FakePayment:
        id = 9

    try:
        client.send_payment(FakePayment())
        assert False, "ожидали RetryError"
    except RetryError:
        pass
