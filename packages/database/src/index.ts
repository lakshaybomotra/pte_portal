// Barrel file for @repo/database package

// Schema tables and types
export {
    // Enums
    userRoleEnum,
    examCodeEnum,
    sessionModeEnum,
    sessionStatusEnum,
    evaluationStatusEnum,
    // Tables
    tenants,
    profiles,
    exams,
    sections,
    questions,
    attemptSessions,
    responses,
    scoresPte,
    scoresIelts,
    // Relations
    tenantsRelations,
    profilesRelations,
    examsRelations,
    sectionsRelations,
    questionsRelations,
    attemptSessionsRelations,
    responsesRelations,
} from "./schema";

// Drizzle utilities (re-exported for single instance)
export { eq, and, or, sql, desc, asc } from "drizzle-orm";

// Database client inline to avoid circular deps
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is missing in .env");
}

// Transaction Pooler Configuration
export const client = postgres(connectionString, {
    prepare: false,
});

export const db = drizzle(client, { schema });
