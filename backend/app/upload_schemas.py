from datetime import datetime

from pydantic import BaseModel

from app.document_analysis import DeviationItem


class UploadedDocumentSummaryOut(BaseModel):
    """Lightweight shape for the "Recent uploads" list — no analysis payload."""

    id: int
    filename: str
    fileType: str
    fileSizeBytes: int
    status: str
    createdAt: datetime
    updatedAt: datetime


class ComparisonOut(BaseModel):
    matchedCatalogKey: str
    matchedCatalogName: str
    deviations: list[DeviationItem]


class UploadedDocumentDetailOut(UploadedDocumentSummaryOut):
    errorMessage: str | None = None
    matchedCatalogKey: str | None = None
    matchedCatalogName: str | None = None
    summary: str | None = None
    risks: list[dict] | None = None
    clauses: list[dict] | None = None
    comparison: ComparisonOut | None = None
