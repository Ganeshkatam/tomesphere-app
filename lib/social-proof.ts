export class SocialProof {
    getTrendingBadge(viewCount: number): string | null {
        if (viewCount > 10000) return '🔥 Viral';
        if (viewCount > 5000) return '⭐ Trending';
        if (viewCount > 1000) return '📈 Popular';
        return null;
    }

    getCommunityRating(ratings: number[]): {
        average: number;
        count: number;
        distribution: Record<number, number>;
    } {
        const count = ratings.length;
        const average = ratings.reduce((sum, r) => sum + r, 0) / count;
        const distribution: Record<number, number> = {};

        ratings.forEach(r => {
            distribution[r] = (distribution[r] || 0) + 1;
        });

        return { average, count, distribution };
    }

    getReaderCount(bookId: string): string {
        const count = Math.floor(Math.random() * 10000);
        if (count > 1000) return `${(count / 1000).toFixed(1)}K readers`;
        return `${count} readers`;
    }
}

export const socialProof = new SocialProof();
