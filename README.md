# PTE & IELTS Practice Portal

A comprehensive prep platform for PTE and IELTS exams, built contributing to a modern monorepo structure.

## 🏗️ Tech Stack

- **Monorepo Manager:** [Turborepo](https://turbo.build/)
- **Frontend (Student Portal):** [Next.js 16](https://nextjs.org/) (React 19)
- **Backend (API):** [NestJS 11](https://nestjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Styling:** CSS Modules / Tailwind (where applicable)
- **Language:** TypeScript 100%

## 📂 Project Structure

```text
├── apps/
│   ├── web-student/     # Next.js student-facing application
│   └── api-server/      # NestJS backend API
└── packages/
    ├── database/        # Shared Drizzle schema, client, and seeds
    ├── ui/              # Shared React UI components
    ├── typescript-config/ # Shared TS configurations
    └── eslint-config/   # Shared ESLint configurations
```

## 🧩 Key Features

- **Multi-Tenant Architecture:** Supports multiple institutions/tenants.
- **User Roles:** Student, Teacher, Admin.
- **Exam Engine:** Support for PTE and IELTS exam structures.
  - Sections, Questions, Item Types (Read Aloud, Essay, etc.).
  - Scouting & Rubrics.
- **Assessment:**
  - Full Mock Tests & Practice Sessions.
  - AI-based Feedback & Scoring (placeholder/planned).
  - Detailed Scoring Breakdowns (Communicative & Enabling Skills).

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm, pnpm, or yarn
- PostgreSQL database (Supabase recommended)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd pte_portal
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

### Environment Setup

Create `.env` files in the respective application directories:

**`apps/api-server/.env` & `packages/database/.env`**
```env
DATABASE_URL=postgres://user:pass@host:5432/db
# Add other necessary env vars
```

### Running the Project

To run the entire stack (Frontend + Backend) in development mode:

```bash
npx turbo dev
```

- **Web Student:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:3001](http://localhost:3001) (or configured port)

### Database Management

The `packages/database` folder contains the Drizzle schema and migrations.

**Seed the database:**
```bash
npm run seed --workspace=@repo/database
```

## 🛠️ Development

- **Build:** `npx turbo build`
- **Lint:** `npx turbo lint`
- **Type Check:** `npx turbo check-types`

## 🤝 Contributing

This project uses Turborepo. Development is streamlined to cache builds and checks. Ensure you follow the linting rules and commit messages.
