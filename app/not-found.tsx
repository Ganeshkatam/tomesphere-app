import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md">
                {/* Icon */}
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                    <span className="text-4xl">🔭</span>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
                    <p className="text-slate-400">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Action */}
                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
