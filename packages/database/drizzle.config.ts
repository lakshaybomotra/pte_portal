import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL is missing in .env (Required for Migrations)");
}

export default defineConfig({
    schema: "./src/schema.ts",
    out: "./supabase/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DIRECT_URL,
    },
});
