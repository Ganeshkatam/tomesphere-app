'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    shortcut?: string;
    action: () => void;
    category: 'navigation' | 'actions' | 'search';
}

export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();

    const commands: CommandItem[] = [
        // Navigation
        { id: 'home', label: 'Go to Home', shortcut: 'h', action: () => router.push('/home'), category: 'navigation' },
        { id: 'explore', label: 'Go to Explore', shortcut: 'e', action: () => router.push('/explore'), category: 'navigation' },
        { id: 'library', label: 'Go to Library', shortcut: 'l', action: () => router.push('/library'), category: 'navigation' },
        { id: 'profile', label: 'Go to Profile', shortcut: 'p', action: () => router.push('/profile'), category: 'navigation' },

        // Actions
        {
            id: 'theme', label: 'Toggle Theme', shortcut: 't', action: () => {
                document.documentElement.classList.toggle('light');
                setIsOpen(false);
            }, category: 'actions'
        },
        {
            id: 'random', label: 'Random Book', shortcut: 'r', action: () => {
                // Would trigger random book
                setIsOpen(false);
            }, category: 'actions'
        },
    ];

    const filteredCommands = search
        ? commands.filter(cmd =>
            cmd.label.toLowerCase().includes(search.toLowerCase())
        )
        : commands;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Cmd+K or Ctrl+K to open
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsOpen(prev => !prev);
        }

        // Escape to close
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return {
        isOpen,
        setIsOpen,
        search,
        setSearch,
        commands: filteredCommands,
    };
}

export function CommandPalette() {
    const { isOpen, setIsOpen, search, setSearch, commands } = useCommandPalette();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
            <div className="glass-card w-full max-w-2xl rounded-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                    <Command size={20} className="text-primary" />
                    <input
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-lg"
                        autoFocus
                    />
                    <kbd className="px-2 py-1 text-xs rounded bg-white/10">ESC</kbd>
                </div>

                {/* Commands List */}
                <div className="max-h-96 overflow-y-auto">
                    {commands.map((cmd) => (
                        <button
                            key={cmd.id}
                            onClick={() => {
                                cmd.action();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                            <span>{cmd.label}</span>
                            {cmd.shortcut && (
                                <kbd className="px-2 py-1 text-xs rounded bg-white/10">
                                    {cmd.shortcut}
                                </kbd>
                            )}
                        </button>
                    ))}

                    {commands.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No commands found
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
                    <span>Use ↑↓ to navigate</span>
                    <span>⏎ to select</span>
                </div>
            </div>
        </div>
    );
}
