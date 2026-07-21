# 📋 Deployment & System Fixes Walkthrough

This document outlines all the modifications, production preparation steps, local build verifications, and step-by-step instructions to deploy your MERN Enterprise Merchant ERP + POS System to **Render** (Backend) and **Vercel** (Frontend).

---

## 1. Issues Identified & Applied Fixes

### A. Sales Report Blank Screen Bug Fix
- **Problem**: Opening the Sales Reports page in the CEO portal rendered a blank screen.
- **Cause**: The `<Download />` icon component was rendered in [SalesReports.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/pages/SalesReports.jsx#L249) for the CSV Export button without being imported from `lucide-react`, causing `Uncaught ReferenceError: Download is not defined`.
- **Fix**: Added `Download` to the `lucide-react` import statement in [SalesReports.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/pages/SalesReports.jsx#L16).

### B. Production Dynamic API & Media URL Handling
- **Problem**: `http://localhost:5000` was hardcoded across multiple frontend components, causing production API requests and image URLs to target the client's local machine.
- **Fix**:
  1. Created [urlHelper.js](file:///d:/Promotez%20Intership/shop/frontend/src/utils/urlHelper.js) to resolve `VITE_API_URL` and `VITE_BACKEND_URL` dynamically.
  2. Updated [api.js](file:///d:/Promotez%20Intership/shop/frontend/src/utils/api.js) to use `API_URL` for API requests and 401 token refresh.
  3. Updated [NotificationContext.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/context/NotificationContext.jsx) to connect Socket.io using `BACKEND_URL`.
  4. Updated [Sidebar.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/components/Sidebar.jsx), [Profile.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/pages/Profile.jsx), [ShopSettings.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/pages/ShopSettings.jsx), and [Products.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/pages/Products.jsx) using `getImageUrl()` to load media correctly.

### C. CORS & Cloud Host Environment Preparedness
- **Fix**: Updated [server.js](file:///d:/Promotez%20Intership/shop/backend/server.js) CORS configuration to accept requests from any `*.vercel.app` origin domain. Added a `try/catch` guard around `dns.setServers()` for cloud container compatibility.

### D. Single Page Application (SPA) Client Routing on Vercel
- **Fix**: Created [vercel.json](file:///d:/Promotez%20Intership/shop/frontend/vercel.json) in `frontend/` to rewrite all route requests back to `index.html`, eliminating 404 errors on direct URL accesses or page refreshes.

### E. Render Infrastructure Specification
- **Fix**: Created [render.yaml](file:///d:/Promotez%20Intership/shop/render.yaml) specifying Node runtime, build/start commands, health check path `/`, and default environment keys.

---

## 2. Step-by-Step Deployment Instructions

```mermaid
sequenceDiagram
    autonumber
    actor Developer
    participant GitHub as GitHub Repository
    participant Render as Render (Backend Node API)
    participant Vercel as Vercel (Frontend React SPA)
    participant Mongo as MongoDB Atlas

    Developer->>GitHub: Push main branch
    GitHub->>Render: Auto-build & Deploy backend/
    Render->>Mongo: Connect via MONGO_URI
    GitHub->>Vercel: Auto-build & Deploy frontend/
    Vercel->>Render: Communicate via HTTPS REST & WebSockets
```

### Step 1: Deploy Backend to Render

1. Open your browser and log into [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository** and pick `asadalirustam/Merchant-`.
4. Fill in the service parameters:

| Field | Configuration Value |
| :--- | :--- |
| **Name** | `merchant-erp-backend` |
| **Region** | Oregon (or nearest region) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/` |

5. Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://asadalirustam9_db_user:asadali456@cluster0.7ktiiem.mongodb.net/Shop?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | `merchant_secret_access_key_9988776655` |
| `JWT_REFRESH_SECRET` | `merchant_secret_refresh_key_5544332211` |
| `FRONTEND_URL` | `https://<your-vercel-app-name>.vercel.app` *(update once frontend is deployed)* |

6. Click **Create Web Service**. Wait for the build to complete and copy the live URL (e.g., `https://merchant-erp-backend.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel

1. Open your browser and log into [vercel.com/new](https://vercel.com/new).
2. Import the `asadalirustam/Merchant-` repository.
3. Configure the deployment settings:

| Field | Configuration Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://merchant-erp-backend.onrender.com/api` *(use your Render backend URL)* |
| `VITE_BACKEND_URL` | `https://merchant-erp-backend.onrender.com` *(use your Render backend URL)* |

5. Click **Deploy**. Vercel will build the frontend and provide your production domain (e.g., `https://merchant-erp-frontend.vercel.app`).

---

### Step 3: Post-Deployment Verification Checklist

- [x] **API Health Check**: Visit `https://<backend-render-app>.onrender.com/` in browser $\rightarrow$ should display `"Merchant Management System API is running..."`.
- [x] **Authentication**: Test login with CEO credentials (`ceo@shop.com` / `password123`) or Cashier Admin (`admin@shop.com` / `password123`).
- [x] **Dashboard Metrics**: Confirm total admins, product counts, stock numbers, and Recharts sales graphs render cleanly.
- [x] **POS Billing & Stock Updates**: Create a POS transaction $\rightarrow$ verify stock decrements atomically and real-time Socket.io toast alerts trigger.
- [x] **Consolidated Sales Reports**: Access `/reports` $\rightarrow$ verify CSV export and PDF printing work.
- [x] **Client Routing**: Refresh any sub-page (e.g. `/reports` or `/products`) $\rightarrow$ verify page reloads without 404 errors.
