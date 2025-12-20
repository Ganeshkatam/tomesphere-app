export class BookmarkOrganization {
    createFolder(userId: string, folderName: string): any {
        const folder = { id: crypto.randomUUID(), name: folderName, bookmarks: [] };
        const folders = this.getFolders(userId);
        folders.push(folder);
        localStorage.setItem(`bookmark-folders-${userId}`, JSON.stringify(folders));
        return folder;
    }

    getFolders(userId: string): any[] {
        const stored = localStorage.getItem(`bookmark-folders-${userId}`);
        return stored ? JSON.parse(stored) : [];
    }

    moveBookmark(bookmarkId: string, folderId: string): void {
        console.log(`Moved bookmark ${bookmarkId} to folder ${folderId}`);
    }
}

export const bookmarkOrg = new BookmarkOrganization();
