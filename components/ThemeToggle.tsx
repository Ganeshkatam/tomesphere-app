'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center group"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun
                    size={18}
                    className="text-yellow-400 transition-transform group-hover:rotate-90 duration-500"
                />
            ) : (
                <Moon
                    size={18}
                    className="text-blue-400 transition-transform group-hover:-rotate-12 duration-500"
                />
            )}

            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${theme === 'dark' ? 'bg-yellow-400/10' : 'bg-blue-400/10'
                }`} />
        </button>
    );
}
