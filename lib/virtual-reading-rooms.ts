export interface ReadingRoom {
    id: string;
    hostId: string;
    bookId: string;
    participants: string[];
    isLive: boolean;
    startTime: string;
    currentPage: number;
}

export class VirtualReadingRooms {
    createRoom(hostId: string, bookId: string): ReadingRoom {
        const room: ReadingRoom = {
            id: crypto.randomUUID(),
            hostId,
            bookId,
            participants: [hostId],
            isLive: true,
            startTime: new Date().toISOString(),
            currentPage: 1,
        };

        this.saveRoom(room);
        return room;
    }

    joinRoom(roomId: string, userId: string): boolean {
        const room = this.getRoom(roomId);
        if (!room || !room.isLive) return false;

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            this.saveRoom(room);
        }

        return true;
    }

    syncPage(roomId: string, page: number): void {
        const room = this.getRoom(roomId);
        if (room) {
            room.currentPage = page;
            this.saveRoom(room);
        }
    }

    private saveRoom(room: ReadingRoom): void {
        const rooms = this.getAllRooms();
        const index = rooms.findIndex(r => r.id === room.id);

        if (index >= 0) {
            rooms[index] = room;
        } else {
            rooms.push(room);
        }

        localStorage.setItem('reading-rooms', JSON.stringify(rooms));
    }

    getAllRooms(): ReadingRoom[] {
        const stored = localStorage.getItem('reading-rooms');
        return stored ? JSON.parse(stored) : [];
    }

    getRoom(roomId: string): ReadingRoom | null {
        return this.getAllRooms().find(r => r.id === roomId) || null;
    }

    getActiveRooms(): ReadingRoom[] {
        return this.getAllRooms().filter(r => r.isLive);
    }
}

export const virtualRooms = new VirtualReadingRooms();
