// Smart Enter Key Detection Utilities
// Handles Enter key for form navigation and submission

export const handleEnterKey = (
    e: React.KeyboardEvent,
    action: 'next' | 'submit',
    nextElementId?: string
) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        if (action === 'next' && nextElementId) {
            // Focus next input
            const nextElement = document.getElementById(nextElementId) as HTMLInputElement;
            if (nextElement) {
                nextElement.focus();
            }
        } else if (action === 'submit') {
            // Submit form
            const form = (e.target as HTMLElement).closest('form');
            if (form) {
                form.requestSubmit();
            }
        }
    }
};

export const setupEnterKeyNavigation = (formId: string) => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) return;

    const inputs = Array.from(form.querySelectorAll('input, select, textarea')) as HTMLElement[];

    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e: any) => {
            if (e.key === 'Enter') {
                e.preventDefault();

                // If last input, submit form
                if (index === inputs.length - 1) {
                    form.requestSubmit();
                } else {
                    // Focus next input
                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
            }
        });
    });
};
