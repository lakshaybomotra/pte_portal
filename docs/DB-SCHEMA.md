# Enterprise Database Schema Documentation

**Platform:** PTE Learning Platform (Multi-Tenant, Multi-Exam)
**Database:** PostgreSQL (Supabase) + Drizzle ORM
**Architecture:** Hybrid (Relational Core + Typed JSONB Extensions)

---

## 1. Enums (Type Definitions)

```sql
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE exam_code AS ENUM ('PTE', 'IELTS');
CREATE TYPE session_mode AS ENUM ('practice', 'mock_test');
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'evaluated');
CREATE TYPE evaluation_status AS ENUM ('pending', 'processing', 'evaluated', 'failed');
```

---

## 2. Identity & Access Layers

### `tenants` (B2B / Multi-Tenancy)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,         -- e.g. "Public" or "Ace Institute"
  domain TEXT UNIQUE,         -- e.g. "ace.pteportal.com"
  settings JSONB DEFAULT '{}', -- Branding (logo, colors)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `profiles` (User Extensions)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  role user_role DEFAULT 'student',
  full_name TEXT,
  target_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Content Engine (The Hybrid Core)

### `exams` & `sections`
```sql
CREATE TABLE exams (
  code exam_code PRIMARY KEY, -- 'PTE'
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_code exam_code REFERENCES exams(code),
  title TEXT NOT NULL, -- 'Speaking', 'Writing'
  "order" INTEGER NOT NULL
);
```

### `questions` (The Polymorphic Master Table)
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_code exam_code NOT NULL REFERENCES exams(code),
  section_id UUID REFERENCES sections(id),
  
  -- Discriminator for Frontend/Zod
  item_type TEXT NOT NULL, -- 'read_aloud', 'essay', 'fib_dropdown'
  
  -- 🔒 PUBLIC READ-ONLY CONTENT (Validated by Zod before INSERT)
  content JSONB NOT NULL DEFAULT '{}', 
  CONSTRAINT content_valid CHECK (jsonb_typeof(content) = 'object'),

  -- 🔒 PRIVATE SCORING LOGIC (RLS Protected - Hidden from Student)
  scoring_rubric JSONB NOT NULL DEFAULT '{}',

  difficulty INTEGER DEFAULT 5, -- 1-10 Scale
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Index for fast filtering
CREATE INDEX idx_questions_type ON questions(exam_code, item_type);
```

---

## 4. Assessment & Scoring Layers

### `attempt_sessions` (The Test Instance)
```sql
CREATE TABLE attempt_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  exam_code exam_code REFERENCES exams(code),
  mode session_mode DEFAULT 'practice',
  status session_status DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

### `responses` (User Answers)
```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attempt_sessions(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  
  -- Order persistence for Mock Tests
  question_order INTEGER NOT NULL,

  -- User Input (Audio Path, Text, or Indices)
  user_answer JSONB NOT NULL,

  -- AI Feedback (Pronunciation score, Grammar errors)
  ai_feedback JSONB,
  
  -- Async Scoring Status (for BullMQ polling)
  evaluation_status evaluation_status DEFAULT 'pending',

  -- Normalized Score (0-90) for this single item
  score_obtained DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `scores_pte` (Extension Table: PTE Specifics)
```sql
CREATE TABLE scores_pte (
  session_id UUID PRIMARY KEY REFERENCES attempt_sessions(id),
  
  -- Overall Score (10-90)
  overall_score INTEGER CHECK (overall_score BETWEEN 10 AND 90),
  
  -- Communicative Skills
  speaking INTEGER,
  writing INTEGER,
  reading INTEGER,
  listening INTEGER,
  
  -- Enabling Skills (Granular)
  fluency INTEGER,
  pronunciation INTEGER,
  grammar INTEGER,
  vocabulary INTEGER,
  spelling INTEGER,
  discourse INTEGER,
  
  generated_at TIMESTAMPTZ DEFAULT now()
);
```

### `scores_ielts` (Extension Table: IELTS Specifics)
```sql
CREATE TABLE scores_ielts (
  session_id UUID PRIMARY KEY REFERENCES attempt_sessions(id),
  
  -- Band Scores (0-9.0)
  overall_band DECIMAL(2,1) CHECK (overall_band BETWEEN 0 AND 9.0),
  
  listening_band DECIMAL(2,1),
  reading_band DECIMAL(2,1),
  writing_band DECIMAL(2,1),
  speaking_band DECIMAL(2,1),
  
  examiner_comments JSONB, -- Generic storage for human feedback
  generated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. JSONB Contracts (Managed in code via Zod)

### Type: `read_aloud` (PTE Speaking)
**Content (`questions.content`):**
```json
{
  "text": "The rapid pace of technological change...",
  "time_limit": 40,
  "prep_time": 25
}
```

### Type: `fib_dropdown` (PTE Reading)
**Content (`questions.content`):**
```json
{
  "text_template": "Science is a {{0}} process...",
  "blanks": [
    { "index": 0, "options": ["systematic", "random", "chaotic"] }
  ]
}
```

---

## 6. RLS Security Policies

1.  **`questions`**: `SELECT` is Public. `INSERT` is Admin only.
2.  **`scoring_rubric`**: **CRITICAL**. Creating a `view_public_questions` view that selects all columns *except* `scoring_rubric` is recommended for the Student API. 
3.  **`attempt_sessions`**: Users can only read/write their own rows (`auth.uid() = user_id`).
4.  **`tenants`**: Users access data filtered by `tenant_id` from their `profile`.
