export interface Badge {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    category: 'reading' | 'social' | 'discovery' | 'achievement';
    requirement: string;
    pointsValue: number;
}

export const ALL_BADGES: Badge[] = [
    // Reading Badges
    {
        id: '1',
        key: 'first_book',
        name: 'First Book',
        description: 'Completed your first book',
        icon: '📖',
        tier: 'bronze',
        category: 'reading',
        requirement: 'Read 1 book',
        pointsValue: 50,
    },
    {
        id: '2',
        key: 'bookworm',
        name: 'Bookworm',
        description: 'Read 10 books',
        icon: '🐛',
        tier: 'silver',
        category: 'reading',
        requirement: 'Read 10 books',
        pointsValue: 200,
    },
    {
        id: '3',
        key: 'bibliophile',
        name: 'Bibliophile',
        description: 'Read 50 books',
        icon: '📚',
        tier: 'gold',
        category: 'reading',
        requirement: 'Read 50 books',
        pointsValue: 500,
    },
    {
        id: '4',
        key: 'century_club',
        name: 'Century Club',
        description: 'Read 100 books',
        icon: '💯',
        tier: 'platinum',
        category: 'reading',
        requirement: 'Read 100 books',
        pointsValue: 1000,
    },
    // Streak Badges
    {
        id: '5',
        key: 'week_streak',
        name: 'Weekly Reader',
        description: '7-day reading streak',
        icon: '🔥',
        tier: 'bronze',
        category: 'reading',
        requirement: '7 consecutive reading days',
        pointsValue: 100,
    },
    {
        id: '6',
        key: 'month_streak',
        name: 'Monthly Marathon',
        description: '30-day reading streak',
        icon: '⚡',
        tier: 'silver',
        category: 'reading',
        requirement: '30 consecutive reading days',
        pointsValue: 300,
    },
    // Social Badges
    {
        id: '7',
        key: 'socialite',
        name: 'Socialite',
        description: 'Follow 10 readers',
        icon: '👥',
        tier: 'bronze',
        category: 'social',
        requirement: 'Follow 10 users',
        pointsValue: 50,
    },
    {
        id: '8',
        key: 'influencer',
        name: 'Influencer',
        description: '50 followers',
        icon: '⭐',
        tier: 'gold',
        category: 'social',
        requirement: 'Get 50 followers',
        pointsValue: 400,
    },
    // Discovery Badges
    {
        id: '9',
        key: 'explorer',
        name: 'Genre Explorer',
        description: 'Read books in 5 different genres',
        icon: '🗺️',
        tier: 'silver',
        category: 'discovery',
        requirement: 'Read 5 different genres',
        pointsValue: 200,
    },
    {
        id: '10',
        key: 'globetrotter',
        name: 'Literary Globetrotter',
        description: 'Read books from 10 different countries',
        icon: '🌍',
        tier: 'gold',
        category: 'discovery',
        requirement: 'Read 10 different countries',
        pointsValue: 500,
    },
];

export function checkBadgeEligibility(
    badgeKey: string,
    userStats: {
        booksRead: number;
        streak: number;
        followers: number;
        following: number;
        genresRead: string[];
    }
): boolean {
    const badge = ALL_BADGES.find(b => b.key === badgeKey);
    if (!badge) return false;

    switch (badgeKey) {
        case 'first_book':
            return userStats.booksRead >= 1;
        case 'bookworm':
            return userStats.booksRead >= 10;
        case 'bibliophile':
            return userStats.booksRead >= 50;
        case 'century_club':
            return userStats.booksRead >= 100;
        case 'week_streak':
            return userStats.streak >= 7;
        case 'month_streak':
            return userStats.streak >= 30;
        case 'socialite':
            return userStats.following >= 10;
        case 'influencer':
            return userStats.followers >= 50;
        case 'explorer':
            return userStats.genresRead.length >= 5;
        case 'globetrotter':
            return userStats.genresRead.length >= 10;
        default:
            return false;
    }
}

export function getBadgesByCategory(category: Badge['category']): Badge[] {
    return ALL_BADGES.filter(b => b.category === category);
}

export function getBadgesByTier(tier: Badge['tier']): Badge[] {
    return ALL_BADGES.filter(b => b.tier === tier);
}

export function calculateBadgeProgress(
    badgeKey: string,
    userStats: any
): { current: number; required: number; percentage: number } {
    const badge = ALL_BADGES.find(b => b.key === badgeKey);
    if (!badge) return { current: 0, required: 1, percentage: 0 };

    let current = 0;
    let required = 0;

    switch (badgeKey) {
        case 'first_book':
            current = userStats.booksRead;
            required = 1;
            break;
        case 'bookworm':
            current = userStats.booksRead;
            required = 10;
            break;
        case 'bibliophile':
            current = userStats.booksRead;
            required = 50;
            break;
        // Add more cases
        default:
            break;
    }

    const percentage = Math.min(100, (current / required) * 100);
    return { current, required, percentage };
}
