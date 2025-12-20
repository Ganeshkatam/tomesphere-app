export default function LoadingSpinner({ size = 'md', color = 'purple' }: { size?: 'sm' | 'md' | 'lg', color?: string }) {
    const sizeClasses = {
        sm: 'h-6 w-6 border-2',
        md: 'h-12 w-12 border-4',
        lg: 'h-16 w-16 border-4'
    };

    const colorClasses = {
        purple: 'border-purple-600 border-t-transparent',
        pink: 'border-pink-600 border-t-transparent',
        blue: 'border-blue-600 border-t-transparent',
        green: 'border-green-600 border-t-transparent'
    };

    return (
        <div className="flex items-center justify-center">
            <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses] || colorClasses.purple}`}></div>
        </div>
    );
}

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="min-h-screen bg-gradient-page flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400 mt-4">{message}</p>
        </div>
    );
}
