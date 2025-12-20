'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';

export default function ThemeManager() {
    const [primary, setPrimary] = useState('#6366f1');

    const applyTheme = () => {
        document.documentElement.style.setProperty('--color-primary', primary);
        localStorage.setItem('admin_theme_primary', primary);
    };

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Palette size={20} /> Theme Customization
            </h3>
            <div className="flex items-center gap-4">
                <input
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="w-16 h-16 rounded cursor-pointer"
                />
                <div>
                    <label className="text-sm text-slate-400">Primary Color</label>
                    <p className="text-white font-mono">{primary}</p>
                </div>
                <button onClick={applyTheme} className="btn-primary ml-auto">
                    Apply Theme
                </button>
            </div>
        </div>
    );
}
