from pathlib import Path

import chromadb

from app.utils.llm import embed_texts

BACKEND_DIR = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = BACKEND_DIR.parent / "datasets" / "career_knowledge"
CHROMA_DIR = BACKEND_DIR / "chroma_db"
COLLECTION_NAME = "career_knowledge"
EMBED_BATCH_SIZE = 50

_client = None


def get_collection():
    global _client

    if _client is None:
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    return _client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=None,
        metadata={"hnsw:space": "cosine"}
    )


def chunk_markdown(path: Path):
    text = path.read_text(encoding="utf-8")
    title = text.splitlines()[0].lstrip("# ").strip()

    chunks = []
    for index, section in enumerate(text.split("\n## ")[1:]):
        heading = section.splitlines()[0].strip()
        chunks.append({
            "id": f"{path.stem}-{index}",
            "text": f"{title} - {heading}\n{section}",
            "source": path.name,
            "section": heading,
        })

    return chunks


def ingest_knowledge():
    chunks = []
    for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        chunks.extend(chunk_markdown(path))

    if _client is None:
        get_collection()
    try:
        _client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = get_collection()

    for start in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch = chunks[start:start + EMBED_BATCH_SIZE]
        collection.add(
            ids=[c["id"] for c in batch],
            documents=[c["text"] for c in batch],
            embeddings=embed_texts(
                [c["text"] for c in batch],
                task_type="RETRIEVAL_DOCUMENT"
            ),
            metadatas=[
                {"source": c["source"], "section": c["section"]}
                for c in batch
            ]
        )

    return len(chunks)


def search_knowledge(query: str, top_k: int = 3):
    collection = get_collection()

    if collection.count() == 0:
        ingest_knowledge()
        collection = get_collection()

    results = collection.query(
        query_embeddings=embed_texts([query], task_type="RETRIEVAL_QUERY"),
        n_results=top_k
    )

    return [
        {
            "text": document,
            "source": metadata["source"],
            "section": metadata["section"],
            "distance": distance,
        }
        for document, metadata, distance in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        )
    ]


if __name__ == "__main__":
    print(f"Indexed {ingest_knowledge()} chunks into {CHROMA_DIR}")
