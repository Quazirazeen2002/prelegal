import pytest
from fastapi.testclient import TestClient

from app.document_analysis import (
    ClauseExplanation,
    ComparisonResult,
    DeviationItem,
    RiskItem,
)


def _signup(client: TestClient, email: str = "alice@example.com") -> None:
    response = client.post("/api/auth/signup", json={"email": email, "password": "password123"})
    assert response.status_code == 201


@pytest.fixture()
def mock_analysis(monkeypatch: pytest.MonkeyPatch):
    """By default, a full successful analysis pipeline. Tests can monkeypatch
    individual pieces further to simulate partial failures."""
    monkeypatch.setattr("app.routers.uploads.match_catalog_type", lambda _text: "csa")
    monkeypatch.setattr("app.routers.uploads.generate_summary", lambda _text: "A plain-English summary.")
    monkeypatch.setattr(
        "app.routers.uploads.detect_risks",
        lambda _text: [
            RiskItem(title="Uncapped liability", description="...", severity="high", relatedClause="8")
        ],
    )
    monkeypatch.setattr(
        "app.routers.uploads.explain_clauses",
        lambda _text: [ClauseExplanation(clauseTitle="Term", plainEnglish="How long this lasts.")],
    )
    monkeypatch.setattr(
        "app.routers.uploads.compare_to_template",
        lambda _text, _key: ComparisonResult(
            deviations=[
                DeviationItem(
                    topic="Liability cap",
                    standardTerm="Capped.",
                    uploadedDocumentTerm="Uncapped.",
                    assessment="Riskier than standard.",
                )
            ]
        ),
    )


def test_list_uploads_requires_authentication(client: TestClient) -> None:
    assert client.get("/api/uploads").status_code == 401


def test_upload_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/uploads", files={"file": ("a.txt", b"hello", "text/plain")})
    assert response.status_code == 401


def test_upload_and_analyze_a_document(client: TestClient, mock_analysis) -> None:
    _signup(client)

    response = client.post(
        "/api/uploads", files={"file": ("agreement.txt", b"This is a cloud agreement.", "text/plain")}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "processed"
    assert body["filename"] == "agreement.txt"
    assert body["fileType"] == "txt"
    assert body["summary"] == "A plain-English summary."
    assert body["risks"][0]["severity"] == "high"
    assert body["clauses"][0]["clauseTitle"] == "Term"
    assert body["matchedCatalogKey"] == "csa"
    assert body["matchedCatalogName"] == "Cloud Service Agreement"
    assert body["comparison"]["deviations"][0]["topic"] == "Liability cap"


def test_upload_rejects_unsupported_file_type(client: TestClient, mock_analysis) -> None:
    _signup(client)
    response = client.post(
        "/api/uploads", files={"file": ("image.png", b"not a document", "image/png")}
    )
    assert response.status_code == 400


def test_upload_marks_status_error_when_analysis_fails(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _signup(client)

    def raise_error(_text):
        raise RuntimeError("upstream boom")

    monkeypatch.setattr("app.routers.uploads.match_catalog_type", raise_error)

    response = client.post(
        "/api/uploads", files={"file": ("agreement.txt", b"Some text.", "text/plain")}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "error"
    assert body["errorMessage"]


def test_list_and_get_and_delete_upload(client: TestClient, mock_analysis) -> None:
    _signup(client)
    created = client.post(
        "/api/uploads", files={"file": ("agreement.txt", b"Some text.", "text/plain")}
    ).json()

    list_response = client.get("/api/uploads")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert "summary" not in list_response.json()[0]  # lightweight list shape

    get_response = client.get(f"/api/uploads/{created['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["summary"] == "A plain-English summary."

    delete_response = client.delete(f"/api/uploads/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/uploads/{created['id']}").status_code == 404


def test_uploads_are_isolated_between_users(client: TestClient, mock_analysis) -> None:
    _signup(client, "alice@example.com")
    created = client.post(
        "/api/uploads", files={"file": ("agreement.txt", b"Some text.", "text/plain")}
    ).json()

    client.post("/api/auth/signout")
    _signup(client, "bob@example.com")

    assert client.get(f"/api/uploads/{created['id']}").status_code == 404
    assert client.get("/api/uploads").json() == []
