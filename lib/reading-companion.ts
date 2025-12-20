export class ReadingCompanion {
    provideContextualHelp(currentPage: number, bookId: string): string[] {
        return [
            'Historical context about this period',
            'Character background information',
            'Related themes in other books',
        ];
    }

    explainConcept(term: string): string {
        return `Definition and explanation of: ${term}`;
    }

    suggestDiscussionTopics(bookId: string): string[] {
        return [
            'What did you think of the ending?',
            'How did the main character develop?',
            'What themes resonated with you?',
        ];
    }
}

export const readingCompanion = new ReadingCompanion();
