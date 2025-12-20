export class AdvancedFiltering {
    filterByReadingTime(books: any[], maxMinutes: number): any[] {
        return books.filter(book => {
            const estimatedTime = (book.pages || 0) * 2; // 2 min per page
            return estimatedTime <= maxMinutes;
        });
    }

    filterByComplexity(books: any[], level: 'easy' | 'medium' | 'hard'): any[] {
        const complexityMap = { easy: [0, 200], medium: [200, 400], hard: [400, 1000] };
        const [min, max] = complexityMap[level];
        return books.filter(book => (book.pages || 0) >= min && (book.pages || 0) <= max);
    }

    filterByMood(books: any[], mood: string): any[] {
        const moodGenreMap: Record<string, string[]> = {
            happy: ['Romance', 'Comedy'],
            sad: ['Literary Fiction', 'Drama'],
            excited: ['Thriller', 'Adventure'],
        };
        const genres = moodGenreMap[mood] || [];
        return books.filter(book => genres.includes(book.genre));
    }
}

export const advancedFiltering = new AdvancedFiltering();
