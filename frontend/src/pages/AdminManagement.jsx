import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { NotificationContext } from '../context/NotificationContext';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  UserX,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';

const AdminManagement = () => {
  const { addToast } = useContext(NotificationContext);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [permissions, setPermissions] = useState([]);

  const permissionOptions = [
    { value: 'MANAGE_PRODUCTS', label: 'Product Catalog' },
    { value: 'MANAGE_CATEGORIES', label: 'Category Settings' },
    { value: 'MANAGE_INVENTORY', label: 'Inventory adjustments' },
    { value: 'MANAGE_SALES', label: 'Sales & POS terminal' },
    { value: 'MANAGE_PURCHASES', label: 'Purchases & supply orders' },
    { value: 'MANAGE_SUPPLIERS', label: 'Supplier profiles' },
    { value: 'MANAGE_CUSTOMERS', label: 'Customer accounts' },
    { value: 'MANAGE_EXPENSES', label: 'Expenses & utility bills' },
  ];

  const fetchAdmins = async () => {
    try {
      const { data } = await API.get('/admins');
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (error) {
      console.error(error);
      addToast('Error', 'Failed to retrieve Admin accounts list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCheckboxChange = (value) => {
    setPermissions((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Error', 'Please fill in required fields', 'error');
      return;
    }

    try {
      const { data } = await API.post('/admins', { name, email, password, permissions });
      if (data.success) {
        addToast('Success', 'Admin profile registered successfully', 'success');
        setIsCreateModalOpen(false);
        // Clear
        setName('');
        setEmail('');
        setPassword('');
        setPermissions([]);
        fetchAdmins();
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Failed to register Admin', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      addToast('Error', 'Name field is required', 'error');
      return;
    }

    try {
      const { data } = await API.put(`/admins/${selectedAdmin._id}`, { name, permissions });
      if (data.success) {
        addToast('Success', 'Admin profile updated successfully', 'success');
        setIsEditModalOpen(false);
        fetchAdmins();
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast('Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const { data } = await API.put(`/admins/${selectedAdmin._id}/reset-password`, { newPassword });
      if (data.success) {
        addToast('Success', 'Admin password reset successfully', 'success');
        setIsResetModalOpen(false);
        setNewPassword('');
      }
    } catch (error) {
      addToast('Error', error.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await API.patch(`/admins/${id}/toggle-status`);
      if (data.success) {
        addToast('Success', data.message, 'success');
        fetchAdmins();
      }
    } catch (error) {
      addToast('Error', 'Failed to toggle account status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this Admin?')) return;

    try {
      const { data } = await API.delete(`/admins/${id}`);
      if (data.success) {
        addToast('Success', 'Admin profile deleted successfully', 'success');
        fetchAdmins();
      }
    } catch (error) {
      addToast('Error', 'Failed to delete Admin', 'error');
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setName(admin.name);
    setPermissions(admin.permissions || []);
    setIsEditModalOpen(true);
  };

  const openResetModal = (admin) => {
    setSelectedAdmin(admin);
    setIsResetModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" />
            Admin Accounts Registry
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">CEO workspace for managing roles and security authorization keys.</p>
        </div>
        <button
          onClick={() => {
            setName('');
            setEmail('');
            setPassword('');
            setPermissions([]);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Register New Admin
        </button>
      </div>

      {/* Admin Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading admin list...</div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No Admin users registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Assigned Permissions</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-800/10">
                    <td className="py-4 px-6 font-semibold text-slate-200">{admin.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{admin.email}</td>
                    <td className="py-4 px-6">
                      {admin.permissions?.length === 0 ? (
                        <span className="text-[10px] text-slate-500 italic">No permissions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {admin.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[9px] font-medium"
                            >
                              <Shield className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                              {perm.replace('MANAGE_', '')}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(admin._id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          admin.status === 'Active'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800/50 hover:bg-rose-900/40'
                        }`}
                      >
                        {admin.status === 'Active' ? (
                          <>
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 shrink-0" />
                            Suspended
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openResetModal(admin)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/50 rounded-lg transition-all"
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(admin)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-all"
                        title="Edit Admin permissions"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 rounded-lg transition-all"
                        title="Delete Admin"
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

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Register Admin Profile</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Admin name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@merchant.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-9 text-xs text-slate-100 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">Access Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 border border-slate-850 rounded-xl max-h-48 overflow-y-auto">
                  {permissionOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.includes(opt.value)}
                        onChange={() => handleCheckboxChange(opt.value)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Edit Admin Permissions</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={selectedAdmin?.email || ''}
                  className="w-full bg-slate-950/50 border border-slate-850 rounded-xl p-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">Access Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 border border-slate-850 rounded-xl max-h-48 overflow-y-auto">
                  {permissionOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.includes(opt.value)}
                        onChange={() => handleCheckboxChange(opt.value)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Force Password Reset</h3>
            </div>
            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Resetting password for admin account: <span className="font-semibold text-indigo-400">{selectedAdmin?.name}</span>
              </p>
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Security Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-550 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
