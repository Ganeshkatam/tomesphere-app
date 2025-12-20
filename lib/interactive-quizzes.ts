export interface BookQuiz {
    id: string;
    bookId: string;
    questions: QuizQuestion[];
    difficulty: 'easy' | 'medium' | 'hard';
    passingScore: number;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export class InteractiveQuizzes {
    createQuiz(bookId: string, difficulty: BookQuiz['difficulty']): BookQuiz {
        return {
            id: crypto.randomUUID(),
            bookId,
            questions: this.generateQuestions(bookId, difficulty),
            difficulty,
            passingScore: 70,
        };
    }

    private generateQuestions(bookId: string, difficulty: string): QuizQuestion[] {
        // Mock questions - would integrate with AI to generate from book content
        return [
            {
                id: '1',
                question: 'What is the main theme of this book?',
                options: ['Love', 'Adventure', 'Mystery', 'Coming of age'],
                correctAnswer: 0,
                explanation: 'The central theme explores the concept of love.',
            },
            {
                id: '2',
                question: 'Who is the protagonist?',
                options: ['Character A', 'Character B', 'Character C', 'Character D'],
                correctAnswer: 1,
            },
        ];
    }

    checkAnswer(questionId: string, userAnswer: number, quiz: BookQuiz): boolean {
        const question = quiz.questions.find(q => q.id === questionId);
        return question ? question.correctAnswer === userAnswer : false;
    }

    calculateScore(userAnswers: Record<string, number>, quiz: BookQuiz): {
        score: number;
        percentage: number;
        passed: boolean;
    } {
        let correct = 0;

        quiz.questions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) {
                correct++;
            }
        });

        const percentage = (correct / quiz.questions.length) * 100;

        return {
            score: correct,
            percentage,
            passed: percentage >= quiz.passingScore,
        };
    }
}

export const quizSystem = new InteractiveQuizzes();
