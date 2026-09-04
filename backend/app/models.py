from datetime import datetime, timezone

from sqlalchemy import JSON
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Document(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    documentType: str
    title: str
    fields: dict = Field(sa_type=JSON)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UploadedDocument(SQLModel, table=True):
    """An existing legal document a user uploaded for AI analysis (summary, risk
    detection, clause explanation, comparison against our closest catalog
    template) — the counterpart to Document, which stores documents *drafted*
    through the chat flow rather than uploaded and analyzed."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    filename: str
    fileType: str
    fileSizeBytes: int
    extractedText: str
    status: str = "processing"  # "processing" | "processed" | "error"
    errorMessage: str | None = None
    matchedCatalogKey: str | None = None
    summary: str | None = None
    risks: list | None = Field(default=None, sa_type=JSON)
    clauses: list | None = Field(default=None, sa_type=JSON)
    comparison: dict | None = Field(default=None, sa_type=JSON)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
