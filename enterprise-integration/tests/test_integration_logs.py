def test_send_to_bank_creates_integration_log(client, admin_headers):
    pid = client.post(
        "/payments",
        json={"amount": 500, "currency": "UZS", "idempotency_key": "log-1"},
        headers=admin_headers,
    ).json()["id"]
    client.post(f"/payments/{pid}/send-to-bank", headers=admin_headers)

    logs = client.get("/integration-logs", headers=admin_headers).json()
    assert any(
        log["system_name"] == "bank" and log["direction"] == "outgoing" for log in logs
    )


def test_get_single_log(client, admin_headers):
    pid = client.post(
        "/payments",
        json={"amount": 500, "currency": "UZS", "idempotency_key": "log-2"},
        headers=admin_headers,
    ).json()["id"]
    client.post(f"/payments/{pid}/send-to-bank", headers=admin_headers)

    logs = client.get("/integration-logs", headers=admin_headers).json()
    log_id = logs[0]["id"]
    r = client.get(f"/integration-logs/{log_id}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["id"] == log_id


def test_logs_require_auth(client):
    assert client.get("/integration-logs").status_code == 401


def test_sap_orders_and_payment_request(client, admin_headers):
    orders = client.get("/sap/orders", headers=admin_headers).json()
    assert len(orders) >= 1
    sap_order_id = orders[0]["sap_order_id"]

    r = client.post(
        "/sap/payment-request",
        json={"sap_order_id": sap_order_id, "idempotency_key": "sap-pay-1"},
        headers=admin_headers,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["sap_document_id"] == sap_order_id  # data mapping SAP → платёж
    # incoming-лог от SAP записан
    logs = client.get("/integration-logs", headers=admin_headers).json()
    assert any(log["system_name"] == "sap" for log in logs)
