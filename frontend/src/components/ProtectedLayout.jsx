import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { ShieldAlert } from 'lucide-react';

const ProtectedLayout = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Validating security session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to access-denied screen if user's role is not authorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-900/50 flex items-center justify-center text-rose-500 mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">Access Restrained</h1>
          <p className="text-sm text-slate-400">
            Your current account role ({user.role}) is unauthorized to view this admin panel. Please contact the system CEO if you think this is a mistake.
          </p>
          <a
            href={user.role === 'CEO' ? '/dashboard' : '/pos'}
            className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs rounded-xl font-semibold border border-slate-700 hover:border-slate-600 transition-all"
          >
            Return to Authorized Portal
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar - fixed width */}
      <Sidebar />

      {/* Main body wrapper */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Navbar */}
        <Navbar />

        {/* Content area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
