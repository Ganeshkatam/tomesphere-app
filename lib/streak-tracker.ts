import { supabase } from './supabase';

const STORAGE_KEY = 'tomesphere_reading_streak';

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastReadDate: string;
    totalDays: number;
}

export async function recordReadingActivity(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Record in database
    const { error } = await supabase
        .from('reading_activity')
        .upsert({
            user_id: userId,
            date: today,
        }, {
            onConflict: 'user_id,date'
        });

    if (error) {
        console.error('Error recording activity:', error);
    }

    // Update local storage
    updateLocalStreak(today);
}

export async function getStreakData(userId?: string): Promise<StreakData> {
    if (userId) {
        return await getDatabaseStreak(userId);
    }
    return getLocalStreak();
}

function updateLocalStreak(today: string): void {
    const streak = getLocalStreak();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (streak.lastReadDate === today) {
        // Already recorded today
        return;
    }

    if (streak.lastReadDate === yesterday) {
        // Continuing streak
        streak.currentStreak++;
    } else if (streak.lastReadDate !== today) {
        // Streak broken, start new
        streak.currentStreak = 1;
    }

    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastReadDate = today;
    streak.totalDays++;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(streak));
}

function getLocalStreak(): StreakData {
    if (typeof window === 'undefined') {
        return { currentStreak: 0, longestStreak: 0, lastReadDate: '', totalDays: 0 };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }

    return {
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: '',
        totalDays: 0,
    };
}

async function getDatabaseStreak(userId: string): Promise<StreakData> {
    const { data, error } = await supabase
        .from('reading_activity')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error || !data || data.length === 0) {
        return getLocalStreak();
    }

    // Calculate streak from data
    const dates = data.map(d => d.date).sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < dates.length - 1; i++) {
        const current = new Date(dates[i]);
        const next = new Date(dates[i + 1]);
        const diffDays = Math.floor((current.getTime() - next.getTime()) / 86400000);

        if (diffDays === 1) {
            tempStreak++;
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
        }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if streak is current
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] === today || dates[0] === yesterday) {
        currentStreak = tempStreak;
    }

    return {
        currentStreak,
        longestStreak,
        lastReadDate: dates[0],
        totalDays: dates.length,
    };
}
