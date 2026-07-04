import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  FileDown,
  Calendar,
  Users,
  Package,
  TrendingUp,
  Award,
  TrendingDown,
  Printer,
  Download,
  Activity,
} from 'lucide-react';

const SalesReports = () => {
  const { settings, getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);
  const currencySymbol = getCurrencySymbol();

  const [sales, setSales] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  // Filters
  const [startDate, setStartDate] = useState(location.state?.startDate || '');
  const [endDate, setEndDate] = useState(location.state?.endDate || '');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  const fetchFiltersData = async () => {
    try {
      const [adminsRes, productsRes] = await Promise.all([
        API.get('/admins'),
        API.get('/products'),
      ]);
      if (adminsRes.data.success) setAdmins(adminsRes.data.data);
      if (productsRes.data.success) setProducts(productsRes.data.data.products);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const url = `/sales?startDate=${startDate}&endDate=${endDate}&admin=${selectedAdmin}&product=${selectedProduct}`;
      const { data } = await API.get(url);
      if (data.success) {
        setSales(data.data);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve sales logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
    if (!location.state) {
      fetchSalesData();
    }
  }, []);

  // Watch for location state transitions to auto-apply filters and refetch
  useEffect(() => {
    if (location.state) {
      const sDate = location.state.startDate || '';
      const eDate = location.state.endDate || '';
      setStartDate(sDate);
      setEndDate(eDate);
      
      // Auto-trigger fetch
      setLoading(true);
      const url = `/sales?startDate=${sDate}&endDate=${eDate}&admin=${selectedAdmin}&product=${selectedProduct}`;
      API.get(url)
        .then(({ data }) => {
          if (data.success) {
            setSales(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [location.state]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchSalesData();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedAdmin('');
    setSelectedProduct('');
    setLoading(true);
    API.get('/sales')
      .then(({ data }) => {
        if (data.success) setSales(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // --- REPORT ANALYTICS CALCULATIONS ---

  const getFilteredTotalRevenue = () => sales.reduce((acc, curr) => acc + curr.grandTotal, 0);

  // Time scope revenues
  const getTodaySales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales
      .filter((s) => new Date(s.date) >= today)
      .reduce((acc, s) => acc + s.grandTotal, 0);
  };

  const getWeeklySales = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return sales
      .filter((s) => new Date(s.date) >= lastWeek)
      .reduce((acc, s) => acc + s.grandTotal, 0);
  };

  const getMonthlySales = () => {
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    return sales
      .filter((s) => new Date(s.date) >= lastMonth)
      .reduce((acc, s) => acc + s.grandTotal, 0);
  };

  const getYearlySales = () => {
    const lastYear = new Date();
    lastYear.setDate(lastYear.getDate() - 365);
    return sales
      .filter((s) => new Date(s.date) >= lastYear)
      .reduce((acc, s) => acc + s.grandTotal, 0);
  };

  // Product ranking
  const getProductRankings = () => {
    const map = {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        map[item.name] = (map[item.name] || 0) + item.quantity;
      });
    });
    return Object.keys(map).map((name) => ({ name, qty: map[name] }));
  };

  const rankings = getProductRankings();
  const bestSelling = [...rankings].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const lowSelling = [...rankings].sort((a, b) => a.qty - b.qty).slice(0, 5);

  // --- PROFIT CALCULATIONS (using costPrice snapshots) ---
  const getTotalCOGS = () =>
    sales.reduce((acc, sale) =>
      acc + sale.items.reduce((iAcc, item) => iAcc + (item.costPrice || 0) * item.quantity, 0)
    , 0);

  const getTotalSalesProfit = () => {
    const revenue = getFilteredTotalRevenue();
    const cogs = getTotalCOGS();
    return revenue - cogs;
  };

  const getProfitMargin = () => {
    const revenue = getFilteredTotalRevenue();
    if (revenue === 0) return 0;
    return ((getTotalSalesProfit() / revenue) * 100).toFixed(1);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Print-only report header */}
      <div className="hidden print:block text-slate-900 border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{settings.shopName || 'Enterprise Merchant Store'}</h1>
            <p className="text-sm font-semibold mt-0.5 text-slate-600">Consolidated Sales Ledger Report</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p>Printed: {new Date().toLocaleString()}</p>
            <p>Period: {startDate ? new Date(startDate).toLocaleDateString() : 'All Time'} - {endDate ? new Date(endDate).toLocaleDateString() : 'Present'}</p>
          </div>
        </div>
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <FileDown className="w-7 h-7 text-indigo-500" />
            Consolidated Sales Reports
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">CEO workspace for auditing gross turnovers, checkout timelines, best selling items, and cashier outputs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <FileDown className="w-4 h-4 text-indigo-450" />
            Export PDF
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filter Row Form */}
      <form onSubmit={handleFilterSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap gap-4 items-end no-print">
        <div className="flex-1 min-w-[150px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[150px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[150px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cashier Admin</label>
          <div className="relative">
            <Users className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-200 outline-none"
            >
              <option value="">All Cashiers</option>
              {admins.map((adm) => (
                <option key={adm._id} value={adm._id}>
                  {adm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-[150px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Product Item</label>
          <div className="relative">
            <Package className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-200 outline-none"
            >
              <option value="">All Products</option>
              {products.map((prod) => (
                <option key={prod._id} value={prod._id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Clear
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Filter Report
          </button>
        </div>
      </form>

      {/* --- PROFIT ANALYSIS SECTION --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Profit Analysis
          <span className="text-[10px] text-slate-500 font-normal ml-1">(based on current filtered records)</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Revenue</p>
            <h4 className="text-lg font-black text-slate-100 mt-1">
              {currencySymbol}{getFilteredTotalRevenue().toLocaleString()}
            </h4>
          </div>
          {/* Cost of Goods Sold */}
          <div className="bg-slate-950/50 rounded-xl p-4 border border-orange-900/30">
            <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Cost of Goods Sold</p>
            <h4 className="text-lg font-black text-orange-400 mt-1">
              {currencySymbol}{getTotalCOGS().toLocaleString()}
            </h4>
          </div>
          {/* Net Profit */}
          <div className={`bg-slate-950/50 rounded-xl p-4 border ${getTotalSalesProfit() >= 0 ? 'border-emerald-900/30' : 'border-rose-900/30'}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${getTotalSalesProfit() >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Net Profit</p>
            <h4 className={`text-lg font-black mt-1 ${getTotalSalesProfit() >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {getTotalSalesProfit() >= 0 ? '' : '-'}{currencySymbol}{Math.abs(getTotalSalesProfit()).toLocaleString()}
            </h4>
          </div>
          {/* Profit Margin % */}
          <div className={`bg-slate-950/50 rounded-xl p-4 border ${getProfitMargin() >= 0 ? 'border-violet-900/30' : 'border-rose-900/30'}`}>
            <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">Profit Margin</p>
            <h4 className={`text-lg font-black mt-1 ${getProfitMargin() >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
              {getProfitMargin()}%
            </h4>
          </div>
        </div>
      </div>

      {/* --- TIME PERIOD SALES CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Today's Revenue</p>
            <h4 className="text-lg font-bold text-slate-100 mt-0.5">
              {currencySymbol}
              {getTodaySales().toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Weekly (7-Days) Sales</p>
            <h4 className="text-lg font-bold text-slate-100 mt-0.5">
              {currencySymbol}
              {getWeeklySales().toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Monthly (30-Days) Sales</p>
            <h4 className="text-lg font-bold text-slate-100 mt-0.5">
              {currencySymbol}
              {getMonthlySales().toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Yearly (365-Days) Sales</p>
            <h4 className="text-lg font-bold text-slate-100 mt-0.5">
              {currencySymbol}
              {getYearlySales().toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* --- BEST SELLING vs LOW SELLING PRODUCT SCOPES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-450" />
            Top 5 Best-Selling Products
          </h3>
          <div className="divide-y divide-slate-800/40">
            {bestSelling.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No sales recorded yet.</div>
            ) : (
              bestSelling.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <span className="text-xs text-slate-300 font-medium">
                    <span className="text-indigo-400 font-bold mr-2">#{idx + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-xs font-bold text-slate-200">{p.qty} units sold</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Selling */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-450" />
            Top 5 Lowest-Selling Products
          </h3>
          <div className="divide-y divide-slate-800/40">
            {lowSelling.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No sales recorded yet.</div>
            ) : (
              lowSelling.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <span className="text-xs text-slate-300 font-medium">
                    <span className="text-rose-400 font-bold mr-2">#{idx + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-xs font-bold text-slate-200">{p.qty} units sold</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- FILTERED SALES TRANSACTION RECORDS LEDGER --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
        <h3 className="font-bold text-sm text-slate-200 p-5 border-b border-slate-850 bg-slate-950/20 flex justify-between items-center">
          <span>Filtered Transaction Ledger</span>
          <span className="text-xs text-slate-400 font-semibold">
            Grand Subtotal: {currencySymbol}
            {getFilteredTotalRevenue().toLocaleString()}
          </span>
        </h3>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <Activity className="w-5 h-5 animate-spin text-indigo-500" />
            <span>Scanning transaction logs...</span>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No transaction matches selection filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                  <th className="py-3 px-6">Invoice</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Cashier</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-800/10">
                    <td className="py-4 px-6 font-bold text-slate-200 font-mono text-[10px]">{sale.invoiceNumber}</td>
                    <td className="py-4 px-6 text-slate-550 font-mono text-[10px]">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6 font-medium text-slate-400">{sale.customerName}</td>
                    <td className="py-4 px-6 text-slate-400 font-semibold">{sale.cashier?.name || 'System'}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{sale.paymentMethod}</td>
                    <td className="py-4 px-6 text-right font-black text-emerald-450">
                      {currencySymbol}
                      {sale.grandTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReports;
