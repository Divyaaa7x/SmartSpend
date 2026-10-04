import { useState, useCallback } from "react";
import ConfirmationModal from "./ConfirmationModal";

export function ConfirmationProvider({ children }) {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        type: "danger",
        onConfirm: () => {},
        onClose: () => {}
    });

    const confirm = useCallback((options) => {
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

    const closeModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <>
            {children}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                type={modalState.type}
            />
        </>
    );
}

export function useConfirm() {
    // This will be used within a component that has access to the context
    // For simplicity, we'll use a different approach - a global confirm function
    throw new Error("useConfirm must be used with a different pattern");
}

// Alternative: A simpler hook that manages its own modal state
export function useConfirmation() {
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
                onConfirm: () => {
                    resolve(true);
                    setModalState(prev => ({ ...prev, isOpen: false }));
                },
                onClose: () => {
                    resolve(false);
                    setModalState(prev => ({ ...prev, isOpen: false }));
                }
            });
        });
    }, []);

    const ConfirmationDialog = () => (
        <ConfirmationModal
            isOpen={modalState.isOpen}
            onClose={modalState.onClose}
            onConfirm={modalState.onConfirm}
            title={modalState.title}
            message={modalState.message}
            confirmText={modalState.confirmText}
            cancelText={modalState.cancelText}
            type={modalState.type}
        />
    );

    return { openConfirm, ConfirmationDialog };
}