from app.catalog import CATALOG, SELECTABLE_DOCUMENT_TYPES, get_by_key


def test_catalog_loads_all_entries_from_repo_root_catalog_json() -> None:
    assert len(CATALOG) == 12


def test_selectable_types_excludes_the_mutual_nda_cover_page() -> None:
    keys = [e.key for e in SELECTABLE_DOCUMENT_TYPES]
    assert len(keys) == 11
    assert "mutual-nda-coverpage" not in keys
    assert "mutual-nda" in keys
    assert "csa" in keys


def test_get_by_key_returns_matching_entry() -> None:
    entry = get_by_key("csa")
    assert entry is not None
    assert entry.name == "Cloud Service Agreement"


def test_get_by_key_returns_none_for_unknown_key() -> None:
    assert get_by_key("not-a-real-document") is None
