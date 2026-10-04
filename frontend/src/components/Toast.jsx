import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "info", duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type };
        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const hideToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (msg, dur) => showToast(msg, "success", dur),
        error: (msg, dur) => showToast(msg, "error", dur),
        warning: (msg, dur) => showToast(msg, "warning", dur),
        info: (msg, dur) => showToast(msg, "info", dur),
        dismiss: hideToast
    };

    return (
        <ToastContext.Provider value={{ toasts, toast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={hideToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context.toast;
}

function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }) {
    const icons = {
        success: "✓",
        error: "⚠️",
        warning: "⚠️",
        info: "ℹ️"
    };

    const labels = {
        success: "Success",
        error: "Error",
        warning: "Warning",
        info: "Info"
    };

    return (
        <div
            className={`toast toast-${toast.type}`}
            role="alert"
            aria-live="assertive"
        >
            <span className="toast-icon" aria-hidden="true">
                {icons[toast.type]}
            </span>
            <span className="toast-message">
                {toast.message}
            </span>
            <button
                className="toast-close"
                onClick={() => onDismiss(toast.id)}
                aria-label={`Dismiss ${labels[toast.type].toLowerCase()}`}
            >
                ✕
            </button>
        </div>
    );
}