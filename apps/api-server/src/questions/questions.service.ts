import { Injectable } from '@nestjs/common';
import { db, questions, eq, and, sql } from '@repo/database';

@Injectable()
export class QuestionsService {
    /**
     * Fetch a random question by item_type (e.g., 'read_aloud')
     * Excludes the scoring_rubric for security.
     */
    async getRandomByType(itemType: string) {
        // Using SQL RANDOM() to get a random question
        const result = await db
            .select({
                id: questions.id,
                examCode: questions.examCode,
                sectionId: questions.sectionId,
                itemType: questions.itemType,
                content: questions.content,
                difficulty: questions.difficulty,
                // Note: Intentionally NOT selecting scoringRubric
            })
            .from(questions)
            .where(and(eq(questions.itemType, itemType), eq(questions.isActive, true)))
            .orderBy(sql`RANDOM()`)
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return result[0];
    }

    /**
     * Fetch all question types available for an exam
     */
    async getQuestionTypes(examCode: 'PTE' | 'IELTS' = 'PTE') {
        const result = await db
            .selectDistinct({ itemType: questions.itemType })
            .from(questions)
            .where(eq(questions.examCode, examCode));

        return result.map((r: { itemType: string }) => r.itemType);
    }
}
