from pathlib import Path
from typing import Literal, Optional

from pydantic import BaseModel, create_model

from app.catalog import SELECTABLE_DOCUMENT_TYPES, get_by_key
from app.llm import call_structured

TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "templates"

# Keeps calls fast (per the Cerebras skill's low-latency intent) and avoids
# exceeding context limits on very long uploads. Most real-world contracts
# are well within this; a note is appended to the prompt when truncated.
MAX_DOCUMENT_CHARS = 15_000


def _truncate(text: str) -> str:
    if len(text) <= MAX_DOCUMENT_CHARS:
        return text
    return text[:MAX_DOCUMENT_CHARS] + "\n\n[... document truncated for analysis ...]"


# --- Catalog type matching (reused as the basis for comparison) -----------

_CATALOG_LISTING = "\n".join(f"- {entry.name}: {entry.description}" for entry in SELECTABLE_DOCUMENT_TYPES)


class MatchResult(BaseModel):
    matchedType: Optional[str] = None


def _match_model() -> type[BaseModel]:
    names = [entry.name for entry in SELECTABLE_DOCUMENT_TYPES]
    return create_model("MatchResult", matchedType=(Optional[Literal[tuple(names)]], None))  # type: ignore[valid-type]


def match_catalog_type(document_text: str) -> str | None:
    """Which of our 11 standard document types this upload most resembles, if any."""
    messages = [
        {
            "role": "system",
            "content": (
                "You classify an uploaded legal document against a fixed list of standard "
                "document types. Respond with the exact name of the closest match, or null if "
                "none are a reasonable match.\n\n"
                f"Standard document types:\n{_CATALOG_LISTING}"
            ),
        },
        {"role": "user", "content": _truncate(document_text)},
    ]
    result = call_structured(_match_model(), messages)
    if result.matchedType is None:
        return None
    matching = next((e for e in SELECTABLE_DOCUMENT_TYPES if e.name == result.matchedType), None)
    return matching.key if matching else None


# --- Plain-English summary --------------------------------------------------


class SummaryResult(BaseModel):
    summary: str


def generate_summary(document_text: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You explain legal documents in plain English for someone without a legal "
                "background. Write a clear, concise summary (3-5 short paragraphs or a tight "
                "bulleted list) covering what the document is, who the parties are, and the "
                "main obligations each side takes on. Avoid legal jargon where possible. "
                "Write in plain text only — no markdown formatting (no **bold**, no #headers, "
                "no markdown bullet syntax). Use plain dashes and line breaks for lists."
            ),
        },
        {"role": "user", "content": _truncate(document_text)},
    ]
    return call_structured(SummaryResult, messages).summary


# --- Risk detection ----------------------------------------------------------


class RiskItem(BaseModel):
    title: str
    description: str
    severity: Literal["low", "medium", "high"]
    relatedClause: Optional[str] = None


class RiskAnalysisResult(BaseModel):
    risks: list[RiskItem]


def detect_risks(document_text: str) -> list[RiskItem]:
    messages = [
        {
            "role": "system",
            "content": (
                "You review legal documents for a non-lawyer and flag potential risks or "
                "one-sided terms — e.g. broad indemnification, uncapped liability, automatic "
                "renewal without notice, unusual termination terms, missing limitation of "
                "liability, one-sided confidentiality. For each risk found, give a short title, "
                "a plain-English description of why it matters, a severity (low/medium/high), "
                "and the clause or section it relates to if identifiable. If the document "
                "appears to have no notable risks, return an empty list rather than inventing "
                "one."
            ),
        },
        {"role": "user", "content": _truncate(document_text)},
    ]
    return call_structured(RiskAnalysisResult, messages).risks


# --- Clause explanation -------------------------------------------------------


class ClauseExplanation(BaseModel):
    clauseTitle: str
    plainEnglish: str


class ClauseAnalysisResult(BaseModel):
    clauses: list[ClauseExplanation]


def explain_clauses(document_text: str) -> list[ClauseExplanation]:
    messages = [
        {
            "role": "system",
            "content": (
                "You break a legal document down into its key clauses/sections and explain "
                "each one in plain English, one or two sentences per clause. Use the "
                "document's own section titles where present. Cover every substantive clause; "
                "skip only boilerplate signature blocks."
            ),
        },
        {"role": "user", "content": _truncate(document_text)},
    ]
    return call_structured(ClauseAnalysisResult, messages).clauses


# --- Comparison against the matched catalog template --------------------------


class DeviationItem(BaseModel):
    topic: str
    standardTerm: str
    uploadedDocumentTerm: str
    assessment: str


class ComparisonResult(BaseModel):
    deviations: list[DeviationItem]


def compare_to_template(document_text: str, catalog_key: str) -> ComparisonResult:
    entry = get_by_key(catalog_key)
    if entry is None:
        raise ValueError(f"Unknown catalog key: {catalog_key}")

    template_text = (TEMPLATES_DIR / entry.filename).read_text()

    messages = [
        {
            "role": "system",
            "content": (
                f"You compare an uploaded document against our standard {entry.name} template "
                "terms and identify material deviations — where the uploaded document is "
                "missing a standard protection, adds an unusual obligation, or otherwise "
                "differs in a way that matters. For each deviation, name the topic, quote or "
                "paraphrase the standard term, quote or paraphrase the uploaded document's "
                "term (or note it's missing entirely), and give a short plain-English "
                "assessment of the practical effect. Only list genuine, material differences — "
                "not every wording difference.\n\n"
                f"Standard template terms:\n{_truncate(template_text)}"
            ),
        },
        {"role": "user", "content": f"Uploaded document:\n{_truncate(document_text)}"},
    ]
    return call_structured(ComparisonResult, messages)
