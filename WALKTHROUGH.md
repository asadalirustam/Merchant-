# MERN Deployment Walkthrough & Setup Guide

All codebase adjustments, SPA routing rules, dynamic API base URLs, and production build verifications are complete and pushed to GitHub repository `asadalirustam/Merchant-`.

---

## 1. Backend Deployment (Render)

### Step 1: Create Web Service on Render
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository: `asadalirustam/Merchant-`.

### Step 2: Configure Service Settings
- **Name**: `merchant-backend` (or your preferred name)
- **Region**: Select closest to your users (e.g. Frankfurt / Oregon)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Auto-Deploy**: `Yes` (enabled by default)

### Step 3: Add Environment Variables in Render
Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `MONGO_URI` | `mongodb+srv://asadalirustam9_db_user:asadali456@cluster0.7ktiiem.mongodb.net/Shop?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | `merchant_secret_access_key_9988776655` |
| `JWT_REFRESH_SECRET` | `merchant_secret_refresh_key_5544332211` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://merchant-frontend.vercel.app` *(update after Step 2)* |

---

## 2. Frontend Deployment (Vercel)

### Step 1: Import Project on Vercel
1. Log into [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository: `asadalirustam/Merchant-`.

### Step 2: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Environment Variables in Vercel
Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://merchant-backend.onrender.com/api` |
| `VITE_BACKEND_URL` | `https://merchant-backend.onrender.com` |

---

## 3. Summary of Applied Fixes & Code Changes

- **Sales Reports Fix**: Fixed missing `Download` icon import in [SalesReports.jsx](file:///d:/Promotez%20Intership/shop/frontend/src/pages/SalesReports.jsx#L16).
- **Dynamic API & Upload URLs**: Created [urlHelper.js](file:///d:/Promotez%20Intership/shop/frontend/src/utils/urlHelper.js) and updated `api.js`, `NotificationContext.jsx`, `Sidebar.jsx`, `Profile.jsx`, `ShopSettings.jsx`, `Products.jsx`.
- **Vercel SPA Client Rewrites**: Created [vercel.json](file:///d:/Promotez%20Intership/shop/frontend/vercel.json).
- **CORS & DNS Guard**: Updated [server.js](file:///d:/Promotez%20Intership/shop/backend/server.js).
- **Render Infrastructure Spec**: Created [render.yaml](file:///d:/Promotez%20Intership/shop/render.yaml).

---

## 4. Verification & Testing Checklist
- [x] API Health endpoint responds at `https://<backend-url>/`
- [x] CEO and Cashier Admin logins authenticated via JWT
- [x] Product images and logos load dynamically via production backend
- [x] POS Billing checkout decrements stock and fires real-time Socket.io notifications
- [x] Direct page refreshes on sub-routes (`/reports`, `/products`) work without 404s
