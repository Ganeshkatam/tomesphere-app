export class SeasonalRecommendations {
    getSeason(): string {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    getSeasonalBooks(season: string): string[] {
        const recommendations: Record<string, string[]> = {
            spring: ['Renewal', 'Growth', 'Fresh Starts'],
            summer: ['Beach Reads', 'Adventure', 'Travel'],
            fall: ['Cozy Mysteries', 'Spooky', 'Reflective'],
            winter: ['Holiday', 'Introspective', 'Epic Fantasy'],
        };

        return recommendations[season] || [];
    }

    getHolidayRecommendations(holiday: string): string[] {
        return ['Holiday Special 1', 'Holiday Special 2'];
    }
}

export const seasonalRecs = new SeasonalRecommendations();
