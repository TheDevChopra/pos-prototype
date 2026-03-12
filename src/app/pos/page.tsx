'use client';

import { useState, useMemo } from 'react';
import { usePosStore, CartItem } from '@/lib/store';
import { ReceiptModal } from '@/components/ReceiptModal';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { Modal } from '@/components/Modal';
import { Minus, Plus, ShoppingCart, LogOut, ArrowRight, Printer, Settings, Mic, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function PosPage() {
    const router = useRouter();

    // Store
    const {
        role, setRole, menuItems, cart, addToCart, updateCartQuantity, clearCart,
        applyGst, toggleGst, addOrder, resetDemoData
    } = usePosStore();

    // Local State
    const [selectedCategory, setSelectedCategory] = useState<string>('Fries');
    const [showReceipt, setShowReceipt] = useState(false);

    // Modals
    const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isClearCartModalOpen, setClearCartModalOpen] = useState(false);

    // Derived State
    const categories = useMemo(() => Array.from(new Set(menuItems.map(i => i.category))), [menuItems]);
    const filteredItems = useMemo(() => menuItems.filter(i => i.category === selectedCategory && i.enabled), [menuItems, selectedCategory]);

    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
    const gst = applyGst ? subtotal * 0.05 : 0; // 5% GST
    const total = subtotal + gst;

    // Actions
    const handleLogout = () => {
        setRole(null);
        router.push('/login');
    };

    const handlePrint = () => {
        if (cart.length === 0) return;

        // Create new order in store
        addOrder({
            id: `ord_${Date.now()}`,
            items: cart,
            subtotal,
            gst,
            total,
            date: new Date().toISOString()
        });

        setShowReceipt(true);
    };

    const onPrintComplete = () => {
        setShowReceipt(false);
        clearCart();
    };

    const handleVoiceOrderStart = () => {
        setVoiceModalOpen(true);
        setIsListening(true);
        setVoiceTranscript('Listening...');

        // Simulate voice recognition demo
        setTimeout(() => {
            setVoiceTranscript('two chocolate shakes and one fries');
            setIsListening(false);
        }, 3000);
    };

    const confirmVoiceOrder = () => {
        if (voiceTranscript.includes('chocolate shakes')) {
            const shake = menuItems.find(i => i.id === '16');
            if (shake) { addToCart(shake); addToCart(shake); }
        }
        if (voiceTranscript.includes('fries')) {
            const fries = menuItems.find(i => i.id === '1');
            if (fries) addToCart(fries);
        }
        setVoiceModalOpen(false);
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
            <OnboardingTutorial />

            {/* Left Panel: Categories */}
            <aside className="w-64 bg-white border-r flex flex-col shadow-sm z-10">
                <div className="p-4 border-b bg-blue-600 text-white shadow-sm flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight">POSLY</h1>
                    <button
                        onClick={handleVoiceOrderStart}
                        className="p-2 bg-blue-500 hover:bg-blue-400 rounded-full transition-colors text-white tooltip-trigger"
                        title="Voice Order Demo"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={clsx(
                                "w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-sm",
                                selectedCategory === cat
                                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100 ring-1 ring-blue-500/20"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t bg-slate-50 flex gap-2 flex-col">
                    <button
                        onClick={() => router.push('/admin')}
                        className="w-full flex justify-center items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 rounded-xl transition-colors text-sm"
                    >
                        <Settings className="w-4 h-4" />
                        Owner Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/settings')}
                        className="w-full flex justify-center items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-xl transition-colors text-sm"
                    >
                        <Settings className="w-4 h-4" />
                        System Settings
                    </button>
                </div>
            </aside>

            {/* Center Panel: Menu Grid */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-100/50">
                <div className="p-6 border-b bg-white flex justify-between items-center shadow-sm z-0">
                    <h2 className="text-2xl font-bold text-slate-800">{selectedCategory}</h2>
                    <div className="text-sm text-slate-500 font-medium">
                        {filteredItems.length} items
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="bg-white border rounded-2xl p-4 flex flex-col justify-between items-start text-left shadow-sm hover:shadow-md hover:border-blue-300 hover:ring-1 hover:ring-blue-200 transition-all group aspect-square"
                            >
                                <span className="font-semibold text-slate-700 group-hover:text-blue-700 line-clamp-2 text-lg leading-tight">
                                    {item.name}
                                </span>
                                <div className="flex justify-between items-end w-full mt-2">
                                    <span className="text-blue-600 font-bold text-xl">₹{item.price}</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Right Panel: Cart */}
            <aside className="w-96 bg-white border-l shadow-2xl z-20 flex flex-col flex-shrink-0 relative">
                <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                            Current Order
                        </h2>
                        <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
                            {cart.reduce((a, b) => a + b.quantity, 0)} items
                        </span>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={() => setClearCartModalOpen(true)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <ShoppingCart className="w-16 h-16 opacity-20" />
                            <p className="font-medium text-slate-500">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex flex-col bg-white border rounded-xl p-3 shadow-sm hover:border-blue-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-slate-800 w-2/3 truncate">{item.name}</span>
                                    <span className="font-bold text-slate-700">₹{item.price * item.quantity}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">₹{item.price} each</span>
                                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                                        <button
                                            onClick={() => updateCartQuantity(item.id, -1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm hover:text-blue-600 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-semibold w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateCartQuantity(item.id, 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm hover:text-blue-600 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t bg-slate-50 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium">GST (5%)</span>
                            <button
                                onClick={toggleGst}
                                className={clsx(
                                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                                    applyGst ? "bg-blue-600" : "bg-slate-300"
                                )}
                            >
                                <span className={clsx(
                                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                                    applyGst ? "translate-x-4" : "translate-x-1"
                                )} />
                            </button>
                        </div>
                        <span className="font-medium text-slate-600">₹{gst.toFixed(2)}</span>
                    </div>

                    <div className="pt-3 border-t flex justify-between items-center">
                        <span className="text-xl font-bold text-slate-800">Total</span>
                        <span className="text-3xl font-black text-blue-600 tracking-tight">₹{total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handlePrint}
                        disabled={cart.length === 0}
                        className="w-full py-4 mt-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white enabled:hover:scale-[1.02] enabled:active:scale-[0.98] enabled:shadow-blue-600/30"
                    >
                        <Printer className="w-6 h-6" />
                        Print Bill
                    </button>
                </div>
            </aside>

            {/* Modals & Overlays */}
            {showReceipt && (
                <ReceiptModal
                    onClose={() => setShowReceipt(false)}
                    onPrintComplete={onPrintComplete}
                    cart={cart}
                    subtotal={subtotal}
                    gst={gst}
                    total={total}
                />
            )}

            <Modal isOpen={isVoiceModalOpen} onClose={() => setVoiceModalOpen(false)} title="AI Voice Ordering">
                <div className="flex flex-col items-center justify-center space-y-6 py-6 border-b border-t border-slate-100 bg-slate-50/50 rounded-xl my-4">
                    <div className={clsx("w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-500", isListening ? "bg-red-500 animate-pulse text-white scale-110" : "bg-blue-600 text-white")}>
                        <Mic className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-medium text-slate-700 italic px-8 text-center min-h-[3rem]">
                        &quot;{voiceTranscript}&quot;
                    </p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setVoiceModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                    <button onClick={confirmVoiceOrder} disabled={isListening} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">Add to Order</button>
                </div>
            </Modal>

            <Modal isOpen={isClearCartModalOpen} onClose={() => setClearCartModalOpen(false)} title="Clear Cart?">
                <p className="text-slate-600 text-lg py-4">Are you sure you want to remove all items from the current order? This action cannot be undone.</p>
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setClearCartModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                    <button onClick={() => { clearCart(); setClearCartModalOpen(false); }} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium">Clear Cart</button>
                </div>
            </Modal>
        </div>
    );
}
