import pytest

from app.document_analysis import (
    ClauseAnalysisResult,
    ClauseExplanation,
    ComparisonResult,
    DeviationItem,
    MatchResult,
    RiskAnalysisResult,
    RiskItem,
    SummaryResult,
    compare_to_template,
    detect_risks,
    explain_clauses,
    generate_summary,
    match_catalog_type,
)


@pytest.fixture()
def mock_call_structured(monkeypatch: pytest.MonkeyPatch):
    def _install(result):
        monkeypatch.setattr("app.document_analysis.call_structured", lambda *_a, **_k: result)

    return _install


def test_match_catalog_type_maps_name_back_to_key(mock_call_structured) -> None:
    mock_call_structured(MatchResult(matchedType="Cloud Service Agreement"))
    assert match_catalog_type("some document text") == "csa"


def test_match_catalog_type_returns_none_when_unmatched(mock_call_structured) -> None:
    mock_call_structured(MatchResult(matchedType=None))
    assert match_catalog_type("some document text") is None


def test_generate_summary_returns_the_summary_text(mock_call_structured) -> None:
    mock_call_structured(SummaryResult(summary="This is a plain-English summary."))
    assert generate_summary("some document text") == "This is a plain-English summary."


def test_detect_risks_returns_risk_list(mock_call_structured) -> None:
    mock_call_structured(
        RiskAnalysisResult(
            risks=[
                RiskItem(
                    title="Uncapped liability",
                    description="No cap on damages.",
                    severity="high",
                    relatedClause="Section 8",
                )
            ]
        )
    )
    risks = detect_risks("some document text")
    assert len(risks) == 1
    assert risks[0].severity == "high"


def test_explain_clauses_returns_clause_list(mock_call_structured) -> None:
    mock_call_structured(
        ClauseAnalysisResult(
            clauses=[ClauseExplanation(clauseTitle="Term", plainEnglish="How long this lasts.")]
        )
    )
    clauses = explain_clauses("some document text")
    assert clauses[0].clauseTitle == "Term"


def test_compare_to_template_reads_the_real_template_and_returns_deviations(
    mock_call_structured,
) -> None:
    mock_call_structured(
        ComparisonResult(
            deviations=[
                DeviationItem(
                    topic="Liability cap",
                    standardTerm="Capped at fees paid.",
                    uploadedDocumentTerm="No cap mentioned.",
                    assessment="Uploaded document is riskier than our standard terms.",
                )
            ]
        )
    )
    result = compare_to_template("some document text", "csa")
    assert len(result.deviations) == 1
    assert result.deviations[0].topic == "Liability cap"


def test_compare_to_template_raises_for_unknown_catalog_key() -> None:
    with pytest.raises(ValueError):
        compare_to_template("some document text", "not-a-real-key")
