import { useState, useContext } from 'react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { User, Mail, Calendar, KeyRound, ShieldCheck, Lock, Camera } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const { addToast } = useContext(NotificationContext);

  const [name, setName] = useState(user?.name || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    user?.profileImage ? `http://localhost:5000${user.profileImage}` : ''
  );

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Validation Error', 'Name cannot be empty.', 'warning');
      return;
    }

    setProfileLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) {
      formData.append('profileImage', imageFile);
    }

    try {
      const { data } = await API.put('/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        addToast('Success', 'Profile details updated.', 'success');
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        setImageFile(null);
      }
    } catch (error) {
      addToast(
        'Update Failed',
        error.response?.data?.message || 'Unable to update profile.',
        'error'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      addToast('Validation Error', 'Please fill out all fields.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('Validation Error', 'New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('Validation Error', 'Password must be at least 6 characters.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.put('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      if (data.success) {
        addToast('Success', 'Password updated successfully.', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      addToast(
        'Update Failed',
        error.response?.data?.message || 'Unable to update password.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const getFormattedDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
          <User className="w-7 h-7 text-indigo-500" />
          Profile Dashboard
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Manage your personal account details and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-500/35 flex items-center justify-center font-extrabold text-3xl text-indigo-400 shadow-md overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.slice(0, 2).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full border border-slate-900 cursor-pointer shadow-md transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
                accept="image/*"
              />
            </label>
          </div>

          <div className="w-full">
            <h2 className="text-lg font-bold text-slate-100">{user?.name}</h2>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                user?.role === 'CEO'
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
            >
              {user?.role}
            </span>
          </div>

          {/* Profile Editor Form */}
          <form onSubmit={handleProfileUpdateSubmit} className="w-full space-y-3 pt-2">
            <div>
              <label className="text-[10px] text-slate-500 block text-left mb-1 font-semibold">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none"
                placeholder="Full Name"
                required
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-850 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>

          <div className="w-full border-t border-slate-850 pt-4 space-y-3.5 text-left text-xs">
            <div className="flex items-center gap-2.5 text-slate-350">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-500 font-medium">Email Address</p>
                <p className="font-semibold text-slate-200 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-350">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Member Since</p>
                <p className="font-semibold text-slate-200">
                  {getFormattedDate(user?.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-350">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Account Status</p>
                <p className="font-semibold text-emerald-450 flex items-center gap-1">
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Change Password
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Update your account password. For security, do not share your credentials.
            </p>
          </div>

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-600" />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-600" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-600" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Verify new password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-850 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-lg"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
