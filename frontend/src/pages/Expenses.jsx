import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import { DollarSign, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const Expenses = () => {
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Form Fields
  const [type, setType] = useState('Rent');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/expenses');
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve expenses log list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedExpense(null);
    setType('Rent');
    setAmount(0);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (exp) => {
    setModalMode('edit');
    setSelectedExpense(exp);
    setType(exp.type);
    setAmount(exp.amount);
    setDescription(exp.description || '');
    setDate(new Date(exp.date).toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || amount <= 0) {
      addToast('Error', 'Type and positive amount are required', 'error');
      return;
    }

    const payload = {
      type,
      amount: Number(amount),
      description,
      date: new Date(date),
    };

    setSubmitLoading(true);
    try {
      let res;
      if (modalMode === 'add') {
        res = await API.post('/expenses', payload);
      } else {
        res = await API.put(`/expenses/${selectedExpense._id}`, payload);
      }

      if (res.data.success) {
        addToast('Success', `Expense record ${modalMode === 'add' ? 'saved' : 'updated'} successfully`, 'success');
        setIsModalOpen(false);
        fetchExpenses();
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;

    try {
      const { data } = await API.delete(`/expenses/${id}`);
      if (data.success) {
        addToast('Success', 'Expense record removed', 'success');
        fetchExpenses();
      }
    } catch (error) {
      addToast('Error', 'Failed to delete expense record', 'error');
    }
  };

  const getExpenseTypeColor = (type) => {
    switch (type) {
      case 'Rent':
        return 'bg-blue-950/60 text-blue-300 border-blue-900/50';
      case 'Electricity':
        return 'bg-amber-950/60 text-amber-300 border-amber-900/50';
      case 'Internet':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-900/50';
      case 'Salary':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-900/50';
      default:
        return 'bg-slate-950 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-indigo-500" />
            Operational Expense Logs
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Record utility payments, staff salaries, rent agreements, and general shop costs.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Record Expense Log
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span>Scanning expense ledgers...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No expenses recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                  <th className="py-3 px-6">Billing Date</th>
                  <th className="py-3 px-6">Expense Type</th>
                  <th className="py-3 px-6">Recorded By</th>
                  <th className="py-3 px-6">Description Details</th>
                  <th className="py-3 px-6">Billing Amount</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-[10px]">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded border text-[9px] font-bold ${getExpenseTypeColor(exp.type)}`}>
                        {exp.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200">{exp.recordedBy?.name || <span className="text-slate-550 italic">System</span>}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium max-w-xs truncate" title={exp.description}>
                      {exp.description || <span className="text-slate-650 italic">None</span>}
                    </td>
                    <td className="py-4 px-6 font-black text-rose-455">
                      {currencySymbol}
                      {exp.amount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp._id)}
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

      {/* CREATE / UPDATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">
                {modalMode === 'add' ? 'Record Expense Log' : 'Edit Expense Log'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Expense Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                  required
                >
                  <option value="Rent">Shop Rent</option>
                  <option value="Electricity">Electricity Bill</option>
                  <option value="Internet">Internet Service</option>
                  <option value="Salary">Staff Salary</option>
                  <option value="Other">Other Miscellaneous Expenses</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Billing Amount ({currencySymbol})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={0.01}
                  step="0.01"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Payment Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Billing reference number or details..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none resize-none"
                />
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
                  {submitLoading ? 'Saving...' : 'Record Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
