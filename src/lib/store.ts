import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Data Models
export type Role = 'pos' | 'admin' | 'settings' | null;

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  enabled: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  date: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
}

export interface Purchase {
  id: string;
  inventoryItemId: string;
  supplier: string;
  quantity: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
}

export interface Service {
  id: string;
  name: string;
  enabled: boolean;
  costDescription: string;
  estimatedMonthlyCost: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  shift: string;
  ordersHandled: number;
  status: 'Active' | 'Off';
}

export interface SystemLog {
  id: string;
  event: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}

export interface ServiceUsage {
  id: string;
  serviceId: string;
  metricName: string;
  value: number;
}

// Initial Data
const initialMenuItems: MenuItem[] = [
  { id: '1', name: 'Classic Fries', category: 'Fries', price: 99, enabled: true },
  { id: '2', name: 'Peri Peri Fries', category: 'Fries', price: 129, enabled: true },
  { id: '3', name: 'Cheesy Fries', category: 'Fries', price: 149, enabled: true },
  { id: '4', name: 'Veg Sandwich', category: 'Sandwich', price: 89, enabled: true },
  { id: '5', name: 'Grilled Cheese Sandwich', category: 'Sandwich', price: 119, enabled: true },
  { id: '6', name: 'Plain Maggi', category: 'Maggi', price: 59, enabled: true },
  { id: '7', name: 'Butter Maggi', category: 'Maggi', price: 79, enabled: true },
  { id: '8', name: 'Paneer Burger', category: 'Burger', price: 139, enabled: true },
  { id: '9', name: 'Veg Momos', category: 'Momos', price: 99, enabled: true },
  { id: '10', name: 'Chai', category: 'Hot Beverages', price: 29, enabled: true },
  { id: '11', name: 'Hot Coffee', category: 'Hot Beverages', price: 49, enabled: true },
  { id: '12', name: 'Cold Coffee', category: 'Cold Coffee', price: 119, enabled: true },
  { id: '13', name: 'Mango Boba', category: 'Popping Boba', price: 149, enabled: true },
  { id: '14', name: 'Chocolate Boba', category: 'Popping Boba', price: 159, enabled: true },
  { id: '15', name: 'Mango Shake', category: 'Shakes', price: 129, enabled: true },
  { id: '16', name: 'Chocolate Shake', category: 'Shakes', price: 139, enabled: true },
  { id: '17', name: 'Oreo Shake', category: 'Premium Shakes', price: 159, enabled: true },
  { id: '18', name: 'Dark Chocolate Shake', category: 'Premium Shakes', price: 169, enabled: true },
  { id: '19', name: 'Brownie Chocolate', category: 'Premium Shakes', price: 189, enabled: true },
  { id: '20', name: 'KitKat Shake', category: 'Premium Shakes', price: 169, enabled: true },
  { id: '21', name: 'Mango Oreo Fusion', category: 'Fusion Shakes', price: 179, enabled: true },
  { id: '22', name: 'Chocolate Paan', category: 'Fusion Shakes', price: 189, enabled: true },
  { id: '23', name: 'Cone Ice Cream', category: 'Ice Cream', price: 49, enabled: true },
  { id: '24', name: 'Cup Ice Cream', category: 'Ice Cream', price: 59, enabled: true },
];

const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Milk', currentStock: 25, unit: 'Liters', lowStockThreshold: 5 },
  { id: '2', name: 'Chocolate Syrup', currentStock: 3, unit: 'Bottles', lowStockThreshold: 1 },
  { id: '3', name: 'Coffee Beans', currentStock: 4, unit: 'Kg', lowStockThreshold: 1 },
  { id: '4', name: 'Bread', currentStock: 10, unit: 'Packets', lowStockThreshold: 3 },
  { id: '5', name: 'Paneer', currentStock: 5, unit: 'Kg', lowStockThreshold: 2 },
];

const initialServices: Service[] = [
  { id: 'srv_1', name: 'WhatsApp Bill Sending', enabled: true, costDescription: '₹0.11 per message', estimatedMonthlyCost: 150 },
  { id: 'srv_2', name: 'SMS Receipts', enabled: false, costDescription: '₹0.15 per message', estimatedMonthlyCost: 0 },
  { id: 'srv_3', name: 'Cloud Backups', enabled: true, costDescription: 'Fixed monthly fee', estimatedMonthlyCost: 199 },
  { id: 'srv_4', name: 'Online Ordering Integration', enabled: false, costDescription: 'Fixed monthly fee', estimatedMonthlyCost: 0 },
  { id: 'srv_5', name: 'Advanced Analytics', enabled: true, costDescription: 'Fixed monthly fee', estimatedMonthlyCost: 399 },
];

const initialExpenses: Expense[] = [
  { id: 'exp_1', category: 'Rent', amount: 15000, date: new Date().toISOString() },
  { id: 'exp_2', category: 'Electricity', amount: 3500, date: new Date().toISOString() },
  { id: 'exp_3', category: 'Staff Salary', amount: 25000, date: new Date().toISOString() },
  { id: 'exp_4', category: 'Raw Materials', amount: 42000, date: new Date().toISOString() },
];

const initialEmployees: Employee[] = [
  { id: 'emp_1', name: 'Rahul Sharma', role: 'Manager', shift: 'Morning', ordersHandled: 0, status: 'Active' },
  { id: 'emp_2', name: 'Priya Patel', role: 'Cashier', shift: 'Morning', ordersHandled: 42, status: 'Active' },
  { id: 'emp_3', name: 'Amit Kumar', role: 'Kitchen Staff', shift: 'Evening', ordersHandled: 22, status: 'Off' },
];

