import pytest
from fastapi import HTTPException
from google.genai import errors

from app.utils import llm


class FakeModels:
    def __init__(self, exhausted):
        self.exhausted = exhausted
        self.calls = []

    def generate_content(self, model, **kwargs):
        self.calls.append(model)
        if model in self.exhausted:
            raise errors.ClientError(429, {"error": {"code": 429, "message": "quota", "status": "RESOURCE_EXHAUSTED"}})
        return type("Response", (), {"text": f"reply from {model}"})()


@pytest.fixture
def fake_models(monkeypatch):
    def install(exhausted):
        models = FakeModels(exhausted)
        monkeypatch.setattr(llm, "get_client", lambda: type("Client", (), {"models": models})())
        monkeypatch.setattr(llm, "GEMINI_MODELS", ["model-a", "model-b", "model-c"])
        return models
    return install


def test_falls_back_to_next_model_on_quota(fake_models):
    models = fake_models({"model-a"})
    assert llm.generate_text("system", "hi") == "reply from model-b"
    assert models.calls == ["model-a", "model-b"]


def test_all_models_exhausted_gives_friendly_429(fake_models):
    fake_models({"model-a", "model-b", "model-c"})
    with pytest.raises(HTTPException) as error:
        llm.generate_text("system", "hi")
    assert error.value.status_code == 429
    assert error.value.detail == llm.QUOTA_MESSAGE
