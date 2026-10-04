import { createContext, useContext, useState, useCallback } from "react";
import ConfirmationModal from "./ConfirmationModal";

const ConfirmContext = createContext(null);

export function ConfirmationProvider({ children }) {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "Confirm Action",
        message: "Are you sure you want to proceed?",
        confirmText: "Confirm",
        cancelText: "Cancel",
        type: "danger",
        onConfirm: () => {},
        onClose: () => {}
    });

    const openConfirm = useCallback((options) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title: options.title || "Confirm Action",
                message: options.message || "Are you sure you want to proceed?",
                confirmText: options.confirmText || "Confirm",
                cancelText: options.cancelText || "Cancel",
                type: options.type || "danger",
                onConfirm: () => resolve(true),
                onClose: () => resolve(false)
            });
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <ConfirmContext.Provider value={{ openConfirm, closeConfirm }}>
            {children}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={closeConfirm}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                type={modalState.type}
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmationProvider");
    }
    return context;
}