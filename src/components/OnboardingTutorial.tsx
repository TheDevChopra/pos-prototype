'use client';

import { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import clsx from 'clsx';

const steps = [
    {
        title: 'Welcome to Shake Era POS! 👋',
        description: 'Let us show you how simple it is to run your business with this demo. Takes only 30 seconds.',
    },
    {
        title: 'How to Create an Order',
        description: 'Select a category on the left, then click on any menu item in the center to add it to your order cart.',
    },
    {
        title: 'How to Print Bills',
        description: 'Once all items are added, click the "Print Bill" button at the bottom right. It will generate an 80mm thermal receipt preview.',
    },
    {
        title: 'How to View Reports',
        description: 'Click on "Dashboard" in the bottom left corner to access the Admin Panel. There you can see real-time revenue analytics and interactive Recharts graphs.',
    },
    {
        title: 'How to Add Inventory Purchases',
        description: 'In the Admin Dashboard, click the "Inventory" tab and use the "Add Purchase Entry" button to update your stock.',
    }
];

export function OnboardingTutorial() {
    const { tutorialCompleted, completeTutorial } = usePosStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [isHiding, setIsHiding] = useState(false);

    if (tutorialCompleted) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finish();
        }
    };

    const finish = () => {
        setIsHiding(true);
        setTimeout(() => {
            completeTutorial();
        }, 300); // Wait for transition
    };

    return (
        <div className={clsx(
            "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300",
            isHiding ? "opacity-0" : "opacity-100"
        )}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative transform transition-transform duration-300 ease-out scale-100">
                <button
                    onClick={finish}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                    <Sparkles className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-3 leading-tight">
                    {steps[currentStep].title}
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed mb-8">
                    {steps[currentStep].description}
                </p>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "h-2 rounded-full transition-all duration-300",
                                i === currentStep ? "w-8 bg-blue-600" : "w-2 bg-slate-200"
                            )}
                        />
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={finish}
                        className="px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Skip Tour
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {currentStep === steps.length - 1 ? "Let's Start" : "Next"}
                        {currentStep < steps.length - 1 && <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
