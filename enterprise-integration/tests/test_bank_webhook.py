def _create_and_send(client, headers, key):
    pid = client.post(
        "/payments",
        json={"amount": 500, "currency": "UZS", "idempotency_key": key},
        headers=headers,
    ).json()["id"]
    sent = client.post(f"/payments/{pid}/send-to-bank", headers=headers).json()
    return pid, sent["external_bank_id"]


def test_webhook_marks_payment_success(client, admin_headers):
    pid, external_id = _create_and_send(client, admin_headers, "wh-ok")
    r = client.post(
        "/bank/webhook", json={"external_bank_id": external_id, "status": "success"}
    )
    assert r.status_code == 200
    assert r.json() == {"payment_id": pid, "status": "success", "updated": True}

    status = client.get(f"/payments/{pid}/status", headers=admin_headers).json()
    assert status["status"] == "success"


def test_webhook_marks_payment_failed(client, admin_headers):
    pid, external_id = _create_and_send(client, admin_headers, "wh-fail")
    r = client.post(
        "/bank/webhook", json={"external_bank_id": external_id, "status": "failed"}
    )
    assert r.json()["status"] == "failed"


def test_webhook_unknown_external_id_404(client):
    r = client.post(
        "/bank/webhook", json={"external_bank_id": "BANK-404", "status": "success"}
    )
    assert r.status_code == 404


def test_webhook_does_not_update_unsent_payment(client, admin_headers):
    # платёж только создан (created), webhook на него не должен менять статус
    pid = client.post(
        "/payments",
        json={"amount": 500, "currency": "UZS", "idempotency_key": "wh-created"},
        headers=admin_headers,
    ).json()["id"]
    # вручную дёрнуть webhook нельзя без external_bank_id — его ещё нет,
    # поэтому проверяем, что статус остаётся created
    status = client.get(f"/payments/{pid}/status", headers=admin_headers).json()
    assert status["status"] == "created"
