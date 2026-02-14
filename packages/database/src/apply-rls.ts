
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: "../../.env" });

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("DIRECT_URL is missing in .env (Required for RLS Schema Changes)");
}

const sql = postgres(connectionString);

async function main() {
    console.log("🔒 Applying RLS Policies...");

    try {
        // 1. Enable RLS on All Tables
        const tables = [
            "profiles", "tenants",
            "exams", "sections", "questions",
            "attempt_sessions", "responses",
            "scores_pte", "scores_ielts"
        ];

        for (const t of tables) {
            console.log(`   - Enabling RLS on ${t}...`);
            await sql`ALTER TABLE ${sql(t)} ENABLE ROW LEVEL SECURITY`;
        }

        // 2. Create Policies
        console.log("   - Creating Policies...");

        // PROFILES
        await sql`DROP POLICY IF EXISTS "Users can view own profile" ON profiles`;
        await sql`CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id)`;

        await sql`DROP POLICY IF EXISTS "Users can update own profile" ON profiles`;
        await sql`CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id)`;

        // TENANTS (Public Read)
        await sql`DROP POLICY IF EXISTS "Public read tenants" ON tenants`;
        await sql`CREATE POLICY "Public read tenants" ON tenants FOR SELECT USING (true)`;

        // EXAMS (Public Read)
        await sql`DROP POLICY IF EXISTS "Public read exams" ON exams`;
        await sql`CREATE POLICY "Public read exams" ON exams FOR SELECT USING (true)`;

        // SECTIONS (Public Read)
        await sql`DROP POLICY IF EXISTS "Public read sections" ON sections`;
        await sql`CREATE POLICY "Public read sections" ON sections FOR SELECT USING (true)`;

        // QUESTIONS (Public Read)
        // Note: This exposes the 'scoring_rubric' column to the API if selected. 
        // Frontend must select specific columns. Real security for column requires a View.
        await sql`DROP POLICY IF EXISTS "Public read questions" ON questions`;
        await sql`CREATE POLICY "Public read questions" ON questions FOR SELECT USING (true)`;

        // ATTEMPT SESSIONS (User Owns)
        await sql`DROP POLICY IF EXISTS "Users own sessions" ON attempt_sessions`;
        await sql`CREATE POLICY "Users own sessions" ON attempt_sessions FOR ALL USING (auth.uid() = user_id)`;

        // RESPONSES (User Owns via Session)
        // Note: RLS with Joins can have perf impact, but essential here.
        await sql`DROP POLICY IF EXISTS "Users own responses" ON responses`;
        await sql`CREATE POLICY "Users own responses" ON responses FOR ALL USING (
      session_id IN (SELECT id FROM attempt_sessions WHERE user_id = auth.uid())
    )`;

        // SCORES PTE
        await sql`DROP POLICY IF EXISTS "Users own scores_pte" ON scores_pte`;
        await sql`CREATE POLICY "Users own scores_pte" ON scores_pte FOR ALL USING (
      session_id IN (SELECT id FROM attempt_sessions WHERE user_id = auth.uid())
    )`;

        // SCORES IELTS
        await sql`DROP POLICY IF EXISTS "Users own scores_ielts" ON scores_ielts`;
        await sql`CREATE POLICY "Users own scores_ielts" ON scores_ielts FOR ALL USING (
      session_id IN (SELECT id FROM attempt_sessions WHERE user_id = auth.uid())
    )`;

        console.log("✅ RLS Applied Successfully!");

    } catch (err) {
        console.error("❌ RLS Failed:", err);
    } finally {
        await sql.end();
    }
}

main();
