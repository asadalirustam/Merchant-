import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import {
  LayoutDashboard,
  Users,
  History,
  Settings,
  ShoppingCart,
  Package,
  Receipt,
  FileDown,
  LogOut,
  Store,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    // CEO NAVIGATION PATHS
    {
      path: '/dashboard',
      label: 'CEO Dashboard',
      icon: LayoutDashboard,
      roles: ['CEO'],
    },
    {
      path: '/admins',
      label: 'Admin Management',
      icon: Users,
      roles: ['CEO'],
    },
    {
      path: '/reports',
      label: 'Sales Reports',
      icon: FileDown,
      roles: ['CEO'],
    },
    {
      path: '/invoices',
      label: 'Invoice History',
      icon: Receipt,
      roles: ['CEO'],
    },
    {
      path: '/logs',
      label: 'Activity Logs',
      icon: History,
      roles: ['CEO'],
    },
    {
      path: '/settings',
      label: 'Shop Settings',
      icon: Settings,
      roles: ['CEO'],
    },
    // ADMIN NAVIGATION PATHS
    {
      path: '/dashboard',
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin'],
    },
    {
      path: '/pos',
      label: 'POS Billing',
      icon: ShoppingCart,
      roles: ['Admin'],
    },
    {
      path: '/products',
      label: 'Products Catalog',
      icon: Package,
      roles: ['CEO', 'Admin'], // Both can access (Admin has CRUD, CEO has read-only overview)
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 no-print">
      {/* Brand header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        {settings.logo ? (
          <img src={`http://localhost:5000${settings.logo}`} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <Store className="w-7 h-7 text-indigo-500" />
        )}
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm text-slate-100 truncate">{settings.shopName}</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate">{user?.role} Portal</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {filteredMenuItems.map((item, idx) => {
          const Icon = item.icon;
          // React Router issue with multiple identical paths, differentiate matching
          return (
            <NavLink
              key={`${item.path}-${idx}`}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-450 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile segment */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col gap-3">
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-800/40 rounded-xl cursor-pointer transition-colors"
          title="View Profile Dashboard"
        >
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-indigo-400 shrink-0 overflow-hidden">
            {user?.profileImage ? (
              <img src={`http://localhost:5000${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{user?.name}</h4>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/50 hover:border-rose-900/55 text-xs rounded-xl font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
