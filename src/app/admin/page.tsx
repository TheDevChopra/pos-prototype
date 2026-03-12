'use client';

import { useState, useMemo } from 'react';
import { usePosStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, ShoppingBag, DollarSign, Package, Coffee, Settings,
    LogOut, Plus, AlertCircle, Edit, Trash2, Receipt
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import clsx from 'clsx';
import { Modal } from '@/components/Modal';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

type Tab = 'overview' | 'inventory' | 'menu' | 'expenses' | 'sales';

export default function AdminDashboard() {
    const router = useRouter();
    const {
        orders, inventory, menuItems, purchases, addPurchase,
        addMenuItem, updateMenuItem, expenses, addExpense,
        updateInventoryStock, addInventoryItem, updateExpense, removeExpense,
        addOrder, updateOrder, removeOrder
    } = usePosStore();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

    const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
    const [isMenuModalOpen, setMenuModalOpen] = useState(false);
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [isInventoryUpdateModalOpen, setInventoryUpdateModalOpen] = useState(false);
    const [isInventoryItemModalOpen, setInventoryItemModalOpen] = useState(false);
    const [isOrderModalOpen, setOrderModalOpen] = useState(false);

    const [expenseForm, setExpenseForm] = useState({ id: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], isEdit: false });
    const [menuForm, setMenuForm] = useState({ id: '', name: '', category: 'Drinks', price: '', isEdit: false });
    const [purchaseForm, setPurchaseForm] = useState({ itemId: '', supplier: '', quantity: '', cost: '', date: new Date().toISOString().split('T')[0] });
    const [inventoryUpdateForm, setInventoryUpdateForm] = useState({ itemId: '', actionType: 'Add Stock', quantity: '' });
    const [inventoryItemForm, setInventoryItemForm] = useState({ id: '', name: '', unit: 'kg', initialStock: '0', lowStock: '5', isEdit: false });
    const [orderForm, setOrderForm] = useState({ id: '', total: '', date: new Date().toISOString().split('T')[0], isEdit: false });

    const handleExpenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (expenseForm.isEdit && expenseForm.id) {
            updateExpense(expenseForm.id, {
                category: expenseForm.category,
                amount: Number(expenseForm.amount),
                date: new Date(expenseForm.date).toISOString()
            });
        } else {
            addExpense({
                id: `exp_${Date.now()}`,
                category: expenseForm.category,
                amount: Number(expenseForm.amount),
                date: new Date(expenseForm.date).toISOString()
            });
        }
        setExpenseModalOpen(false);
        setExpenseForm({ id: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], isEdit: false });
    };

    const handleMenuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (menuForm.isEdit && menuForm.id) {
            updateMenuItem(menuForm.id, {
                name: menuForm.name,
                category: menuForm.category,
                price: Number(menuForm.price)
            });
        } else {
            addMenuItem({
                id: `menu_${Date.now()}`,
                name: menuForm.name,
                category: menuForm.category,
                price: Number(menuForm.price),
                enabled: true
            });
        }
        setMenuModalOpen(false);
        setMenuForm({ id: '', name: '', category: 'Drinks', price: '', isEdit: false });
    };

    const handlePurchaseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addPurchase({
            id: `pur_${Date.now()}`,
            inventoryItemId: purchaseForm.itemId,
            supplier: purchaseForm.supplier,
            quantity: Number(purchaseForm.quantity),
            cost: Number(purchaseForm.cost),
            date: new Date(purchaseForm.date).toISOString()
        });
        setPurchaseModalOpen(false);
        setPurchaseForm({ itemId: '', supplier: '', quantity: '', cost: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleInventoryUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const item = inventory.find(i => i.id === inventoryUpdateForm.itemId);
        if (!item) return;
        const qty = Number(inventoryUpdateForm.quantity);
        let newStock = item.currentStock;
        if (inventoryUpdateForm.actionType === 'Add Stock') newStock += qty;
        else if (inventoryUpdateForm.actionType === 'Reduce Stock') newStock = Math.max(0, newStock - qty);
        else newStock = qty; // Adjustment

        updateInventoryStock(item.id, newStock);
        setInventoryUpdateModalOpen(false);
    };

    const handleInventoryItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addInventoryItem({
            id: `inv_${Date.now()}`,
            name: inventoryItemForm.name,
            currentStock: Number(inventoryItemForm.initialStock),
            lowStockThreshold: Number(inventoryItemForm.lowStock),
            unit: inventoryItemForm.unit
        });
        setInventoryItemModalOpen(false);
        setInventoryItemForm({ id: '', name: '', unit: 'kg', initialStock: '0', lowStock: '5', isEdit: false });
    };

    const handleOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (orderForm.isEdit && orderForm.id) {
            updateOrder(orderForm.id, {
                total: Number(orderForm.total),
                date: new Date(orderForm.date).toISOString()
            });
        } else {
            addOrder({
                id: `ord_${Date.now()}`,
                items: [],
                subtotal: Number(orderForm.total) / 1.05, // Rough estimate
                gst: Number(orderForm.total) * 0.05,
                total: Number(orderForm.total),
                date: new Date(orderForm.date).toISOString()
            });
        }
        setOrderModalOpen(false);
        setOrderForm({ id: '', total: '', date: new Date().toISOString().split('T')[0], isEdit: false });
    };

    // --- DERIVED ANALYTICS DATA ---
    const today = startOfDay(new Date());

    const todayOrders = useMemo(() => orders.filter(o => isSameDay(parseISO(o.date), today)), [orders, today]);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalItemsSold = todayOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const aov = todayOrders.length > 0 ? (todayRevenue / todayOrders.length) : 0;

    const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
    const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const estimatedProfit = totalRevenue - totalExpenses;

    // Revenue Chart Data
    const chartData = useMemo(() => {
        const days = timeRange === 'daily' ? 1 : timeRange === 'weekly' ? 7 : 30;
        return Array.from({ length: days }).map((_, i) => {
            const d = startOfDay(subDays(today, days - 1 - i));
            const dayOrders = orders.filter(o => isSameDay(startOfDay(parseISO(o.date)), d));
            return {
                name: format(d, days > 7 ? 'dd MMM' : 'EEE'),
                revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
                orders: dayOrders.length
            };
        });
    }, [orders, timeRange, today]);

    // Top Products Data
    const topProducts = useMemo(() => {
        const counts = new Map<string, { name: string, qty: number, rev: number }>();
        todayOrders.forEach(o => {
            o.items.forEach(i => {
                const existing = counts.get(i.id) || { name: i.name, qty: 0, rev: 0 };
                counts.set(i.id, { ...existing, qty: existing.qty + i.quantity, rev: existing.rev + (i.price * i.quantity) });
            });
        });
        return Array.from(counts.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [todayOrders]);

    const lowStockItems = inventory.filter(i => i.currentStock <= i.lowStockThreshold);

    // Protection Removed

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r shadow-sm flex flex-col z-10">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
                        POSLY Admin
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">POSLY Central Ecosystem</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {(['overview', 'inventory', 'menu', 'expenses', 'sales'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium capitalize",
                                activeTab === tab
                                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100 ring-1 ring-blue-500/20"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {tab === 'overview' && <TrendingUp className="w-5 h-5" />}
                            {tab === 'inventory' && <Package className="w-5 h-5" />}
                            {tab === 'menu' && <Coffee className="w-5 h-5" />}
                            {tab === 'expenses' && <Receipt className="w-5 h-5" />}
                            {tab === 'sales' && <ShoppingBag className="w-5 h-5" />}
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t space-y-2">
                    <button
                        onClick={() => router.push('/settings')}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-3 rounded-xl transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        System Settings
                    </button>
                    <button
                        onClick={() => router.push('/pos')}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
                    >
                        <Coffee className="w-5 h-5" />
                        POS Screen
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
                                <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening today.</p>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <DollarSign className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Today&apos;s Revenue</p>
                                    <p className="text-2xl font-black text-slate-800">₹{todayRevenue.toFixed(0)}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <ShoppingBag className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Orders Today</p>
                                    <p className="text-2xl font-black text-slate-800">{todayOrders.length}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Average Order Value</p>
                                    <p className="text-2xl font-black text-slate-800">₹{aov.toFixed(0)}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <Coffee className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Items Sold</p>
                                    <p className="text-2xl font-black text-slate-800">{totalItemsSold}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {['daily', 'weekly', 'monthly'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTimeRange(t as any)}
                                                className={clsx(
                                                    "px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors",
                                                    timeRange === t ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                formatter={(value: any) => [`₹${Number(value).toFixed(0)}`, 'Revenue']}
                                            />
                                            <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Top Selling Today</h3>
                                {topProducts.length > 0 ? (
                                    <div className="space-y-4">
                                        {topProducts.map((p, i) => (
                                            <div key={p.name} className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-700 leading-tight">{p.name}</p>
                                                    <p className="text-xs text-slate-500">{p.qty} items sold</p>
                                                </div>
                                                <div className="font-bold text-slate-800">
                                                    ₹{p.rev}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-slate-400">
                                        No sales yet today
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Low Stock Alerts Mini */}
                        {lowStockItems.length > 0 && (
                            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-base font-bold text-red-800">Low Stock Alerts</h3>
                                    <div className="mt-2 flex gap-3 flex-wrap">
                                        {lowStockItems.map(item => (
                                            <span key={item.id} className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-red-100">
                                                {item.name}: {item.currentStock} {item.unit} left
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Financial Summary */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-lg overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <DollarSign className="w-48 h-48" />
                            </div>
                            <h3 className="text-xl font-bold mb-6 text-slate-200 relative z-10">Overall Financial Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                                <div>
                                    <p className="text-slate-400 font-medium">Total Revenue (All Time)</p>
                                    <p className="text-3xl font-black mt-2">₹{totalRevenue.toFixed(0)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-medium">Recorded Expenses</p>
                                    <p className="text-3xl font-black mt-2">₹{totalExpenses.toFixed(0)}</p>
                                </div>
                                <div className="md:border-l md:border-slate-700 md:pl-8">
                                    <p className="text-indigo-300 font-medium">Estimated Profit</p>
                                    <p className="text-4xl font-black mt-2 text-indigo-400 flex items-center gap-2">
                                        ₹{estimatedProfit.toFixed(0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Inventory Management</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setInventoryItemForm({ id: '', name: '', unit: 'kg', initialStock: '0', lowStock: '5', isEdit: false }); setInventoryItemModalOpen(true); }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add New Item
                                </button>
                                <button
                                    onClick={() => setPurchaseModalOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                                >
                                    <Package className="w-5 h-5" />
                                    Add Purchase Entry
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Item Name</th>
                                        <th className="p-4 font-semibold text-slate-600">Current Stock</th>
                                        <th className="p-4 font-semibold text-slate-600">Unit</th>
                                        <th className="p-4 font-semibold text-slate-600">Status</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inventory.map(item => {
                                        const isLow = item.currentStock <= item.lowStockThreshold;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                                <td className="p-4 font-bold text-slate-700">{item.currentStock}</td>
                                                <td className="p-4 text-slate-500">{item.unit}</td>
                                                <td className="p-4">
                                                    {isLow ? (
                                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                                                            Good
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setInventoryUpdateForm({ itemId: item.id, actionType: 'Reduce Stock', quantity: '1' }); setInventoryUpdateModalOpen(true); }}
                                                        title="Use / Record Consumption"
                                                        className="p-2 text-amber-500 hover:text-amber-600 transition-colors bg-white hover:bg-amber-50 rounded-lg shadow-sm border border-slate-100">
                                                        <Coffee className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setInventoryUpdateForm({ itemId: item.id, actionType: 'Set Exact Quantity', quantity: String(item.currentStock) }); setInventoryUpdateModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-100">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MENU TAB */}
                {activeTab === 'menu' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Menu Editor</h2>
                            <button
                                onClick={() => { setMenuForm({ id: '', name: '', category: 'Drinks', price: '', isEdit: false }); setMenuModalOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Item
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Name</th>
                                        <th className="p-4 font-semibold text-slate-600">Category</th>
                                        <th className="p-4 font-semibold text-slate-600">Price</th>
                                        <th className="p-4 font-semibold text-slate-600">Status</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {menuItems.slice(0, 15).map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                            <td className="p-4 text-slate-500">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-slate-700">₹{item.price}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => updateMenuItem(item.id, { enabled: !item.enabled })}
                                                    className={clsx(
                                                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                                        item.enabled ? "bg-blue-600" : "bg-slate-300"
                                                    )}
                                                >
                                                    <span className={clsx(
                                                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                                                        item.enabled ? "translate-x-4" : "translate-x-1"
                                                    )} />
                                                </button>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => { setMenuForm({ id: item.id, name: item.name, category: item.category, price: String(item.price), isEdit: true }); setMenuModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-100">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 border-t">
                                Showing top 15 items. (Add pagination here)
                            </div>
                        </div>
                    </div>
                )}
                {/* EXPENSES TAB */}
                {activeTab === 'expenses' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Expense Tracking</h2>
                            <button
                                onClick={() => { setExpenseForm({ id: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], isEdit: false }); setExpenseModalOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Add Expense
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Category</th>
                                        <th className="p-4 font-semibold text-slate-600">Amount</th>
                                        <th className="p-4 font-semibold text-slate-600">Date Logged</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {expenses.map(expense => (
                                        <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800">{expense.category}</td>
                                            <td className="p-4 font-bold text-slate-700">₹{expense.amount}</td>
                                            <td className="p-4 text-slate-500">{format(parseISO(expense.date), 'dd MMM yyyy')}</td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => { setExpenseForm({ id: expense.id, category: expense.category, amount: String(expense.amount), date: new Date(expense.date).toISOString().split('T')[0], isEdit: true }); setExpenseModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-100">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => removeExpense(expense.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-white hover:bg-red-50 rounded-lg shadow-sm border border-slate-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                                No expenses recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* SALES TAB */}
                {activeTab === 'sales' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Sales Records</h2>
                            <button
                                onClick={() => { setOrderForm({ id: '', total: '', date: new Date().toISOString().split('T')[0], isEdit: false }); setOrderModalOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Add Manual Sale
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Order ID</th>
                                        <th className="p-4 font-semibold text-slate-600">Date</th>
                                        <th className="p-4 font-semibold text-slate-600">Items</th>
                                        <th className="p-4 font-semibold text-slate-600">Total</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.slice(0, 50).map(order => (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-blue-600">#{order.id.replace('ord_', '')}</td>
                                            <td className="p-4 text-slate-500">{format(parseISO(order.date), 'dd MMM yyyy, HH:mm')}</td>
                                            <td className="p-4 text-slate-600">
                                                {order.items.length > 0 ? `${order.items.length} items` : 'Manual Entry'}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">₹{order.total.toFixed(2)}</td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => { setOrderForm({ id: order.id, total: String(order.total), date: new Date(order.date).toISOString().split('T')[0], isEdit: true }); setOrderModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-100">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => removeOrder(order.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-white hover:bg-red-50 rounded-lg shadow-sm border border-slate-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 border-t">
                                Showing last 50 sales records.
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Inventory Item Modal */}
            <Modal isOpen={isInventoryItemModalOpen} onClose={() => setInventoryItemModalOpen(false)} title="Add New Inventory Item">
                <form onSubmit={handleInventoryItemSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                        <input type="text" required value={inventoryItemForm.name} onChange={e => setInventoryItemForm({ ...inventoryItemForm, name: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Full Cream Milk" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                            <input type="text" required value={inventoryItemForm.unit} onChange={e => setInventoryItemForm({ ...inventoryItemForm, unit: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="kg, L, pcs..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                            <input type="number" required value={inventoryItemForm.initialStock} onChange={e => setInventoryItemForm({ ...inventoryItemForm, initialStock: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Threshold</label>
                        <input type="number" required value={inventoryItemForm.lowStock} onChange={e => setInventoryItemForm({ ...inventoryItemForm, lowStock: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setInventoryItemModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium">Create Item</button>
                    </div>
                </form>
            </Modal>

            {/* Order Modal */}
            <Modal isOpen={isOrderModalOpen} onClose={() => setOrderModalOpen(false)} title={orderForm.isEdit ? "Edit Sales Record" : "Add Manual Sale Record"}>
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (₹)</label>
                        <input type="number" required value={orderForm.total} onChange={e => setOrderForm({ ...orderForm, total: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                        <input type="date" required value={orderForm.date} onChange={e => setOrderForm({ ...orderForm, date: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <p className="text-xs text-slate-500">Note: Manual entries will not have itemized breakdowns in receipts.</p>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setOrderModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">{orderForm.isEdit ? 'Update Record' : 'Save Record'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} title={expenseForm.isEdit ? "Edit Expense" : "Log New Expense"}>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option>Rent</option><option>Utilities</option><option>Payroll</option><option>Supplies</option><option>Marketing</option><option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                        <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setExpenseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">{expenseForm.isEdit ? 'Save Changes' : 'Save Expense'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isMenuModalOpen} onClose={() => setMenuModalOpen(false)} title={menuForm.isEdit ? "Edit Menu Item" : "Add Menu Item"}>
                <form onSubmit={handleMenuSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                        <input type="text" required value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select value={menuForm.category} onChange={e => setMenuForm({ ...menuForm, category: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                                <option>Drinks</option><option>Food</option><option>Desserts</option><option>Merch</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                            <input type="number" required value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setMenuModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">{menuForm.isEdit ? 'Save Changes' : 'Add Item'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isInventoryUpdateModalOpen} onClose={() => setInventoryUpdateModalOpen(false)} title="Quick Edit Stock">
                <form onSubmit={handleInventoryUpdateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
                        <select required value={inventoryUpdateForm.itemId} onChange={e => setInventoryUpdateForm({ ...inventoryUpdateForm, itemId: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Select Item...</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Cur: {i.currentStock} {i.unit})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
                        <select value={inventoryUpdateForm.actionType} onChange={e => setInventoryUpdateForm({ ...inventoryUpdateForm, actionType: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option>Add Stock</option><option>Reduce Stock</option><option>Set Exact Quantity</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                        <input type="number" required value={inventoryUpdateForm.quantity} onChange={e => setInventoryUpdateForm({ ...inventoryUpdateForm, quantity: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setInventoryUpdateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">Update Stock</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPurchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} title="Add Purchase Record">
                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item to Restock</label>
                        <select required value={purchaseForm.itemId} onChange={e => setPurchaseForm({ ...purchaseForm, itemId: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Select Item...</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                            <input type="text" required value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input type="date" required value={purchaseForm.date} onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 border-none outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Added</label>
                            <input type="number" required value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Cost (₹)</label>
                            <input type="number" required value={purchaseForm.cost} onChange={e => setPurchaseForm({ ...purchaseForm, cost: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setPurchaseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">Record</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
