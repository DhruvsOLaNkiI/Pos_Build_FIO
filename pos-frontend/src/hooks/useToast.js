import { useState, useCallback } from 'react';

let toastCount = 0;

export function useToast() {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }) => {
        const id = toastCount++;
        const newToast = { id, title, description, variant, open: true };
        setToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);

        return id;
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, toast, dismiss };
}
