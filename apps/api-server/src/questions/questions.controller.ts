import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    /**
     * GET /questions/random?type=read_aloud
     * Returns a random question of the specified type.
     */
    @Get('random')
    async getRandomQuestion(@Query('type') itemType: string) {
        if (!itemType) {
            throw new NotFoundException('Query param "type" is required');
        }

        const question = await this.questionsService.getRandomByType(itemType);

        if (!question) {
            throw new NotFoundException(`No questions found for type: ${itemType}`);
        }

        return question;
    }

    /**
     * GET /questions/types?exam=PTE
     * Returns available question types for an exam.
     */
    @Get('types')
    async getQuestionTypes(@Query('exam') examCode: 'PTE' | 'IELTS' = 'PTE') {
        const types = await this.questionsService.getQuestionTypes(examCode);
        return { types };
    }
}
