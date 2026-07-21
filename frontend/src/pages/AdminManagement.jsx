import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { NotificationContext } from '../context/NotificationContext';
import {
  Users,
  UserPlus,
  KeyRound,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  History,
  X,
} from 'lucide-react';

const AdminManagement = () => {
  const { addToast } = useContext(NotificationContext);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminLogs, setAdminLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Error', 'Please fill in required fields', 'error');
      return;
    }

    try {
      const { data } = await API.post('/admins', { name, email, password });
      if (data.success) {
        addToast('Success', 'Admin profile registered successfully', 'success');
        setIsCreateModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
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
      const { data } = await API.put(`/admins/${selectedAdmin._id}`, { name });
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
      console.error(error);
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
      console.error(error);
      addToast('Error', 'Failed to delete Admin', 'error');
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setName(admin.name);
    setIsEditModalOpen(true);
  };

  const openResetModal = (admin) => {
    setSelectedAdmin(admin);
    setIsResetModalOpen(true);
  };

  const openActivityModal = async (admin) => {
    setSelectedAdmin(admin);
    setIsActivityOpen(true);
    setLogsLoading(true);
    try {
      const { data } = await API.get(`/admins/${admin._id}/activity`);
      if (data.success) {
        setAdminLogs(data.data);
      }
    } catch (error) {
      console.error(error);
      addToast('Error', 'Failed to retrieve admin activity log', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" />
            Admin Account Managers
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">CEO workspace for managing cashier logins, passwords, and viewing activity trails.</p>
        </div>
        <button
          onClick={() => {
            setName('');
            setEmail('');
            setPassword('');
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Add Admin Account
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
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-800/10">
                    <td className="py-4 px-6 font-bold text-slate-200">{admin.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{admin.email}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(admin._id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          admin.status === 'Enabled'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800/50 hover:bg-rose-900/40'
                        }`}
                      >
                        {admin.status === 'Enabled' ? (
                          <>
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 shrink-0" />
                            Disabled
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openActivityModal(admin)}
                        className="px-2 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        Activity Logs
                      </button>
                      <button
                        onClick={() => openResetModal(admin)}
                        className="p-1.5 text-slate-400 hover:text-amber-450 hover:bg-slate-850 rounded-xl transition-all"
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(admin)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-xl transition-all"
                        title="Edit Admin details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded-xl transition-all"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Register Admin Profile</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin name"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 pl-9 text-xs text-slate-100 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Edit Admin Name</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
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
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Force Password Reset</h3>
            </div>
            <form onSubmit={handleResetSubmit} className="p-5 space-y-4">
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
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
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVITY LOGS MODAL */}
      {isActivityOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">
                Activity Logs: <span className="text-indigo-400">{selectedAdmin.name}</span>
              </h3>
              <button onClick={() => setIsActivityOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto">
              {logsLoading ? (
                <div className="text-center py-8 text-slate-500 text-xs">Scanning logs...</div>
              ) : adminLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No activity logs recorded for this Admin.</div>
              ) : (
                <div className="space-y-3">
                  {adminLogs.map((log) => (
                    <div key={log._id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-[11px] font-medium leading-relaxed">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-indigo-455 font-bold uppercase tracking-wider text-[9px]">{log.action}</span>
                        <span className="text-slate-500 text-[9px] font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-350">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
