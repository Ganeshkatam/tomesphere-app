export interface BookSubscription {
    id: string;
    userId: string;
    type: 'author' | 'genre' | 'series';
    targetId: string;
    frequency: 'instant' | 'daily' | 'weekly';
}

export class BookSubscriptions {
    subscribeToAuthor(userId: string, authorName: string, frequency: BookSubscription['frequency']): BookSubscription {
        const subscription: BookSubscription = {
            id: crypto.randomUUID(),
            userId,
            type: 'author',
            targetId: authorName,
            frequency,
        };

        this.saveSubscription(subscription);
        return subscription;
    }

    subscribeToGenre(userId: string, genre: string, frequency: BookSubscription['frequency']): BookSubscription {
        const subscription: BookSubscription = {
            id: crypto.randomUUID(),
            userId,
            type: 'genre',
            targetId: genre,
            frequency,
        };

        this.saveSubscription(subscription);
        return subscription;
    }

    private saveSubscription(sub: BookSubscription): void {
        const subs = this.getAll(sub.userId);
        subs.push(sub);
        localStorage.setItem(`subscriptions-${sub.userId}`, JSON.stringify(subs));
    }

    getAll(userId: string): BookSubscription[] {
        const stored = localStorage.getItem(`subscriptions-${userId}`);
        return stored ? JSON.parse(stored) : [];
    }

    unsubscribe(userId: string, subscriptionId: string): boolean {
        const subs = this.getAll(userId).filter(s => s.id !== subscriptionId);
        localStorage.setItem(`subscriptions-${userId}`, JSON.stringify(subs));
        return true;
    }
}

export const subscriptions = new BookSubscriptions();
