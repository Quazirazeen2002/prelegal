from datetime import datetime

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    documentType: str
    title: str
    fields: dict


class DocumentUpdate(BaseModel):
    title: str | None = None
    fields: dict | None = None


class DocumentOut(BaseModel):
    id: int
    documentType: str
    title: str
    fields: dict
    createdAt: datetime
    updatedAt: datetime
