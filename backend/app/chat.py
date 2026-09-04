from app.llm import call_structured
from app.nda_schemas import (
    ChatCompletionResult,
    ChatMessageIn,
    NdaExtraction,
    NdaFormData,
    PartyInfo,
    PartyInfoExtraction,
)

SYSTEM_PROMPT_TEMPLATE = """You are a friendly assistant helping a user fill in a Common Paper Mutual \
Non-Disclosure Agreement (NDA) through freeform conversation, instead of a form.

Every reply you send must end by asking a specific question or proposing a concrete next step — never \
leave the user without a clear idea of what to say next.

Gather these fields naturally over the conversation, asking one or two related questions at a time \
rather than listing everything at once:
- purpose: why the parties are sharing confidential information (e.g. "evaluating a joint venture").
- effectiveDate: the date the NDA starts, as an ISO date (YYYY-MM-DD). A sensible default is already
  set, so only change it if the user specifies a date.
- mndaTermType ("expires" or "perpetual") and, if "expires", mndaTermYears: how long the NDA itself lasts.
- confidentialityTermType ("term" or "perpetual") and, if "term", confidentialityTermYears: how long
  confidentiality obligations survive.
- governingLaw: the US state whose law governs the agreement.
- jurisdiction: the city/county and state where disputes must be litigated.
- modifications: any changes to the standard terms (optional — leave unset if the user has none).
- party1 and party2: each party's company name, the name and title of the person signing, and a notice
  address (email or postal). One party is usually the user's own company; ask who the other party is.

Required before the document is usable: purpose, and each party's company name and signer name. \
Everything else has a reasonable default or can be left blank. Once you believe you have the required \
fields (and have asked about the optional ones at least once), summarize what you've gathered and ask \
the user to confirm. Only set isComplete to true on the turn the user actually confirms — never before.

Fields already known from this conversation (JSON, may be partially filled in with defaults):
{known_fields}

Respond with:
- reply: your next conversational message to the user (a question, confirmation, or acknowledgment).
- fields: any field values you can newly confirm from the conversation so far, whether just extracted
  or previously established. Leave a field null if you don't know it.
- isComplete: true only once the user has confirmed everything is correct and ready to generate.
"""


def build_system_prompt(known_fields: NdaFormData) -> str:
    return SYSTEM_PROMPT_TEMPLATE.format(known_fields=known_fields.model_dump_json(indent=2))


def _merge_party(current: PartyInfo, extracted: PartyInfoExtraction | None) -> PartyInfo:
    if extracted is None:
        return current
    return PartyInfo(
        company=extracted.company or current.company,
        printName=extracted.printName or current.printName,
        title=extracted.title or current.title,
        noticeAddress=extracted.noticeAddress or current.noticeAddress,
    )


def merge_fields(current: NdaFormData, extracted: NdaExtraction) -> NdaFormData:
    return NdaFormData(
        purpose=extracted.purpose or current.purpose,
        effectiveDate=extracted.effectiveDate or current.effectiveDate,
        mndaTermType=extracted.mndaTermType or current.mndaTermType,
        mndaTermYears=extracted.mndaTermYears if extracted.mndaTermYears is not None else current.mndaTermYears,
        confidentialityTermType=extracted.confidentialityTermType or current.confidentialityTermType,
        confidentialityTermYears=(
            extracted.confidentialityTermYears
            if extracted.confidentialityTermYears is not None
            else current.confidentialityTermYears
        ),
        governingLaw=extracted.governingLaw or current.governingLaw,
        jurisdiction=extracted.jurisdiction or current.jurisdiction,
        modifications=extracted.modifications or current.modifications,
        party1=_merge_party(current.party1, extracted.party1),
        party2=_merge_party(current.party2, extracted.party2),
    )


def has_required_fields(fields: NdaFormData) -> bool:
    return bool(
        fields.purpose.strip()
        and fields.party1.company.strip()
        and fields.party1.printName.strip()
        and fields.party2.company.strip()
        and fields.party2.printName.strip()
    )


def get_ai_response(messages: list[ChatMessageIn], known_fields: NdaFormData) -> ChatCompletionResult:
    llm_messages = [{"role": "system", "content": build_system_prompt(known_fields)}] + [
        {"role": message.role, "content": message.content} for message in messages
    ]
    return call_structured(ChatCompletionResult, llm_messages)
