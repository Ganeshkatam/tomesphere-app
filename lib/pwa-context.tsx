'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
    installPrompt: BeforeInstallPromptEvent | null;
    isInstalled: boolean;
    isIOS: boolean;
    promptInstall: () => Promise<void>;
    dismissPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const checkIfInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone ||
                document.referrer.includes('android-app://');
            setIsInstalled(isStandalone);
        };

        checkIfInstalled();
        window.addEventListener('appinstalled', checkIfInstalled);

        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('appinstalled', checkIfInstalled);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const promptInstall = async () => {
        if (!installPrompt) return;

        try {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstallPrompt(null);
            }
        } catch (error) {
            console.error('Install prompt error:', error);
        }
    };

    const dismissPrompt = () => {
        // This is mostly for UI that might want to hide itself, 
        // but we encourage keeping the button available.
        // We don't nullify the prompt here so the button remains active.
    };

    return (
        <PWAContext.Provider value={{
            installPrompt,
            isInstalled,
            isIOS,
            promptInstall,
            dismissPrompt
        }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}
