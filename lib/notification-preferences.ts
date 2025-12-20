export interface NotificationPreferences {
    email: {
        enabled: boolean;
        frequency: 'immediate' | 'daily' | 'weekly';
        types: {
            newFollower: boolean;
            clubInvite: boolean;
            eventReminder: boolean;
            bookRelease: boolean;
            goalMilestone: boolean;
            reviewReply: boolean;
        };
    };
    push: {
        enabled: boolean;
        types: {
            messages: boolean;
            updates: boolean;
            recommendations: boolean;
        };
    };
    inApp: {
        enabled: boolean;
        sound: boolean;
        types: {
            all: boolean;
        };
    };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    email: {
        enabled: true,
        frequency: 'daily',
        types: {
            newFollower: true,
            clubInvite: true,
            eventReminder: true,
            bookRelease: true,
            goalMilestone: true,
            reviewReply: true,
        },
    },
    push: {
        enabled: true,
        types: {
            messages: true,
            updates: true,
            recommendations: false,
        },
    },
    inApp: {
        enabled: true,
        sound: true,
        types: {
            all: true,
        },
    },
};

export class NotificationPreferencesManager {
    private prefs: NotificationPreferences;
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
        this.prefs = this.load();
    }

    private load(): NotificationPreferences {
        const stored = localStorage.getItem(`notif-prefs-${this.userId}`);
        return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    }

    private save(): void {
        localStorage.setItem(`notif-prefs-${this.userId}`, JSON.stringify(this.prefs));
    }

    get(): NotificationPreferences {
        return { ...this.prefs };
    }

    updateEmail(updates: Partial<NotificationPreferences['email']>): void {
        this.prefs.email = { ...this.prefs.email, ...updates };
        this.save();
    }

    updatePush(updates: Partial<NotificationPreferences['push']>): void {
        this.prefs.push = { ...this.prefs.push, ...updates };
        this.save();
    }

    updateInApp(updates: Partial<NotificationPreferences['inApp']>): void {
        this.prefs.inApp = { ...this.prefs.inApp, ...updates };
        this.save();
    }

    enableAll(): void {
        this.prefs.email.enabled = true;
        this.prefs.push.enabled = true;
        this.prefs.inApp.enabled = true;
        this.save();
    }

    disableAll(): void {
        this.prefs.email.enabled = false;
        this.prefs.push.enabled = false;
        this.prefs.inApp.enabled = false;
        this.save();
    }

    shouldNotify(type: string, channel: 'email' | 'push' | 'inApp'): boolean {
        if (channel === 'email') {
            return this.prefs.email.enabled && (this.prefs.email.types as any)[type];
        }
        if (channel === 'push') {
            return this.prefs.push.enabled && (this.prefs.push.types as any)[type];
        }
        if (channel === 'inApp') {
            return this.prefs.inApp.enabled;
        }
        return false;
    }
}

export function createNotificationPreferences(userId: string): NotificationPreferencesManager {
    return new NotificationPreferencesManager(userId);
}
