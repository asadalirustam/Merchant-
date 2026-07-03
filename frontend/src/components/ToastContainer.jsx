import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useContext(NotificationContext);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => {
        let bgColor = 'bg-slate-900 border-slate-800 text-slate-100';
        let Icon = Info;

        if (toast.type === 'success') {
          bgColor = 'bg-emerald-950 border-emerald-800 text-emerald-200';
          Icon = CheckCircle;
        } else if (toast.type === 'warning') {
          bgColor = 'bg-amber-950 border-amber-800 text-amber-200';
          Icon = AlertTriangle;
        } else if (toast.type === 'error') {
          bgColor = 'bg-rose-950 border-rose-800 text-rose-200';
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-in transition-all duration-300 ${bgColor}`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-800/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
