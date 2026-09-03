from fastapi.testclient import TestClient


def test_database_is_recreated_empty_on_startup(client: TestClient) -> None:
    """Each app startup (lifespan) runs init_db(), which drops and recreates all
    tables — simulating a fresh container start with a clean, temporary database."""
    signup_response = client.post(
        "/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"}
    )
    assert signup_response.status_code == 201

    import app.db as db_module

    db_module.init_db()

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401

    signup_again = client.post(
        "/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"}
    )
    assert signup_again.status_code == 201
