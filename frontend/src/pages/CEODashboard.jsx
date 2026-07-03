import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  Tags,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CEODashboard = () => {
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const currencySymbol = getCurrencySymbol();

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/dashboard/stats');
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard statistics', error);
      addToast('Error', 'Failed to retrieve analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-800 rounded-xl w-48 mb-2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl lg:col-span-2"></div>
          <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { cards, profitAndLoss, charts } = stats || {
    cards: {},
    profitAndLoss: {},
    charts: { dailySales: [], monthlySales: [], bestSellingProducts: [], categoryAnalytics: [], adminPerformance: [], customerGrowth: [] },
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">CEO Analytics Suite</h1>
          <p className="text-slate-400 text-xs mt-1">Real-time enterprise metrics, profit margins, and performance charts.</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Activity className="w-4 h-4 text-indigo-400" />
          Refresh Live Stream
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100">
              {currencySymbol}
              {cards.totalRevenue?.toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              All-time completed sales
            </p>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100">
              {currencySymbol}
              {cards.todayRevenue?.toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
              Live updates via cashier POS terminals
            </p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Monthly Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100">
              {currencySymbol}
              {cards.monthlyRevenue?.toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Current billing calendar cycle</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Profit (Net Income)</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${profitAndLoss.profit > 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100">
              {currencySymbol}
              {(profitAndLoss.profit - profitAndLoss.loss).toLocaleString()}
            </h3>
            <p className={`text-[10px] font-semibold flex items-center gap-1 mt-1 ${profitAndLoss.profit >= profitAndLoss.loss ? 'text-emerald-400' : 'text-rose-400'}`}>
              {profitAndLoss.profit >= profitAndLoss.loss ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Net margin positive
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Operating loss
                </>
              )}
            </p>
          </div>
        </div>

        {/* Count Stats Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Total Products</p>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.totalProducts}</h4>
            <span className="text-[10px] text-slate-500">{cards.totalCategories} Categories</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Total Customers</p>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.totalCustomers}</h4>
            <span className="text-[10px] text-slate-500">{cards.totalSales} POS Orders</span>
          </div>
        </div>

        {/* Inventory alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cards.outOfStock > 0 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Out of Stock</p>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.outOfStock}</h4>
            <span className="text-[10px] text-slate-500">{cards.lowStock} Low Stock items</span>
          </div>
        </div>

        {/* Pending purchases */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cards.pendingOrders > 0 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Pending Supply Orders</p>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">{cards.pendingOrders}</h4>
            <span className="text-[10px] text-slate-500">Awaiting received stock</span>
          </div>
        </div>
      </div>

      {/* Charts section: Primary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics (Sales, Expenses, Profits) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Revenue Analytics</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Yearly monthly breakdown of sales vs utility expenses.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="sales" fill="#6366f1" name="Sales Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f59e0b" name="Operating Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Category Analytics</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Share of total revenue aggregated by product categories.</p>
          </div>
          <div className="h-60 flex-1 flex items-center justify-center">
            {charts.categoryAnalytics?.length === 0 ? (
              <p className="text-xs text-slate-500">No category sales recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryAnalytics}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.categoryAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Category legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {charts.categoryAnalytics.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-400 truncate">{cat.name}</span>
                <span className="font-semibold text-slate-200 ml-auto">{currencySymbol}{cat.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Customer Growth and Daily Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Customer Growth</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Cumulative customer profiles registered in ERP database.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.customerGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCust)" name="Customers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Sales (7 days curve) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Daily Sales Performance</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Net revenue trends recorded over the last 7 calendar days.</p>
          </div>
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
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third Row: P&L breakdown and Best selling table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit & Loss Aggregates Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Profit & Loss Statement</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Consolidated company margin and operational costs.</p>
          </div>
          <div className="space-y-3.5 divide-y divide-slate-800/40 text-xs">
            <div className="flex justify-between pb-2">
              <span className="text-slate-400">Total Sales Revenue</span>
              <span className="font-bold text-slate-100">{currencySymbol}{profitAndLoss.revenue?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2.5 pb-2">
              <span className="text-slate-400">Cost of Goods Sold (COGS)</span>
              <span className="font-semibold text-rose-300">-{currencySymbol}{profitAndLoss.cost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2.5 pb-2">
              <span className="text-slate-400 font-semibold text-slate-300">Gross Profit Margin</span>
              <span className="font-black text-indigo-400">
                {currencySymbol}{(profitAndLoss.revenue - profitAndLoss.cost)?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2.5 pb-2">
              <span className="text-slate-400">Operating Expenses (OPEX)</span>
              <span className="font-semibold text-rose-300">-{currencySymbol}{profitAndLoss.expenses?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2.5 pb-2">
              <span className="text-slate-400">Gross Profit Margin (%)</span>
              <span className="font-bold text-indigo-400">{profitAndLoss.grossMargin?.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between pt-3 text-sm">
              <span className="font-extrabold text-slate-200">Net Operating Income</span>
              <span className={`font-black ${profitAndLoss.profit >= profitAndLoss.loss ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profitAndLoss.profit >= profitAndLoss.loss ? '+' : '-'}
                {currencySymbol}
                {(profitAndLoss.profit - profitAndLoss.loss)?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Best Selling Products</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Top performing products ranked by total volume sold.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-semibold pb-2">
                  <th className="py-2.5 pl-2">Product Name</th>
                  <th className="py-2.5">Units Sold</th>
                  <th className="py-2.5">Revenue Generated</th>
                  <th className="py-2.5 pr-2 text-right">Performance Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {charts.bestSellingProducts?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">No items sold yet.</td>
                  </tr>
                ) : (
                  charts.bestSellingProducts.map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-800/10">
                      <td className="py-3 pl-2 font-medium text-slate-200">{p.name}</td>
                      <td className="py-3 text-slate-300 font-semibold">{p.quantitySold} units</td>
                      <td className="py-3 text-indigo-400 font-bold">{currencySymbol}{p.revenueGenerated?.toLocaleString()}</td>
                      <td className="py-3 pr-2 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          i === 0 ? 'bg-amber-950 text-amber-300 border border-amber-800/50' : 
                          i === 1 ? 'bg-slate-800 text-slate-300' : 'bg-slate-900 text-slate-400'
                        }`}>
                          <Award className="w-3 h-3 shrink-0" />
                          Rank #{i + 1}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin Performance Bar list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Admin Sales Performance</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Total cashier turnover logged by Admin team.</p>
          </div>
          <div className="space-y-3.5">
            {charts.adminPerformance?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No admin transactions recorded.</p>
            ) : (
              charts.adminPerformance.map((adm, i) => (
                <div key={adm.name} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">{adm.name}</span>
                    <span className="font-semibold text-slate-100">{currencySymbol}{adm.salesTotal?.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{
                        width: `${
                          charts.adminPerformance[0].salesTotal > 0
                            ? (adm.salesTotal / charts.adminPerformance[0].salesTotal) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;
