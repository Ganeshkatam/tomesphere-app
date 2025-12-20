export interface CommunityHighlight {
    id: string;
    type: 'trending_book' | 'top_reviewer' | 'active_club' | 'popular_list';
    title: string;
    description: string;
    data: any;
    score: number;
    createdAt: string;
}

export class CommunityHighlightsEngine {
    generateHighlights(communityData: {
        books: any[];
        users: any[];
        clubs: any[];
        lists: any[];
    }): CommunityHighlight[] {
        const highlights: CommunityHighlight[] = [];

        // Trending books
        const trendingBooks = this.getTrendingBooks(communityData.books);
        trendingBooks.forEach((book, index) => {
            highlights.push({
                id: `trending-${index}`,
                type: 'trending_book',
                title: book.title,
                description: `Trending this week with ${book.views} views`,
                data: book,
                score: book.views,
                createdAt: new Date().toISOString(),
            });
        });

        // Top reviewers
        const topReviewers = this.getTopReviewers(communityData.users);
        topReviewers.forEach((user, index) => {
            highlights.push({
                id: `reviewer-${index}`,
                type: 'top_reviewer',
                title: user.name,
                description: `${user.reviewCount} insightful reviews`,
                data: user,
                score: user.reviewCount,
                createdAt: new Date().toISOString(),
            });
        });

        return highlights.sort((a, b) => b.score - a.score).slice(0, 20);
    }

    private getTrendingBooks(books: any[]): any[] {
        return books
            .map(book => ({
                ...book,
                views: Math.floor(Math.random() * 1000), // Mock data
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
    }

    private getTopReviewers(users: any[]): any[] {
        return users
            .map(user => ({
                ...user,
                reviewCount: Math.floor(Math.random() * 50),
            }))
            .sort((a, b) => b.reviewCount - a.reviewCount)
            .slice(0, 5);
    }
}

export const communityHighlights = new CommunityHighlightsEngine();
