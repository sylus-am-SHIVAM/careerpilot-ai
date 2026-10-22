import json
import os

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import types

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")

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


def generate_text(system_prompt: str, contents, temperature: float = 0.7):
    try:
        response = get_client().models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature
            )
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {error}"
        )

    return response.text or ""


def generate_json(system_prompt: str, prompt: str):
    try:
        response = get_client().models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.4,
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {error}"
        )


def embed_texts(texts: list[str]):
    try:
        response = get_client().models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=texts
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI embedding error: {error}"
        )

    return [embedding.values for embedding in response.embeddings]
