export class BetaFeatures {
    enrollInBeta(userId: string): void {
        localStorage.setItem(`beta-${userId}`, 'enrolled');
    }

    hasAccess(userId: string, featureName: string): boolean {
        const isBeta = localStorage.getItem(`beta-${userId}`) === 'enrolled';
        return isBeta;
    }

    provideFeedback(userId: string, feature: string, feedback: string): void {
        console.log(`Beta feedback from ${userId}: ${feedback}`);
    }
}

export const betaFeatures = new BetaFeatures();
