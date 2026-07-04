import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import ToastContainer from './components/ToastContainer';

// Import Pages
import Login from './pages/Login';
import CEODashboard from './pages/CEODashboard';
import AdminManagement from './pages/AdminManagement';
import ActivityLogs from './pages/ActivityLogs';
import ShopSettings from './pages/ShopSettings';
import POSBilling from './pages/POSBilling';
import Products from './pages/Products';
import InvoiceHistory from './pages/InvoiceHistory';
import SalesReports from './pages/SalesReports';
import Profile from './pages/Profile';

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

      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<Login />} />

        {/* CEO-Only Protected Routes */}
        <Route element={<ProtectedLayout allowedRoles={['CEO']} />}>
          <Route path="/admins" element={<AdminManagement />} />
          <Route path="/reports" element={<SalesReports />} />
          <Route path="/invoices" element={<InvoiceHistory />} />
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
        </Route>

        {/* Catch-all fallback redirections */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
