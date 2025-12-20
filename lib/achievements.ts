import { supabase } from './supabase';

export interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    requirement: number;
    category: 'reading' | 'social' | 'collection' | 'streak' | 'special';
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_key: string;
    unlocked_at: string;
    progress: number;
}

export const achievements: Achievement[] = [
    // Reading Achievements
    { id: '1', key: 'first_book', name: 'First Step', description: 'Read your first book', icon: '📖', requirement: 1, category: 'reading' },
    { id: '2', key: 'books_10', name: 'Bookworm', description: 'Read 10 books', icon: '🐛', requirement: 10, category: 'reading' },
    { id: '3', key: 'books_50', name: 'Bibliophile', description: 'Read 50 books', icon: '📚', requirement: 50, category: 'reading' },
    { id: '4', key: 'books_100', name: 'Century Reader', description: 'Read 100 books', icon: '💯', requirement: 100, category: 'reading' },
    { id: '5', key: 'books_500', name: 'Library Master', description: 'Read 500 books', icon: '🏛️', requirement: 500, category: 'reading' },

    // Streak Achievements
    { id: '6', key: 'streak_7', name: 'Week Warrior', description: '7-day reading streak', icon: '🔥', requirement: 7, category: 'streak' },
    { id: '7', key: 'streak_30', name: 'Monthly Master', description: '30-day reading streak', icon: '⚡', requirement: 30, category: 'streak' },
    { id: '8', key: 'streak_100', name: 'Centurion', description: '100-day reading streak', icon: '💪', requirement: 100, category: 'streak' },
    { id: '9', key: 'streak_365', name: 'Year Round', description: '365-day reading streak', icon: '👑', requirement: 365, category: 'streak' },

    // Genre Achievements
    { id: '10', key: 'genres_5', name: 'Explorer', description: 'Read from 5 different genres', icon: '🧭', requirement: 5, category: 'collection' },
    { id: '11', key: 'genres_10', name: 'Versatile Reader', description: 'Read from 10 different genres', icon: '🌈', requirement: 10, category: 'collection' },
    { id: '12', key: 'genres_20', name: 'Genre Master', description: 'Read from 20 different genres', icon: '🎭', requirement: 20, category: 'collection' },

    // Social Achievements
    { id: '13', key: 'reviews_5', name: 'Reviewer', description: 'Write 5 reviews', icon: '✍️', requirement: 5, category: 'social' },
    { id: '14', key: 'reviews_25', name: 'Critic', description: 'Write 25 reviews', icon: '📝', requirement: 25, category: 'social' },
    { id: '15', key: 'reviews_100', name: 'Master Critic', description: 'Write 100 reviews', icon: '🎯', requirement: 100, category: 'social' },

    // Special Achievements
    { id: '16', key: 'goal_complete', name: 'Goal Crusher', description: 'Complete your reading goal', icon: '🎉', requirement: 1, category: 'special' },
    { id: '17', key: 'night_owl', name: 'Night Owl', description: 'Read 10 books after midnight', icon: '🦉', requirement: 10, category: 'special' },
    { id: '18', key: 'speed_reader', name: 'Speed Reader', description: 'Read 3 books in one day', icon: '⚡', requirement: 3, category: 'special' },
];

export async function checkAchievements(userId: string, stats: {
    booksRead: number;
    currentStreak: number;
    genresRead: number;
    reviewsWritten: number;
}): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    // Check each achievement
    for (const achievement of achievements) {
        const isUnlocked = await hasAchievement(userId, achievement.key);
        if (isUnlocked) continue;

        let shouldUnlock = false;

        switch (achievement.key) {
            case 'first_book':
            case 'books_10':
            case 'books_50':
            case 'books_100':
            case 'books_500':
                shouldUnlock = stats.booksRead >= achievement.requirement;
                break;

            case 'streak_7':
            case 'streak_30':
            case 'streak_100':
            case 'streak_365':
                shouldUnlock = stats.currentStreak >= achievement.requirement;
                break;

            case 'genres_5':
            case 'genres_10':
            case 'genres_20':
                shouldUnlock = stats.genresRead >= achievement.requirement;
                break;

            case 'reviews_5':
            case 'reviews_25':
            case 'reviews_100':
                shouldUnlock = stats.reviewsWritten >= achievement.requirement;
                break;
        }

        if (shouldUnlock) {
            await unlockAchievement(userId, achievement.key);
            unlockedAchievements.push(achievement);
        }
    }

    return unlockedAchievements;
}

async function hasAchievement(userId: string, achievementKey: string): Promise<boolean> {
    const { data } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_key', achievementKey)
        .single();

    return !!data;
}

async function unlockAchievement(userId: string, achievementKey: string): Promise<void> {
    await supabase
        .from('user_achievements')
        .insert({
            user_id: userId,
            achievement_key: achievementKey,
            progress: 100,
        });
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
    const { data } = await supabase
        .from('user_achievements')
        .select('achievement_key')
        .eq('user_id', userId);

    if (!data) return [];

    const keys = data.map(d => d.achievement_key);
    return achievements.filter(a => keys.includes(a.key));
}
