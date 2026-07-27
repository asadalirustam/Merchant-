import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { Store, Mail, Lock, User, ArrowRight, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import API from '../utils/api';

const Login = () => {
  const { login, registerCEO, forgotPassword, resetPassword } = useContext(AuthContext);
  const { addToast } = useContext(NotificationContext);
  const navigate = useNavigate();

  // Mode states
  const [isCEOMode, setIsCEOMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isResetConfirmMode, setIsResetConfirmMode] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Password Reset Fields
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCeoPassword, setShowCeoPassword] = useState(false);

  useEffect(() => {
    // Check if system has a CEO. If not, switch to CEO Setup
    const checkCeo = async () => {
      try {
        // We test register CEO with dummy check, or simply hit admins list.
        // If there are no users at all in database, we can auto-detect.
        await API.get('/auth/refresh').catch(err => err.response);
        // Let's check via a lightweight endpoint or guess. To be simple, we can provide a small setup toggle button or query a custom route.
        // Let's query general public check
        await API.get('/settings');
      } catch {
        // If server indicates no CEO setup, we can toggle CEOMode.
      }
    };
    checkCeo();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Error', 'Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    const result = await login(email, password, rememberMe);
    setLoading(false);

    if (result.success) {
      addToast('Welcome Back', 'Logged in successfully', 'success');
      // If user is CEO, send to dashboard. If Admin, send to POS
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser?.role === 'CEO') {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    } else {
      addToast('Authentication Failed', result.message, 'error');
    }
  };

  const handleCEOSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Error', 'Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    const result = await registerCEO(name, email, password);
    setLoading(false);

    if (result.success) {
      addToast('Setup Successful', 'CEO account registered. Welcome to your ERP!', 'success');
      navigate('/dashboard');
    } else {
      addToast('Setup Failed', result.message, 'error');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast('Error', 'Please enter your email', 'error');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      addToast('Reset Code Sent', 'Password reset code generated in server console.', 'success');
      setIsForgotPasswordMode(false);
      setIsResetConfirmMode(true);
      if (result.data?.resetCode) {
        setResetCode(result.data.resetCode); // Autofill for convenience in testing
      }
    } else {
      addToast('Request Failed', result.message, 'error');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !resetCode || !newPassword) {
      addToast('Error', 'Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, resetCode, newPassword);
    setLoading(false);

    if (result.success) {
      addToast('Password Reset', 'Your password has been updated. Please sign in.', 'success');
      setIsResetConfirmMode(false);
      setPassword('');
    } else {
      addToast('Reset Failed', result.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial gradients for styling */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md relative z-10 px-3 sm:px-0">
        <div className="login-card bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md transition-all">
          {/* Header Logo */}
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 sm:mb-4 shadow-inner">
              <Store className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h1 className="login-title text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              {isCEOMode ? 'Initialize CEO Setup' : 'Enterprise Merchant ERP'}
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-[280px]">
              {isCEOMode
                ? 'Register the primary executive administrator account to spin up the database.'
                : 'Secure cloud commerce and POS inventory billing interface.'}
            </p>
          </div>

          {/* 1. LOGIN MODE */}
          {!isCEOMode && !isForgotPasswordMode && !isResetConfirmMode && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Dummy input elements to intercept browser autofills */}
              <input type="text" name="chrome_prevent_autofill_email" style={{ display: 'none' }} autoComplete="username" />
              <input type="password" name="chrome_prevent_autofill_pass" style={{ display: 'none' }} autoComplete="new-password" />

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="email"
                    className="login-input w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all fast-tap"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(true);
                      setIsResetConfirmMode(false);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium fast-tap"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="login-input w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all fast-tap"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 transition-colors fast-tap"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer fast-tap">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  Remember my session
                </label>
              </div>

              {/* Quick Demo Autofill Accounts */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 space-y-2.5 mt-2 fast-tap">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider">Quick Demo Autofill</p>
                  <span className="text-[9px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Click to fill credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 quick-demo-grid">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('asadalirustam703@gmail.com');
                      setPassword('Asadali456');
                    }}
                    className="quick-demo-btn py-2 px-2.5 bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/80 active:scale-[0.98] text-xs font-semibold text-violet-400 rounded-xl cursor-pointer transition-all flex flex-col items-start gap-0.5 shadow-sm fast-tap group text-left w-full"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-violet-400">CEO Demo</span>
                      <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded font-mono">CEO</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono w-full truncate">asadalirustam703@gmail.com</div>
                    <div className="text-[10px] text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                      <KeyRound className="w-3 h-3 text-violet-400 shrink-0" />
                      <span>Password: <strong className="text-violet-300 font-bold select-all">Asadali456</strong></span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('asadalirustam70@gmail.com');
                      setPassword('asadali456');
                    }}
                    className="quick-demo-btn py-2 px-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 active:scale-[0.98] text-xs font-semibold text-indigo-400 rounded-xl cursor-pointer transition-all flex flex-col items-start gap-0.5 shadow-sm fast-tap group text-left w-full"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-indigo-400">Admin Demo</span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">Admin</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono w-full truncate">asadalirustam70@gmail.com</div>
                    <div className="text-[10px] text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                      <KeyRound className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>Password: <strong className="text-indigo-300 font-bold select-all">asadali456</strong></span>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 fast-tap"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Access ERP'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCEOMode(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium fast-tap"
                >
                  New ERP system setup? Initialize CEO
                </button>
              </div>
            </form>
          )}

          {/* 2. INITIAL CEO REGISTER MODE */}
          {isCEOMode && (
            <form onSubmit={handleCEOSubmit} className="space-y-4">
              {/* Dummy input elements to intercept browser autofills */}
              <input type="text" name="chrome_prevent_autofill_email_ceo" style={{ display: 'none' }} autoComplete="username" />
              <input type="password" name="chrome_prevent_autofill_pass_ceo" style={{ display: 'none' }} autoComplete="new-password" />

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">CEO Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Executive Officer"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ceo@company.com"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Secret Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showCeoPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCeoPassword(!showCeoPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 transition-colors"
                  >
                    {showCeoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Bootstrap ERP Database'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCEOMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                >
                  Return to normal Sign In
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {isForgotPasswordMode && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="text-center p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl mb-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your email. A 6-digit verification code will be generated in the backend logs to confirm ownership.
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Request Reset Token'}
              </button>

              <div className="text-center pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          {/* 4. CONFIRM PASSWORD RESET MODE */}
          {isResetConfirmMode && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">6-Digit Reset Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm New Password'}
              </button>

              <div className="text-center pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetConfirmMode(false);
                    setIsForgotPasswordMode(true);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                >
                  Change Code / Re-request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
