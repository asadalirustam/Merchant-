# 🚀 Enterprise Merchant ERP & POS System Workflow

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend [Vercel Deployment]
        UI[React 19 + Vite SPA]
        State[Auth & Settings Context]
        WS_Client[Socket.io Client]
    end

    subgraph Backend [Render Deployment]
        API[Express REST API]
        Auth[JWT & RBAC Middleware]
        WS_Server[Socket.io Server]
        Media[Multer / Cloudinary Uploads]
    end

    subgraph Database [MongoDB Atlas]
        Users[(Users Collection)]
        Products[(Products Collection)]
        Sales[(Sales Collection)]
        Invoices[(Invoices Collection)]
        Logs[(Activity Logs Collection)]
    end

    UI -->|HTTPS REST Requests| API
    WS_Client <-->|WebSockets| WS_Server
    API --> Auth
    Auth --> Users
    Auth --> Products
    Auth --> Sales
    Auth --> Invoices
    Auth --> Logs
```

---

## 2. User Roles & Access Control (RBAC)

| Feature / Page | CEO Role | Cashier Admin Role |
| :--- | :---: | :---: |
| **CEO Executive Dashboard** | Full Access | Limited / Terminal View |
| **POS Billing Terminal** | Read / Restricted | Full Billing Access |
| **Products Catalog** | Read-Only | Full CRUD Access |
| **Sales Reports & Export** | Full Access | Restricted |
| **Invoice History** | View & Edit | View Only |
| **Admin Management** | Full Access | Restricted |
| **Audit Activity Logs** | Full Access | Restricted |
| **Shop Settings** | Full Access | Restricted |

---

## 3. Initial Bootstrapping & First-Time Setup

1. **DB Initialization**:
   - The database connects to MongoDB Atlas using `MONGO_URI`.
   - Seed script (`node backend/seed_mms.js`) creates initial default settings, demo inventory items, master CEO account, and cashier accounts.

2. **System Bootstrap (If fresh DB)**:
   - Navigating to `/login` allows clicking **"New ERP setup? Initialize CEO"**.
   - Registers the master CEO account when no CEO exists in the system.

---

## 4. Operational Business Workflows

### A. Cashier POS Checkout Workflow
1. Cashier logs into the POS terminal (`/pos`).
2. Scans product barcode or selects items from catalog.
3. Cart calculates Subtotal, Tax %, Discount, and Grand Total in real time.
4. Cashier submits payment (Cash / Card / Online).
5. **System Actions**:
   - Generates unique invoice number (`INV-XXXX-XXXX`).
   - Atomically decrements product stock in MongoDB.
   - Creates `Sale` and `Invoice` records.
   - Emits WebSocket event `SALE_COMPLETED`.
   - If stock falls $\le 5$ or reaches $0$, emits `LOW_STOCK` or `OUT_OF_STOCK` alert to all connected sessions.
   - Logs action in `ActivityLog`.

### B. Product Inventory Management Workflow
1. Admin opens `/products`.
2. Adds product details (Name, Code, Price, Cost Price, Stock Quantity, Image).
3. Barcode QR code is generated automatically for printing.
4. Low stock ($\le 5$) and Out of Stock ($0$) badges highlight critical inventory levels.

### C. CEO Executive Analytics & Audit Workflow
1. CEO accesses `/dashboard` for high-level KPIs: Total Revenue, Total Profit, Stock Valuation, Daily/Monthly Sales Graphs.
2. CEO accesses `/reports` to filter sales by date range, cashier, or product, and exports CSV reports or prints ledger PDFs.
3. CEO accesses `/logs` to review real-time security and operational audit trails.

---

## 5. Production Deployment Workflow

### Step 1: Push Repository to GitHub
Ensure all latest changes are pushed to `main`:
```bash
git add .
git commit -m "Deployment preparation complete"
git push origin main
```

---

### Step 2: Deploy Backend to Render

1. Go to [dashboard.render.com](https://dashboard.render.com) $\rightarrow$ **New Web Service**.
2. Connect repository `asadalirustam/Merchant-`.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/`
4. Set **Environment Variables**:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `mongodb+srv://asadalirustam9_db_user:asadali456@cluster0.7ktiiem.mongodb.net/Shop?retryWrites=true&w=majority&appName=Cluster0`
   - `JWT_SECRET` = `merchant_secret_access_key_9988776655`
   - `JWT_REFRESH_SECRET` = `merchant_secret_refresh_key_5544332211`
   - `FRONTEND_URL` = `https://<your-app>.vercel.app`
5. Click **Create Web Service**. Copy the generated URL (e.g. `https://merchant-erp-backend.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import repository `asadalirustam/Merchant-`.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set **Environment Variables**:
   - `VITE_API_URL` = `https://merchant-erp-backend.onrender.com/api`
   - `VITE_BACKEND_URL` = `https://merchant-erp-backend.onrender.com`
5. Click **Deploy**.

---

### Step 4: Continuous Deployment (CD)

Both Vercel and Render are connected to `origin/main`. Any future `git push` to `main` will automatically build, test, and redeploy both services without downtime.
