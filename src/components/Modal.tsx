import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure the browser paints the initial state before applying the transform class
            const timer = setTimeout(() => setAnimateIn(true), 10);
            return () => clearTimeout(timer);
        } else {
            setAnimateIn(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300",
                    animateIn ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Modal Box */}
            <div
                className={clsx(
                    "relative bg-white rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden transition-all duration-300 ease-out transform",
                    maxWidthClasses[maxWidth],
                    animateIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
                )}
            >
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
