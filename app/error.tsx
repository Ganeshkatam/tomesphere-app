'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md">
                {/* Icon */}
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                    <span className="text-4xl">⚠️</span>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">Something went wrong</h2>
                    <p className="text-slate-400">
                        We encountered an unexpected error. Our team has been notified.
                    </p>
                    <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3 rounded-lg break-all">
                        {error.message || 'Unknown error'}
                    </p>
                </div>

                {/* Action */}
                <button
                    onClick={reset}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-200 transition-all"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
