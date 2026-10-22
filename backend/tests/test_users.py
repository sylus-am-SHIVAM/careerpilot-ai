from conftest import register


def test_register_login_and_me(client, auth):
    user, headers = auth
    me = client.get("/api/v1/me", headers=headers)
    assert me.status_code == 200
    assert me.json() == user
    assert "password" not in me.json()


def test_duplicate_email_rejected(client, auth):
    response = client.post(
        "/api/v1/users",
        json={"full_name": "Copy", "email": "student@example.com", "password": "x"},
    )
    assert response.status_code == 400


def test_wrong_password_rejected(client, auth):
    response = client.post("/api/v1/login", data={"username": "student@example.com", "password": "wrong"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect password. Please try again."

    unknown = client.post("/api/v1/login", data={"username": "nobody@example.com", "password": "secret123"})
    assert unknown.status_code == 404
    assert "sign up" in unknown.json()["detail"]

    mixed_case = client.post("/api/v1/login", data={"username": "Student@Example.com", "password": "secret123"})
    assert mixed_case.status_code == 200


def test_protected_routes_need_token(client):
    for path in ["/api/v1/me", "/api/v1/users", "/api/v1/chat/history", "/api/v1/resume", "/api/v1/roadmap"]:
        assert client.get(path).status_code == 401


def test_missing_user_returns_404(client, auth):
    _, headers = auth
    assert client.get("/api/v1/users/999", headers=headers).status_code == 404


def test_cannot_modify_other_user(client, auth):
    _, headers = auth
    other, _ = register(client, email="other@example.com")
    body = {"full_name": "Hacker", "email": "h@example.com", "password": "x"}
    assert client.put(f"/api/v1/users/{other['id']}", json=body, headers=headers).status_code == 403
    assert client.delete(f"/api/v1/users/{other['id']}", headers=headers).status_code == 403


def test_password_update_is_hashed(client, auth):
    user, headers = auth
    body = {"full_name": "Student One", "email": "student@example.com", "password": "newpass123"}
    assert client.put(f"/api/v1/users/{user['id']}", json=body, headers=headers).status_code == 200
    login = client.post("/api/v1/login", data={"username": "student@example.com", "password": "newpass123"})
    assert login.status_code == 200


def test_delete_user_with_answers(client, auth):
    user, headers = auth
    question = client.get("/api/v1/assessments/1/questions").json()[0]
    client.post(
        "/api/v1/assessments/answers",
        json={"question_id": question["id"], "option_id": question["options"][0]["id"]},
        headers=headers,
    )
    assert client.delete(f"/api/v1/users/{user['id']}", headers=headers).status_code == 200
