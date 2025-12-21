'use client';

import toast from 'react-hot-toast';
import { XCircle, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import React from 'react';

// Toast configuration with excellent styling
const toastConfig = {
    duration: 4000,
    style: {
        background: '#1e293b',
        color: '#f1f5f9',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '14px 18px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        maxWidth: '400px',
    },
};

// Custom styled toast functions
export const showError = (message: string, options?: { duration?: number }) => {
    return toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-red-500/30 bg-gradient-to-r from-red-950/90 to-slate-900/90 backdrop-blur-xl max-w-md`}
            >
                <div className="flex-shrink-0 p-1 rounded-full bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-red-200">Error</p>
                    <p className="text-sm text-slate-300">{message}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    <XCircle className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
            </div>
        ),
        { duration: options?.duration ?? 5000 }
    );
};

export const showSuccess = (message: string, options?: { duration?: number }) => {
    return toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-green-500/30 bg-gradient-to-r from-green-950/90 to-slate-900/90 backdrop-blur-xl max-w-md`}
            >
                <div className="flex-shrink-0 p-1 rounded-full bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-green-200">Success</p>
                    <p className="text-sm text-slate-300">{message}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    <XCircle className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
            </div>
        ),
        { duration: options?.duration ?? 4000 }
    );
};

export const showWarning = (message: string, options?: { duration?: number }) => {
    return toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/90 to-slate-900/90 backdrop-blur-xl max-w-md`}
            >
                <div className="flex-shrink-0 p-1 rounded-full bg-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-200">Warning</p>
                    <p className="text-sm text-slate-300">{message}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    <XCircle className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
            </div>
        ),
        { duration: options?.duration ?? 5000 }
    );
};

export const showInfo = (message: string, options?: { duration?: number }) => {
    return toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/90 to-slate-900/90 backdrop-blur-xl max-w-md`}
            >
                <div className="flex-shrink-0 p-1 rounded-full bg-blue-500/20">
                    <Info className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-200">Info</p>
                    <p className="text-sm text-slate-300">{message}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    <XCircle className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
            </div>
        ),
        { duration: options?.duration ?? 4000 }
    );
};

export const showLoading = (message: string) => {
    return toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/90 to-slate-900/90 backdrop-blur-xl max-w-md`}
            >
                <div className="flex-shrink-0 p-1 rounded-full bg-indigo-500/20">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-indigo-200">Loading</p>
                    <p className="text-sm text-slate-300">{message}</p>
                </div>
            </div>
        ),
        { duration: Infinity }
    );
};

// Promise-based toast for async operations
export const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
    }
) => {
    return toast.promise(
        promise,
        {
            loading: messages.loading,
            success: (data) =>
                typeof messages.success === 'function'
                    ? messages.success(data)
                    : messages.success,
            error: (err) =>
                typeof messages.error === 'function'
                    ? messages.error(err)
                    : messages.error,
        },
        {
            style: toastConfig.style,
            success: {
                icon: <CheckCircle className="w-5 h-5 text-green-400" />,
                style: {
                    ...toastConfig.style,
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    background: 'linear-gradient(to right, rgb(20, 83, 45, 0.9), rgb(30, 41, 59, 0.9))',
                },
            },
            error: {
                icon: <XCircle className="w-5 h-5 text-red-400" />,
                style: {
                    ...toastConfig.style,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    background: 'linear-gradient(to right, rgb(127, 29, 29, 0.9), rgb(30, 41, 59, 0.9))',
                },
            },
            loading: {
                icon: <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />,
                style: {
                    ...toastConfig.style,
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    background: 'linear-gradient(to right, rgb(49, 46, 129, 0.9), rgb(30, 41, 59, 0.9))',
                },
            },
        }
    );
};

// Export default toast for simple usage
export { toast };

// Toaster configuration for app-wide use
export const toasterConfig = {
    position: 'top-right' as const,
    toastOptions: {
        ...toastConfig,
        success: {
            duration: 4000,
            iconTheme: {
                primary: '#22c55e',
                secondary: '#dcfce7',
            },
        },
        error: {
            duration: 5000,
            iconTheme: {
                primary: '#ef4444',
                secondary: '#fee2e2',
            },
        },
    },
};
