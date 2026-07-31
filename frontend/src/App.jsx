import { useContext, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import ToastContainer from './components/ToastContainer';

// Lazy-loaded Pages for fast code-splitting
const Login = lazy(() => import('./pages/Login'));
const CEODashboard = lazy(() => import('./pages/CEODashboard'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const ShopSettings = lazy(() => import('./pages/ShopSettings'));
const POSBilling = lazy(() => import('./pages/POSBilling'));
const Products = lazy(() => import('./pages/Products'));
const InvoiceHistory = lazy(() => import('./pages/InvoiceHistory'));
const SalesReports = lazy(() => import('./pages/SalesReports'));
const Profile = lazy(() => import('./pages/Profile'));

// Loading Fallback Spinner Component
const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      <span className="text-xs font-medium text-slate-400">Loading page resources...</span>
    </div>
  </div>
);

// Root Route Redirect Handler
const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <>
      {/* Real-time Overlay Toast Alerts */}
      <ToastContainer />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public auth route */}
          <Route path="/login" element={<Login />} />

          {/* CEO-Only Protected Routes */}
          <Route element={<ProtectedLayout allowedRoles={['CEO']} />}>
            <Route path="/admins" element={<AdminManagement />} />
            <Route path="/reports" element={<SalesReports />} />
            <Route path="/logs" element={<ActivityLogs />} />
            <Route path="/settings" element={<ShopSettings />} />
          </Route>

          {/* Admin-Only Protected Routes */}
          <Route element={<ProtectedLayout allowedRoles={['Admin']} />}>
            <Route path="/pos" element={<POSBilling />} />
          </Route>

          {/* Shared CEO and Admin Protected Routes */}
          <Route element={<ProtectedLayout allowedRoles={['CEO', 'Admin']} />}>
            <Route path="/dashboard" element={<CEODashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/invoices" element={<InvoiceHistory />} />
          </Route>

          {/* Catch-all fallback redirections */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
