'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
    BookOpen,
    Quote,
    FileText,
    Target,
    Users,
    ShoppingBag,
    Home
} from 'lucide-react';

export default function StudentNav() {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        {
            name: 'Home',
            path: '/home',
            icon: Home,
            color: 'text-slate-400 hover:text-white'
        },
        {
            name: 'Academic Library',
            path: '/academic',
            icon: BookOpen,
            color: 'text-purple-400 hover:text-purple-300'
        },
        {
            name: 'Citations',
            path: '/citations',
            icon: Quote,
            color: 'text-orange-400 hover:text-orange-300'
        },
        {
            name: 'Smart Notes',
            path: '/notes',
            icon: FileText,
            color: 'text-indigo-400 hover:text-indigo-300'
        },
        {
            name: 'Exam Prep',
            path: '/exam-prep',
            icon: Target,
            color: 'text-pink-400 hover:text-pink-300'
        },
        {
            name: 'Analytics',
            path: '/analytics',
            icon: Target,
            color: 'text-cyan-400 hover:text-cyan-300'
        },
        {
            name: 'Study Groups',
            path: '/study-groups',
            icon: Users,
            color: 'text-blue-400 hover:text-blue-300'
        },
        {
            name: 'Textbook Exchange',
            path: '/textbook-exchange',
            icon: ShoppingBag,
            color: 'text-green-400 hover:text-green-300'
        }
    ];

    const isActive = (path: string) => {
        if (path === '/home') {
            return pathname === '/home';
        }
        return pathname.startsWith(path);
    };

    return (
        <div className="glass-strong border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl
                                    transition-all whitespace-nowrap text-sm font-medium
                                    ${active
                                        ? 'bg-white/20 text-white shadow-lg'
                                        : `bg-white/5 ${item.color}`
                                    }
                                `}
                            >
                                <Icon size={16} />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
