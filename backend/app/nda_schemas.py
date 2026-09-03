from typing import Literal

from pydantic import BaseModel

MndaTermType = Literal["expires", "perpetual"]
ConfidentialityTermType = Literal["term", "perpetual"]


class PartyInfo(BaseModel):
    """Mirrors the frontend's `PartyInfo` (frontend/lib/nda.ts) field-for-field."""

    company: str
    printName: str
    title: str
    noticeAddress: str


class NdaFormData(BaseModel):
    """Mirrors the frontend's `NdaFormData` (frontend/lib/nda.ts) field-for-field.

    Always fully populated — this is the "known so far" state the frontend
    already has (defaults included), sent up on every chat turn and returned
    back merged with anything newly extracted from the conversation.
    """

    purpose: str
    effectiveDate: str
    mndaTermType: MndaTermType
    mndaTermYears: int
    confidentialityTermType: ConfidentialityTermType
    confidentialityTermYears: int
    governingLaw: str
    jurisdiction: str
    modifications: str
    party1: PartyInfo
    party2: PartyInfo


class PartyInfoExtraction(BaseModel):
    """Same shape as `PartyInfo`, but every field is nullable: the model only
    fills in what it could confidently extract from the conversation so far."""

    company: str | None = None
    printName: str | None = None
    title: str | None = None
    noticeAddress: str | None = None


class NdaExtraction(BaseModel):
    """Same shape as `NdaFormData`, but every field is nullable — this is the
    LLM's per-turn extraction, later merged onto the known `NdaFormData`."""

    purpose: str | None = None
    effectiveDate: str | None = None
    mndaTermType: MndaTermType | None = None
    mndaTermYears: int | None = None
    confidentialityTermType: ConfidentialityTermType | None = None
    confidentialityTermYears: int | None = None
    governingLaw: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    party1: PartyInfoExtraction | None = None
    party2: PartyInfoExtraction | None = None


class ChatCompletionResult(BaseModel):
    """The Structured Outputs schema requested from the LLM for each turn."""

    reply: str
    fields: NdaExtraction
    isComplete: bool


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn]
    fields: NdaFormData


class ChatMessageOut(BaseModel):
    reply: str
    fields: NdaFormData
    isComplete: bool
