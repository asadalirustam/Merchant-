import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { SettingsContext } from '../context/SettingsContext';
import { Bell, Moon, Sun, ShieldCheck, AlertTriangle, Menu, LogOut, User } from 'lucide-react';
import { getImageUrl } from '../utils/urlHelper';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, clearNotifications } = useContext(NotificationContext);
  const { theme, setTheme } = useContext(SettingsContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 no-print">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 lg:hidden transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm sm:text-lg font-bold text-slate-100 hidden sm:block truncate">
          Welcome back, <span className="text-indigo-400 font-semibold">{user?.name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors relative cursor-pointer"
            title="View Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping-slow"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-xs text-slate-200">Real-Time Alerts ({notifications.length})</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">No notifications yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-3.5 hover:bg-slate-800/20 flex gap-3 items-start">
                      {getNotificationIcon(notif.type)}
                      <div>
                        <p className="text-xs font-medium text-slate-200">{notif.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{notif.message}</p>
                        <span className="text-[8px] text-slate-500 block mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge (clickable to go to profile) */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
          title="View Profile"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center font-bold text-indigo-400 text-xs shrink-0 overflow-hidden">
            {user?.profileImage ? (
              <img src={getImageUrl(user.profileImage)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-200 hidden md:inline truncate max-w-[100px]">
            {user?.name}
          </span>
        </button>

        {/* Top Navbar Sign Out / Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-900/50 hover:border-rose-700/60 text-xs rounded-xl font-medium transition-all cursor-pointer shadow-sm"
          title="Sign Out of Account"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
