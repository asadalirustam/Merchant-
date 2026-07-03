import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { SettingsContext } from '../context/SettingsContext';
import { Bell, Moon, Sun, ShieldCheck, AlertTriangle } from 'lucide-react';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const { notifications, clearNotifications } = useContext(NotificationContext);
  const { settings, updateSettings } = useContext(SettingsContext);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = async () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const formData = new FormData();
    formData.append('theme', nextTheme);
    await updateSettings(formData);
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
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 no-print">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-100">
          Welcome back, <span className="text-indigo-400 font-semibold">{user?.name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors relative"
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
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
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
      </div>
    </header>
  );
};

export default Navbar;
