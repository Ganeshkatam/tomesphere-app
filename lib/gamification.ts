import { supabase } from './supabase';

export interface GamePoints {
    userId: string;
    totalPoints: number;
    level: number;
    rank: string;
    achievements: string[];
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    points: number;
    level: number;
    rank: number;
}

export const pointsSystem = {
    bookRead: 100,
    reviewWritten: 50,
    postCreated: 25,
    commentMade: 10,
    bookRated: 15,
    listCreated: 30,
    clubJoined: 20,
    goalCompleted: 200,
    challengeWon: 500,
    streakMilestone: 150,
};

export const levelThresholds = {
    1: 0,
    2: 500,
    3: 1000,
    4: 2500,
    5: 5000,
    6: 10000,
    7: 20000,
    8: 40000,
    9: 75000,
    10: 150000,
};

export async function awardPoints(
    userId: string,
    action: keyof typeof pointsSystem,
    multiplier: number = 1
): Promise<number> {
    const points = pointsSystem[action] * multiplier;

    const { data } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single();

    const currentPoints = data?.total_points || 0;
    const newTotal = currentPoints + points;

    await supabase
        .from('user_points')
        .upsert({
            user_id: userId,
            total_points: newTotal,
            level: calculateLevel(newTotal),
        });

    return points;
}

export function calculateLevel(points: number): number {
    let level = 1;
    for (const [lvl, threshold] of Object.entries(levelThresholds)) {
        if (points >= threshold) {
            level = parseInt(lvl);
        }
    }
    return level;
}

export function getPointsToNextLevel(currentPoints: number): number {
    const currentLevel = calculateLevel(currentPoints);
    const nextLevel = currentLevel + 1;
    const nextThreshold = levelThresholds[nextLevel as keyof typeof levelThresholds];

    if (!nextThreshold) return 0; // Max level

    return nextThreshold - currentPoints;
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const { data } = await supabase
        .from('user_points')
        .select(`
      *,
      user:user_id (
        id,
        email,
        profiles (*)
      )
    `)
        .order('total_points', { ascending: false })
        .limit(limit);

    if (!data) return [];

    return data.map((entry: any, index: number) => ({
        userId: entry.user_id,
        userName: entry.user?.profiles?.username || entry.user?.email || 'Anonymous',
        points: entry.total_points,
        level: entry.level,
        rank: index + 1,
    }));
}

export function getRankTitle(level: number): string {
    if (level >= 10) return '📚 Literary Legend';
    if (level >= 8) return '📖 Master Reader';
    if (level >= 6) return '📕 Avid Bookworm';
    if (level >= 4) return '📗 Devoted Reader';
    if (level >= 2) return '📘 Book Explorer';
    return '📙 Novice Reader';
}

export async function getUserStats(userId: string): Promise<GamePoints> {
    const { data } = await supabase
        .from('user_points')
        .select('*, user_achievements(*)')
        .eq('user_id', userId)
        .single();

    if (!data) {
        return {
            userId,
            totalPoints: 0,
            level: 1,
            rank: getRankTitle(1),
            achievements: [],
        };
    }

    return {
        userId,
        totalPoints: data.total_points,
        level: data.level,
        rank: getRankTitle(data.level),
        achievements: data.user_achievements?.map((a: any) => a.achievement_key) || [],
    };
}
