export class BookmarkSharing {
    shareBookmarkCollection(userId: string, bookmarkIds: string[]): string {
        const shareLink = `https://tomesphere.app/shared/bookmarks/${crypto.randomUUID()}`;
        localStorage.setItem(`shared-bookmarks-${shareLink}`, JSON.stringify({ userId, bookmarkIds }));
        return shareLink;
    }

    importSharedBookmarks(shareLink: string, userId: string): boolean {
        const data = localStorage.getItem(`shared-bookmarks-${shareLink}`);
        if (!data) return false;

        const { bookmarkIds } = JSON.parse(data);
        // Import bookmarks for user
        return true;
    }
}

export const bookmarkSharing = new BookmarkSharing();
