import { Book } from './supabase';

export interface HybridRecommendation {
    book: Book;
    score: number;
    sources: {
        collaborative: number;
        contentBased: number;
        trending: number;
        social: number;
        ai: number;
    };
    reasoning: string[];
}

export class RecommendationEngineV3 {
    generateHybridRecommendations(
        userId: string,
        allBooks: Book[],
        userHistory: any[],
        socialData: any[]
    ): HybridRecommendation[] {
        const recommendations: HybridRecommendation[] = [];

        allBooks.forEach(book => {
            const sources = {
                collaborative: this.getCollaborativeScore(book, userHistory),
                contentBased: this.getContentScore(book, userHistory),
                trending: this.getTrendingScore(book),
                social: this.getSocialScore(book, socialData),
                ai: this.getAIScore(book, userHistory),
            };

            const score =
                sources.collaborative * 0.25 +
                sources.contentBased * 0.25 +
                sources.trending * 0.15 +
                sources.social * 0.20 +
                sources.ai * 0.15;

            const reasoning = this.generateReasoning(sources, book);

            if (score > 50) {
                recommendations.push({
                    book,
                    score,
                    sources,
                    reasoning,
                });
            }
        });

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);
    }

    private getCollaborativeScore(book: Book, history: any[]): number {
        // Users who read similar books also read this
        return Math.random() * 100; // Mock
    }

    private getContentScore(book: Book, history: any[]): number {
        if (history.length === 0) return 50;

        const matchingGenres = history.filter(h => h.genre === book.genre).length;
        return (matchingGenres / history.length) * 100;
    }

    private getTrendingScore(book: Book): number {
        return book.is_featured ? 80 : 40;
    }

    private getSocialScore(book: Book, socialData: any[]): number {
        // Friends' ratings and recommendations
        return Math.random() * 100; // Mock
    }

    private getAIScore(book: Book, history: any[]): number {
        // AI pattern matching
        return Math.random() * 100; // Mock
    }

    private generateReasoning(sources: HybridRecommendation['sources'], book: Book): string[] {
        const reasons: string[] = [];

        if (sources.collaborative > 70) {
            reasons.push('Readers like you loved this book');
        }
        if (sources.contentBased > 70) {
            reasons.push(`Matches your interest in ${book.genre}`);
        }
        if (sources.trending > 70) {
            reasons.push('Currently trending');
        }
        if (sources.social > 70) {
            reasons.push('Recommended by your friends');
        }
        if (sources.ai > 70) {
            reasons.push('AI predicts you\'ll enjoy this');
        }

        return reasons;
    }
}

export const recommendationEngineV3 = new RecommendationEngineV3();
