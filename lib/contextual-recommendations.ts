export class ContentRecommendations {
    recommendBasedOnTime(hour: number): string[] {
        if (hour >= 6 && hour < 12) return ['Self-Help', 'Business', 'Non-Fiction'];
        if (hour >= 12 && hour < 18) return ['Fiction', 'Mystery', 'Contemporary'];
        return ['Thriller', 'Horror', 'Suspense'];
    }

    recommendBasedOnWeather(weather: string): string[] {
        const weatherMap: Record<string, string[]> = {
            rainy: ['Cozy Mystery', 'Romance', 'Literary Fiction'],
            sunny: ['Adventure', 'Travel', 'Humor'],
            cold: ['Fantasy', 'Sci-Fi', 'Epic'],
        };
        return weatherMap[weather] || [];
    }

    recommendBasedOnMood(mood: string): string[] {
        const moodMap: Record<string, string[]> = {
            happy: ['Comedy', 'Romance', 'Feel-Good'],
            sad: ['Inspirational', 'Uplifting', 'Hope'],
            stressed: ['Self-Help', 'Meditation', 'Calm'],
        };
        return moodMap[mood] || [];
    }
}

export const contextualRecs = new ContentRecommendations();
