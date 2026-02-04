# 🧩 API Specification & DB Schema

## ORIGINER – AI Instructor Platform (MVP)

---

## 0. 설계 원칙

1. **Session 중심 설계** (수업 = 세션)
2. **강사 / 학생 데이터 완전 분리**
3. **LLM 교체 가능**
4. **RAG + Rule 기반**

---

## 1️⃣ Core Domain Model

### 핵심 엔티티

- Instructor
- InstructorProfile
- Learner
- LearnerMemory
- Session
- Message
- InstructorMaterial

---

## 2️⃣ API 명세 (REST 기준)

---

### 🔐 Auth (간략화, MVP)

### `POST /auth/login`

```json
{
  "email": "test@origininer.ai",
  "role": "instructor | learner"
}

```

---

## 3️⃣ Instructor APIs

---

### 🧑‍🏫 강사 생성

### `POST /instructors`

```json
{
  "name": "김OO",
  "bio": "비유로 설명하는 AI 강사",
  "tone": "friendly"
}

```

**Response**

```json
{
  "instructor_id": "inst_123"
}

```

---

### 📚 강의 자료 업로드

### `POST /instructors/{id}/materials`

```json
{
  "type": "pdf | ppt | code | text",
  "content_url": "s3://..."
}

```

---

### 🧠 AI 강사 생성 요청

### `POST /instructors/{id}/profile/build`

**Response**

```json
{
  "status": "processing"
}

```

---

### 👀 AI 응답 미리보기

### `POST /instructors/{id}/preview`

```json
{
  "question": "재귀가 왜 여기서 멈춰요?"
}

```

---

## 4️⃣ Learner APIs

---

### 👩‍🎓 학생 생성

### `POST /learners`

```json
{
  "name": "이OO",
  "level": "beginner"
}

```

---

### 📈 학습 기록 조회

### `GET /learners/{id}/memory`

```json
{
  "weak_concepts": ["recursion"],
  "explanation_depth_level": 2
}

```

---

## 5️⃣ Session APIs (핵심)

---

### ▶️ 수업 세션 시작

### `POST /sessions/start`

```json
{
  "instructor_id": "inst_123",
  "learner_id": "learner_456"
}

```

**Response**

```json
{
  "session_id": "sess_789"
}

```

---

### 💬 메시지 전송 (Streaming 가능)

### `POST /sessions/{id}/message`

```json
{
  "message": "이 부분이 이해가 안돼요"
}

```

**Response**

```json
{
  "ai_message": "좋은 질문이야. 여기서 먼저..."
}

```

---

### ⛔ 세션 종료

### `POST /sessions/{id}/end`

---

## 6️⃣ Instructor Dashboard API

---

### 📊 대시보드 데이터

### `GET /instructors/{id}/dashboard`

```json
{
  "top_questions": [
    "재귀 종료 조건",
    "포인터 개념"
  ],
  "confusing_sections": [
    "Transformer Self-Attention"
  ]
}

```

---

## 7️⃣ DB Schema (SQL 기준)

---

### 🧑‍🏫 instructors

```sql
CREATE TABLE instructors (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  bio TEXT,
  tone VARCHAR,
  created_at TIMESTAMP
);

```

---

### 🧠 instructor_profiles

```sql
CREATE TABLE instructor_profiles (
  instructor_id VARCHAR,
  explanation_style JSONB,
  analogy_patterns JSONB,
  forbidden_topics JSONB,
  curriculum_tree JSONB,
  created_at TIMESTAMP
);

```

---

### 📚 instructor_materials

```sql
CREATE TABLE instructor_materials (
  id VARCHAR PRIMARY KEY,
  instructor_id VARCHAR,
  type VARCHAR,
  content_url TEXT,
  created_at TIMESTAMP
);

```

---

### 👩‍🎓 learners

```sql
CREATE TABLE learners (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  level VARCHAR,
  created_at TIMESTAMP
);

```

---

### 🧠 learner_memory

```sql
CREATE TABLE learner_memory (
  learner_id VARCHAR,
  weak_concepts JSONB,
  mastered_concepts JSONB,
  explanation_depth_level INT,
  updated_at TIMESTAMP
);

```

---

### ▶️ sessions

```sql
CREATE TABLE sessions (
  id VARCHAR PRIMARY KEY,
  instructor_id VARCHAR,
  learner_id VARCHAR,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

```

---

### 💬 messages

```sql
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY,
  session_id VARCHAR,
  sender VARCHAR, -- learner | ai
  content TEXT,
  created_at TIMESTAMP
);

```

---

## 8️⃣ Vector DB 구조 (RAG)

### Instructor Knowledge

- collection: `instructor_{id}_knowledge`
- embeddings: 강의 자료 / Q&A

### Learner Context

- collection: `learner_{id}_memory`
- embeddings: 질문 히스토리 / 오개념

---

## 9️⃣ 트랜잭션 흐름 요약

```
User Message
 → Session API
   → Instructor Profile Load
   → Learner Memory Load
   → Prompt Assemble
   → LLM Call
   → Response Validate
   → Save Message
   → Update Memory

```

---

## 🔥 백엔드 관점 한 줄 요약

> “모든 것은 세션을 중심으로 흐르고,AI는 그 안에서만 말한다.”
> 

---