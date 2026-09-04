import json
from pathlib import Path

from pydantic import BaseModel

CATALOG_PATH = Path(__file__).resolve().parents[2] / "catalog.json"

# The cover page is a companion file incorporated by reference into the Mutual
# NDA flow (which has its own hand-crafted, bespoke implementation) — it is
# never independently offered as a document a user can ask for.
_EXCLUDED_KEYS = {"mutual-nda-coverpage"}


class CatalogEntry(BaseModel):
    key: str
    name: str
    description: str
    filename: str


def _load_catalog() -> list[CatalogEntry]:
    raw = json.loads(CATALOG_PATH.read_text())
    return [
        CatalogEntry(
            key=entry["filename"].removesuffix(".md"),
            name=entry["name"],
            description=entry["description"],
            filename=entry["filename"],
        )
        for entry in raw
    ]


CATALOG: list[CatalogEntry] = _load_catalog()
SELECTABLE_DOCUMENT_TYPES: list[CatalogEntry] = [
    entry for entry in CATALOG if entry.key not in _EXCLUDED_KEYS
]

_BY_KEY = {entry.key: entry for entry in CATALOG}


def get_by_key(key: str) -> CatalogEntry | None:
    return _BY_KEY.get(key)
