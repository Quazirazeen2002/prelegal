from fastapi.testclient import TestClient


def _signup(client: TestClient, email: str) -> None:
    response = client.post("/api/auth/signup", json={"email": email, "password": "password123"})
    assert response.status_code == 201


def test_list_documents_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/documents")
    assert response.status_code == 401


def test_create_and_list_document(client: TestClient) -> None:
    _signup(client, "alice@example.com")

    create_response = client.post(
        "/api/documents",
        json={"documentType": "csa", "title": "Acme <> CloudCo", "fields": {"customer": "Acme"}},
    )
    assert create_response.status_code == 201
    body = create_response.json()
    assert body["documentType"] == "csa"
    assert body["fields"] == {"customer": "Acme"}

    list_response = client.get("/api/documents")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["title"] == "Acme <> CloudCo"


def test_get_document_by_id(client: TestClient) -> None:
    _signup(client, "alice@example.com")
    created = client.post(
        "/api/documents", json={"documentType": "mutual-nda", "title": "NDA", "fields": {}}
    ).json()

    response = client.get(f"/api/documents/{created['id']}")
    assert response.status_code == 200
    assert response.json()["title"] == "NDA"


def test_update_document_merges_title_and_fields(client: TestClient) -> None:
    _signup(client, "alice@example.com")
    created = client.post(
        "/api/documents",
        json={"documentType": "csa", "title": "Draft", "fields": {"customer": "Acme"}},
    ).json()

    response = client.put(
        f"/api/documents/{created['id']}",
        json={"fields": {"customer": "Acme", "provider": "CloudCo"}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Draft"  # unchanged since not provided
    assert body["fields"] == {"customer": "Acme", "provider": "CloudCo"}


def test_delete_document(client: TestClient) -> None:
    _signup(client, "alice@example.com")
    created = client.post(
        "/api/documents", json={"documentType": "csa", "title": "Draft", "fields": {}}
    ).json()

    delete_response = client.delete(f"/api/documents/{created['id']}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/documents/{created['id']}")
    assert get_response.status_code == 404


def test_documents_are_isolated_between_users(client: TestClient) -> None:
    _signup(client, "alice@example.com")
    created = client.post(
        "/api/documents", json={"documentType": "csa", "title": "Alice's doc", "fields": {}}
    ).json()

    client.post("/api/auth/signout")
    _signup(client, "bob@example.com")

    response = client.get(f"/api/documents/{created['id']}")
    assert response.status_code == 404

    list_response = client.get("/api/documents")
    assert list_response.json() == []
