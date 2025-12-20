import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface FormErrorProps {
    message: string;
    type?: ToastType;
}

export function FormError({ message, type = 'error' }: FormErrorProps) {
    const icons = {
        success: CheckCircle2,
        error: XCircle,
        info: Info,
        warning: AlertTriangle
    };

    const colors = {
        success: 'text-green-400 bg-green-600/20 border-green-600/30',
        error: 'text-red-400 bg-red-600/20 border-red-600/30',
        info: 'text-blue-400 bg-blue-600/20 border-blue-600/30',
        warning: 'text-yellow-400 bg-yellow-600/20 border-yellow-600/30'
    };

    const Icon = icons[type];

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${colors[type]} mt-4`}>
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

export function InputError({ message }: { message: string }) {
    return (
        <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
            <XCircle size={14} />
            {message}
        </p>
    );
}
