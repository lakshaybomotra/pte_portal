
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is missing in .env");
}

// Transaction Pooler Configuration
// Supabase Transaction Pooler (Port 6543) does NOT support prepared statements.
export const client = postgres(connectionString, {
    prepare: false
});

export const db = drizzle(client, { schema });

