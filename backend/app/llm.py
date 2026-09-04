from typing import TypeVar

from litellm import completion
from pydantic import BaseModel, ValidationError

# The project's Cerebras skill normally routes here (openrouter/openai/gpt-oss-120b,
# forced to the Cerebras inference provider) — see CLAUDE.md's "AI design" section.
# That model requires OpenRouter credits, and the project's OpenRouter account
# balance hit zero, so calls now go to a free OpenRouter model first, falling
# back to a local Ollama model (must be running via `ollama serve`, with
# `ollama pull llama3.1` done beforehand) if the free model is unavailable —
# rate-limited, erroring, or persistently returning malformed JSON — rather
# than failing the request outright. Restore MODELS to the Cerebras model
# above once the account has credits again.
MODELS = ["openrouter/nvidia/nemotron-3-super-120b-a12b:free", "ollama_chat/llama3.1:latest"]
MAX_TOKENS = 2048

ModelT = TypeVar("ModelT", bound=BaseModel)


def _try_model(
    model: str, response_format: type[ModelT], messages: list[dict[str, str]], max_attempts: int
) -> ModelT:
    last_error: Exception | None = None
    for _ in range(max_attempts):
        try:
            response = completion(
                model=model,
                messages=messages,
                response_format=response_format,
                max_tokens=MAX_TOKENS,
            )
            content = response.choices[0].message.content
            return response_format.model_validate_json(content)
        except (ValidationError, ValueError) as exc:
            last_error = exc
        except Exception as exc:  # API errors (rate limits, provider outages, etc.)
            last_error = exc
    assert last_error is not None
    raise last_error


def call_structured(
    response_format: type[ModelT], messages: list[dict[str, str]], max_attempts: int = 2
) -> ModelT:
    """Calls the LLM for a Structured Outputs response, trying each model in
    MODELS in order. Within a model, a bad response is retried up to
    max_attempts times before giving up — this "Structured Outputs" support
    isn't grammar-constrained decoding, so a model can occasionally emit
    syntactically malformed JSON despite conceptually following the requested
    schema. If a model never returns valid JSON (or errors outright), the next
    model in the list is tried before the whole call is considered failed."""
    last_error: Exception | None = None
    for model in MODELS:
        try:
            return _try_model(model, response_format, messages, max_attempts)
        except Exception as exc:
            last_error = exc
    assert last_error is not None
    raise last_error
