export interface UserPreferences {
    userId: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    privacy: {
        profilePublic: boolean;
        showReadingActivity: boolean;
        showCurrentBook: boolean;
    };
    reading: {
        defaultView: 'grid' | 'list';
        autoMarkAsRead: boolean;
        trackReadingTime: boolean;
    };
    recommendations: {
        includeExplicit: boolean;
        preferredGenres: string[];
        avoidGenres: string[];
    };
}

const DEFAULT_PREFERENCES: UserPreferences = {
    userId: '',
    theme: 'auto',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailNotifications: true,
    pushNotifications: true,
    privacy: {
        profilePublic: true,
        showReadingActivity: true,
        showCurrentBook: true,
    },
    reading: {
        defaultView: 'grid',
        autoMarkAsRead: false,
        trackReadingTime: true,
    },
    recommendations: {
        includeExplicit: true,
        preferredGenres: [],
        avoidGenres: [],
    },
};

export class PreferencesManager {
    private preferences: UserPreferences;

    constructor(userId: string) {
        this.preferences = { ...DEFAULT_PREFERENCES, userId };
        this.load();
    }

    private load(): void {
        const stored = localStorage.getItem(`preferences-${this.preferences.userId}`);
        if (stored) {
            this.preferences = { ...this.preferences, ...JSON.parse(stored) };
        }
    }

    save(): void {
        localStorage.setItem(
            `preferences-${this.preferences.userId}`,
            JSON.stringify(this.preferences)
        );
    }

    get(): UserPreferences {
        return { ...this.preferences };
    }

    update(updates: Partial<UserPreferences>): void {
        this.preferences = { ...this.preferences, ...updates };
        this.save();
    }

    updateTheme(theme: UserPreferences['theme']): void {
        this.preferences.theme = theme;
        this.save();
        this.applyTheme();
    }

    private applyTheme(): void {
        const theme = this.preferences.theme;

        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', isDark);
        } else {
            document.documentElement.classList.toggle('dark', theme === 'dark');
        }
    }

    updatePrivacy(privacy: Partial<UserPreferences['privacy']>): void {
        this.preferences.privacy = { ...this.preferences.privacy, ...privacy };
        this.save();
    }

    updateReading(reading: Partial<UserPreferences['reading']>): void {
        this.preferences.reading = { ...this.preferences.reading, ...reading };
        this.save();
    }

    updateRecommendations(recs: Partial<UserPreferences['recommendations']>): void {
        this.preferences.recommendations = { ...this.preferences.recommendations, ...recs };
        this.save();
    }

    reset(): void {
        this.preferences = { ...DEFAULT_PREFERENCES, userId: this.preferences.userId };
        this.save();
    }
}

export function createPreferencesManager(userId: string): PreferencesManager {
    return new PreferencesManager(userId);
}
