from app.generic_documents import (
    build_chat_completion_model,
    build_extraction_model,
    has_all_variables_filled,
    merge_generic_fields,
    slugify,
    slugs_for,
)


def test_slugify_normalizes_names() -> None:
    assert slugify("Subscription Period") == "subscription_period"
    assert slugify("Customer") == "customer"
    assert slugify("Provider's") == "provider"
    assert slugify("Provider’s") == "provider"


def test_slugs_for_disambiguates_collisions() -> None:
    slugs = slugs_for(["Foo Bar", "Foo-Bar"])
    assert len(set(slugs.values())) == 2
    assert slugs["Foo Bar"] == "foo_bar"
    assert slugs["Foo-Bar"] == "foo_bar_2"


def test_build_extraction_model_has_one_nullable_field_per_variable() -> None:
    model = build_extraction_model(["Customer", "Subscription Period"])
    instance = model()
    assert instance.customer is None
    assert instance.subscription_period is None

    filled = model(customer="Acme", subscription_period="12 months")
    assert filled.customer == "Acme"
    assert filled.subscription_period == "12 months"


def test_build_chat_completion_model_shape() -> None:
    model = build_chat_completion_model(["Customer"])
    instance = model(reply="hi", fields={"customer": "Acme"}, isComplete=False)
    assert instance.reply == "hi"
    assert instance.fields.customer == "Acme"
    assert instance.isComplete is False


def test_merge_generic_fields_preserves_previous_values_when_not_re_extracted() -> None:
    extraction_model = build_extraction_model(["Customer", "Provider"])
    current = {"customer": "Acme, Inc."}
    extracted = extraction_model(provider="Globex Corp")

    merged = merge_generic_fields(["Customer", "Provider"], current, extracted)

    assert merged["customer"] == "Acme, Inc."
    assert merged["provider"] == "Globex Corp"


def test_merge_generic_fields_does_not_overwrite_with_null() -> None:
    extraction_model = build_extraction_model(["Customer"])
    current = {"customer": "Acme, Inc."}
    extracted = extraction_model()  # customer left null

    merged = merge_generic_fields(["Customer"], current, extracted)

    assert merged["customer"] == "Acme, Inc."


def test_has_all_variables_filled() -> None:
    variables = ["Customer", "Provider"]
    assert not has_all_variables_filled(variables, {"customer": "Acme"})
    assert not has_all_variables_filled(variables, {"customer": "Acme", "provider": ""})
    assert has_all_variables_filled(variables, {"customer": "Acme", "provider": "Globex"})
