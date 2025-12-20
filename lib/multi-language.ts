export class MultiLanguageSupport {
    private translations: Record<string, Record<string, string>> = {
        en: { welcome: 'Welcome', books: 'Books' },
        es: { welcome: 'Bienvenido', books: 'Libros' },
        fr: { welcome: 'Bienvenue', books: 'Livres' },
        de: { welcome: 'Willkommen', books: 'Bücher' },
    };

    translate(key: string, language: string = 'en'): string {
        return this.translations[language]?.[key] || key;
    }

    setLanguage(userId: string, language: string): void {
        localStorage.setItem(`lang-${userId}`, language);
    }

    getLanguage(userId: string): string {
        return localStorage.getItem(`lang-${userId}`) || 'en';
    }

    getSupportedLanguages(): string[] {
        return Object.keys(this.translations);
    }
}

export const i18n = new MultiLanguageSupport();
