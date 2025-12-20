export interface AIBookBuddy {
    chat: (message: string, context: ChatContext) => Promise<string>;
    getRecommendation: (preferences: UserPreferences) => Promise<string>;
    answerQuestion: (question: string, bookContext?: string) => Promise<string>;
}

export interface ChatContext {
    userId: string;
    recentBooks?: string[];
    currentMood?: string;
    chatHistory?: ChatMessage[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface UserPreferences {
    favoriteGenres?: string[];
    recentlyRead?: string[];
    mood?: string;
}

export async function chatWithAI(
    message: string,
    context: ChatContext
): Promise<string> {
    // This would integrate with OpenAI API in production
    // For now, providing intelligent rule-based responses

    const lowercaseMsg = message.toLowerCase();

    // Book recommendations
    if (lowercaseMsg.includes('recommend') || lowercaseMsg.includes('suggest')) {
        if (lowercaseMsg.includes('fantasy')) {
            return "I'd recommend 'The Way of Kings' by Brandon Sanderson for epic fantasy, or 'The Name of the Wind' by Patrick Rothfuss for beautiful prose and magic!";
        }
        if (lowercaseMsg.includes('mystery')) {
            return "For a gripping mystery, try 'The Silent Patient' by Alex Michaelides, or classic Agatha Christie with 'And Then There Were None'!";
        }
        return "Based on your reading history, I think you'd enjoy exploring some science fiction! How about 'Project Hail Mary' by Andy Weir?";
    }

    // Book information
    if (lowercaseMsg.includes('tell me about') || lowercaseMsg.includes('what is')) {
        return "I can help you explore book details! Which book would you like to know more about?";
    }

    // Reading advice
    if (lowercaseMsg.includes('how to') || lowercaseMsg.includes('should i')) {
        return "Great question! For choosing your next read, consider your current mood and how much time you have. Want fast-paced? Try thrillers. Want to relax? Romance or cozy mysteries work well!";
    }

    // Default helpful response
    return "I'm here to help you discover great books! Ask me for recommendations, book information, or reading advice. What are you in the mood for today?";
}

export async function getAIRecommendation(
    preferences: UserPreferences
): Promise<string> {
    const { favoriteGenres = [], mood = 'curious' } = preferences;

    if (mood === 'happy' && favoriteGenres.includes('Romance')) {
        return "For your happy, romantic mood, I recommend 'Beach Read' by Emily Henry - it's a delightful contemporary romance with humor and heart!";
    }

    if (mood === 'stressed' && favoriteGenres.includes('Fantasy')) {
        return "To de-stress with fantasy, try 'Howl's Moving Castle' by Diana Wynne Jones - whimsical, magical, and wonderfully escapist!";
    }

    return "Based on your preferences, I think you'd love discovering some new authors in your favorite genres!";
}

export async function answerBookQuestion(
    question: string,
    bookContext?: string
): Promise<string> {
    const lowercaseQ = question.toLowerCase();

    if (lowercaseQ.includes('series')) {
        return "This book is part of a series! I'd recommend reading them in order for the best experience.";
    }

    if (lowercaseQ.includes('similar')) {
        return "Looking for similar books? I can suggest titles with comparable themes, writing style, or genre. What aspects did you enjoy most?";
    }

    if (lowercaseQ.includes('worth reading')) {
        return "Based on reader reviews and ratings, this book has been very well-received! If you enjoy the genre, it's definitely worth your time.";
    }

    return "I'm here to answer your book questions! Feel free to ask about plot, series order, similar books, or anything else!";
}

export function formatChatHistory(messages: ChatMessage[]): string {
    return messages
        .map(msg => `${msg.role === 'user' ? 'You' : 'AI Buddy'}: ${msg.content}`)
        .join('\n');
}

export function saveChatMessage(
    userId: string,
    role: ChatMessage['role'],
    content: string
): ChatMessage {
    return {
        role,
        content,
        timestamp: new Date().toISOString(),
    };
}
