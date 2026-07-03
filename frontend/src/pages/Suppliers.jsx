import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import { Truck, Plus, Edit2, Trash2, History, X, Receipt } from 'lucide-react';

const Suppliers = () => {
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierHistory, setSupplierHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [linkedProducts, setLinkedProducts] = useState([]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/suppliers');
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve suppliers list', 'error');
    } finally {
      setLoading(false);
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
    fetchSuppliers();
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedSupplier(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setLinkedProducts([]);
    setIsModalOpen(true);
  };

  const openEditModal = (supp) => {
    setModalMode('edit');
    setSelectedSupplier(supp);
    setName(supp.name);
    setPhone(supp.phone);
    setEmail(supp.email || '');
    setAddress(supp.address || '');
    setLinkedProducts(supp.products?.map((p) => p._id) || []);
    setIsModalOpen(true);
  };

  const openHistoryModal = async (supp) => {
    setSelectedSupplier(supp);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await API.get(`/suppliers/${supp._id}/history`);
      if (data.success) {
        setSupplierHistory(data.data);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve supplier purchase history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCheckboxChange = (id) => {
    setLinkedProducts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      addToast('Error', 'Name and phone fields are required', 'error');
      return;
    }

    const payload = { name, phone, email, address, products: linkedProducts };

    try {
      let res;
      if (modalMode === 'add') {
        res = await API.post('/suppliers', payload);
      } else {
        res = await API.put(`/suppliers/${selectedSupplier._id}`, payload);
      }

      if (res.data.success) {
        addToast('Success', `Supplier profile ${modalMode === 'add' ? 'created' : 'updated'} successfully`, 'success');
        setIsModalOpen(false);
        fetchSuppliers();
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const { data } = await API.delete(`/suppliers/${id}`);
      if (data.success) {
        addToast('Success', 'Supplier deleted successfully', 'success');
        fetchSuppliers();
      }
    } catch (err) {
      addToast('Error', 'Failed to delete supplier', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-500" />
            Supplier Management
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage supply logs, contact details and review inventory history logs.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Supplier Partner
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Scanning suppliers registry...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No suppliers registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                  <th className="py-3 px-6">Company / Name</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Address Details</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {suppliers.map((supp) => (
                  <tr key={supp._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-200">{supp.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{supp.phone}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{supp.email || <span className="text-slate-650 italic">None</span>}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium max-w-xs truncate">{supp.address || <span className="text-slate-650 italic">None</span>}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openHistoryModal(supp)}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-400" />
                        Log history
                      </button>
                      <button
                        onClick={() => openEditModal(supp)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supp._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded-xl transition-all"
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

      {/* CREATE / UPDATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">
                {modalMode === 'add' ? 'Add Supplier Partner' : 'Edit Supplier Partner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Supplier Company Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Distributor Inc."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@distributor.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Office Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Warehouse 1B, Industrials Park"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">Linked Catalog Products</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 border border-slate-850 rounded-xl max-h-40 overflow-y-auto">
                  {products.map((prod) => (
                    <label key={prod._id} className="flex items-center gap-2 text-xs text-slate-350 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={linkedProducts.includes(prod._id)}
                        onChange={() => handleCheckboxChange(prod._id)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-650 focus:ring-0"
                      />
                      {prod.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER HISTORY SLIDE OVER/MODAL */}
      {isHistoryOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">
                Purchase Order History: <span className="text-indigo-400">{selectedSupplier.name}</span>
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 max-h-[30rem] overflow-y-auto">
              {historyLoading ? (
                <div className="text-center py-10 text-slate-500 text-xs">Retrieving supply history...</div>
              ) : supplierHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No purchase transactions recorded with this supplier.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold pb-2">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Product</th>
                      <th className="py-2.5">Quantity</th>
                      <th className="py-2.5">Unit Cost</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {supplierHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-800/10">
                        <td className="py-3 text-slate-400 font-mono text-[10px]">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-slate-200 font-semibold">{item.product?.name || <span className="text-rose-500 italic">Deleted Product</span>}</td>
                        <td className="py-3 text-slate-300 font-semibold">{item.quantity} units</td>
                        <td className="py-3 text-indigo-400 font-bold">
                          {currencySymbol}
                          {item.cost?.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                              item.status === 'Received'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/50'
                                : 'bg-amber-950 text-amber-300 border border-amber-900/50'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
