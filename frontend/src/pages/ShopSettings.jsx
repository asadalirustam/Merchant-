import { useState, useContext, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  Settings,
  Upload,
  Store,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Percent,
} from 'lucide-react';

const ShopSettings = () => {
  const { settings, updateSettings } = useContext(SettingsContext);
  const { changePassword } = useContext(AuthContext);
  const { addToast } = useContext(NotificationContext);

  // General Settings States
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [theme, setTheme] = useState('dark');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setCurrency(settings.currency || 'USD');
      setTaxPercentage(settings.taxPercentage || 0);
      setInvoiceFooter(settings.invoiceFooter || '');
      setTheme(settings.theme || 'dark');
      if (settings.logo) {
        setLogoPreview(`http://localhost:5000${settings.logo}`);
      }
    }
  }, [settings]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);

    const formData = new FormData();
    formData.append('shopName', shopName);
    formData.append('address', address);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('currency', currency);
    formData.append('taxPercentage', taxPercentage);
    formData.append('invoiceFooter', invoiceFooter);
    formData.append('theme', theme);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    const result = await updateSettings(formData);
    setSettingsLoading(false);

    if (result.success) {
      addToast('Success', 'Shop configurations updated successfully', 'success');
    } else {
      addToast('Error', result.message, 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Validation Error', 'New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Validation Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    setPasswordLoading(true);
    const result = await changePassword(oldPassword, newPassword);
    setPasswordLoading(false);

    if (result.success) {
      addToast('Success', 'Master password changed successfully', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      addToast('Error', result.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-500" />
          ERP Shop Settings
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">CEO portal for branding, currency formatting, tax rates, and security key changes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* General settings form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="font-bold text-sm text-slate-200 pb-3 border-b border-slate-850">Shop Configurations</h3>
          
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div className="relative w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div>
                <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Logo Image
                  <input type="file" onChange={handleLogoChange} className="hidden" accept="image/*" />
                </label>
                <p className="text-[10px] text-slate-500 mt-1.5">Recommended format: SVG, PNG or WebP with ratio 1:1.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Company Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Shop Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Store Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Store Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Currency Code</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Sales Tax (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    min={0}
                    max={100}
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pr-8 text-xs text-slate-100 outline-none transition-all"
                  />
                  <Percent className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Global Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none transition-all"
                >
                  <option value="dark">Dark Slate Mode</option>
                  <option value="light">Light Portal Mode</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">POS Invoice Footer Note</label>
              <textarea
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={settingsLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg transition-all"
              >
                {settingsLoading ? 'Saving Settings...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Master Password card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 self-start">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <KeyRound className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="font-bold text-sm text-slate-200">Change CEO Password</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition-all"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-200 font-medium"
              >
                {showPassword ? 'Hide characters' : 'Show characters'}
              </button>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold py-2.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {passwordLoading ? 'Updating credentials...' : 'Update Security Key'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopSettings;
