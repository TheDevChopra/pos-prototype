'use client';

import { useState } from 'react';
import { Delete } from 'lucide-react';
import clsx from 'clsx';

interface PinPadProps {
    onComplete: (pin: string) => void;
    title?: string;
    error?: string;
}

export function PinPad({ onComplete, title = 'Enter PIN', error }: PinPadProps) {
    const [pin, setPin] = useState('');

    const handlePress = (num: string) => {
        if (pin.length < 6) {
            setPin((prev) => prev + num);
        }
    };

    const handleDelete = () => {
        setPin((prev) => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (pin.length > 0) {
            onComplete(pin);
            setPin(''); // Reset after submit
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">{title}</h2>

            {/* PIN Display */}
            <div className="flex gap-3 mb-8">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={clsx(
                            "w-4 h-4 rounded-full transition-all duration-200",
                            i < pin.length ? "bg-blue-600 scale-110" : "bg-slate-200"
                        )}
                    />
                ))}
            </div>

            {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full px-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                        key={num}
                        onClick={() => handlePress(num)}
                        className="w-full aspect-square rounded-xl bg-slate-50 text-2xl font-semibold text-slate-700 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={handleDelete}
                    className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-sm hover:text-red-500"
                >
                    <Delete className="w-8 h-8" />
                </button>
                <button
                    onClick={() => handlePress('0')}
                    className="w-full aspect-square rounded-xl bg-slate-50 text-2xl font-semibold text-slate-700 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                    0
                </button>
                <button
                    onClick={handleSubmit}
                    className="w-full aspect-square rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-sm shadow-blue-200"
                >
                    OK
                </button>
            </div>
        </div>
    );
}
