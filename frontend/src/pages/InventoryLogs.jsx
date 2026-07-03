import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import { ClipboardList, AlertTriangle, Plus, Minus, Settings, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const InventoryLogs = () => {
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();

  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAdjustment, setLoadingAdjustment] = useState(false);

  // Pagination for logs
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Manual Adjustment Form States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState(1);
  const [adjustmentAction, setAdjustmentAction] = useState('IN'); // 'IN', 'OUT', 'SET'
  const [sellingPrice, setSellingPrice] = useState('');

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      // Query activity logs filtering by INVENTORY_ADJUST actions
      const { data } = await API.get(`/activity-logs?page=${page}&limit=50&action=INVENTORY_ADJUST`);
      if (data.success) {
        setLogs(data.data.logs);
        setPages(data.data.pages);
      }
    } catch (error) {
      console.error(error);
      addToast('Error', 'Failed to retrieve stock adjustment history logs', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=200');
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      addToast('Error', 'Please select a product item to adjust', 'error');
      return;
    }

    setLoadingAdjustment(true);

    const selectedProduct = products.find(p => p._id === selectedProductId);
    const oldQty = selectedProduct?.quantity || 0;
    const oldPrice = selectedProduct?.sellingPrice || 0;

    const payload = {
      quantity: adjustmentQty,
      actionType: adjustmentAction,
    };

    if (sellingPrice && Number(sellingPrice) !== oldPrice) {
      payload.sellingPrice = Number(sellingPrice);
    }

    try {
      const { data } = await API.patch(`/products/${selectedProductId}/adjust`, payload);
      if (data.success) {
        addToast('Success', 'Stock levels adjusted successfully', 'success');
        
        // Reset adjustment form
        setAdjustmentQty(1);
        setSellingPrice('');
        setSelectedProductId('');

        // Refresh components
        fetchLogs();
        fetchProducts();
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Failed to apply stock adjustments', 'error');
    } finally {
      setLoadingAdjustment(false);
    }
  };

  const getAdjustmentDirectionText = (details) => {
    if (details.includes('Stock-In') || details.includes('Stock In adjusted: +')) {
      return { text: 'Stock-In', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-900/50' };
    }
    if (details.includes('Stock-Out') || details.includes('Stock Out adjusted: -')) {
      return { text: 'Stock-Out', color: 'bg-rose-950/60 text-rose-300 border-rose-900/50' };
    }
    return { text: 'Override', color: 'bg-slate-950 text-slate-400 border-slate-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-indigo-500" />
          Inventory Audit Logs
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">Track every stock variance, checkout deduction, receipt returns and manually adjusted levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Activity audit logs */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-450 uppercase tracking-wider">Adjustment Audit Trails</h3>
            <button
              onClick={() => {
                setPage(1);
                fetchLogs();
              }}
              className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[30rem]">
            {loadingLogs ? (
              <div className="text-center py-20 text-slate-500 text-xs">Scanning logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">No stock adjustment histories found.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Adjust Type</th>
                    <th className="py-2.5 px-4">Operator</th>
                    <th className="py-2.5 px-4">Audit log details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[11px]">
                  {logs.map((log) => {
                    const badge = getAdjustmentDirectionText(log.details);
                    return (
                      <tr key={log._id} className="hover:bg-slate-800/10">
                        <td className="py-3 px-4 text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold ${badge.color}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-350 font-semibold">{log.user?.name || 'System'}</td>
                        <td className="py-3 px-4 text-slate-200 font-medium leading-relaxed max-w-sm truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="p-4 border-t border-slate-850 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
              <span>Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:text-slate-200 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                  disabled={page === pages}
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:text-slate-200 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Manual stock adjustment panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 self-start">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Settings className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="font-bold text-sm text-slate-200">Manual Stock Adjustment</h3>
          </div>

          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="text-xs text-slate-450 block mb-1">Select Product Item</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const selProd = products.find(p => p._id === e.target.value);
                  setSellingPrice(selProd ? selProd.sellingPrice : '');
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                required
              >
                <option value="">Choose item...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (SKU: {p.sku} | Qty: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-455 block mb-1">Adjustment Action</label>
                <select
                  value={adjustmentAction}
                  onChange={(e) => setAdjustmentAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                >
                  <option value="IN">➕ Stock-In (Add)</option>
                  <option value="OUT">➖ Stock-Out (Subtract)</option>
                  <option value="SET">🔧 Set Stock Level</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-450 block mb-1">Adjustment Qty</label>
                <input
                  type="number"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Math.max(1, Number(e.target.value)))}
                  min={1}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Override Selling Price (Optional)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                min={0}
                step="0.01"
                placeholder="Leave blank to keep price"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loadingAdjustment || !selectedProductId}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              {loadingAdjustment ? 'Applying Adjustments...' : 'Apply Stock Change'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InventoryLogs;
