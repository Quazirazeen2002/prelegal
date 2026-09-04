import json

import pytest
from fastapi.testclient import TestClient


def _fake_completion(content: dict):
    class _Message:
        def __init__(self, content_str: str) -> None:
            self.content = content_str

    class _Choice:
        def __init__(self, content_str: str) -> None:
            self.message = _Message(content_str)

    class _Response:
        def __init__(self, content_str: str) -> None:
            self.choices = [_Choice(content_str)]

    return _Response(json.dumps(content))


@pytest.fixture()
def mock_completion(monkeypatch: pytest.MonkeyPatch):
    def _install(result: dict):
        def fake(*_args, **_kwargs):
            return _fake_completion(result)

        monkeypatch.setattr("app.llm.completion", fake)

    return _install


def test_list_document_types_excludes_cover_page(client: TestClient) -> None:
    response = client.get("/api/chat/document-types")
    assert response.status_code == 200
    keys = [d["key"] for d in response.json()]
    assert len(keys) == 11
    assert "mutual-nda-coverpage" not in keys


def test_detect_document_type_maps_name_back_to_key(client: TestClient, mock_completion) -> None:
    mock_completion({"reply": "Sure thing!", "documentType": "Cloud Service Agreement"})

    response = client.post(
        "/api/chat/detect-document-type",
        json={"messages": [{"role": "user", "content": "I need a cloud service agreement"}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "csa"
    assert body["reply"] == "Sure thing!"


def test_detect_document_type_null_when_still_unclear(client: TestClient, mock_completion) -> None:
    mock_completion({"reply": "What kind of document do you need?", "documentType": None})

    response = client.post(
        "/api/chat/detect-document-type",
        json={"messages": [{"role": "user", "content": "hi"}]},
    )

    assert response.status_code == 200
    assert response.json()["documentType"] is None


def test_detect_document_type_llm_failure_returns_502(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(*_args, **_kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.llm.completion", raise_error)

    response = client.post(
        "/api/chat/detect-document-type", json={"messages": [{"role": "user", "content": "hi"}]}
    )
    assert response.status_code == 502


def test_generic_message_merges_fields_and_respects_completeness_gate(
    client: TestClient, mock_completion
) -> None:
    mock_completion(
        {
            "reply": "Got it, and who's the provider?",
            "fields": {"customer": "Acme, Inc."},
            "isComplete": True,  # model claims complete despite a missing variable
        }
    )

    response = client.post(
        "/api/chat/generic-message",
        json={
            "messages": [{"role": "user", "content": "Our company is Acme, Inc."}],
            "documentType": "csa",
            "variables": ["Customer", "Provider"],
            "fields": {},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["fields"]["customer"] == "Acme, Inc."
    # Backend must not trust isComplete=True when "Provider" is still unfilled.
    assert body["isComplete"] is False


def test_generic_message_is_complete_when_all_variables_filled_and_confirmed(
    client: TestClient, mock_completion
) -> None:
    mock_completion({"reply": "All set!", "fields": {}, "isComplete": True})

    response = client.post(
        "/api/chat/generic-message",
        json={
            "messages": [{"role": "user", "content": "Looks good."}],
            "documentType": "csa",
            "variables": ["Customer"],
            "fields": {"customer": "Acme, Inc."},
        },
    )

    assert response.json()["isComplete"] is True


def test_generic_message_rejects_unknown_document_type(client: TestClient) -> None:
    response = client.post(
        "/api/chat/generic-message",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "documentType": "not-a-real-doc",
            "variables": [],
            "fields": {},
        },
    )
    assert response.status_code == 400
