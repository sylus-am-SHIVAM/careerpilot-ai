# Database Design

## Planned Database

PostgreSQL

---

## Initial Tables

### User

- id
- name
- email
- password
- created_at

---

### Resume

- id
- user_id
- file_path
- extracted_skills
- uploaded_at

---

### Assessment

- id
- user_id
- personality_score
- interests
- aptitude_score

---

### Roadmap

- id
- user_id
- goal
- roadmap
- created_at

---

### Chat History

- id
- user_id
- message
- response
- timestamp

---

Status: 🚧 Design Phase
