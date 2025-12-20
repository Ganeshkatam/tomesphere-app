export class PremiumExclusiveFeatures {
    getEarlyAccess(userId: string): boolean {
        return true; // Premium members get early access
    }

    getExclusiveContent(userId: string): any[] {
        return [
            { type: 'interview', title: 'Author Interview' },
            { type: 'preview', title: 'Book Preview' },
        ];
    }

    getPrioritySupport(): boolean {
        return true;
    }

    getAPIAccess(): { key: string; limit: number } {
        return {
            key: 'premium-api-key',
            limit: 10000, // requests per day
        };
    }
}

export const premiumFeatures = new PremiumExclusiveFeatures();
