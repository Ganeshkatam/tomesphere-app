'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { usePWA } from '@/lib/pwa-context';

export default function InstallPWA() {
    const { installPrompt, isIOS, isInstalled, promptInstall } = usePWA();
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Show popup if install is available and not dismissed recently
        const dismissed = localStorage.getItem('pwa-popup-dismissed');

        if (!isInstalled && !dismissed) {
            // If we have an install prompt (Android/Desktop) or it's iOS (manual instructions)
            if (installPrompt || isIOS) {
                // Short delay to not be annoying immediately on load
                const timer = setTimeout(() => setShowPopup(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [installPrompt, isIOS, isInstalled]);

    const handleDismiss = () => {
        setShowPopup(false);
        localStorage.setItem('pwa-popup-dismissed', 'true');
    };

    if (!showPopup || isInstalled) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-slideIn">
            <div className="glass-strong rounded-2xl p-6 shadow-2xl border border-white/10">
                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
                        📚
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                            Install TomeSphere
                        </h3>

                        {isIOS ? (
                            <div className="text-sm text-slate-300 space-y-2">
                                <p>Install this app on your iPhone:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-400">
                                    <li>Tap the Share button <span className="inline-block">⬆️</span></li>
                                    <li>Scroll and tap "Add to Home Screen"</li>
                                    <li>Tap "Add" to install</li>
                                </ol>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-slate-300 mb-4">
                                    Get quick access and offline reading by installing our app!
                                </p>

                                <button
                                    onClick={() => {
                                        promptInstall();
                                        setShowPopup(false);
                                    }}
                                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                                >
                                    <Download size={18} />
                                    Install App
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
