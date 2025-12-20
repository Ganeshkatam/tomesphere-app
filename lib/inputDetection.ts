// Smart Input Detection Utilities
// Automatically detects if input is email or phone number

export const detectInputType = (input: string): 'email' | 'phone' | 'unknown' => {
    const trimmed = input.trim();

    // Phone number patterns
    const phonePatterns = [
        /^\+?[1-9]\d{1,14}$/,  // E.164 format
        /^\+\d{10,15}$/,        // International with +
        /^\d{10,}$/              // Just digits (10+)
    ];

    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check phone first (more restrictive)
    if (phonePatterns.some(pattern => pattern.test(trimmed))) {
        return 'phone';
    }

    // Check email
    if (emailPattern.test(trimmed)) {
        return 'email';
    }

    return 'unknown';
};

export const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');

    // Ensure it starts with +
    if (!cleaned.startsWith('+') && cleaned.length > 0) {
        cleaned = '+' + cleaned;
    }

    return cleaned;
};

export const getPlaceholderText = (inputType: 'email' | 'phone' | 'unknown'): string => {
    switch (inputType) {
        case 'email':
            return 'Continue typing email...';
        case 'phone':
            return 'Continue typing phone...';
        default:
            return 'Email or phone number';
    }
};

export const getInputHint = (input: string): string => {
    const type = detectInputType(input);

    if (!input) return '';

    switch (type) {
        case 'email':
            return '📧 Email detected';
        case 'phone':
            return '📱 Phone detected';
        default:
            return '⌨️ Keep typing...';
    }
};
