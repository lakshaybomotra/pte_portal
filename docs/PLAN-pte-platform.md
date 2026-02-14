# PTE Learning Platform - Enterprise Plan

**Goal:** Build a scalable, multi-tenant (B2C/B2B), multi-exam (PTE/IELTS) learning platform with a dedicated backend.

---

## 🏗️ Tech Stack (Enterprise)

| Component | Choice | Rationale |
| :--- | :--- | :--- |
| **Monorepo** | **Turborepo** | Manages Web, API, and Shared Packages efficiently. |
| **Frontend** | **Next.js** (App Router) | SEO, Server Components, best-in-class React framework. |
| **Backend** | **NestJS** (Node.js) | Structured, scalable, enterprise-standard for dedicated APIs. |
| **Database** | **Supabase** (PostgreSQL) | Managed Postgres with excellent JSONB support. |
| **ORM** | **Drizzle ORM** | Lightweight, Type-safe, great for serverless & edge. |
| **Validation** | **Zod** | Runtime validation for dynamic Question JSON content. |
| **Auth** | **Supabase Auth** | Handled at Gateway level, verified by NestJS Guards. |

---

## 📂 Enterprise Architecture (Turborepo)

```text
/
├── apps/
│   ├── web-student/            # (Next.js) B2C Student App
│   │   ├── app/                # Pages & Routes
│   ├── web-institute/          # (Next.js) B2B Dashboard (Future/Skeleton)
│   └── api-server/             # (NestJS) Dedicated Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── scoring/    # Core Scoring Logic
│       │   │   ├── exams/      # Exam Management
│       │   │   └── attempts/   # Session handling
├── packages/
│   ├── database/               # Shared Drizzle Schema & Client
│   ├── contracts/              # Shared Zod Schemas (API Request/Response types)
│   └── ui/                     # Shared Tailwind Components
├── docker-compose.yml          # Local Dev Setup (Redis, etc.)
└── turbo.json                  # Build pipeline
```

---

## 🗄️ Database Schema Strategy: "Core + Extension"

We use a Hybrid Model to support PTE & IELTS side-by-side.

### 1. Core Config (Typed JSONB)
*   **`questions` Table**:
    *   Columns: `id`, `exam_type` (Enum), `item_type` (String), `content` (JSONB).
    *   **Safety**: `content` column is VALIDATED by Zod Schemas in `packages/contracts` before writing.
    *   **Polymorphism**: The `item_type` discriminates which Zod schema to use.

### 2. Scoring (Separate Tables)
*   **`scores_pte`**: Columns for `oral_fluency`, `pronunciation`, `communicative_skills`.
*   **`scores_ielts`**: Columns for `band_score`, `examiner_comments`.

---

## 📝 Task Breakdown

### Phase 1: The "Enterprise" Skeleton
**Goal:** A working Monorepo with connected Web <-> API <-> DB.
- [ ] **P1-1: Mono Init**: Initialize Turborepo with `apps/web-student` and `apps/api-server`.
- [ ] **P1-2: Shared DB**: Create `packages/database`, setup Drizzle, connect to Supabase.
- [ ] **P1-3: Contracts**: Create `packages/contracts` and define the `Question` Zod Schema.
- [ ] **P1-4: NestJS Setup**: Setup basic NestJS app with Supabase Auth Guard (JWT Strategy).

### Phase 2: Content Management (The Hard Part)
**Goal:** Storing and fetching complex questions.
- [ ] **P2-1: Seeding Script**: Write a script to insert 5 types of PTE questions using the Zod Schema.
- [ ] **P2-2: API - Get Question**: NestJS endpoint `GET /questions/:id` (returns typed JSON).
- [ ] **P2-3: Web - Question Render**: Dynamic React Component that switches UI based on `item_type`.

### Phase 3: The Practice Loop
**Goal:** Taking a test.
- [ ] **P3-1: API - Start Session**: POST `/sessions` (Creates `attempt_session` row).
- [ ] **P3-2: Web - Timer**: Client-side hook syncs with Server start time.
- [ ] **P3-3: Web - Submit Answer**: POST `/sessions/:id/submit` (Saves to `responses` table).

### Phase 4: Scoring Engine (Node.js)
**Goal:** Grading the user.
- [ ] **P4-1: Scorer Service**: Dedicated NestJS Module.
- [ ] **P4-2: Objective Logic**: Compare user answer vs `scoring_rubric` (fetched from DB).
- [ ] **P4-3: Async Queue**: Setup BullMQ (Redis) for processing Audio Scoring (to not block HTTP).

### Phase 5: MVP Polish
**Goal:** Launch Ready.
- [ ] **P5-1: Auth Flow**: Complete Login/Register on Next.js.
- [ ] **P5-2: Error Handling**: Global Exception Filters in NestJS.

---

## ✅ Phase X: Verification Checklist

### Functional
- [ ] `npm run build` builds ALL apps (Web + API) successfully.
- [ ] API rejects invalid Question JSON (Zod validation works).
- [ ] Student can login -> Start Test -> Submit Answer -> See Score.

### Architecture
- [ ] Database Schema allows inserting an IELTS question without errors.
- [ ] `packages/database` is imported by both API and Web.
