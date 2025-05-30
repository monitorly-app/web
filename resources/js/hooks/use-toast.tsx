import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const { props } = usePage();

    useEffect(() => {
        const flash = props.flash as any;

        if (flash?.success) {
            addToast(flash.success, 'success');
        }

        if (flash?.error) {
            addToast(flash.error, 'error');
        }

        if (flash?.info) {
            addToast(flash.info, 'info');
        }

        if (flash?.warning) {
            addToast(flash.warning, 'warning');
        }
    }, [props.flash]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
        const id = Date.now().toString();
        const newToast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        const duration = type === 'error' ? 7000 : 5000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'info':
                return <Info className="h-4 w-4 text-blue-600" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getVariant = (type: string) => {
        return type === 'error' ? 'destructive' : 'default';
    };

    const ToastContainer = () => {
        if (toasts.length === 0) return null;

        return createPortal(
            <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
                {toasts.map((toast) => (
                    <Alert key={toast.id} variant={getVariant(toast.type)} className="animate-in slide-in-from-top-2 relative pr-10 shadow-lg">
                        {getIcon(toast.type)}
                        <AlertDescription className="pr-2">{toast.message}</AlertDescription>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="absolute top-3 right-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-50 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </button>
                    </Alert>
                ))}
            </div>,
            document.body,
        );
    };

    return {
        ToastContainer,
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
        info: (msg: string) => addToast(msg, 'info'),
        warning: (msg: string) => addToast(msg, 'warning'),
    };
}
