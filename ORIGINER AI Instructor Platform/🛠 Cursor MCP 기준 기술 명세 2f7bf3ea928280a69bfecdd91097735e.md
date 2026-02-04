# 🛠 Cursor / MCP 기준 기술 명세

## ORIGINER – AI Instructor Platform

**(Cursor / MCP / LLM-native Architecture)**

---

## 0. 기술 설계 목표

1. **강사 스타일이 절대 깨지지 않을 것**
2. **학생 맥락이 길게 유지될 것**
3. **Cursor / MCP 기반으로 빠른 반복 개발**
4. **LLM 교체 가능 구조**

---

## 1️⃣ 전체 시스템 아키텍처 (Logical)

```
[Frontend]
  └─ Chat UI / Dashboard
        ↓
[API Gateway]
        ↓
[Session Orchestrator]
        ├─ Instructor Context Loader
        ├─ Learner Memory Loader
        ├─ Prompt Assembler
        ↓
[LLM Runtime]
        ↓
[Response Validator]
        ↓
[Frontend Stream]

```

---

## 2️⃣ 핵심 컴포넌트 설명

---

### 🧠 2-1. Instructor Profile System (강사 핵심)

> 이 서비스의 심장
> 

### 데이터 구조

```tsx
InstructorProfile {
  id: string
  tone: "strict" | "friendly" | "coach"
  explanation_style: string[]
  analogy_patterns: string[]
  forbidden_topics: string[]
  curriculum_tree: TreeNode
}

```

### 생성 방식

- 강의 자료 → 구조 분석
- Q&A → 설명 패턴 추출
- 수동 Rule + Vector 혼합

📌 **중요**

> Fine-tuning ❌ 단독 사용 금지
> 
> 
> → **RAG + Rule + Prompt** 조합 필수
> 

---

### 🧠 2-2. Learner Memory System

### 목적

- “이 학생은 뭘 헷갈리는가?”를 기억

### 메모리 레이어

```tsx
LearnerMemory {
  learner_id: string
  weak_concepts: string[]
  mastered_concepts: string[]
  question_history: QA[]
  explanation_depth_level: number
}

```

### 저장 전략

- Short-term: Redis / In-memory
- Long-term: Vector DB + DB

---

## 3️⃣ Prompt System (매우 중요)

### 🎯 Prompt Layer 분리 구조

```
[System Prompt]
   + Instructor Identity
   + Teaching Rules

[Instructor Style Prompt]
   + 말투
   + 설명 방식

[Learner Context Prompt]
   + 이해도
   + 이전 질문

[User Input]

```

---

### ✨ 예시 (축약)

```
SYSTEM:
You are an AI instructor cloned from {InstructorName}.
Never answer outside the instructor's teaching style.

INSTRUCTOR_STYLE:
- Explains concepts step by step
- Uses real-world analogies
- Never gives final answers directly

LEARNER_CONTEXT:
- Learner struggles with recursion
- Needs concrete examples

USER:
Why does recursion stop here?

```

📌 Cursor에서 **프롬프트 블록 분리 파일**로 관리 추천

(`prompts/instructor.md`, `prompts/learner.md`)

---

## 4️⃣ Session Orchestrator (MCP 핵심)

> MCP = 수업 지휘자
> 

### 역할

- 컨텍스트 조합
- 토큰 예산 관리
- 스트리밍 응답 제어

```tsx
function runSession(input) {
  instructor = loadInstructorProfile()
  learner = loadLearnerMemory()
  prompt = assemblePrompt(instructor, learner, input)
  response = callLLM(prompt)
  validated = validate(response)
  updateLearnerMemory(validated)
  return stream(validated)
}

```

📌 MCP 도입 이유

→ **프롬프트 실험·교체가 매우 쉬움**

---

## 5️⃣ Response Validator (환각 방지)

### 검증 규칙

- 커리큘럼 범위 벗어남 ❌
- 강사 톤 불일치 ❌
- 정답 바로 제공 ❌

```tsx
if (response.violatesRules) {
  return fallbackInstructorResponse()
}

```

---

## 6️⃣ API 설계 (요약)

### POST `/session/start`

- instructor_id
- learner_id

### POST `/session/message`

- session_id
- user_message

### GET `/instructor/dashboard`

---

## 7️⃣ Cursor 개발 운영 전략

### 📁 추천 레포 구조

```
/origininer
 ├─ /prompts
 ├─ /instructor
 ├─ /learner
 ├─ /orchestrator
 ├─ /validators
 └─ /frontend

```

### Cursor 활용 팁

- 각 폴더에 `.mdc` 룰 설정
- Prompt 변경 = 코드 수정 ❌
- **Prompt = Config**

---

## 8️⃣ LLM 전략

### 초기

- GPT-4.x / GPT-5.x API

### 중기

- Open-source (Mixtral, Qwen) 병행

📌 **Instructor Vector는 LLM 독립적**

---

## 9️⃣ 확장 포인트 (미리 설계)

- 음성 강의 → Session Orchestrator 재사용
- 멀티 강사 → Instructor Mixer
- AI 강사 마켓 → Profile Marketplace

---

## 🔥 엔지니어 관점 핵심 한 줄

> “이건 챗봇이 아니라,상태를 가진 교육 시스템이다.”
> 

---