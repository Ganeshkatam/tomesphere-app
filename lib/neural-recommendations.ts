import { Book } from './supabase';

export class NeuralRecommendations {
    analyzeReadingPattern(books: Book[], readingHistory: any[]): {
        preferredComplexity: string;
        preferredPace: string;
        preferredLength: string;
        emotionalAffinity: string[];
    } {
        // Analyze complexity preference
        const avgPages = readingHistory.reduce((sum, b) => sum + (b.pages || 0), 0) / readingHistory.length;

        const complexity = avgPages > 400 ? 'complex' : avgPages > 250 ? 'moderate' : 'light';

        // Analyze reading pace
        const durations = readingHistory
            .filter(b => b.started_at && b.finished_at)
            .map(b => {
                const days = (new Date(b.finished_at).getTime() - new Date(b.started_at).getTime()) / (1000 * 60 * 60 * 24);
                return days / (b.pages || 1);
            });

        const avgDaysPerPage = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const pace = avgDaysPerPage < 0.05 ? 'fast' : avgDaysPerPage < 0.1 ? 'moderate' : 'slow';

        return {
            preferredComplexity: complexity,
            preferredPace: pace,
            preferredLength: avgPages > 400 ? 'long' : avgPages > 250 ? 'medium' : 'short',
            emotionalAffinity: this.detectEmotionalPreferences(readingHistory),
        };
    }

    private detectEmotionalPreferences(history: any[]): string[] {
        // Mock emotional analysis based on genres
        const genreEmotions: Record<string, string[]> = {
            'Romance': ['warmth', 'connection', 'hope'],
            'Thriller': ['excitement', 'tension', 'mystery'],
            'Fantasy': ['wonder', 'adventure', 'escape'],
            'Literary Fiction': ['depth', 'reflection', 'nuance'],
        };

        const emotions = new Set<string>();
        history.forEach(book => {
            const genreEmotions = this.getGenreEmotions(book.genre);
            genreEmotions.forEach(e => emotions.add(e));
        });

        return Array.from(emotions);
    }

    private getGenreEmotions(genre: string): string[] {
        const map: Record<string, string[]> = {
            'Romance': ['warmth', 'connection'],
            'Thriller': ['excitement', 'tension'],
            'Fantasy': ['wonder', 'adventure'],
            'Science Fiction': ['curiosity', 'innovation'],
        };
        return map[genre] || ['enjoyment'];
    }
}

export const neuralRecs = new NeuralRecommendations();
