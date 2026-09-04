from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.catalog import get_by_key
from app.db import get_session
from app.document_analysis import (
    compare_to_template,
    detect_risks,
    explain_clauses,
    generate_summary,
    match_catalog_type,
)
from app.document_parsing import (
    EmptyDocumentError,
    FileTooLargeError,
    UnsupportedFileTypeError,
    extract_text,
    file_extension,
)
from app.models import UploadedDocument, User
from app.upload_schemas import ComparisonOut, UploadedDocumentDetailOut, UploadedDocumentSummaryOut

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


def _get_owned_upload(upload_id: int, user: User, session: Session) -> UploadedDocument:
    upload = session.get(UploadedDocument, upload_id)
    if upload is None or upload.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return upload


def _to_detail(upload: UploadedDocument) -> UploadedDocumentDetailOut:
    comparison_out = None
    if upload.comparison and upload.matchedCatalogKey:
        entry = get_by_key(upload.matchedCatalogKey)
        comparison_out = ComparisonOut(
            matchedCatalogKey=upload.matchedCatalogKey,
            matchedCatalogName=entry.name if entry else upload.matchedCatalogKey,
            deviations=upload.comparison.get("deviations", []),
        )
    matched_entry = get_by_key(upload.matchedCatalogKey) if upload.matchedCatalogKey else None
    return UploadedDocumentDetailOut(
        id=upload.id,
        filename=upload.filename,
        fileType=upload.fileType,
        fileSizeBytes=upload.fileSizeBytes,
        status=upload.status,
        createdAt=upload.createdAt,
        updatedAt=upload.updatedAt,
        errorMessage=upload.errorMessage,
        matchedCatalogKey=upload.matchedCatalogKey,
        matchedCatalogName=matched_entry.name if matched_entry else None,
        summary=upload.summary,
        risks=upload.risks,
        clauses=upload.clauses,
        comparison=comparison_out,
    )


@router.get("", response_model=list[UploadedDocumentSummaryOut])
def list_uploads(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[UploadedDocument]:
    statement = (
        select(UploadedDocument)
        .where(UploadedDocument.user_id == current_user.id)
        .order_by(UploadedDocument.createdAt.desc())
    )
    return list(session.exec(statement).all())


@router.post("", response_model=UploadedDocumentDetailOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UploadedDocumentDetailOut:
    content = file.file.read()
    filename = file.filename or "upload"

    try:
        text = extract_text(filename, content)
    except (UnsupportedFileTypeError, FileTooLargeError, EmptyDocumentError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    upload = UploadedDocument(
        user_id=current_user.id,
        filename=filename,
        fileType=file_extension(filename),
        fileSizeBytes=len(content),
        extractedText=text,
        status="processing",
    )
    session.add(upload)
    session.commit()
    session.refresh(upload)

    try:
        matched_key = match_catalog_type(text)
        summary = generate_summary(text)
        risks = detect_risks(text)
        clauses = explain_clauses(text)
        comparison = compare_to_template(text, matched_key) if matched_key else None

        upload.matchedCatalogKey = matched_key
        upload.summary = summary
        upload.risks = [r.model_dump() for r in risks]
        upload.clauses = [c.model_dump() for c in clauses]
        upload.comparison = (
            {"deviations": [d.model_dump() for d in comparison.deviations]} if comparison else None
        )
        upload.status = "processed"
    except Exception:
        upload.status = "error"
        upload.errorMessage = "Analysis failed. Please try again."

    upload.updatedAt = datetime.now(timezone.utc)
    session.add(upload)
    session.commit()
    session.refresh(upload)

    return _to_detail(upload)


@router.get("/{upload_id}", response_model=UploadedDocumentDetailOut)
def get_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UploadedDocumentDetailOut:
    upload = _get_owned_upload(upload_id, current_user, session)
    return _to_detail(upload)


@router.delete("/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    upload = _get_owned_upload(upload_id, current_user, session)
    session.delete(upload)
    session.commit()
