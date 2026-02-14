import { pgTable, uuid, text, integer, jsonb, boolean, timestamp, decimal, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// --------------------------------------------------------------------------
// 1. Enums
// --------------------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
export const examCodeEnum = pgEnum("exam_code", ["PTE", "IELTS"]);
export const sessionModeEnum = pgEnum("session_mode", ["practice", "mock_test"]);
export const sessionStatusEnum = pgEnum("session_status", ["in_progress", "completed", "evaluated"]);
export const evaluationStatusEnum = pgEnum("evaluation_status", ["pending", "processing", "evaluated", "failed"]);

// --------------------------------------------------------------------------
// 2. Identity & Access
// --------------------------------------------------------------------------
export const tenants = pgTable("tenants", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    domain: text("domain").unique(),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey(), // Linked to auth.users in Supabase
    tenantId: uuid("tenant_id").references(() => tenants.id),
    role: userRoleEnum("role").default("student"),
    fullName: text("full_name"),
    targetScore: integer("target_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --------------------------------------------------------------------------
// 3. Content Engine
// --------------------------------------------------------------------------
export const exams = pgTable("exams", {
    code: examCodeEnum("code").primaryKey(),
    title: text("title").notNull(),
    isActive: boolean("is_active").default(true),
});

export const sections = pgTable("sections", {
    id: uuid("id").defaultRandom().primaryKey(),
    examCode: examCodeEnum("exam_code").references(() => exams.code),
    title: text("title").notNull(),
    order: integer("order").notNull(),
});

export const questions = pgTable("questions", {
    id: uuid("id").defaultRandom().primaryKey(),
    examCode: examCodeEnum("exam_code").notNull().references(() => exams.code),
    sectionId: uuid("section_id").references(() => sections.id),

    // Discriminators
    itemType: text("item_type").notNull(), // 'read_aloud', 'essay', etc.

    // Content (Public)
    content: jsonb("content").notNull().default({}),

    // Logic (Private/Protected)
    scoringRubric: jsonb("scoring_rubric").notNull().default({}),

    difficulty: integer("difficulty").default(5),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        idxType: index("idx_q_type").on(table.examCode, table.itemType),
    };
});

// --------------------------------------------------------------------------
// 4. Assessment & Scoring
// --------------------------------------------------------------------------
export const attemptSessions = pgTable("attempt_sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => profiles.id), // Link to our internal profile
    examCode: examCodeEnum("exam_code").references(() => exams.code),
    mode: sessionModeEnum("mode").default("practice"),
    status: sessionStatusEnum("status").default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const responses = pgTable("responses", {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => attemptSessions.id),
    questionId: uuid("question_id").notNull().references(() => questions.id),

    questionOrder: integer("question_order").notNull(),

    userAnswer: jsonb("user_answer").notNull(),
    aiFeedback: jsonb("ai_feedback"),
    evaluationStatus: evaluationStatusEnum("evaluation_status").default("pending"),

    scoreObtained: decimal("score_obtained", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Extension: PTE Scores
export const scoresPte = pgTable("scores_pte", {
    sessionId: uuid("session_id").primaryKey().references(() => attemptSessions.id),

    overallScore: integer("overall_score"),

    // Communicative
    speaking: integer("speaking"),
    writing: integer("writing"),
    reading: integer("reading"),
    listening: integer("listening"),

    // Enabling
    fluency: integer("fluency"),
    pronunciation: integer("pronunciation"),
    grammar: integer("grammar"),
    vocabulary: integer("vocabulary"),
    spelling: integer("spelling"),
    discourse: integer("discourse"),

    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
});

// Extension: IELTS Scores
export const scoresIelts = pgTable("scores_ielts", {
    sessionId: uuid("session_id").primaryKey().references(() => attemptSessions.id),

    overallBand: decimal("overall_band", { precision: 2, scale: 1 }),

    listeningBand: decimal("listening_band", { precision: 2, scale: 1 }),
    readingBand: decimal("reading_band", { precision: 2, scale: 1 }),
    writingBand: decimal("writing_band", { precision: 2, scale: 1 }),
    speakingBand: decimal("speaking_band", { precision: 2, scale: 1 }),

    examinerComments: jsonb("examiner_comments"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
});

// --------------------------------------------------------------------------
// 5. Relations
// --------------------------------------------------------------------------
export const tenantsRelations = relations(tenants, ({ many }) => ({
    profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [profiles.tenantId],
        references: [tenants.id],
    }),
    sessions: many(attemptSessions),
}));

export const examsRelations = relations(exams, ({ many }) => ({
    sections: many(sections),
    questions: many(questions),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
    exam: one(exams, {
        fields: [sections.examCode],
        references: [exams.code],
    }),
    questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    exam: one(exams, {
        fields: [questions.examCode],
        references: [exams.code],
    }),
    section: one(sections, {
        fields: [questions.sectionId],
        references: [sections.id],
    }),
    responses: many(responses),
}));

export const attemptSessionsRelations = relations(attemptSessions, ({ one, many }) => ({
    user: one(profiles, {
        fields: [attemptSessions.userId],
        references: [profiles.id],
    }),
    exam: one(exams, {
        fields: [attemptSessions.examCode],
        references: [exams.code],
    }),
    responses: many(responses),
    scorePte: one(scoresPte, {
        fields: [attemptSessions.id],
        references: [scoresPte.sessionId],
    }),
    scoreIelts: one(scoresIelts, {
        fields: [attemptSessions.id],
        references: [scoresIelts.sessionId],
    }),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
    session: one(attemptSessions, {
        fields: [responses.sessionId],
        references: [attemptSessions.id],
    }),
    question: one(questions, {
        fields: [responses.questionId],
        references: [questions.id],
    }),
}));

