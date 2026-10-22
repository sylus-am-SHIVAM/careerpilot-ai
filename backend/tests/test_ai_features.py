from conftest import register

PDF_BYTES = b"%PDF-1.4 fake pdf content"


def test_chat_saves_history_with_sources(client, auth):
    _, headers = auth
    reply = client.post("/api/v1/chat", json={"message": "How to become a UX designer?"}, headers=headers)
    assert reply.status_code == 200
    body = reply.json()
    assert body["response"] == "Mock mentor reply to: How to become a UX designer?"
    assert body["sources"] == ["creative.md: UI/UX Designer"]

    history = client.get("/api/v1/chat/history", headers=headers).json()
    assert [m["message"] for m in history] == ["How to become a UX designer?"]


def test_chat_history_is_private(client, auth):
    _, headers = auth
    _, other_headers = register(client, email="other@example.com")
    client.post("/api/v1/chat", json={"message": "hello"}, headers=headers)
    assert client.get("/api/v1/chat/history", headers=other_headers).json() == []


def test_empty_chat_message_rejected(client, auth):
    _, headers = auth
    assert client.post("/api/v1/chat", json={"message": ""}, headers=headers).status_code == 422


def test_roadmap_generate_and_list(client, auth):
    _, headers = auth
    created = client.post("/api/v1/roadmap/generate", json={"goal": "Data Scientist"}, headers=headers)
    assert created.status_code == 200
    roadmap = created.json()
    assert roadmap["content"]["phases"][0]["weeks"] == "Weeks 1-4"

    assert len(client.get("/api/v1/roadmap", headers=headers).json()) == 1
    assert client.get(f"/api/v1/roadmap/{roadmap['id']}", headers=headers).status_code == 200
    assert client.get("/api/v1/roadmap/999", headers=headers).status_code == 404


def test_roadmap_of_other_user_hidden(client, auth):
    _, headers = auth
    _, other_headers = register(client, email="other@example.com")
    roadmap = client.post("/api/v1/roadmap/generate", json={"goal": "Designer"}, headers=headers).json()
    assert client.get(f"/api/v1/roadmap/{roadmap['id']}", headers=other_headers).status_code == 404


def test_resume_validation(client, auth):
    _, headers = auth
    text_file = {"file": ("resume.txt", b"hello", "text/plain")}
    assert client.post("/api/v1/resume/upload", files=text_file, headers=headers).status_code == 400
    fake_pdf = {"file": ("resume.pdf", b"not a pdf", "application/pdf")}
    assert client.post("/api/v1/resume/upload", files=fake_pdf, headers=headers).status_code == 400
    assert client.get("/api/v1/resume", headers=headers).status_code == 404


def test_resume_upload_replace_and_delete(client, auth, monkeypatch):
    from app.services import resume_service

    monkeypatch.setattr(resume_service, "extract_pdf_text", lambda data: "Python FastAPI developer resume text")
    _, headers = auth
    files = {"file": ("resume.pdf", PDF_BYTES, "application/pdf")}

    first = client.post("/api/v1/resume/upload", files=files, data={"target_role": "Backend"}, headers=headers)
    assert first.status_code == 200
    assert first.json()["analysis"]["overall_score"] == 70
    second = client.post("/api/v1/resume/upload", files=files, headers=headers)
    assert second.json()["id"] == first.json()["id"]
    assert len(list(resume_service.UPLOAD_DIR.glob("*.pdf"))) == 1

    assert client.delete("/api/v1/resume", headers=headers).status_code == 200
    assert client.get("/api/v1/resume", headers=headers).status_code == 404
    assert len(list(resume_service.UPLOAD_DIR.glob("*.pdf"))) == 0


def test_skill_gap_uses_resume_skills(client, auth, monkeypatch):
    from app.services import resume_service

    monkeypatch.setattr(resume_service, "extract_pdf_text", lambda data: "resume text long enough")
    _, headers = auth
    client.post("/api/v1/resume/upload", files={"file": ("r.pdf", PDF_BYTES, "application/pdf")}, headers=headers)

    report = client.post("/api/v1/skill-gap", json={"target_role": "Backend Developer"}, headers=headers).json()
    assert report["current_skills"] == ["Python", "FastAPI"]
    assert report["content"]["readiness_score"] == 60
    assert len(client.get("/api/v1/skill-gap", headers=headers).json()) == 1
