import { Book } from './supabase';

export interface MoodProfile {
    mood: string;
    preferredGenres: string[];
    pacePreference: 'fast' | 'medium' | 'slow';
    emotionalTone: 'light' | 'balanced' | 'heavy';
    lengthPreference: 'short' | 'medium' | 'long';
}

export const moodProfiles: Record<string, MoodProfile> = {
    happy: {
        mood: 'Happy & Uplifted',
        preferredGenres: ['Romance', 'Comedy', 'Adventure', 'Young Adult'],
        pacePreference: 'fast',
        emotionalTone: 'light',
        lengthPreference: 'medium',
    },
    sad: {
        mood: 'Sad & Reflective',
        preferredGenres: ['Literary Fiction', 'Historical Fiction', 'Poetry'],
        pacePreference: 'slow',
        emotionalTone: 'heavy',
        lengthPreference: 'medium',
    },
    stressed: {
        mood: 'Stressed & Need Escape',
        preferredGenres: ['Fantasy', 'Science Fiction', 'Mystery', 'Thriller'],
        pacePreference: 'fast',
        emotionalTone: 'balanced',
        lengthPreference: 'short',
    },
    curious: {
        mood: 'Curious & Learning',
        preferredGenres: ['Non-Fiction', 'Science', 'Biography', 'History'],
        pacePreference: 'medium',
        emotionalTone: 'balanced',
        lengthPreference: 'long',
    },
    romantic: {
        mood: 'Romantic & Dreamy',
        preferredGenres: ['Romance', 'Historical Romance', 'Contemporary Romance'],
        pacePreference: 'medium',
        emotionalTone: 'light',
        lengthPreference: 'medium',
    },
    adventurous: {
        mood: 'Adventurous & Bold',
        preferredGenres: ['Adventure', 'Action', 'Thriller', 'Fantasy'],
        pacePreference: 'fast',
        emotionalTone: 'balanced',
        lengthPreference: 'long',
    },
};

export function getBooksByMood(mood: string, allBooks: Book[]): Book[] {
    const profile = moodProfiles[mood.toLowerCase()];
    if (!profile) return [];

    return allBooks
        .filter(book => {
            // Filter by preferred genres
            if (!profile.preferredGenres.includes(book.genre)) return false;

            // Filter by length preference
            const pages = book.pages || 0;
            if (profile.lengthPreference === 'short' && pages > 300) return false;
            if (profile.lengthPreference === 'long' && pages < 400) return false;
            if (profile.lengthPreference === 'medium' && (pages < 200 || pages > 500)) return false;

            return true;
        })
        .slice(0, 20);
}

export function detectMoodFromText(userInput: string): string {
    const keywords = {
        happy: ['happy', 'joy', 'uplifting', 'fun', 'cheerful', 'bright'],
        sad: ['sad', 'melancholy', 'emotional', 'reflective', 'thoughtful'],
        stressed: ['stressed', 'escape', 'relax', 'distract', 'unwind'],
        curious: ['learn', 'discover', 'knowledge', 'understand', 'explore'],
        romantic: ['love', 'romance', 'relationship', 'passion', 'heart'],
        adventurous: ['adventure', 'action', 'excitement', 'thrill', 'bold'],
    };

    const input = userInput.toLowerCase();
    let maxMatches = 0;
    let detectedMood = 'curious'; // default

    Object.entries(keywords).forEach(([mood, words]) => {
        const matches = words.filter(word => input.includes(word)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedMood = mood;
        }
    });

    return detectedMood;
}

export function getMoodRecommendationReason(mood: string, book: Book): string {
    const reasons: Record<string, string[]> = {
        happy: [
            `This ${book.genre} will keep your spirits high`,
            'Perfect uplifting read for your current mood',
            'Light and enjoyable - just what you need!',
        ],
        sad: [
            'A thoughtful read for reflection',
            'This will resonate with how you\'re feeling',
            'Beautiful prose for contemplative moments',
        ],
        stressed: [
            'The perfect escape from daily stress',
            'Get lost in another world',
            'Fast-paced and distracting in the best way',
        ],
        curious: [
            'Expand your knowledge with this fascinating read',
            'Learn something new and exciting',
            'Satisfy your intellectual curiosity',
        ],
        romantic: [
            'Swoon-worthy romance ahead',
            'Love story that will warm your heart',
            'Perfect for your romantic mood',
        ],
        adventurous: [
            'Thrilling page-turner for adventurers',
            'Action-packed excitement awaits',
            'Bold and daring - perfect for you',
        ],
    };

    const moodReasons = reasons[mood] || reasons.curious;
    return moodReasons[Math.floor(Math.random() * moodReasons.length)];
}
