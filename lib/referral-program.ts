export class ReferralProgram {
    createReferralCode(userId: string): string {
        const code = `REF${userId.substring(0, 6).toUpperCase()}`;
        localStorage.setItem(`referral-${userId}`, code);
        return code;
    }

    trackReferral(referrerCode: string, newUserId: string): void {
        localStorage.setItem(`referred-by-${newUserId}`, referrerCode);
    }

    getReferralStats(userId: string): { count: number; rewards: number } {
        const keys = Object.keys(localStorage);
        const userCode = localStorage.getItem(`referral-${userId}`);
        const count = keys.filter(k => localStorage.getItem(k) === userCode).length;

        return {
            count,
            rewards: count * 100, // 100 points per referral
        };
    }
}

export const referralProgram = new ReferralProgram();
