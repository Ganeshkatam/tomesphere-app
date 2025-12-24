import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ElementType;
}

export function EmptyState({
    title = "No results found",
    description = "We couldn't find anything matching your search.",
    actionLabel,
    onAction,
    icon: Icon = Search
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Icon className="w-10 h-10 text-slate-400 group-hover:text-indigo-400 transition-colors duration-300" />
            </motion.div>

            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="backdrop-blur-xl bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 font-medium"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
