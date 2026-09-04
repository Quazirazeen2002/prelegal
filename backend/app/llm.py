from typing import TypeVar

from litellm import completion
from pydantic import BaseModel, ValidationError

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}
MAX_TOKENS = 2048

ModelT = TypeVar("ModelT", bound=BaseModel)


def call_structured(
    response_format: type[ModelT], messages: list[dict[str, str]], max_attempts: int = 2
) -> ModelT:
    """Calls the LLM for a Structured Outputs response, retrying once if the
    model returns content that doesn't parse as valid JSON matching the
    schema. In practice, this "Structured Outputs" support isn't grammar-
    constrained decoding — the model can occasionally emit syntactically
    malformed JSON (e.g. a misplaced brace) despite conceptually following
    the requested schema, so a bad response is worth one retry before giving
    up rather than failing the whole turn outright."""
    last_error: Exception | None = None
    for _ in range(max_attempts):
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=response_format,
            reasoning_effort="low",
            max_tokens=MAX_TOKENS,
            extra_body=EXTRA_BODY,
        )
        content = response.choices[0].message.content
        try:
            return response_format.model_validate_json(content)
        except (ValidationError, ValueError) as exc:
            last_error = exc

    assert last_error is not None
    raise last_error
