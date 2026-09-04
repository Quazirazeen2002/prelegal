import json

import pytest
from pydantic import BaseModel

from app.llm import call_structured


class _Message:
    def __init__(self, content_str: str) -> None:
        self.content = content_str


class _Choice:
    def __init__(self, content_str: str) -> None:
        self.message = _Message(content_str)


class _Response:
    def __init__(self, content_str: str) -> None:
        self.choices = [_Choice(content_str)]


class _Result(BaseModel):
    reply: str


def test_call_structured_retries_once_on_malformed_json(monkeypatch: pytest.MonkeyPatch) -> None:
    responses = [
        _Response('{"reply": "oops" "extra"}'),  # malformed JSON
        _Response(json.dumps({"reply": "fixed on retry"})),
    ]
    calls = []

    def fake(*_args, **_kwargs):
        calls.append(1)
        return responses[len(calls) - 1]

    monkeypatch.setattr("app.llm.completion", fake)

    result = call_structured(_Result, [{"role": "user", "content": "hi"}])

    assert result.reply == "fixed on retry"
    assert len(calls) == 2


def test_call_structured_raises_after_exhausting_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake(*_args, **_kwargs):
        return _Response("not json at all")

    monkeypatch.setattr("app.llm.completion", fake)

    with pytest.raises(ValueError):
        call_structured(_Result, [{"role": "user", "content": "hi"}])
