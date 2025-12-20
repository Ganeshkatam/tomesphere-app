export class UserSegmentation {
    segmentUsers(users: any[]): {
        casual: any[];
        regular: any[];
        avid: any[];
        super: any[];
    } {
        return {
            casual: users.filter(u => u.booksRead < 5),
            regular: users.filter(u => u.booksRead >= 5 && u.booksRead < 20),
            avid: users.filter(u => u.booksRead >= 20 && u.booksRead < 50),
            super: users.filter(u => u.booksRead >= 50),
        };
    }

    getPersonalizedExperience(segment: string): any {
        const experiences: Record<string, any> = {
            casual: { showTutorials: true, simpleUI: true },
            regular: { showRecommendations: true, socialFeatures: true },
            avid: { advancedStats: true, clubFeatures: true },
            super: { exclusiveContent: true, betaFeatures: true },
        };
        return experiences[segment] || experiences.casual;
    }
}

export const userSegmentation = new UserSegmentation();
