from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.db import get_session
from app.document_schemas import DocumentCreate, DocumentOut, DocumentUpdate
from app.models import Document, User

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _get_owned_document(document_id: int, user: User, session: Session) -> Document:
    document = session.get(Document, document_id)
    if document is None or document.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.get("", response_model=list[DocumentOut])
def list_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[Document]:
    statement = (
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.updatedAt.desc())
    )
    return list(session.exec(statement).all())


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Document:
    document = Document(
        user_id=current_user.id,
        documentType=payload.documentType,
        title=payload.title,
        fields=payload.fields,
    )
    session.add(document)
    session.commit()
    session.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Document:
    return _get_owned_document(document_id, current_user, session)


@router.put("/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: int,
    payload: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Document:
    document = _get_owned_document(document_id, current_user, session)
    if payload.title is not None:
        document.title = payload.title
    if payload.fields is not None:
        document.fields = payload.fields
    document.updatedAt = datetime.now(timezone.utc)
    session.add(document)
    session.commit()
    session.refresh(document)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    document = _get_owned_document(document_id, current_user, session)
    session.delete(document)
    session.commit()
