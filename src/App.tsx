import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  FileText, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  Search, 
  AlertTriangle, 
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  ChevronRight,
  UserCircle,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { cn } from './lib/utils';
import { User, Product, Sale, Invoice, Role } from './types';
import { dbService } from './dbService';

// --- Auth Context (Simplified for Demo) ---
interface AuthContextType {
  user: User | null;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)} {...props}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; 
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100"
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required,
  className
}: { 
  label?: string; 
  type?: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; 
  placeholder?: string;
  required?: boolean;
  className?: string;
}) => (
  <div className={cn("space-y-1.5", className)}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange as any}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
    />
  </div>
);

const Select = ({ 
  label, 
  value, 
  onChange, 
  options,
  className
}: { 
  label?: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  options: { value: string; label: string }[];
  className?: string;
}) => (
  <div className={cn("space-y-1.5", className)}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Views ---

const DashboardView = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setSales(dbService.getSales(user.role, user.id));
      setProducts(dbService.getProducts());
    }
  }, [user]);

  const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0);
  const activeLeads = sales.filter(s => s.status === 'lead').length;
  const lowStockItems = products.filter(p => p.quantity <= p.low_stock_threshold).length;

  const chartData = sales.slice(-10).map(s => ({
    name: format(new Date(s.created_at), 'MMM dd'),
    amount: s.total_amount
  }));

  const statusData = [
    { name: 'Leads', value: sales.filter(s => s.status === 'lead').length, color: '#6366f1' },
    { name: 'Quotes', value: sales.filter(s => s.status === 'quote').length, color: '#f59e0b' },
    { name: 'Won', value: sales.filter(s => s.status === 'won').length, color: '#10b981' },
    { name: 'Lost', value: sales.filter(s => s.status === 'lost').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <div className="text-sm text-slate-500">
          Last updated: {format(new Date(), 'MMM dd, HH:mm')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900">${totalSales.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Leads</p>
              <h3 className="text-2xl font-bold text-slate-900">{activeLeads}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-slate-900">{lowStockItems}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Deals Won</p>
              <h3 className="text-2xl font-bold text-slate-900">{sales.filter(s => s.status === 'won').length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Sales Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Pipeline Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {statusData.map(status => (
              <div key={status.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                  <span className="text-slate-600">{status.name}</span>
                </div>
                <span className="font-bold text-slate-900">{status.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const InventoryView = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', quantity: 0, price: 0, low_stock_threshold: 10 });
  const { user } = useAuth();

  const fetchProducts = () => {
    setProducts(dbService.getProducts());
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.createProduct(newProduct);
    setShowAdd(false);
    fetchProducts();
    setNewProduct({ name: '', sku: '', quantity: 0, price: 0, low_stock_threshold: 10 });
  };

  const updateStock = (id: number, newQty: number) => {
    dbService.updateProductStock(id, newQty);
    fetchProducts();
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Stock Control</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
          {(user?.role === 'admin' || user?.role === 'warehouse') && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={18} /> Add Product
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{p.name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-sm">{p.sku}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold",
                        p.quantity <= p.low_stock_threshold ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {p.quantity} in stock
                      </span>
                      {p.quantity <= p.low_stock_threshold && (
                        <AlertTriangle size={14} className="text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium">${p.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    {(user?.role === 'admin' || user?.role === 'warehouse') && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => updateStock(p.id, p.quantity - 1)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => updateStock(p.id, p.quantity + 1)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Add New Product</h3>
                  <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <Input label="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
                  <Input label="SKU" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Quantity" type="number" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: parseInt(e.target.value)})} required />
                    <Input label="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} required />
                  </div>
                  <Input label="Low Stock Threshold" type="number" value={newProduct.low_stock_threshold} onChange={e => setNewProduct({...newProduct, low_stock_threshold: parseInt(e.target.value)})} required />
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
                    <Button type="submit" className="flex-1">Save Product</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SalesView = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSale, setNewSale] = useState({ customer_name: '', product_id: 0, quantity: 1, status: 'lead' as const });
  const { user } = useAuth();

  const fetchData = () => {
    if (user) {
      setSales(dbService.getSales(user.role, user.id));
      setProducts(dbService.getProducts());
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === newSale.product_id);
    if (!product || !user) return;
    
    dbService.createSale({
      ...newSale,
      total_amount: product.price * newSale.quantity
    }, user.id);
    
    setShowAdd(false);
    fetchData();
    setNewSale({ customer_name: '', product_id: 0, quantity: 1, status: 'lead' });
  };

  const generateInvoice = (sale: Sale) => {
    dbService.createInvoice({
      sale_id: sale.id,
      customer_name: sale.customer_name,
      total_amount: sale.total_amount,
      tax_amount: sale.total_amount * 0.15
    });
    alert('Invoice generated successfully! Check the Invoices tab.');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      lead: "bg-indigo-100 text-indigo-700",
      quote: "bg-amber-100 text-amber-700",
      won: "bg-emerald-100 text-emerald-700",
      lost: "bg-red-100 text-red-700"
    };
    return colors[status as keyof typeof colors] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Sales Pipeline</h2>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={18} /> New Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['lead', 'quote', 'won', 'lost'].map(stage => (
          <div key={stage} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stage}s</h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {sales.filter(s => s.status === stage).length}
              </span>
            </div>
            <div className="space-y-3">
              {sales.filter(s => s.status === stage).map(sale => (
                <Card key={sale.id} className="p-4 hover:border-indigo-200 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-slate-900">{sale.customer_name}</h4>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", getStatusColor(sale.status))}>
                      {sale.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{sale.product_name} x {sale.quantity}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">${sale.total_amount.toLocaleString()}</span>
                    {sale.status === 'won' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); generateInvoice(sale); }}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        Create Invoice
                      </button>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <UserCircle size={12} />
                      {sale.rep_name}
                    </div>
                    <span className="text-[10px] text-slate-400">{format(new Date(sale.created_at), 'MMM dd')}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">New Sale Opportunity</h3>
                  <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <Input label="Customer Name" value={newSale.customer_name} onChange={e => setNewSale({...newSale, customer_name: e.target.value})} required />
                  <Select 
                    label="Product" 
                    value={newSale.product_id.toString()} 
                    onChange={e => setNewSale({...newSale, product_id: parseInt(e.target.value)})}
                    options={[
                      { value: '0', label: 'Select a product' },
                      ...products.map(p => ({ value: p.id.toString(), label: `${p.name} ($${p.price})` }))
                    ]}
                  />
                  <Input label="Quantity" type="number" value={newSale.quantity} onChange={e => setNewSale({...newSale, quantity: parseInt(e.target.value)})} required />
                  <Select 
                    label="Initial Status" 
                    value={newSale.status} 
                    onChange={e => setNewSale({...newSale, status: e.target.value as any})}
                    options={[
                      { value: 'lead', label: 'Lead' },
                      { value: 'quote', label: 'Quote' },
                      { value: 'won', label: 'Won' }
                    ]}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
                    <Button type="submit" className="flex-1">Create Lead</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InvoicesView = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setInvoices(dbService.getInvoices());
  }, []);

  const downloadPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("OmniCRM Invoice", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 40);
    doc.text(`Date: ${format(new Date(invoice.created_at), 'PPP')}`, 20, 45);
    doc.text(`Customer: ${invoice.customer_name}`, 20, 50);
    (doc as any).autoTable({
      startY: 60,
      head: [['Description', 'Amount']],
      body: [
        ['Subtotal', `$${invoice.total_amount.toFixed(2)}`],
        ['Tax (15%)', `$${invoice.tax_amount.toFixed(2)}`],
        ['Total', `$${(invoice.total_amount + invoice.tax_amount).toFixed(2)}`]
      ],
      theme: 'striped',
      headStyles: { fillStyle: '#6366f1' }
    });
    doc.save(`${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-bold">{inv.invoice_number}</td>
                  <td className="px-6 py-4 text-slate-900 font-medium">{inv.customer_name}</td>
                  <td className="px-6 py-4 text-slate-900 font-bold">${(inv.total_amount + inv.tax_amount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                      inv.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => downloadPDF(inv)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-sm"
                    >
                      <Download size={14} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const AdminView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'sales' as Role, name: '' });

  const fetchUsers = () => {
    setUsers(dbService.getUsers());
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.createUser(newUser);
    setShowAdd(false);
    fetchUsers();
    setNewUser({ username: '', password: '', role: 'sales', name: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Create User
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 text-slate-500">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                      u.role === 'admin' ? "bg-purple-100 text-purple-700" : 
                      u.role === 'sales' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Create New User</h3>
                  <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <Input label="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                  <Input label="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                  <Input label="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                  <Select 
                    label="Role" 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                    options={[
                      { value: 'sales', label: 'Sales Rep' },
                      { value: 'warehouse', label: 'Warehouse Staff' },
                      { value: 'admin', label: 'Administrator' }
                    ]}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
                    <Button type="submit" className="flex-1">Create User</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Layout ---

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sales', 'warehouse'] },
    { id: 'sales', label: 'Sales', icon: TrendingUp, roles: ['admin', 'sales'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'warehouse'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'sales'] },
    { id: 'admin', label: 'Team', icon: Users, roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  const switchRole = (role: Role) => {
    const users = dbService.getUsers();
    const found = users.find(u => u.role === role);
    if (found) setUser(found);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">OmniCRM</h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {filteredMenu.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === item.id 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ShieldCheck size={10} /> Demo: Switch Role
              </p>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => switchRole('admin')} className={cn("text-[10px] py-1 rounded border", user?.role === 'admin' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200")}>Admin</button>
                <button onClick={() => switchRole('sales')} className={cn("text-[10px] py-1 rounded border", user?.role === 'sales' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200")}>Sales</button>
                <button onClick={() => switchRole('warehouse')} className={cn("text-[10px] py-1 rounded border", user?.role === 'warehouse' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200")}>Whse</button>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <UserCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <TrendingUp size={16} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">OmniCRM</h1>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'sales' && <SalesView />}
                {activeTab === 'inventory' && <InventoryView />}
                {activeTab === 'invoices' && <InvoicesView />}
                {activeTab === 'admin' && <AdminView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Root App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Default to Admin for demo
    const users = dbService.getUsers();
    setUser(users[0]);
  }, []);

  if (!user) return null;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <MainLayout>Content</MainLayout>
    </AuthContext.Provider>
  );
}
