'use client';

import { useMemo } from 'react';
import { usePosStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, ArrowLeft, DollarSign, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Target, Activity,
  PieChart as PieChartIcon, Zap
} from 'lucide-react';
import { format, parseISO, startOfDay, subDays, isSameDay } from 'date-fns';
import clsx from 'clsx';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalysisPage() {
  const router = useRouter();
  const { orders, expenses } = usePosStore();

  const today = startOfDay(new Date());

  // Calculations
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Daily Trend Data
  const trendData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = startOfDay(subDays(today, 13 - i));
      const dayOrders = orders.filter(o => isSameDay(startOfDay(parseISO(o.date)), d));
      const rev = dayOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        date: format(d, 'MMM dd'),
        revenue: rev,
        orders: dayOrders.length
      };
    });
  }, [orders, today]);

  // Category Breakdown
  const categoryData = useMemo(() => {
    const categories = new Map<string, number>();
    orders.forEach(o => {
      o.items.forEach(i => {
        categories.set(i.category, (categories.get(i.category) || 0) + (i.price * i.quantity));
      });
    });
    return Array.from(categories.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  // Expense Breakdown
  const expenseBreakdown = useMemo(() => {
    const categories = new Map<string, number>();
    expenses.forEach(e => {
      categories.set(e.category, (categories.get(e.category) || 0) + e.amount);
    });
    return Array.from(categories.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">POSLY Analysis</h1>
              <p className="text-xs font-medium text-slate-500">Intelligent Business Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
            <Zap className="w-4 h-4 fill-current" />
            Live Analytics
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`₹${totalRevenue.toLocaleString()}`} 
            change="+12.5%" 
            isPositive={true}
            icon={<DollarSign className="w-6 h-6" />}
            color="blue"
          />
          <StatCard 
            title="Net Profit" 
            value={`₹${netProfit.toLocaleString()}`} 
            change="+8.2%" 
            isPositive={true}
            icon={<Activity className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard 
            title="Profit Margin" 
            value={`${profitMargin.toFixed(1)}%`} 
            change="-2.1%" 
            isPositive={false}
            icon={<Target className="w-6 h-6" />}
            color="indigo"
          />
          <StatCard 
            title="Total Sales" 
            value={orders.length.toString()} 
            change="+18%" 
            isPositive={true}
            icon={<ShoppingBag className="w-6 h-6" />}
            color="amber"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Revenue Trend */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold">Revenue Performance</h3>
                <p className="text-sm text-slate-500">Daily revenue trends for the last 14 days</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-md text-xs font-semibold text-slate-600 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Revenue
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-md flex flex-col">
            <div className="mb-8">
              <h3 className="text-lg font-bold">Sales by Category</h3>
              <p className="text-sm text-slate-500">Distribution of revenue across menu types</p>
            </div>
            <div className="flex-1 min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <PieChartIcon className="w-8 h-8 text-slate-300 mx-auto" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {categoryData.slice(0, 4).map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Analysis */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
            <h3 className="text-lg font-bold mb-6">Expense Structure</h3>
            <div className="space-y-6">
              {expenseBreakdown.map((exp, i) => {
                const percentage = (exp.value / totalExpenses) * 100;
                return (
                  <div key={exp.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-slate-700">{exp.name}</span>
                      <span className="text-sm font-black text-slate-900">₹{exp.value.toLocaleString()} <span className="text-slate-400 font-medium ml-1">({percentage.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Efficiency & Velocity */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <TrendingUp className="w-48 h-48" />
            </div>
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-indigo-200">Business Velocity</h3>
                <p className="text-sm text-indigo-300/60 mt-2">Calculated operational efficiency metrics</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Avg Transaction</p>
                  <p className="text-3xl font-black">₹{(totalRevenue / orders.length || 0).toFixed(0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Break-even Ratio</p>
                  <p className="text-3xl font-black">{(totalRevenue / (totalExpenses || 1)).toFixed(2)}x</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Profit per Sale</p>
                  <p className="text-3xl font-black text-emerald-400">₹{(netProfit / orders.length || 0).toFixed(0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Growth Factor</p>
                  <p className="text-3xl font-black text-blue-400">1.44</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button className="flex items-center gap-2 text-indigo-300 font-bold hover:text-white transition-colors group/btn">
                  Generate Full Audit Report
                  <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col space-y-4 group hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className={clsx("p-3 rounded-2xl border transition-transform group-hover:scale-110 duration-500", colorMap[color])}>
          {icon}
        </div>
        <div className={clsx(
          "flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full",
          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
