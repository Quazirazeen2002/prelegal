from fastapi import APIRouter, HTTPException, status

from app.chat import get_ai_response, has_required_fields, merge_fields
from app.nda_schemas import ChatMessageOut, ChatRequest

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageOut)
def send_message(payload: ChatRequest) -> ChatMessageOut:
    try:
        result = get_ai_response(payload.messages, payload.fields)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="AI service unavailable"
        ) from exc

    merged_fields = merge_fields(payload.fields, result.fields)
    is_complete = result.isComplete and has_required_fields(merged_fields)

    return ChatMessageOut(reply=result.reply, fields=merged_fields, isComplete=is_complete)
