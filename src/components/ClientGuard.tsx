'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePosStore } from '@/lib/store';

export function ClientGuard({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (pathname === '/' || pathname === '/login') {
            router.push('/pos');
        }
    }, [mounted, pathname, router]);

    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (pathname === '/' || pathname === '/login') return null;

    return <>{children}</>;
}
