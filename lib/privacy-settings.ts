export class PrivacySettings {
    setProfileVisibility(userId: string, visibility: 'public' | 'friends' | 'private'): void {
        localStorage.setItem(`privacy-${userId}`, visibility);
    }

    allowDataCollection(userId: string, allow: boolean): void {
        localStorage.setItem(`data-collection-${userId}`, allow.toString());
    }

    exportUserData(userId: string): any {
        return {
            profile: {},
            books: [],
            activity: [],
        };
    }

    deleteAccount(userId: string): void {
        // Remove all user data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes(userId)) {
                localStorage.removeItem(key);
            }
        });
    }
}

export const privacy = new PrivacySettings();
