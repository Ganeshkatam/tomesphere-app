'use client';

import { useEffect, useState } from 'react';
import { X, RefreshCw, Sparkles } from 'lucide-react';

export default function PWAUpdatePrompt() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Check for updates every 60 seconds
            const checkForUpdates = setInterval(() => {
                navigator.serviceWorker.ready.then(reg => {
                    reg.update();
                });
            }, 60000);

            // Listen for new service worker
            navigator.serviceWorker.ready.then(reg => {
                setRegistration(reg);

                // Check if there's a waiting service worker
                if (reg.waiting) {
                    setUpdateAvailable(true);
                }

                // Listen for new service worker installing
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;

                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker is ready
                                setUpdateAvailable(true);
                            }
                        });
                    }
                });
            });

            // Listen for controller change (new SW activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });

            return () => clearInterval(checkForUpdates);
        }
    }, []);

    const handleUpdate = () => {
        if (registration?.waiting) {
            // Tell the waiting service worker to activate
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    const handleDismiss = () => {
        setUpdateAvailable(false);
    };

    if (!updateAvailable) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="glass-strong rounded-xl p-4 shadow-2xl border border-white/20 animate-slide-up">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Sparkles className="text-white" size={20} />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                            Update Available! 🎉
                        </h3>
                        <p className="text-slate-300 text-sm mb-3">
                            A new version of TomeSphere is ready. Refresh to get the latest features!
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={handleUpdate}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Update Now
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
