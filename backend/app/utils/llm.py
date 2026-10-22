import json
import os
import time

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import errors, types

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")

RETRYABLE_CODES = {429, 500, 503}
MAX_ATTEMPTS = 3

_client = None


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
            if error.code in RETRYABLE_CODES and attempt < MAX_ATTEMPTS:
                time.sleep(2 ** attempt)
                continue
            raise HTTPException(
                status_code=502,
                detail=f"AI service error: {error}"
            )
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail=f"AI service error: {error}"
            )


def generate_text(system_prompt: str, contents, temperature: float = 0.7):
    response = call_gemini(
        lambda client: client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature
            )
        )
    )

    return response.text or ""


def generate_json(system_prompt: str, prompt: str, schema=None):
    response = call_gemini(
        lambda client: client.models.generate_content(
            model=GEMINI_MODEL,
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
    response = call_gemini(
        lambda client: client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=texts,
            config=types.EmbedContentConfig(task_type=task_type)
        )
    )

    return [embedding.values for embedding in response.embeddings]
