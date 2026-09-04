import re
from typing import Optional

from pydantic import BaseModel, create_model


def slugify(name: str) -> str:
    """The field key a variable's display name maps to, e.g. "Subscription
    Period" -> "subscription_period". Mirrors frontend/lib/document-template.ts's
    `slugifyVariableName` exactly — both sides must agree on the same key for a
    given variable name."""
    name = re.sub(r"['’]s$", "", name.strip(), flags=re.IGNORECASE)
    name = re.sub(r"[^a-zA-Z0-9]+", "_", name)
    return name.strip("_").lower()


def slugs_for(variables: list[str]) -> dict[str, str]:
    """Maps each variable's display name to its slug, disambiguating any
    collision (distinct display names that happen to slugify the same way) by
    appending a numeric suffix — this should be rare in practice (verified
    against all 10 real generic templates with no collisions), but two
    similarly-named variables could theoretically produce the same slug."""
    result: dict[str, str] = {}
    seen: dict[str, int] = {}
    for variable in variables:
        base = slugify(variable) or "field"
        seen[base] = seen.get(base, 0) + 1
        slug = base if seen[base] == 1 else f"{base}_{seen[base]}"
        result[variable] = slug
    return result


def build_extraction_model(variables: list[str]) -> type[BaseModel]:
    """A Structured Outputs schema with one nullable string field per variable,
    built dynamically since the variable list differs per document type."""
    slugs = slugs_for(variables)
    fields = {slug: (Optional[str], None) for slug in slugs.values()}
    return create_model("GenericExtraction", **fields)  # type: ignore[call-overload]


def build_chat_completion_model(variables: list[str]) -> type[BaseModel]:
    extraction_model = build_extraction_model(variables)
    return create_model(
        "GenericChatCompletionResult",
        reply=(str, ...),
        fields=(extraction_model, ...),
        isComplete=(bool, ...),
    )


def merge_generic_fields(
    variables: list[str], current: dict[str, str], extracted: BaseModel
) -> dict[str, str]:
    slugs = slugs_for(variables)
    merged = dict(current)
    for slug in slugs.values():
        value = getattr(extracted, slug, None)
        if value:
            merged[slug] = value
    return merged


def has_all_variables_filled(variables: list[str], fields: dict[str, str]) -> bool:
    slugs = slugs_for(variables)
    return all(fields.get(slug, "").strip() for slug in slugs.values())
