from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.catalog import SELECTABLE_DOCUMENT_TYPES, get_by_key
from app.document_chat import detect_document_type, get_generic_ai_response
from app.generic_documents import has_all_variables_filled
from app.nda_schemas import ChatMessageIn

router = APIRouter(prefix="/api/chat", tags=["chat"])


class CatalogEntryOut(BaseModel):
    key: str
    name: str
    description: str


class DetectDocumentTypeRequest(BaseModel):
    messages: list[ChatMessageIn]


class DetectDocumentTypeResponse(BaseModel):
    reply: str
    documentType: str | None


class GenericChatRequest(BaseModel):
    messages: list[ChatMessageIn]
    documentType: str
    variables: list[str]
    fields: dict[str, str]


class GenericChatResponse(BaseModel):
    reply: str
    fields: dict[str, str]
    isComplete: bool


@router.get("/document-types", response_model=list[CatalogEntryOut])
def list_document_types() -> list[CatalogEntryOut]:
    return [
        CatalogEntryOut(key=e.key, name=e.name, description=e.description)
        for e in SELECTABLE_DOCUMENT_TYPES
    ]


@router.post("/detect-document-type", response_model=DetectDocumentTypeResponse)
def detect_document_type_endpoint(payload: DetectDocumentTypeRequest) -> DetectDocumentTypeResponse:
    try:
        result = detect_document_type(payload.messages)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="AI service unavailable"
        ) from exc

    return DetectDocumentTypeResponse(reply=result.reply, documentType=result.documentType)


@router.post("/generic-message", response_model=GenericChatResponse)
def generic_message(payload: GenericChatRequest) -> GenericChatResponse:
    if get_by_key(payload.documentType) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown document type")

    try:
        reply, merged_fields, model_says_complete = get_generic_ai_response(
            payload.messages, payload.documentType, payload.variables, payload.fields
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="AI service unavailable"
        ) from exc

    is_complete = model_says_complete and has_all_variables_filled(payload.variables, merged_fields)

    return GenericChatResponse(reply=reply, fields=merged_fields, isComplete=is_complete)
