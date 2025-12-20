export interface ReadingChallenge {
    id: string;
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    requirements: string[];
    rewards: { points: number; badge?: string };
    timeLimit?: number; // days
}

export const CHALLENGES: ReadingChallenge[] = [
    {
        id: 'genre-explorer',
        name: 'Genre Explorer',
        description: 'Read books from 5 different genres',
        difficulty: 'easy',
        requirements: ['Read 5 different genres'],
        rewards: { points: 200, badge: 'explorer' },
    },
    {
        id: 'speed-reader',
        name: 'Speed Reader',
        description: 'Read 5 books in one month',
        difficulty: 'medium',
        requirements: ['Read 5 books', 'Complete within 30 days'],
        rewards: { points: 500, badge: 'speed_reader' },
        timeLimit: 30,
    },
    {
        id: 'marathon-reader',
        name: 'Marathon Reader',
        description: 'Read 3 books over 500 pages each',
        difficulty: 'hard',
        requirements: ['Read 3 books', 'Each book must be 500+ pages'],
        rewards: { points: 1000, badge: 'marathon' },
    },
];

export function checkChallengeProgress(
    challengeId: string,
    userBooks: any[]
): { progress: number; completed: boolean } {
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return { progress: 0, completed: false };

    let progress = 0;

    switch (challengeId) {
        case 'genre-explorer': {
            const genres = new Set(userBooks.map(b => b.genre));
            progress = (genres.size / 5) * 100;
            break;
        }
        case 'speed-reader': {
            const recentBooks = userBooks.filter(b => {
                const daysAgo = (Date.now() - new Date(b.finished_at).getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= 30;
            });
            progress = (recentBooks.length / 5) * 100;
            break;
        }
        case 'marathon-reader': {
            const longBooks = userBooks.filter(b => (b.pages || 0) >= 500);
            progress = (longBooks.length / 3) * 100;
            break;
        }
    }

    return {
        progress: Math.min(100, progress),
        completed: progress >= 100,
    };
}

export const challengesV2 = { CHALLENGES, checkChallengeProgress };
