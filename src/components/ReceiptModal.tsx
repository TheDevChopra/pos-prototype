import React, { useRef } from 'react';
import { usePosStore, CartItem } from '@/lib/store';
import { format } from 'date-fns';
import { X, Printer } from 'lucide-react';

interface ReceiptModalProps {
    onClose: () => void;
    onPrintComplete: () => void;
    cart: CartItem[];
    subtotal: number;
    gst: number;
    total: number;
}

export function ReceiptModal({ onClose, onPrintComplete, cart, subtotal, gst, total }: ReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const now = new Date();

    const handlePrint = () => {
        // A simple browser print
        window.print();
        // In a real POS we might use a special thermal printing library or API here
        onPrintComplete();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Printer className="w-5 h-5 text-blue-600" />
                        Receipt Preview
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Receipt content optimized for 80mm thermal printers */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center print:bg-white print:p-0">
                    <div
                        ref={receiptRef}
                        className="w-[300px] bg-white text-black font-mono text-sm leading-tight p-4 shadow-sm print:shadow-none print:w-[80mm]"
                    >
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold mb-1">SHAKE ERA</h1>
                            <p className="text-xs">Invoice #{Math.floor(1000 + Math.random() * 9000)}</p>
                            <p className="text-xs">{format(now, 'dd MMM yyyy, hh:mm a')}</p>
                        </div>

                        <div className="border-t border-b border-dashed border-slate-300 py-2 mb-4">
                            <div className="flex justify-between font-bold mb-2">
                                <span>Item</span>
                                <span>Amt</span>
                            </div>
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between mb-1">
                                    <div className="flex-1 pr-2">
                                        <div>{item.name}</div>
                                        <div className="text-xs text-slate-500">x{item.quantity}  ₹{item.price}</div>
                                    </div>
                                    <div>₹{item.price * item.quantity}</div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1 mb-6">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            {gst > 0 && (
                                <div className="flex justify-between">
                                    <span>GST (5%)</span>
                                    <span>₹{gst.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed border-slate-300 mt-2">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="text-center text-xs mt-8">
                            <p>Thank you for visiting.</p>
                            <p>Have a nice day!</p>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="p-4 border-t bg-slate-50 flex gap-3 print:hidden">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-600 bg-white border hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Printer className="w-5 h-5" />
                        Print
                    </button>
                </div>
            </div>

            {/* Hide surrounding UI when printing */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .fixed * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            height: auto;
            background: white !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
