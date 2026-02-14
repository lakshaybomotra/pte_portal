
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm"; // drizzle-orm imports are safe, they don't side-effect

// 1. Load Env Vars FIRST
dotenv.config({ path: "../../.env" });

async function main() {
    console.log("🌱 Starting Seed...");

    // 2. Dynamic Import of DB Client (connects on load)
    const { db, exams, sections, questions } = await import("./client");

    // 3. Upsert PTE Exam
    console.log("Creating Exam: PTE...");
    await db
        .insert(exams)
        .values({ code: "PTE", title: "Pearson Test of English" })
        .onConflictDoNothing();

    // 4. Upsert Sections
    console.log("Creating PTE Sections...");
    const sectionsData = [
        { title: "Speaking & Writing", order: 1 },
        { title: "Reading", order: 2 },
        { title: "Listening", order: 3 },
    ];

    for (const s of sectionsData) {
        const existing = await db.query.sections.findFirst({
            where: (table, { and, eq }) => and(eq(table.examCode, "PTE"), eq(table.title, s.title))
        });

        if (!existing) {
            await db.insert(sections).values({
                examCode: "PTE",
                title: s.title,
                order: s.order,
            });
        }
    }

    // 5. Create a Sample 'Read Aloud' Question
    console.log("Creating Sample Question: Read Aloud...");

    const speakingSection = await db.query.sections.findFirst({
        where: (table, { and, eq }) => and(eq(table.examCode, "PTE"), eq(table.title, "Speaking & Writing"))
    });

    if (speakingSection) {
        const sampleContent = {
            text: "The rapid pace of technological change has transformed the way we communicate and access information.",
            time_limit: 40,
            prep_time: 25
        };

        const sampleRubric = {
            transcript: "The rapid pace of technological change has transformed the way we communicate and access information.",
            keywords_emphasis: ["rapid", "technological", "transformed"],
        };

        // Check if question exists (to prevent dupes on re-run)
        // Naively checking by content text in JSON might be hard, so just inserting blindly or checking by a unique field?
        // For now, let's just insert one if the table seems empty for testing?
        // Actually, I'll clear questions for this section first? No, that deletes user data.
        // Let's just Add it. It won't hurt to have dupes in dev.

        await db.insert(questions).values({
            examCode: "PTE",
            sectionId: speakingSection.id,
            itemType: "read_aloud",
            content: sampleContent,
            scoringRubric: sampleRubric,
            difficulty: 3
        });
    }

    console.log("✅ Seed Complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seed Failed:", err);
    process.exit(1);
});
