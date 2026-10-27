import json
import logging
import os
import time

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import errors, types

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_FALLBACK_MODELS = os.getenv(
    "GEMINI_FALLBACK_MODELS",
    "gemini-3.5-flash,gemini-3.7-flash,gemini-3.5-flash-lite,gemini-3-flash-preview,gemini-2.5-flash"
)
GEMINI_MODELS = list(dict.fromkeys(
    [GEMINI_MODEL] + [m.strip() for m in GEMINI_FALLBACK_MODELS.split(",") if m.strip()]
))
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")

RETRYABLE_CODES = {500, 503}
MAX_ATTEMPTS = 3

QUOTA_MESSAGE = "The AI has reached its usage limit for now. Please try again in a few hours."
ERROR_MESSAGE = "The AI service is having trouble right now. Please try again in a minute."

logger = logging.getLogger(__name__)

_client = None


class QuotaExceeded(Exception):
    pass


def get_client():
    global _client

    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="AI service is not configured (GEMINI_API_KEY missing)"
            )
        _client = genai.Client(api_key=api_key)

    return _client


def call_gemini(request):
    client = get_client()

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return request(client)
        except errors.APIError as error:
            if error.code == 429:
                raise QuotaExceeded() from error
            if error.code in RETRYABLE_CODES and attempt < MAX_ATTEMPTS:
                time.sleep(2 ** attempt)
                continue
            logger.error("Gemini API error: %s", error)
            raise HTTPException(status_code=502, detail=ERROR_MESSAGE)
        except Exception as error:
            logger.error("Gemini call failed: %s", error)
            raise HTTPException(status_code=502, detail=ERROR_MESSAGE)


def generate_with_fallback(request):
    for model in GEMINI_MODELS:
        try:
            return call_gemini(lambda client: request(client, model))
        except QuotaExceeded:
            logger.warning("Gemini quota exceeded for %s, trying next model", model)

    raise HTTPException(status_code=429, detail=QUOTA_MESSAGE)


def generate_text(system_prompt: str, contents, temperature: float = 0.7):
    response = generate_with_fallback(
        lambda client, model: client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature
            )
        )
    )

    return response.text or ""


def generate_json(system_prompt: str, prompt: str, schema=None):
    response = generate_with_fallback(
        lambda client, model: client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.4,
                response_mime_type="application/json",
                response_schema=schema
            )
        )
    )

    try:
        data = json.loads(response.text)
        return schema.model_validate(data).model_dump() if schema else data
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="AI service returned invalid JSON"
        )


def embed_texts(texts: list[str], task_type: str | None = None):
    try:
        response = call_gemini(
            lambda client: client.models.embed_content(
                model=GEMINI_EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(task_type=task_type)
            )
        )
    except QuotaExceeded:
        raise HTTPException(status_code=429, detail=QUOTA_MESSAGE)

    return [embedding.values for embedding in response.embeddings]
