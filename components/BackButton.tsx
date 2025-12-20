'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
    fallbackUrl?: string;
    className?: string;
    label?: string;
}

export default function BackButton({
    fallbackUrl = '/',
    className = '',
    label = 'Back'
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            router.back();
        } else {
            // Fallback to specified URL if no history
            router.push(fallbackUrl);
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all duration-200 ${className}`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="font-medium">{label}</span>
        </button>
    );
}
