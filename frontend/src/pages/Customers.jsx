import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import { UserCheck, Plus, Edit2, Trash2, History, X, Receipt } from 'lucide-react';

const Customers = () => {
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/customers');
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve customers registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setModalMode('edit');
    setSelectedCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setIsModalOpen(true);
  };

  const openHistoryModal = async (cust) => {
    setSelectedCustomer(cust);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await API.get(`/customers/${cust._id}/history`);
      if (data.success) {
        setCustomerHistory(data.data.sales);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve customer history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      addToast('Error', 'Name and Phone are required fields', 'error');
      return;
    }

    const payload = { name, phone, email, address };

    try {
      let res;
      if (modalMode === 'add') {
        res = await API.post('/customers', payload);
      } else {
        res = await API.put(`/customers/${selectedCustomer._id}`, payload);
      }

      if (res.data.success) {
        addToast('Success', `Customer profile ${modalMode === 'add' ? 'created' : 'updated'} successfully`, 'success');
        setIsModalOpen(false);
        fetchCustomers();
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { data } = await API.delete(`/customers/${id}`);
      if (data.success) {
        addToast('Success', 'Customer deleted from registry', 'success');
        fetchCustomers();
      }
    } catch (err) {
      addToast('Error', 'Failed to delete customer', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-indigo-500" />
            Customer Accounts
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage buyer contact details and review POS billing ledger history.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Register Customer
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Scanning customers list...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No customers registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Total Spent</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {customers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-200">{cust.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{cust.phone}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{cust.email || <span className="text-slate-650 italic">None</span>}</td>
                    <td className="py-4 px-6 font-black text-indigo-400">
                      {currencySymbol}
                      {cust.totalSpending?.toLocaleString() || 0}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openHistoryModal(cust)}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-400" />
                        Purchase logs
                      </button>
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cust._id)}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">
                {modalMode === 'add' ? 'Register Customer Profile' : 'Edit Customer Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Phone Number (Unique)</label>
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
                    placeholder="buyer@client.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="456 Avenue St, Commerce City"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PURCHASE LEDGER HISTORY MODAL */}
      {isHistoryOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">
                POS Transaction Ledger: <span className="text-indigo-400">{selectedCustomer.name}</span>
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 max-h-[30rem] overflow-y-auto">
              {historyLoading ? (
                <div className="text-center py-10 text-slate-500 text-xs">Scanning ledger lines...</div>
              ) : customerHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No POS checkout logs found for this customer account.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold pb-2">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Invoice Number</th>
                      <th className="py-2.5">Cashier</th>
                      <th className="py-2.5">Payment Method</th>
                      <th className="py-2.5 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {customerHistory.map((sale) => (
                      <tr key={sale._id} className="hover:bg-slate-800/10">
                        <td className="py-3 text-slate-400 font-mono text-[10px]">
                          {new Date(sale.date).toLocaleString()}
                        </td>
                        <td className="py-3 text-slate-200 font-semibold flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3 text-slate-400">{sale.cashier?.name}</td>
                        <td className="py-3">
                          <span className="uppercase text-[9px] px-1.5 py-0.2 bg-slate-950 border border-slate-800 rounded text-slate-400">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 text-right text-indigo-400 font-black">
                          {currencySymbol}
                          {sale.grandTotal?.toLocaleString()}
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

export default Customers;
