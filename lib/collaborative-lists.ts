export interface CollaborativeList {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    collaborators: string[];
    books: string[];
    isPublic: boolean;
    allowSuggestions: boolean;
    createdAt: string;
}

export class CollaborativeListManager {
    createList(
        userId: string,
        name: string,
        description: string,
        isPublic: boolean = true
    ): CollaborativeList {
        const list: CollaborativeList = {
            id: crypto.randomUUID(),
            name,
            description,
            createdBy: userId,
            collaborators: [userId],
            books: [],
            isPublic,
            allowSuggestions: true,
            createdAt: new Date().toISOString(),
        };

        this.saveList(list);
        return list;
    }

    addCollaborator(listId: string, userId: string): boolean {
        const list = this.getList(listId);
        if (!list) return false;

        if (!list.collaborators.includes(userId)) {
            list.collaborators.push(userId);
            this.saveList(list);
        }

        return true;
    }

    addBook(listId: string, bookId: string, userId: string): boolean {
        const list = this.getList(listId);
        if (!list) return false;

        // Check if user is collaborator
        if (!list.collaborators.includes(userId)) return false;

        if (!list.books.includes(bookId)) {
            list.books.push(bookId);
            this.saveList(list);
        }

        return true;
    }

    private saveList(list: CollaborativeList): void {
        const lists = this.getAllLists();
        const index = lists.findIndex(l => l.id === list.id);

        if (index >= 0) {
            lists[index] = list;
        } else {
            lists.push(list);
        }

        localStorage.setItem('collaborative-lists', JSON.stringify(lists));
    }

    getAllLists(): CollaborativeList[] {
        const stored = localStorage.getItem('collaborative-lists');
        return stored ? JSON.parse(stored) : [];
    }

    getList(listId: string): CollaborativeList | null {
        return this.getAllLists().find(l => l.id === listId) || null;
    }

    getUserLists(userId: string): CollaborativeList[] {
        return this.getAllLists().filter(l => l.collaborators.includes(userId));
    }
}

export const collaborativeListManager = new CollaborativeListManager();
