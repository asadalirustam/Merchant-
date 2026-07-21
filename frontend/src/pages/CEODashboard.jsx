import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  XCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CEODashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/dashboard/stats');
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error(error);
      addToast('Error', 'Failed to retrieve analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-800 rounded-xl w-48 mb-2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  const { cards, charts } = stats || {
    cards: {},
    charts: { dailySales: [], monthlySales: [], productWiseSales: [], revenueGraph: [] },
  };

  // Check if role is CEO
  const isCEO = user?.role === 'CEO';

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            {isCEO ? 'CEO Executive Suite' : 'Cashier Terminal Dashboard'}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {isCEO
              ? 'Consolidated company revenue, stock levels, and admin analytics.'
              : 'Real-time billing performance, low stock warnings, and checkout stats.'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Activity className="w-4 h-4 text-indigo-400" />
          Refresh Stats
        </button>
      </div>

      {/* --- 1. CEO DASHBOARD METRICS --- */}
      {isCEO && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Admins */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Admins</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.totalAdmins}</h4>
              </div>
            </div>

            {/* Total Products */}
            <div
              onClick={() => navigate('/products', { state: { stockStatus: '' } })}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Products</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.totalProducts}</h4>
              </div>
            </div>

            {/* Total Sales */}
            <div
              onClick={() => navigate('/reports', { state: { startDate: '', endDate: '' } })}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Sales (Orders)</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.totalSales}</h4>
              </div>
            </div>

            {/* Total Revenue */}
            <div
              onClick={() => navigate('/reports', { state: { startDate: '', endDate: '' } })}
              className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Revenue</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">
                  {currencySymbol}
                  {cards.totalRevenue?.toLocaleString()}
                </h4>
              </div>
            </div>

            {/* Today's Sales */}
            <div
              onClick={() => {
                const todayStr = new Date().toISOString().split('T')[0];
                navigate('/reports', { state: { startDate: todayStr, endDate: todayStr } });
              }}
              className="bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Today's Sales</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">
                  {currencySymbol}
                  {cards.todaySales?.toLocaleString()}
                </h4>
              </div>
            </div>

            {/* Monthly Sales */}
            <div
              onClick={() => {
                const now = new Date();
                const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const lastDayStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                navigate('/reports', { state: { startDate: firstDayStr, endDate: lastDayStr } });
              }}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Monthly Sales</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">
                  {currencySymbol}
                  {cards.monthlySales?.toLocaleString()}
                </h4>
              </div>
            </div>

            {/* Available Stock */}
            <div
              onClick={() => navigate('/products', { state: { stockStatus: '' } })}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Available Stock Qty</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.availableStock}</h4>
              </div>
            </div>

            {/* Low Stock Items */}
            <div
              onClick={() => navigate('/products', { state: { stockStatus: 'low' } })}
              className="bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cards.lowStockProducts > 0 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Low Stock Products</p>
                <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.lowStockProducts}</h4>
              </div>
            </div>
          </div>

          {/* Profit & Cost Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Inventory Cost */}
            <div className="bg-slate-900 border border-slate-800 hover:border-orange-500/40 rounded-2xl p-5 shadow-xl flex items-center gap-4 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Inventory Cost</p>
                <p className="text-[10px] text-slate-500 font-medium">Amount spent to stock store</p>
                <h4 className="text-xl font-bold text-orange-400 mt-0.5">
                  {currencySymbol}{cards.totalInventoryCost?.toLocaleString() ?? 0}
                </h4>
              </div>
            </div>

            {/* Potential Stock Profit */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl flex items-center gap-4 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Potential Stock Profit</p>
                <p className="text-[10px] text-slate-500 font-medium">Unrealized margin in warehouse</p>
                <h4 className="text-xl font-bold text-emerald-400 mt-0.5">
                  {currencySymbol}{cards.inventoryPotentialProfit?.toLocaleString() ?? 0}
                </h4>
              </div>
            </div>

            {/* Total Sales Profit (Realized) */}
            <div className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-5 shadow-xl flex items-center gap-4 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Sales Profit</p>
                <p className="text-[10px] text-slate-500 font-medium">Realized profit from all sales</p>
                <h4 className="text-xl font-bold text-violet-400 mt-0.5">
                  {currencySymbol}{cards.totalSalesProfit?.toLocaleString() ?? 0}
                </h4>
              </div>
            </div>
          </div>

          {/* Charts Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-slate-200">Daily Sales Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Sales" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Sales (Revenue Graph) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-slate-200">Monthly Sales (Revenue Graph)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                    <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Product wise sales */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200">Product Wise Sales (Revenue)</h3>
            <div className="h-72">
              {charts.productWiseSales?.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">No product sales logged yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.productWiseSales} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                    <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {/* --- 2. ADMIN DASHBOARD METRICS --- */}
      {!isCEO && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total Products */}
            <div
              onClick={() => navigate('/products', { state: { stockStatus: '' } })}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Products</p>
                <h4 className="text-lg font-bold text-slate-100 mt-0.5">{cards.totalProducts}</h4>
              </div>
            </div>

            {/* Available Products */}
            <div
              onClick={() => navigate('/products', { state: { stockStatus: '' } })}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">In-Stock Qty</p>
                <h4 className="text-lg font-bold text-slate-100 mt-0.5">{cards.availableStock}</h4>
              </div>
            </div>

            {/* Low Stock */}
            <div
              onClick={() => navigate('/products', { state: { stockStatus: 'low' } })}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cards.lowStockProducts > 0 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Low Stock</p>
                <h4 className="text-lg font-bold text-slate-100 mt-0.5">{cards.lowStockProducts}</h4>
              </div>
            </div>

            {/* Out of Stock */}
            {/* Compute out of stock. It is totalProducts - inStockProducts where qty > 0 */}
            <div
              onClick={() => navigate('/products', { state: { stockStatus: 'out' } })}
              className="bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-850/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Out of Stock</p>
                <h4 className="text-lg font-bold text-slate-100 mt-0.5">
                  {cards.outOfStockProducts || 0}
                </h4>
              </div>
            </div>

            {/* Today's Sales */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Today's Sales</p>
                <h4 className="text-lg font-bold text-slate-100 mt-0.5">
                  {currencySymbol}
                  {cards.todaySales?.toLocaleString()}
                </h4>
              </div>
            </div>
          </div>

          {/* Simple Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200">Daily Billings Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} name="Total Billing" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CEODashboard;