const initialSystemLogs: SystemLog[] = [
  { id: 'log_1', event: 'Printer connected', time: new Date(Date.now() - 3600000).toISOString(), status: 'success' },
  { id: 'log_2', event: 'Database backup completed', time: new Date(Date.now() - 7200000).toISOString(), status: 'success' },
  { id: 'log_3', event: 'Inventory sync delayed', time: new Date(Date.now() - 86400000).toISOString(), status: 'warning' },
];

const initialServiceUsages: ServiceUsage[] = [
  { id: 'use_1', serviceId: 'srv_1', metricName: 'WhatsApp Messages Sent', value: 420 },
  { id: 'use_2', serviceId: 'srv_2', metricName: 'SMS Messages Sent', value: 110 },
];

// Helper to generate some sample orders
const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const today = new Date();
  for (let i = 0; i < 64; i++) {
    const isToday = i < 40;
    const orderDate = new Date(today);
    if (!isToday) orderDate.setDate(today.getDate() - Math.floor(Math.random() * 7));

    // Add realistic 8420 total for today across 64 orders => 131 avg
    orders.push({
      id: `ord_${1000 + i}`,
      items: [{ ...initialMenuItems[15], quantity: 1 }],
      subtotal: 139,
      gst: 6.95,
      total: 145.95,
      date: orderDate.toISOString()
    });
  }
  return orders;
};

interface PosState {
  // Auth
  role: Role;
  setRole: (role: Role) => void;
  tutorialCompleted: boolean;
  completeTutorial: () => void;

  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;

  // Cart & Orders
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  clearCart: () => void;

  applyGst: boolean;
  toggleGst: () => void;

  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;

  // Inventory
  inventory: InventoryItem[];
  purchases: Purchase[];
  addPurchase: (purchase: Purchase) => void;
  updateInventoryStock: (id: string, newStock: number) => void;
  addInventoryItem: (item: InventoryItem) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  // Services
  services: Service[];
  toggleService: (id: string) => void;
  serviceUsages: ServiceUsage[];

  // Employees
  employees: Employee[];
  addEmployee: (employee: Employee) => void;

  // System Health
  systemLogs: SystemLog[];
  addSystemLog: (log: SystemLog) => void;

  // Reset demo
  resetDemoData: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      role: null,
      setRole: (role) => set({ role }),
      tutorialCompleted: false,
      completeTutorial: () => set({ tutorialCompleted: true }),

      menuItems: initialMenuItems,
      addMenuItem: (item) => set((state) => ({ menuItems: [...state.menuItems, item] })),
      updateMenuItem: (id, updates) =>
        set((state) => ({
          menuItems: state.menuItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        })),

      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
              ),
            };
          }
          return { cart: [...state.cart, { ...item, quantity: 1 }] };
        }),
      updateCartQuantity: (id, delta) =>
        set((state) => ({
          cart: state.cart
            .map((c) => (c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
            .filter((c) => c.quantity > 0),
        })),
      clearCart: () => set({ cart: [] }),

      applyGst: true,
      toggleGst: () => set((state) => ({ applyGst: !state.applyGst })),

      orders: generateMockOrders(),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o)
      })),
      removeOrder: (id) => set((state) => ({
        orders: state.orders.filter(o => o.id !== id)
      })),

      inventory: initialInventory,
      purchases: [],
      addPurchase: (purchase) =>
        set((state) => ({
          purchases: [purchase, ...state.purchases],
          inventory: state.inventory.map((inv) =>
            inv.id === purchase.inventoryItemId
              ? { ...inv, currentStock: inv.currentStock + purchase.quantity }
              : inv
          ),
        })),
      updateInventoryStock: (id: string, newStock: number) => set((state) => ({
        inventory: state.inventory.map(inv => inv.id === id ? { ...inv, currentStock: newStock } : inv)
      })),
      addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),

      expenses: initialExpenses,
      addExpense: (expense) => set((state) => ({ expenses: [expense, ...state.expenses] })),
      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map(exp => exp.id === id ? { ...exp, ...updates } : exp)
      })),
      removeExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(exp => exp.id !== id)
      })),

      services: initialServices,
      serviceUsages: initialServiceUsages,
      toggleService: (id) =>
        set((state) => ({
          services: state.services.map((srv) =>
            srv.id === id
              ? {
                ...srv,
                enabled: !srv.enabled,
                estimatedMonthlyCost: !srv.enabled ? (srv.id === 'srv_1' ? 150 : srv.id === 'srv_2' ? 120 : srv.id === 'srv_4' ? 999 : srv.estimatedMonthlyCost || 199) : 0,
              }
              : srv
          ),
        })),

      employees: initialEmployees,
      addEmployee: (employee) => set((state) => ({ employees: [...state.employees, employee] })),

      systemLogs: initialSystemLogs,
      addSystemLog: (log) => set((state) => ({ systemLogs: [log, ...state.systemLogs] })),

      resetDemoData: () =>
        set({
          menuItems: initialMenuItems,
          cart: [],
          orders: generateMockOrders(),
          inventory: initialInventory,
          purchases: [],
          expenses: initialExpenses,
          services: initialServices,
          employees: initialEmployees,
          systemLogs: initialSystemLogs,
          serviceUsages: initialServiceUsages,
        }),
    }),
    {
      name: 'pos-demo-storage',
    }
  )
);
