'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/lib/store';
import { PinPad } from '@/components/PinPad';
import { Store } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const setRole = usePosStore((state) => state.setRole);
    const [error, setError] = useState('');

    const handlePinComplete = (pin: string) => {
        if (pin === '9999') {
            setRole('pos');
            router.push('/pos');
        } else if (pin === '100000') {
            setRole('settings');
            router.push('/settings');
        } else {
            setError('Invalid PIN code');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                    <Store className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Shake Era POS</h1>
                <p className="text-slate-500 mt-2 text-center max-w-sm">
                    Enter your PIN to access the system.
                    <br />
                    <span className="text-sm border-t border-slate-200 pt-2 mt-2 block">
                        Demo PINs: <strong>9999</strong> (POS/Admin), <strong>100000</strong> (Settings)
                    </span>
                </p>
            </div>

            <PinPad onComplete={handlePinComplete} error={error} title="Enter Access PIN" />
        </div>
    );
}
