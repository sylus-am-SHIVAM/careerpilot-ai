from conftest import register

from app.data.career_assessment import QUESTIONS


def questions(client):
    return client.get("/api/v1/assessments/1/questions").json()


def answer(client, headers, question, option_index):
    return client.post(
        "/api/v1/assessments/answers",
        json={"question_id": question["id"], "option_id": question["options"][option_index]["id"]},
        headers=headers,
    )


def answer_text(client, headers, question, text):
    option = next(o for o in question["options"] if o["option_text"] == text)
    return client.post(
        "/api/v1/assessments/answers",
        json={"question_id": question["id"], "option_id": option["id"]},
        headers=headers,
    )


def test_seeded_assessment(client):
    qs = questions(client)
    assert len(qs) == 20
    assert all(len(q["options"]) == 5 for q in qs)
    assert {q["section"] for q in qs} == {
        "Interests", "Strengths & Aptitude", "Work Style & Personality",
        "Values & Motivation", "Academics & Experience",
    }


def test_questions_for_missing_assessment(client):
    assert client.get("/api/v1/assessments/999/questions").status_code == 404


def test_answer_validation(client, auth):
    _, headers = auth
    q1, q2 = questions(client)[:2]
    missing = client.post("/api/v1/assessments/answers", json={"question_id": 999, "option_id": 1}, headers=headers)
    assert missing.status_code == 404
    wrong = client.post(
        "/api/v1/assessments/answers",
        json={"question_id": q1["id"], "option_id": q2["options"][0]["id"]},
        headers=headers,
    )
    assert wrong.status_code == 400


def test_reanswer_updates_instead_of_duplicating(client, auth):
    _, headers = auth
    q1 = questions(client)[0]
    first = answer(client, headers, q1, 0).json()
    second = answer(client, headers, q1, 2).json()
    assert first["id"] == second["id"]
    assert second["option_id"] == q1["options"][2]["id"]

    result = client.get("/api/v1/assessments/1/result", headers=headers).json()
    assert result["answered_questions"] == 1
    assert result["completion_percentage"] == 5


def test_recommendation_scores(client, auth):
    _, headers = auth
    assert client.get("/api/v1/assessments/1/recommendation", headers=headers).status_code == 400

    # first option of every question is the technology one, except two research-heavy ones
    for q, item in zip(questions(client), QUESTIONS):
        answer_text(client, headers, q, item["options"][0][0])

    data = client.get("/api/v1/assessments/1/recommendation", headers=headers).json()
    scores = {s["key"]: s["score"] for s in data["scores"]}
    assert scores == {"technology": 38, "research": 6, "creative": 0, "social": 0, "business": 1}
    assert [c["key"] for c in data["top_categories"]] == ["technology"]
    assert data["answered_questions"] == 20
    assert data["match_strength"] == "strong"
    assert data["career_matches"][0] == {
        "name": "Software Engineer", "category": "Technology & Engineering", "fit": 100
    }
    assert len(data["sections"]) == 5
    assert all(s["answered"] == 4 for s in data["sections"])
    assert {s["top_category"] for s in data["sections"]} == {"Technology & Engineering"}


def test_mixed_answers_give_mixed_profile(client, auth):
    _, headers = auth
    for i, (q, item) in enumerate(zip(questions(client), QUESTIONS)):
        answer_text(client, headers, q, item["options"][i % 5][0])

    data = client.get("/api/v1/assessments/1/recommendation", headers=headers).json()
    assert data["match_strength"] == "mixed"


def test_answers_are_per_user(client, auth):
    _, headers = auth
    _, other_headers = register(client, email="other@example.com")
    answer(client, headers, questions(client)[0], 1)
    assert len(client.get("/api/v1/assessments/1/answers", headers=headers).json()) == 1
    assert client.get("/api/v1/assessments/1/answers", headers=other_headers).json() == []
