'use client';

import Link from 'next/link';
import { 
  BarChart3, 
  LayoutDashboard, 
  Monitor, 
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';

const cards = [
  {
    title: 'Admin Panel',
    description: 'Manage inventory, employees, and system configurations.',
    href: '/admin',
    icon: LayoutDashboard,
    color: 'from-blue-600 to-indigo-700',
    lightColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    features: ['Inventory Mgmt', 'Staff Tracking', 'Expenses']
  },
  {
    title: 'Deep Analysis',
    description: 'Advanced financial insights and sales performance metrics.',
    href: '/analysis',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-700',
    lightColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    features: ['Profit Reports', 'Trend Analysis', 'Sales Map']
  },
  {
    title: 'POS Screen',
    description: 'Quick order processing and sleek checkout experience.',
    href: '/pos',
    icon: Monitor,
    color: 'from-amber-500 to-orange-600',
    lightColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    features: ['Fast Checkout', 'GST Billing', 'Live Sync']
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 sm:p-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[60%] -right-[5%] w-[35%] h-[35%] bg-amber-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl w-full space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next-Gen Point of Sale
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
            Control your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">business ecosystem</span> from one place.
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Navigate through specialized modules designed for precision, speed, and deep understanding.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {cards.map((card, idx) => (
            <Link 
              key={card.title} 
              href={card.href}
              className="group relative flex flex-col bg-white rounded-[2.5rem] border border-slate-200/60 p-8 transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(30,41,59,0.12)] hover:-translate-y-2 hover:border-blue-200 overflow-hidden animate-in fade-in slide-in-from-bottom-12"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              {/* Highlight background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 -mr-12 -mt-12 rounded-full blur-2xl`} />
              
              <div className={`w-16 h-16 rounded-2xl ${card.lightColor} ${card.iconColor} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                <card.icon className="w-8 h-8" />
              </div>

              <div className="space-y-4 flex-1">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {card.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {card.features.map(feat => (
                    <span key={feat} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 tracking-wider uppercase group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <div className={`flex items-center gap-1 font-bold text-sm ${card.iconColor} tracking-wide group-hover:gap-2 transition-all`}>
                  Launch Module
                  <ChevronRight className="w-4 h-4" />
                </div>
                
                <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${card.color} w-0 group-hover:w-full transition-all duration-700 ease-out`} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-12 flex flex-col md:flex-row items-center justify-center gap-8 border-t border-slate-200/50 text-slate-400 font-medium text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            Real-time analytics active
          </div>
          <div className="hidden md:block w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <Settings className="w-4 h-4" />
            </div>
            Version 0.2.0-beta
          </div>
        </div>
      </div>
    </main>
  );
}
