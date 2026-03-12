'use client';

import { useState, useMemo } from 'react';
import { usePosStore, Employee, SystemLog, ServiceUsage } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import {
    Settings2, LogOut, ArrowLeft,
    MessageSquare, Smartphone, Cloud, ShoppingCart, BarChart3, Receipt, IndianRupee,
    TrendingUp, Activity, Users, Package, DollarSign, Plus, Edit, Trash2, HeartPulse, Server
} from 'lucide-react';
import clsx from 'clsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, parseISO, subDays, startOfDay, isSameDay } from 'date-fns';

type Tab = 'analytics' | 'sales' | 'profit' | 'inventory' | 'employees' | 'services' | 'health';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export default function SettingsDashboard() {
    const router = useRouter();
    const {
        role, setRole, services, toggleService, serviceUsages,
        orders, expenses, addExpense, updateExpense, removeExpense,
        inventory, addPurchase, updateInventoryStock,
        employees, addEmployee,
        systemLogs
    } = usePosStore();

    const [activeTab, setActiveTab] = useState<Tab>('analytics');

    // Modals state
    const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
    const [isInventoryUpdateModalOpen, setInventoryUpdateModalOpen] = useState(false);
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [isNewItemModalOpen, setNewItemModalOpen] = useState(false);
    const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
    const [isServiceModalOpen, setServiceModalOpen] = useState(false);
    const [serviceToToggle, setServiceToToggle] = useState<string | null>(null);

    // Form states
    const [expenseForm, setExpenseForm] = useState({ id: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], isEdit: false });
    const [employeeForm, setEmployeeForm] = useState({ name: '', role: 'Cashier', shift: 'Morning', status: 'Active' as const });
    const [inventoryUpdateForm, setInventoryUpdateForm] = useState({ itemId: '', actionType: 'Add Stock', quantity: '' });
    const [purchaseForm, setPurchaseForm] = useState({ itemId: '', supplier: '', quantity: '', cost: '', date: new Date().toISOString().split('T')[0] });
    const [newItemForm, setNewItemForm] = useState({ name: '', sku: '', currentStock: '', lowStockThreshold: '', unit: 'kg' });

    // Protection (moved down to avoid conditional hooks)

    const today = startOfDay(new Date());

    // --- DERIVED METRICS ---
    const todayOrders = useMemo(() => orders.filter(o => isSameDay(parseISO(o.date), today)), [orders, today]);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalItemsSold = todayOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const aov = todayOrders.length > 0 ? (todayRevenue / todayOrders.length) : 0;

    const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
    const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const estimatedProfit = totalRevenue - totalExpenses;

    const activeServicesCount = services.filter(s => s.enabled).length;
    const estimatedMonthlyCost = services.filter(s => s.enabled).reduce((acc, s) => acc + s.estimatedMonthlyCost, 0);

    // Analytics Chart Data
    const revenueLineData = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = startOfDay(subDays(today, 6 - i));
            const dayOrders = orders.filter(o => isSameDay(startOfDay(parseISO(o.date)), d));
            return {
                name: format(d, 'EEE'),
                revenue: dayOrders.reduce((sum, o) => sum + o.total, 0)
            };
        });
    }, [orders, today]);

    const salesByCategoryData = useMemo(() => {
        const cats = new Map<string, number>();
        orders.forEach(o => o.items.forEach(i => {
            cats.set(i.category, (cats.get(i.category) || 0) + (i.price * i.quantity));
        }));
        return Array.from(cats.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [orders]);

    // Handlers
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

    const handleEmployeeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addEmployee({
            id: `emp_${Date.now()}`,
            name: employeeForm.name,
            role: employeeForm.role,
            shift: employeeForm.shift,
            ordersHandled: 0,
            status: employeeForm.status
        });
        setEmployeeModalOpen(false);
        setEmployeeForm({ name: '', role: 'Cashier', shift: 'Morning', status: 'Active' });
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

    const handleNewItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        usePosStore.getState().addInventoryItem({
            id: `inv_${Date.now()}`,
            name: newItemForm.name,
            currentStock: Number(newItemForm.currentStock),
            lowStockThreshold: Number(newItemForm.lowStockThreshold),
            unit: newItemForm.unit
        });
        setNewItemModalOpen(false);
        setNewItemForm({ name: '', sku: '', currentStock: '', lowStockThreshold: '', unit: 'kg' });
    };

    const confirmServiceToggle = () => {
        if (serviceToToggle) {
            toggleService(serviceToToggle);
        }
        setServiceModalOpen(false);
        setServiceToToggle(null);
    };

    const openServiceModal = (id: string) => {
        setServiceToToggle(id);
        const srv = services.find(s => s.id === id);
        if (!srv?.enabled) {
            setServiceModalOpen(true); // Only conf modal when enabling
        } else {
            toggleService(id); // Disable immediately
        }
    };

    // Protection removed for PIN-less use

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col z-10 shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                        <Activity className="w-6 h-6 text-indigo-500" />
                        BI Operations
                    </h1>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-semibold">Single Store Management</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {(['analytics', 'sales', 'profit', 'inventory', 'employees', 'services', 'health'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium shadow-sm transition-all capitalize",
                                activeTab === tab
                                    ? "bg-indigo-600 text-white shadow-indigo-500/20"
                                    : "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            {tab === 'analytics' && <BarChart3 className={clsx("w-5 h-5", activeTab === tab ? "text-indigo-200" : "")} />}
                            {tab === 'sales' && <ShoppingCart className={clsx("w-5 h-5", activeTab === tab ? "text-indigo-200" : "")} />}
                            {tab === 'profit' && <DollarSign className={clsx("w-5 h-5", activeTab === tab ? "text-indigo-200" : "")} />}
                            {tab === 'inventory' && <Package className={clsx("w-5 h-5", activeTab === tab ? "text-indigo-200" : "")} />}
                            {tab === 'employees' && <Users className={clsx("w-5 h-5", activeTab === tab ? "text-indigo-200" : "")} />}
                            {tab === 'services' && <Settings2 className={clsx("w-5 h-5", activeTab === tab ? "text-indigo-200" : "")} />}
                            {tab === 'health' && <HeartPulse className={clsx("w-5 h-5", activeTab === tab ? "text-indigo-200" : "")} />}
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button
                        onClick={() => { setRole('admin'); router.push('/admin'); }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to POS/Admin
                    </button>
                    <button
                        onClick={() => { setRole(null); router.push('/login'); }}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 relative">

                {/* 1. ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Business Intelligence</h2>
                            <p className="text-slate-500 mt-1">High-level operational metrics.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div><p className="text-sm font-medium text-slate-500">Today&apos;s Revenue</p><p className="text-2xl font-black text-slate-800">₹{todayRevenue.toFixed(0)}</p></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div><p className="text-sm font-medium text-slate-500">Orders Today</p><p className="text-2xl font-black text-slate-800">{todayOrders.length}</p></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div><p className="text-sm font-medium text-slate-500">Avg Order Value</p><p className="text-2xl font-black text-slate-800">₹{aov.toFixed(0)}</p></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div><p className="text-sm font-medium text-slate-500">Total Items Sold</p><p className="text-2xl font-black text-slate-800">{totalItemsSold}</p></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Daily Revenue Chart (Last 7 Days)</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Category Distribution</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={salesByCategoryData.slice(0, 5)} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {salesByCategoryData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SALES OVERVIEW */}
                {activeTab === 'sales' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Sales Overview</h2>
                            <p className="text-slate-500 mt-1">Detailed history and breakdown.</p>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800">Recent Orders</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Order ID</th>
                                        <th className="p-4 font-semibold text-slate-600">Date</th>
                                        <th className="p-4 font-semibold text-slate-600">Items</th>
                                        <th className="p-4 font-semibold text-slate-600">GST</th>
                                        <th className="p-4 font-semibold text-slate-600">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.slice(0, 10).map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-indigo-600">#{o.id.split('_')[1]}</td>
                                            <td className="p-4 text-slate-500">{format(parseISO(o.date), 'dd MMM yyyy, p')}</td>
                                            <td className="p-4 text-slate-600">{o.items.reduce((s, i) => s + i.quantity, 0)} items</td>
                                            <td className="p-4 text-slate-500">₹{o.gst.toFixed(2)}</td>
                                            <td className="p-4 font-bold text-slate-800">₹{o.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. PROFIT & EXPENSES */}
                {activeTab === 'profit' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Profit & Expenses</h2>
                                <p className="text-slate-500 mt-1">Financial performance tracking.</p>
                            </div>
                            <button onClick={() => { setExpenseForm({ id: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], isEdit: false }); setExpenseModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm">
                                <Plus className="w-5 h-5" /> Add Expense
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <p className="text-slate-500 font-medium">Total Revenue</p>
                                <p className="text-3xl font-bold mt-2 text-slate-800">₹{totalRevenue.toFixed(0)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <p className="text-slate-500 font-medium">Total Expenses</p>
                                <p className="text-3xl font-bold mt-2 text-red-600">₹{totalExpenses.toFixed(0)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                                <p className="text-emerald-100 font-medium">Estimated Profit</p>
                                <div className="flex items-end gap-4 mt-2">
                                    <p className="text-4xl font-black">₹{estimatedProfit.toFixed(0)}</p>
                                    <p className="text-emerald-200 font-semibold mb-1 border bg-emerald-700/50 px-2 py-0.5 rounded-md">
                                        Margin: {((estimatedProfit / totalRevenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800">Logged Expenses</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Category</th>
                                        <th className="p-4 font-semibold text-slate-600">Amount</th>
                                        <th className="p-4 font-semibold text-slate-600">Date</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-slate-800 bg-slate-100/50 rounded-lg m-2 inline-block px-3 py-1">{e.category}</td>
                                            <td className="p-4 font-bold text-red-600">₹{e.amount}</td>
                                            <td className="p-4 text-slate-500">{format(parseISO(e.date), 'dd MMM yyyy')}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setExpenseForm({ id: e.id, category: e.category, amount: String(e.amount), date: new Date(e.date).toISOString().split('T')[0], isEdit: true }); setExpenseModalOpen(true); }} className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => removeExpense(e.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. STOCK / INVENTORY */}
                {activeTab === 'inventory' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Stock & Inventory</h2>
                                <p className="text-slate-500 mt-1">Manage supplies and stock limits.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setNewItemModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all text-sm">
                                    <Plus className="w-4 h-4" /> Add New Item
                                </button>
                                <button onClick={() => setPurchaseModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all text-sm">
                                    <Plus className="w-4 h-4" /> Add Purchase Entry
                                </button>
                                <button onClick={() => setInventoryUpdateModalOpen(true)} className="bg-white border hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm hover:shadow transition-all text-sm">
                                    <Edit className="w-4 h-4" /> Quick Edit Stock
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Item Name</th>
                                        <th className="p-4 font-semibold text-slate-600">Current Stock</th>
                                        <th className="p-4 font-semibold text-slate-600">Min. Stock</th>
                                        <th className="p-4 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inventory.map(item => {
                                        const isLow = item.currentStock <= item.lowStockThreshold;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                                <td className="p-4 text-slate-800 font-bold">{item.currentStock} {item.unit}</td>
                                                <td className="p-4 text-slate-500">{item.lowStockThreshold} {item.unit}</td>
                                                <td className="p-4 flex gap-2">
                                                    {isLow ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">Low Stock</span> : <span className="text-emerald-600 font-medium">Good</span>}
                                                    <button onClick={() => { setInventoryUpdateForm({ itemId: item.id, actionType: 'Set Exact', quantity: String(item.currentStock) }); setInventoryUpdateModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. EMPLOYEE TRACKING */}
                {activeTab === 'employees' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Employee Tracking</h2>
                                <p className="text-slate-500 mt-1">Monitor staff performance.</p>
                            </div>
                            <button onClick={() => setEmployeeModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm">
                                <Plus className="w-5 h-5" /> Add Employee
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-600">Name</th>
                                            <th className="p-4 font-semibold text-slate-600">Role</th>
                                            <th className="p-4 font-semibold text-slate-600">Shift</th>
                                            <th className="p-4 font-semibold text-slate-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {employees.map(emp => (
                                            <tr key={emp.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-bold text-slate-800">{emp.name}</td>
                                                <td className="p-4 text-slate-600">{emp.role}</td>
                                                <td className="p-4 text-slate-600">{emp.shift}</td>
                                                <td className="p-4">
                                                    <span className={clsx("px-2 py-1 rounded-md text-xs font-bold", emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{emp.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Orders Handled</h3>
                                <div className="space-y-4">
                                    {employees.map(e => (
                                        <div key={e.id} className="flex justify-between items-center">
                                            <span className="font-medium text-slate-600">{e.name}</span>
                                            <span className="bg-slate-100 px-3 py-1 rounded-full text-sm font-bold text-slate-700">{e.ordersHandled}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. SERVICES & BILLING (Existing integrated) */}
                {activeTab === 'services' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Services & Billing</h2>
                            <p className="text-slate-500 mt-1">Manage API integrations and external services.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                                <p className="text-sm font-medium text-slate-500">Active Services</p>
                                <p className="text-4xl font-black text-slate-800 tracking-tight">{activeServicesCount} Modules</p>
                            </div>
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-sm text-white">
                                <p className="text-indigo-100 font-medium">Est. Monthly Cost Summary</p>
                                <p className="text-4xl font-black mt-2">₹{estimatedMonthlyCost}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Service Usage Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {serviceUsages.map(u => (
                                    <div key={u.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                        <p className="text-slate-500 text-sm font-medium">{u.metricName}</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">{u.value} <span className="text-sm font-normal text-slate-400">Total</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {services.map(srv => (
                                    <div key={srv.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{srv.name}</h4>
                                            <p className="text-sm font-medium text-slate-500">{srv.costDescription}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {srv.enabled && <span className="text-sm font-semibold text-indigo-600">Est. ₹{srv.estimatedMonthlyCost}/mo</span>}
                                            <button
                                                onClick={() => openServiceModal(srv.id)}
                                                className={clsx(
                                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                                    srv.enabled ? "bg-indigo-600" : "bg-slate-300"
                                                )}
                                            >
                                                <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", srv.enabled ? "translate-x-6" : "translate-x-1")} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. SYSTEM HEALTH */}
                {activeTab === 'health' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">System Health</h2>
                            <p className="text-slate-500 mt-1">Technical monitoring and status logs.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                                <Server className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                                <p className="font-bold text-emerald-600">99.9%</p>
                                <p className="text-xs text-slate-500 font-medium">POS Uptime</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                                <HeartPulse className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                                <p className="font-bold text-emerald-600">Online</p>
                                <p className="text-xs text-slate-500 font-medium">Database</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                                <Receipt className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                                <p className="font-bold text-emerald-600">Connected</p>
                                <p className="text-xs text-slate-500 font-medium">Thermal Printer</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                                <Cloud className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                                <p className="font-bold text-blue-600">Synced</p>
                                <p className="text-xs text-slate-500 font-medium">Cloud Backup</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800">System Logs</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Time</th>
                                        <th className="p-4 font-semibold text-slate-600">Event</th>
                                        <th className="p-4 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {systemLogs.map(log => (
                                        <tr key={log.id}>
                                            <td className="p-4 text-slate-500 text-sm">{format(parseISO(log.time), 'dd MMM yyyy HH:mm')}</td>
                                            <td className="p-4 font-medium text-slate-800">{log.event}</td>
                                            <td className="p-4">
                                                <span className={clsx("px-2 py-1 rounded-md text-xs font-bold",
                                                    log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                        log.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                )}>{log.status.toUpperCase()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}

            {/* Expense Modal */}
            <Modal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} title={expenseForm.isEdit ? "Edit Expense" : "Add New Expense"}>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                            className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option>Rent</option><option>Electricity</option><option>Staff Salary</option><option>Raw Materials</option><option>Internet</option><option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                        <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setExpenseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
                            {expenseForm.isEdit ? 'Save Changes' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Employee Modal */}
            <Modal isOpen={isEmployeeModalOpen} onClose={() => setEmployeeModalOpen(false)} title="Add New Employee">
                <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input type="text" required value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select value={employeeForm.role} onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option>Cashier</option><option>Kitchen Staff</option><option>Manager</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                        <select value={employeeForm.shift} onChange={e => setEmployeeForm({ ...employeeForm, shift: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option>Morning</option><option>Evening</option><option>Night</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setEmployeeModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Add Employee</button>
                    </div>
                </form>
            </Modal>

            {/* Inventory Update Modal */}
            <Modal isOpen={isInventoryUpdateModalOpen} onClose={() => setInventoryUpdateModalOpen(false)} title="Quick Update Stock">
                <form onSubmit={handleInventoryUpdateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
                        <select required value={inventoryUpdateForm.itemId} onChange={e => setInventoryUpdateForm({ ...inventoryUpdateForm, itemId: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="">Select Item...</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Cur: {i.currentStock} {i.unit})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
                        <select value={inventoryUpdateForm.actionType} onChange={e => setInventoryUpdateForm({ ...inventoryUpdateForm, actionType: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option>Add Stock</option><option>Reduce Stock</option><option>Set Exact Quantity</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                        <input type="number" required value={inventoryUpdateForm.quantity} onChange={e => setInventoryUpdateForm({ ...inventoryUpdateForm, quantity: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setInventoryUpdateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Update Stock</button>
                    </div>
                </form>
            </Modal>

            {/* Purchase Modal */}
            <Modal isOpen={isPurchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} title="Add Purchase Record">
                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item to Restock</label>
                        <select required value={purchaseForm.itemId} onChange={e => setPurchaseForm({ ...purchaseForm, itemId: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="">Select Item...</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                            <input type="text" required value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input type="date" required value={purchaseForm.date} onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 border-none outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Added</label>
                            <input type="number" required value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Cost (₹)</label>
                            <input type="number" required value={purchaseForm.cost} onChange={e => setPurchaseForm({ ...purchaseForm, cost: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setPurchaseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Record Purchase</button>
                    </div>
                </form>
            </Modal>

            {/* New Item Modal */}
            <Modal isOpen={isNewItemModalOpen} onClose={() => setNewItemModalOpen(false)} title="Add New Inventory Item">
                <form onSubmit={handleNewItemSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                            <input type="text" required value={newItemForm.name} onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                            <input type="number" required value={newItemForm.currentStock} onChange={e => setNewItemForm({ ...newItemForm, currentStock: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Low Alert At</label>
                            <input type="number" required value={newItemForm.lowStockThreshold} onChange={e => setNewItemForm({ ...newItemForm, lowStockThreshold: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                            <select value={newItemForm.unit} onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })} className="w-full p-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option>kg</option><option>pcs</option><option>liters</option><option>boxes</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setNewItemModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Add Item</button>
                    </div>
                </form>
            </Modal>

            {/* Service Toggle Confirmation Modal */}
            <Modal isOpen={isServiceModalOpen} onClose={() => setServiceModalOpen(false)} title="Enable Service">
                {serviceToToggle && (
                    <div className="space-y-4">
                        <p className="text-slate-600 text-lg">Are you sure you want to enable <strong className="text-slate-800">{services.find(s => s.id === serviceToToggle)?.name}</strong>?</p>
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <p className="text-indigo-800 font-medium">Pricing Details:</p>
                            <p className="text-indigo-600 text-sm mt-1">{services.find(s => s.id === serviceToToggle)?.costDescription}</p>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button onClick={() => setServiceModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
                            <button onClick={confirmServiceToggle} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Enable Service</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
