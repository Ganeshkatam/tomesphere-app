// Maximum Email Validation System
// Includes: Format, Typos, Duplicates, Normalization, Disposable Blocking, Domain Verification

// Common email domain typos and their corrections
const DOMAIN_CORRECTIONS: Record<string, string> = {
    // Gmail
    'gmial': 'gmail',
    'gmai': 'gmail',
    'gmil': 'gmail',
    'gmaul': 'gmail',
    'gmali': 'gmail',

    // Yahoo
    'yahooo': 'yahoo',
    'yaho': 'yahoo',
    'yhoo': 'yahoo',

    // Hotmail
    'hotmial': 'hotmail',
    'hotmai': 'hotmail',
    'hotmil': 'hotmail',

    // Outlook
    'outlok': 'outlook',
    'outloo': 'outlook',

    // Other common
    'gmal': 'gmail',
    'ymail': 'yahoo',
};

// Common disposable email domains (partial list)
const DISPOSABLE_DOMAINS = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'getnada.com',
    'maildrop.cc',
    'trashmail.com',
    'fakeinbox.com',
];

export interface EmailValidationResult {
    isValid: boolean;
    normalized?: string;
    suggestion?: string;
    error?: string;
    warnings?: string[];
}

// 1. Format Validation
export const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 2. Normalize Email
export const normalizeEmail = (email: string): string => {
    let normalized = email.trim().toLowerCase();

    // Remove Gmail-specific tags (optional)
    // user+tag@gmail.com -> user@gmail.com
    if (normalized.includes('@gmail.com')) {
        const [local, domain] = normalized.split('@');
        const cleanLocal = local.split('+')[0].replace(/\./g, '');
        normalized = `${cleanLocal}@${domain}`;
    }

    return normalized;
};

// 3. Typo Detection
export const detectTypos = (email: string): string | null => {
    const [local, domain] = email.split('@');
    if (!domain) return null;

    const [domainName, tld] = domain.split('.');

    // Check for domain typos
    if (DOMAIN_CORRECTIONS[domainName]) {
        return `${local}@${DOMAIN_CORRECTIONS[domainName]}.${tld}`;
    }

    return null;
};

// 4. Disposable Email Check
export const isDisposableEmail = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    return DISPOSABLE_DOMAINS.includes(domain);
};

// 5. Domain Verification (DNS Lookup)
export const verifyDomain = async (email: string): Promise<boolean> => {
    const domain = email.split('@')[1];

    try {
        // Use a free DNS lookup API
        const response = await fetch(
            `https://dns.google/resolve?name=${domain}&type=MX`,
            { signal: AbortSignal.timeout(3000) } // 3 second timeout
        );

        if (!response.ok) return false;

        const data = await response.json();

        // Check if domain has MX (mail exchange) records
        return data.Answer && data.Answer.length > 0;
    } catch (error) {
        console.warn('Domain verification failed:', error);
        // Don't block signup if verification fails - could be network issue
        return true;
    }
};

// 6. Complete Validation
export const validateEmail = async (
    email: string,
    checkDuplicate?: (email: string) => Promise<boolean>
): Promise<EmailValidationResult> => {
    // Step 1: Format validation
    if (!validateEmailFormat(email)) {
        return {
            isValid: false,
            error: 'Invalid email format. Please enter a valid email address.',
        };
    }

    // Step 2: Normalize
    const normalized = normalizeEmail(email);

    // Step 3: Typo detection
    const suggestion = detectTypos(normalized);
    if (suggestion) {
        return {
            isValid: true,
            normalized,
            suggestion,
            warnings: [`Did you mean ${suggestion}?`],
        };
    }

    // Step 4: Disposable email check
    if (isDisposableEmail(normalized)) {
        return {
            isValid: false,
            error: 'Disposable email addresses are not allowed. Please use a permanent email.',
        };
    }

    // Step 5: Duplicate check
    if (checkDuplicate) {
        const isDuplicate = await checkDuplicate(normalized);
        if (isDuplicate) {
            return {
                isValid: false,
                error: 'This email is already registered. Try signing in instead.',
            };
        }
    }

    // Step 6: Domain verification
    const domainExists = await verifyDomain(normalized);
    if (!domainExists) {
        return {
            isValid: false,
            error: 'Email domain does not exist. Please check your email address.',
        };
    }

    // All checks passed!
    return {
        isValid: true,
        normalized,
    };
};

// Quick validation (no async checks)
export const validateEmailQuick = (email: string): EmailValidationResult => {
    if (!validateEmailFormat(email)) {
        return {
            isValid: false,
            error: 'Invalid email format',
        };
    }

    const normalized = normalizeEmail(email);
    const suggestion = detectTypos(normalized);

    if (suggestion) {
        return {
            isValid: true,
            normalized,
            suggestion,
        };
    }

    if (isDisposableEmail(normalized)) {
        return {
            isValid: false,
            error: 'Disposable emails not allowed',
        };
    }

    return {
        isValid: true,
        normalized,
    };
};
