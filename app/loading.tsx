export default function Loading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-[9999]">
            <div className="relative flex flex-col items-center gap-4">
                {/* Animated Logo/Spinner */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-slate-800"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin-reverse"></div>
                </div>

                {/* Text */}
                <div className="flex flex-col items-center gap-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">TomeSphere</h3>
                    <p className="text-sm text-slate-500 font-medium uppercase tracking-widest animate-pulse">Loading</p>
                </div>
            </div>
        </div>
    );
}
