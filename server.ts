import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("crm.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'sales', 'warehouse'
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    quantity INTEGER DEFAULT 0,
    price REAL NOT NULL,
    low_stock_threshold INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    product_id INTEGER,
    quantity INTEGER,
    total_amount REAL,
    status TEXT DEFAULT 'lead', -- 'lead', 'quote', 'won', 'lost'
    rep_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (rep_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    sale_id INTEGER,
    customer_name TEXT NOT NULL,
    total_amount REAL,
    tax_amount REAL,
    status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );
`);

// Seed Admin User if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run(
    "admin",
    hashedPassword,
    "admin",
    "System Administrator"
  );
}

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-crm-key";

app.use(helmet({
  contentSecurityPolicy: false, // Disable for development/Vite
}));
app.use(cors());
app.use(express.json());

// Middleware: Auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware: Role Check
const authorizeRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

// Auth Routes
app.post("/api/auth/login", (req: any, res: any) => {
  const { username, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

// User Management (Admin only)
app.get("/api/users", authenticateToken, authorizeRole(["admin"]), (req: any, res: any) => {
  const users = db.prepare("SELECT id, username, role, name FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, authorizeRole(["admin"]), (req: any, res: any) => {
  const { username, password, role, name } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run(
      username,
      hashedPassword,
      role,
      name
    );
    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ message: "Username already exists" });
  }
});

// Product Routes (Admin & Warehouse)
app.get("/api/products", authenticateToken, (req: any, res: any) => {
  const products = db.prepare("SELECT * FROM products").all();
  res.json(products);
});

app.post("/api/products", authenticateToken, authorizeRole(["admin", "warehouse"]), (req: any, res: any) => {
  const { name, sku, quantity, price, low_stock_threshold } = req.body;
  try {
    db.prepare("INSERT INTO products (name, sku, quantity, price, low_stock_threshold) VALUES (?, ?, ?, ?, ?)").run(
      name,
      sku,
      quantity,
      price,
      low_stock_threshold
    );
    res.status(201).json({ message: "Product added" });
  } catch (err) {
    res.status(400).json({ message: "SKU already exists" });
  }
});

app.patch("/api/products/:id", authenticateToken, authorizeRole(["admin", "warehouse"]), (req: any, res: any) => {
  const { quantity } = req.body;
  db.prepare("UPDATE products SET quantity = ? WHERE id = ?").run(quantity, req.params.id);
  res.json({ message: "Stock updated" });
});

// Sales Routes (Admin & Sales)
app.get("/api/sales", authenticateToken, (req: any, res: any) => {
  let sales;
  if (req.user.role === "admin") {
    sales = db.prepare(`
      SELECT s.*, p.name as product_name, u.name as rep_name 
      FROM sales s 
      LEFT JOIN products p ON s.product_id = p.id 
      LEFT JOIN users u ON s.rep_id = u.id
    `).all();
  } else if (req.user.role === "sales") {
    sales = db.prepare(`
      SELECT s.*, p.name as product_name, u.name as rep_name 
      FROM sales s 
      LEFT JOIN products p ON s.product_id = p.id 
      LEFT JOIN users u ON s.rep_id = u.id
      WHERE s.rep_id = ?
    `).all(req.user.id);
  } else {
    return res.status(403).json({ message: "Forbidden" });
  }
  res.json(sales);
});

app.post("/api/sales", authenticateToken, authorizeRole(["admin", "sales"]), (req: any, res: any) => {
  const { customer_name, product_id, quantity, total_amount, status } = req.body;
  db.prepare("INSERT INTO sales (customer_name, product_id, quantity, total_amount, status, rep_id) VALUES (?, ?, ?, ?, ?, ?)").run(
    customer_name,
    product_id,
    quantity,
    total_amount,
    status,
    req.user.id
  );
  res.status(201).json({ message: "Sale recorded" });
});

// Invoice Routes (Admin & Sales)
app.get("/api/invoices", authenticateToken, authorizeRole(["admin", "sales"]), (req: any, res: any) => {
  const invoices = db.prepare("SELECT * FROM invoices").all();
  res.json(invoices);
});

app.post("/api/invoices", authenticateToken, authorizeRole(["admin", "sales"]), (req: any, res: any) => {
  const { sale_id, customer_name, total_amount, tax_amount } = req.body;
  const invoice_number = "INV-" + Date.now();
  db.prepare("INSERT INTO invoices (invoice_number, sale_id, customer_name, total_amount, tax_amount) VALUES (?, ?, ?, ?, ?)").run(
    invoice_number,
    sale_id,
    customer_name,
    total_amount,
    tax_amount
  );
  res.status(201).json({ message: "Invoice generated", invoice_number });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
