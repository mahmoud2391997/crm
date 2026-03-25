export type Role = 'admin' | 'sales' | 'warehouse';

export interface User {
  id: number;
  username: string;
  role: Role;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
}

export interface Sale {
  id: number;
  customer_name: string;
  product_id: number;
  product_name?: string;
  quantity: number;
  total_amount: number;
  status: 'lead' | 'quote' | 'won' | 'lost';
  rep_id: number;
  rep_name?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  sale_id: number;
  customer_name: string;
  total_amount: number;
  tax_amount: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  created_at: string;
}
