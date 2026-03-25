import { User, Product, Sale, Invoice } from './types';

const STORAGE_KEYS = {
  USERS: 'crm_users',
  PRODUCTS: 'crm_products',
  SALES: 'crm_sales',
  INVOICES: 'crm_invoices'
};

const defaultUsers: User[] = [
  { id: 1, username: 'admin', role: 'admin', name: 'System Administrator' },
  { id: 2, username: 'sales_rep', role: 'sales', name: 'John Sales' },
  { id: 3, username: 'warehouse_staff', role: 'warehouse', name: 'Mike Warehouse' }
];

const defaultProducts: Product[] = [
  { id: 1, name: 'Laptop Pro 14', sku: 'LP-14-001', quantity: 15, price: 1299, low_stock_threshold: 5 },
  { id: 2, name: 'Wireless Mouse', sku: 'WM-002', quantity: 4, price: 49, low_stock_threshold: 10 },
  { id: 3, name: 'USB-C Hub', sku: 'UH-003', quantity: 25, price: 79, low_stock_threshold: 8 },
  { id: 4, name: 'Monitor 27"', sku: 'MN-27-004', quantity: 2, price: 349, low_stock_threshold: 5 }
];

const get = <T>(key: string, defaults: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaults;
};

const save = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dbService = {
  getUsers: () => get<User[]>(STORAGE_KEYS.USERS, defaultUsers),
  createUser: (user: Omit<User, 'id'>) => {
    const users = dbService.getUsers();
    const newUser = { ...user, id: Date.now() };
    save(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },

  getProducts: () => get<Product[]>(STORAGE_KEYS.PRODUCTS, defaultProducts),
  createProduct: (product: Omit<Product, 'id'>) => {
    const products = dbService.getProducts();
    const newProduct = { ...product, id: Date.now() };
    save(STORAGE_KEYS.PRODUCTS, [...products, newProduct]);
    return newProduct;
  },
  updateProductStock: (id: number, quantity: number) => {
    const products = dbService.getProducts();
    const updated = products.map(p => p.id === id ? { ...p, quantity } : p);
    save(STORAGE_KEYS.PRODUCTS, updated);
  },

  getSales: (userRole: string, userId: number) => {
    const sales = get<Sale[]>(STORAGE_KEYS.SALES, []);
    const products = dbService.getProducts();
    const users = dbService.getUsers();
    
    const enriched = sales.map(s => ({
      ...s,
      product_name: products.find(p => p.id === s.product_id)?.name || 'Unknown',
      rep_name: users.find(u => u.id === s.rep_id)?.name || 'Unknown'
    }));

    if (userRole === 'admin') return enriched;
    return enriched.filter(s => s.rep_id === userId);
  },
  createSale: (sale: Omit<Sale, 'id' | 'created_at'>, userId: number) => {
    const sales = get<Sale[]>(STORAGE_KEYS.SALES, []);
    const newSale = { ...sale, id: Date.now(), rep_id: userId, created_at: new Date().toISOString() };
    save(STORAGE_KEYS.SALES, [...sales, newSale]);
    return newSale;
  },

  getInvoices: () => get<Invoice[]>(STORAGE_KEYS.INVOICES, []),
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'status'>) => {
    const invoices = get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now(),
      invoice_number: `INV-${Date.now()}`,
      status: 'unpaid',
      created_at: new Date().toISOString()
    };
    save(STORAGE_KEYS.INVOICES, [...invoices, newInvoice]);
    return newInvoice;
  }
};
