import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import { Receipt, Plus, CheckCircle, Clock, Trash2, X, RefreshCw } from 'lucide-react';

const Purchases = () => {
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);
  const [status, setStatus] = useState('Pending');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/purchases');
      if (data.success) {
        setPurchases(data.data);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve purchase orders logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await API.get('/suppliers');
      if (data.success) {
        setSuppliers(data.data);
        setSupplierId(data.data[0]?._id || '');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=200');
      if (data.success) {
        setProducts(data.data.products);
        setProductId(data.data.products[0]?._id || '');
        setCost(data.data.products[0]?.costPrice || 0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const handleProductChange = (id) => {
    setProductId(id);
    const prod = products.find((p) => p._id === id);
    if (prod) {
      setCost(prod.costPrice || 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !productId || quantity <= 0 || cost < 0) {
      addToast('Validation Error', 'Please complete all required fields', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const { data } = await API.post('/purchases', {
        supplier: supplierId,
        product: productId,
        quantity: Number(quantity),
        cost: Number(cost),
        status,
        date: new Date(date),
      });

      if (data.success) {
        addToast('Success', 'Purchase order logged successfully', 'success');
        setIsModalOpen(false);
        setQuantity(1);
        fetchPurchases();
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Failed to record purchase', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReceive = async (id) => {
    try {
      const { data } = await API.patch(`/purchases/${id}/receive`);
      if (data.success) {
        addToast('Success', 'Stock received and inventory level updated', 'success');
        fetchPurchases();
      }
    } catch (error) {
      addToast('Error', 'Failed to mark stock received', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase log? Stock levels will be decremented.')) return;

    try {
      const { data } = await API.delete(`/purchases/${id}`);
      if (data.success) {
        addToast('Success', 'Purchase log deleted and inventory adjusted', 'success');
        fetchPurchases();
      }
    } catch (error) {
      addToast('Error', 'Failed to delete purchase record', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-500" />
            Purchase & Supply Logs
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Record inbound restocks, review cost prices, and receive pending order loads.</p>
        </div>
        <button
          onClick={() => {
            setQuantity(1);
            setStatus('Pending');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Log Restock Order
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span>Scanning supply logs...</span>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No restock orders logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Supplier</th>
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-6">Qty</th>
                  <th className="py-3 px-6">Cost Total</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {purchases.map((pur) => (
                  <tr key={pur._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-[10px]">{new Date(pur.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6 font-bold text-slate-200">{pur.supplier?.name || <span className="text-slate-500 italic">Unknown</span>}</td>
                    <td className="py-4 px-6 font-medium text-slate-200">
                      {pur.product ? (
                        <div>
                          <p className="font-semibold">{pur.product.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">SKU: {pur.product.sku}</p>
                        </div>
                      ) : (
                        <span className="text-rose-500 italic">Deleted Product</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-semibold">{pur.quantity} units</td>
                    <td className="py-4 px-6 font-black text-indigo-400">
                      {currencySymbol}
                      {(pur.cost * pur.quantity).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          pur.status === 'Received'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                        }`}
                      >
                        {pur.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {pur.status === 'Pending' && (
                        <button
                          onClick={() => handleReceive(pur._id)}
                          className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg border border-emerald-500/20 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Check Stock In
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(pur._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-slate-850 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / RESTOCK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">Log Restock Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Product Item</label>
                <select
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                  required
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (SKU: {p.sku} | Cost: {currencySymbol}{p.costPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Order Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Unit Cost price ({currencySymbol})</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Shipping Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Order Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="Pending">Pending (Awaiting Load)</option>
                    <option value="Received">Received (Instantly Stock-In)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-355 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {submitLoading ? 'Saving...' : 'Save Order Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
