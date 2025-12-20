export class ReadingMilestones {
    checkMilestone(booksRead: number): { achieved: boolean; milestone: string } | null {
        const milestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

        if (milestones.includes(booksRead)) {
            return {
                achieved: true,
                milestone: `${booksRead} Books Read!`,
            };
        }

        return null;
    }

    getNextMilestone(booksRead: number): { target: number; remaining: number } {
        const milestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
        const next = milestones.find(m => m > booksRead) || 1000;

        return {
            target: next,
            remaining: next - booksRead,
        };
    }

    celebrateMilestone(milestone: number): void {
        console.log(`🎉 Congratulations! You've read ${milestone} books!`);
    }
}

export const milestones = new ReadingMilestones();
