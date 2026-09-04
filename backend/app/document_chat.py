from typing import Literal, Optional

from pydantic import BaseModel, create_model

from app.catalog import SELECTABLE_DOCUMENT_TYPES, get_by_key
from app.generic_documents import build_chat_completion_model, merge_generic_fields, slugs_for
from app.llm import call_structured
from app.nda_schemas import ChatMessageIn

ALWAYS_GUIDE_INSTRUCTION = (
    "Every reply you send must end by asking a specific question or proposing a "
    "concrete next step — never leave the user without a clear idea of what to "
    "say next. Ask about one or two related things at a time rather than "
    "listing everything at once."
)

_CATALOG_LISTING = "\n".join(f"- {entry.name}: {entry.description}" for entry in SELECTABLE_DOCUMENT_TYPES)

DETECTION_SYSTEM_PROMPT = f"""You are a friendly assistant helping a user figure out which legal document \
they need. We can generate exactly these document types:

{_CATALOG_LISTING}

Try to infer which one the user wants from what they've said. If it's genuinely ambiguous, ask a \
clarifying question. If the user describes something we don't support, explain that clearly, then offer \
the closest document from the list above as an alternative and ask if that works for them.

{ALWAYS_GUIDE_INSTRUCTION}

Respond with:
- reply: your next conversational message to the user.
- documentType: the exact name of the document type from the list above once you're confident which one \
the user wants (including once they've agreed to your suggested alternative) — otherwise null.
"""


class DetectDocumentTypeResult(BaseModel):
    reply: str
    documentType: Optional[str] = None


def _detection_model() -> type[BaseModel]:
    names = [entry.name for entry in SELECTABLE_DOCUMENT_TYPES]
    return create_model(
        "DetectDocumentTypeResult",
        reply=(str, ...),
        documentType=(Optional[Literal[tuple(names)]], None),  # type: ignore[valid-type]
    )


def detect_document_type(messages: list[ChatMessageIn]) -> DetectDocumentTypeResult:
    llm_messages = [{"role": "system", "content": DETECTION_SYSTEM_PROMPT}] + [
        {"role": m.role, "content": m.content} for m in messages
    ]
    result = call_structured(_detection_model(), llm_messages)

    document_key = None
    if result.documentType is not None:
        matching = next(
            (e for e in SELECTABLE_DOCUMENT_TYPES if e.name == result.documentType), None
        )
        document_key = matching.key if matching else None

    return DetectDocumentTypeResult(reply=result.reply, documentType=document_key)


def _generic_system_prompt(document_name: str, variables: list[str], known_fields: dict[str, str]) -> str:
    slugs = slugs_for(variables)
    known = "\n".join(
        f"- {v}: {known_fields.get(slugs[v]) or '(not yet known)'}" for v in variables
    )
    return f"""You are a friendly assistant helping a user fill in the details of a {document_name} \
through freeform conversation. This document needs values for the following fields (their legal \
meaning should be inferred from context and the document type — ask about them in plain language, not \
by reading out their exact legal name):

{known}

{ALWAYS_GUIDE_INSTRUCTION}

Once every field above has a value and the user has confirmed everything looks right, set isComplete to \
true — never before that.

Respond with:
- reply: your next conversational message to the user.
- fields: any field values you can newly confirm from the conversation so far, whether just extracted or \
previously established. Leave a field null if you don't know it yet.
- isComplete: true only once every field is filled in and the user has confirmed.
"""


def get_generic_ai_response(
    messages: list[ChatMessageIn],
    document_key: str,
    variables: list[str],
    known_fields: dict[str, str],
):
    entry = get_by_key(document_key)
    if entry is None:
        raise ValueError(f"Unknown document type: {document_key}")

    completion_model = build_chat_completion_model(variables)
    system_prompt = _generic_system_prompt(entry.name, variables, known_fields)
    llm_messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m.role, "content": m.content} for m in messages
    ]

    result = call_structured(completion_model, llm_messages)

    merged_fields = merge_generic_fields(variables, known_fields, result.fields)
    return result.reply, merged_fields, result.isComplete
