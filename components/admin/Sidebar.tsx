import { LayoutDashboard, Compass, BookOpen, Users, ShieldCheck, LogOut } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: 'overview' | 'discover' | 'books' | 'users' | 'reviews') => void;
    onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { id: 'discover', label: 'Discover', icon: <Compass size={20} /> },
        { id: 'books', label: 'Books', icon: <BookOpen size={20} /> },
        { id: 'users', label: 'Users', icon: <Users size={20} /> },
        { id: 'reviews', label: 'Moderation', icon: <ShieldCheck size={20} /> },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 solid-panel z-50 flex flex-col transition-all duration-300 bg-slate-900 border-r border-white/10">
            {/* Logo Area */}
            <div className="p-8 border-b border-white/10 bg-black/20">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    TomeSphere
                </h1>
                <p className="text-xs text-slate-400 mt-2 font-medium tracking-wider uppercase">Admin Workspace</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                            )}

                            <span className={`transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-400' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            <span className={`font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>

                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-white/5 bg-black/20">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
