def _create(client, headers, key="k-1", amount=500, currency="UZS"):
    return client.post(
        "/payments",
        json={"amount": amount, "currency": currency, "idempotency_key": key},
        headers=headers,
    )


def test_create_payment(client, admin_headers):
    r = _create(client, admin_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "created"
    assert body["amount"] == 500


def test_get_payment(client, admin_headers):
    pid = _create(client, admin_headers, key="k-get").json()["id"]
    r = client.get(f"/payments/{pid}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["id"] == pid


def test_get_missing_payment_404(client, admin_headers):
    r = client.get("/payments/9999", headers=admin_headers)
    assert r.status_code == 404


def test_send_to_bank_flow(client, admin_headers):
    pid = _create(client, admin_headers, key="k-send").json()["id"]
    r = client.post(f"/payments/{pid}/send-to-bank", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "sent_to_bank"
    assert body["external_bank_id"] == f"BANK-{pid}"


def test_payment_status_endpoint(client, admin_headers):
    pid = _create(client, admin_headers, key="k-status").json()["id"]
    r = client.get(f"/payments/{pid}/status", headers=admin_headers)
    assert r.status_code == 200
    assert r.json() == {"id": pid, "status": "created"}


def test_invalid_amount_rejected(client, admin_headers):
    r = client.post(
        "/payments",
        json={"amount": -5, "currency": "UZS", "idempotency_key": "k-bad"},
        headers=admin_headers,
    )
    assert r.status_code == 422  # amount должен быть > 0
