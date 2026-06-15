def test_register_and_login(client):
    r = client.post(
        "/auth/register",
        json={"email": "ivan@test.io", "password": "secret123", "role": "manager"},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "ivan@test.io"

    r = client.post(
        "/auth/login", json={"email": "ivan@test.io", "password": "secret123"}
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    client.post(
        "/auth/register",
        json={"email": "anna@test.io", "password": "secret123", "role": "viewer"},
    )
    r = client.post(
        "/auth/login", json={"email": "anna@test.io", "password": "wrong"}
    )
    assert r.status_code == 401


def test_protected_endpoint_without_token(client):
    r = client.get("/payments")
    assert r.status_code == 401


def test_viewer_cannot_create_payment(client, viewer_headers):
    r = client.post(
        "/payments",
        json={"amount": 100, "currency": "UZS", "idempotency_key": "k-viewer"},
        headers=viewer_headers,
    )
    assert r.status_code == 403  # роль viewer не имеет прав на создание платежа
