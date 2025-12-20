export class AccessibilityFeatures {
    enableScreenReader(): void {
        document.body.setAttribute('aria-live', 'polite');
    }

    setFontSize(size: 'small' | 'medium' | 'large' | 'xlarge'): void {
        const sizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
        document.documentElement.style.fontSize = sizes[size];
    }

    enableHighContrast(): void {
        document.body.classList.add('high-contrast');
    }

    enableDyslexicFont(): void {
        document.body.style.fontFamily = 'OpenDyslexic, sans-serif';
    }

    setLineSpacing(spacing: number): void {
        document.body.style.lineHeight = `${spacing}`;
    }
}

export const accessibility = new AccessibilityFeatures();
