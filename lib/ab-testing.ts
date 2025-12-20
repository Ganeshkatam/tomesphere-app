export class ABTesting {
    assignVariant(userId: string, experimentName: string): 'A' | 'B' {
        const hash = this.hashCode(userId + experimentName);
        return hash % 2 === 0 ? 'A' : 'B';
    }

    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    trackConversion(userId: string, experimentName: string, variant: string): void {
        const key = `conversion-${experimentName}-${variant}`;
        const count = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, (count + 1).toString());
    }

    getResults(experimentName: string): { variantA: number; variantB: number } {
        const variantA = parseInt(localStorage.getItem(`conversion-${experimentName}-A`) || '0');
        const variantB = parseInt(localStorage.getItem(`conversion-${experimentName}-B`) || '0');
        return { variantA, variantB };
    }
}

export const abTesting = new ABTesting();
