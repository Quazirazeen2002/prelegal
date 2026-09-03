import os
import tempfile
from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("STATIC_DIR", "static-does-not-exist-in-tests")

import app.db as db_module
from app.main import app as fastapi_app


@pytest.fixture()
def client() -> Iterator[TestClient]:
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = Path(tmp_dir) / "test.db"
        db_module.engine = db_module.create_engine(
            f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
        )

        # Entering the TestClient context runs the app's lifespan, which calls
        # init_db() against the engine we just swapped in above.
        with TestClient(fastapi_app) as test_client:
            yield test_client
