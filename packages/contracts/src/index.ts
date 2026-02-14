import { z } from "zod";

// --------------------------------------------------------------------------
// 1. PTE: Read Aloud
// --------------------------------------------------------------------------
export const ReadAloudContentSchema = z.object({
    text: z.string().min(1, "Text is required"),
    time_limit: z.number().int().positive().default(40),
    prep_time: z.number().int().positive().default(25),
});

export const ReadAloudRubricSchema = z.object({
    transcript: z.string(),
    keywords: z.array(z.string()).optional(),
});

// --------------------------------------------------------------------------
// 2. PTE: Fill In Blanks (Dropdown)
// --------------------------------------------------------------------------
export const FibDropdownOptionSchema = z.object({
    index: z.number().int(),
    options: z.array(z.string()).min(2),
});

export const FibDropdownContentSchema = z.object({
    text_template: z.string().includes("{{0}}"), // Simple check
    blanks: z.array(FibDropdownOptionSchema),
});

export const FibDropdownAnswerSchema = z.object({
    blank_index: z.number(),
    correct_option: z.string(),
});

export const FibDropdownRubricSchema = z.object({
    answers: z.array(FibDropdownAnswerSchema),
});

// --------------------------------------------------------------------------
// 3. Polymorphic Validation Helper
// --------------------------------------------------------------------------
export const QuestionSchemas = {
    read_aloud: {
        content: ReadAloudContentSchema,
        rubric: ReadAloudRubricSchema,
    },
    fib_dropdown: {
        content: FibDropdownContentSchema,
        rubric: FibDropdownRubricSchema,
    },
    // Add other types here...
};
