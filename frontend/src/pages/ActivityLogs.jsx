import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { NotificationContext } from '../context/NotificationContext';
import { History, Search, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const ActivityLogs = () => {
  const { addToast } = useContext(NotificationContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchAction, setSearchAction] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/activity-logs?page=${page}&limit=50&action=${searchAction}`);
      if (data.success) {
        setLogs(data.data.logs);
        setPages(data.data.pages);
      }
    } catch (error) {
      console.error(error);
      addToast('Error', 'Failed to retrieve audit activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('REGISTRATION') || action.includes('CREATE')) {
      return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';
    }
    if (action.includes('DELETE') || action.includes('SUSPEND')) {
      return 'bg-rose-950/60 text-rose-300 border-rose-800/40';
    }
    if (action.includes('UPDATE') || action.includes('ADJUST') || action.includes('PRICE_CHANGED')) {
      return 'bg-amber-950/60 text-amber-300 border-amber-800/40';
    }
    return 'bg-slate-950 text-slate-400 border-slate-800';
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-500" />
            Audit Activity Logs
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Auditing log trails of every administrative check and POS invoice execution.</p>
        </div>
        
        {/* Search filter form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              placeholder="Filter by Action (e.g. LOGIN)"
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-lg"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchAction('');
              setPage(1);
              fetchLogs();
            }}
            className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Logs Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span>Scanning database records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No activity logs matching parameters.</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6">Operator</th>
                    <th className="py-3 px-6">Action Category</th>
                    <th className="py-3 px-6">IP Address</th>
                    <th className="py-3 px-6">Transaction Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-6 text-slate-400 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-200">
                        {log.user ? (
                          <div>
                            <p className="font-semibold text-slate-200">{log.user.name}</p>
                            <p className="text-[9px] text-slate-500 font-mono">{log.user.email} ({log.user.role})</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">System Auto</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 rounded border text-[9px] font-bold ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 font-mono text-[10px]">{log.ipAddress}</td>
                      <td className="py-3.5 px-6 text-slate-300 font-medium flex items-center gap-1.5 max-w-md">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate" title={log.details}>{log.details}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="p-4 border-t border-slate-850 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
                <span>Page {page} of {pages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                    disabled={page === pages}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
