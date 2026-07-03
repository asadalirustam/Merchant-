# Enterprise Merchant ERP + POS System

A high-fidelity Enterprise Resource Planning (ERP) and Point of Sale (POS) application built using the MERN stack (MongoDB, Express, React, Node.js). 

This system provides a full suite of inventory, purchasing, customer management, operational expense logging, and real-time dashboard analytics tools with Role-Based Access Control (RBAC) separating CEO and Admin permissions.

---

## Technical Architecture & Core Stack

### Backend
- **Node.js** with **Express.js** as the runtime framework.
- **MongoDB** with **Mongoose ODM** for data structures and transactional validations.
- **JSON Web Tokens (JWT)** with full token rotation (Access Token & Refresh Token cycle).
- **Socket.io** for real-time stock alerts and cashier sale broadcasts.
- **Multer** and **Cloudinary SDK** for handling dynamic image uploads with automatic local folder fallbacks.
- **Helmet**, **CORS**, and **Express-Rate-Limit** for security filters and rate limiting.

### Frontend
- **React.js** scaffolded using **Vite**.
- **Tailwind CSS v4** for modern styling and dark/light modes.
- **React Router Dom** for client-side navigation paths.
- **Axios** for API queries with automatic token-refresh interceptors.
- **Recharts** for CEO financial and metrics analytics widgets.
- **Lucide React** for dynamic icon packs.

---

## Directory Folder Structure

```
merchant-erp/
├── backend/
│   ├── config/             # DB & Cloudinary connection drivers
│   ├── controllers/        # REST route controllers
│   ├── middleware/         # Auth checkers, Rate limiters, upload configurations
│   ├── models/             # Mongoose schemas (User, Product, Sale, etc.)
│   ├── routes/             # REST route files
│   ├── utils/              # Socket managers, QR render, token generators
│   ├── server.js           # Server runner entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # UI elements (Sidebar, Navbar, Toasts)
│   │   ├── context/        # Auth, Settings, and Socket Notification state providers
│   │   ├── pages/          # Dashboard, POS, Products, Logs, Settings, etc.
│   │   ├── utils/          # Interceptor-enabled API client
│   │   ├── App.jsx         # Routes sheet
│   │   └── main.jsx        # Bootstrapper entrypoint
│   ├── vite.config.js
│   └── package.json
├── .env.example            # Environment variables template
└── README.md
```

---

## Installation & Setup Instructions

### Prerequisites
- Make sure you have **Node.js** (v18+ recommended) and **npm** installed.
- Ensure a local instance of **MongoDB** is running on your system (default `mongodb://localhost:27017/merchant_erp`), or have a MongoDB Atlas URI ready.

### Steps to Run

#### 1. Setup Environment Configuration
Copy the template `.env.example` file located in the root of this repository and configure your variables in `backend/.env`:

```bash
# Go to backend and create .env
cd backend
cp ../.env.example .env
```

#### 2. Launch the Backend Server
From the root workspace directory, install dependencies and start the backend development server:

```bash
cd backend
npm install
npm run dev
```
The server will boot in development mode on port `5000` with the database connected.

#### 3. Launch the Frontend React Client
Open a second terminal window, navigate to the frontend directory, install dependencies, and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```
The Vite client will launch on `http://localhost:5173`.

---

## ERP Setup & Bootstrapping

1. On the very first run, navigate to `http://localhost:5173/login`.
2. Click **"New ERP system setup? Initialize CEO"** at the bottom of the page.
3. Complete the form to register the master CEO administrator account. This will bootstrap the system.
4. Sign in using your newly created CEO credentials.
5. In the CEO Dashboard, you can access **Admin Management** to register secondary cashiers, configure checkboxes for custom permissions, or change active account status.
