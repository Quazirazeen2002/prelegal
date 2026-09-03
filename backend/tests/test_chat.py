import json

import pytest
from fastapi.testclient import TestClient

DEFAULT_FIELDS = {
    "purpose": "",
    "effectiveDate": "2026-09-03",
    "mndaTermType": "expires",
    "mndaTermYears": 1,
    "confidentialityTermType": "term",
    "confidentialityTermYears": 1,
    "governingLaw": "",
    "jurisdiction": "",
    "modifications": "",
    "party1": {"company": "", "printName": "", "title": "", "noticeAddress": ""},
    "party2": {"company": "", "printName": "", "title": "", "noticeAddress": ""},
}


def _fake_completion(content: dict):
    """Builds a stand-in for litellm's `completion(...)` return value, whose only
    part the app code touches is `response.choices[0].message.content`."""

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
    calls = []

    def _install(result: dict):
        def fake(*_args, **kwargs):
            calls.append(kwargs)
            return _fake_completion(result)

        monkeypatch.setattr("app.chat.completion", fake)
        return calls

    return _install


def test_extracted_field_is_merged_into_response(client: TestClient, mock_completion) -> None:
    mock_completion(
        {
            "reply": "Got it, what's the purpose of this NDA?",
            "fields": {"purpose": "Evaluating a joint venture."},
            "isComplete": False,
        }
    )

    response = client.post(
        "/api/chat/message",
        json={
            "messages": [{"role": "user", "content": "We want to explore a joint venture."}],
            "fields": DEFAULT_FIELDS,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Got it, what's the purpose of this NDA?"
    assert body["fields"]["purpose"] == "Evaluating a joint venture."
    assert body["isComplete"] is False


def test_previously_known_fields_survive_when_not_mentioned_again(
    client: TestClient, mock_completion
) -> None:
    fields_with_purpose = {**DEFAULT_FIELDS, "purpose": "Evaluating a joint venture."}
    mock_completion(
        {
            "reply": "And what's Party 1's company name?",
            "fields": {},
            "isComplete": False,
        }
    )

    response = client.post(
        "/api/chat/message",
        json={
            "messages": [{"role": "user", "content": "Sure, go ahead."}],
            "fields": fields_with_purpose,
        },
    )

    assert response.json()["fields"]["purpose"] == "Evaluating a joint venture."


def test_partial_party_update_preserves_other_party_fields(client: TestClient, mock_completion) -> None:
    fields = {
        **DEFAULT_FIELDS,
        "party1": {"company": "Acme, Inc.", "printName": "", "title": "", "noticeAddress": ""},
    }
    mock_completion(
        {
            "reply": "Got it.",
            "fields": {"party1": {"printName": "Jane Doe"}},
            "isComplete": False,
        }
    )

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "Jane Doe will sign."}], "fields": fields},
    )

    party1 = response.json()["fields"]["party1"]
    assert party1["company"] == "Acme, Inc."
    assert party1["printName"] == "Jane Doe"


def test_is_complete_forced_false_when_required_fields_still_missing(
    client: TestClient, mock_completion
) -> None:
    # The model claims completion, but required fields (purpose, party company/signer
    # names) are still blank — the backend must not trust that claim.
    mock_completion({"reply": "All set!", "fields": {}, "isComplete": True})

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "Looks good."}], "fields": DEFAULT_FIELDS},
    )

    assert response.json()["isComplete"] is False


def test_is_complete_true_when_model_confirms_and_required_fields_present(
    client: TestClient, mock_completion
) -> None:
    fields = {
        **DEFAULT_FIELDS,
        "purpose": "Evaluating a joint venture.",
        "party1": {"company": "Acme, Inc.", "printName": "Jane Doe", "title": "", "noticeAddress": ""},
        "party2": {"company": "Globex Corp.", "printName": "John Smith", "title": "", "noticeAddress": ""},
    }
    mock_completion({"reply": "All set!", "fields": {}, "isComplete": True})

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "Looks good."}], "fields": fields},
    )

    assert response.json()["isComplete"] is True


def test_llm_failure_returns_502(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(*_args, **_kwargs):
        raise RuntimeError("upstream boom")

    monkeypatch.setattr("app.chat.completion", raise_error)

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "Hi"}], "fields": DEFAULT_FIELDS},
    )

    assert response.status_code == 502


def test_missing_fields_in_request_is_rejected(client: TestClient) -> None:
    response = client.post("/api/chat/message", json={"messages": []})
    assert response.status_code == 422
