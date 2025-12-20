export class BookCompetitions {
    createCompetition(name: string, goal: number, duration: number): any {
        return {
            id: crypto.randomUUID(),
            name,
            goal,
            duration,
            participants: [],
            startDate: new Date().toISOString(),
        };
    }

    joinCompetition(competitionId: string, userId: string): boolean {
        return true;
    }

    getLeaderboard(competitionId: string): any[] {
        return [
            { userId: '1', progress: 15, rank: 1 },
            { userId: '2', progress: 12, rank: 2 },
        ];
    }
}

export const competitions = new BookCompetitions();
