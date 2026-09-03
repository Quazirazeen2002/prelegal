from fastapi.testclient import TestClient


def test_signup_creates_user_and_sets_cookie(client: TestClient) -> None:
    response = client.post(
        "/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "id" in body
    assert "prelegal_session" in response.cookies


def test_signup_duplicate_email_rejected(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"})
    response = client.post(
        "/api/auth/signup", json={"email": "alice@example.com", "password": "another-password"}
    )
    assert response.status_code == 409


def test_signup_rejects_short_password(client: TestClient) -> None:
    response = client.post("/api/auth/signup", json={"email": "alice@example.com", "password": "short"})
    assert response.status_code == 422


def test_signin_with_correct_credentials(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"})
    response = client.post(
        "/api/auth/signin", json={"email": "alice@example.com", "password": "correct-horse"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_signin_with_wrong_password_rejected(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"})
    response = client.post(
        "/api/auth/signin", json={"email": "alice@example.com", "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_signin_unknown_email_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/auth/signin", json={"email": "nobody@example.com", "password": "whatever1"}
    )
    assert response.status_code == 401


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user_after_signup(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"})
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_signout_clears_session(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"})
    signout_response = client.post("/api/auth/signout")
    assert signout_response.status_code == 204

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401


def test_me_rejects_tampered_token(client: TestClient) -> None:
    client.cookies.set("prelegal_session", "not-a-real-token")
    response = client.get("/api/auth/me")
    assert response.status_code == 401
