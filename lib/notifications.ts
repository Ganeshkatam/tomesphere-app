import { supabase } from './supabase';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// --- Types ---
export interface Notification {
    id: string;
    user_id: string;
    type: 'follow' | 'like' | 'review' | 'achievement' | 'goal' | 'system';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
}

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if config is present and window exists
let app;
let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    try {
        messaging = getMessaging(app);
    } catch (e) {
        console.warn('Firebase Messaging not supported in this browser/environment');
    }
}

// --- FCM Functions ---
export async function requestNotificationPermission() {
    if (!messaging || !('Notification' in window)) {
        console.log('Notifications not supported');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });

            console.log('FCM Token:', token);
            return token;
        }

        return null;
    } catch (error) {
        console.error('Notification permission error:', error);
        return null;
    }
}

export function onMessageListener() {
    if (!messaging) return;

    return new Promise((resolve) => {
        onMessage(messaging!, (payload) => {
            console.log('Message received:', payload);
            resolve(payload);
        });
    });
}

// Server-side function to send notifications via FCM (if you have a backend api route for it)
export async function sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
) {
    try {
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                notification: { title, body },
                data
            })
        });

        return await response.json();
    } catch (error) {
        console.error('Send notification error:', error);
        throw error;
    }
}


// --- Database Notification Functions (Supabase) ---

export async function createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    link?: string
): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            link,
            read: false,
        });

    return !error;
}

export async function getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

export async function markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    return !error;
}

export async function markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

    return !error;
}

export async function getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

    return count || 0;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    return !error;
}

// --- Notification Construction Helpers ---

export async function notifyNewFollower(userId: string, followerName: string) {
    return createNotification(
        userId,
        'follow',
        'New Follower',
        `${followerName} started following you`,
        '/profile'
    );
}

export async function notifyBookLiked(userId: string, likerName: string, bookTitle: string) {
    return createNotification(
        userId,
        'like',
        'Book Liked',
        `${likerName} liked "${bookTitle}"`,
    );
}

export async function notifyAchievementUnlocked(userId: string, achievementName: string) {
    return createNotification(
        userId,
        'achievement',
        'Achievement Unlocked! 🎉',
        `You unlocked "${achievementName}"`,
        '/profile'
    );
}

export async function notifyGoalComplete(userId: string, year: number) {
    return createNotification(
        userId,
        'goal',
        'Goal Completed! 🎯',
        `Congratulations! You completed your ${year} reading goal!`,
        '/home'
    );
}
