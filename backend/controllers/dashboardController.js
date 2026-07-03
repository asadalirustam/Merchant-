import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Customer from '../models/Customer.js';
import Purchase from '../models/Purchase.js';
import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// @desc    Get CEO Dashboard analytics metrics
// @route   GET /api/dashboard/stats
// @access  Private (CEO Only)
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // --- CARDS CALCULATIONS ---

    // 1. Sales & Revenue statistics
    const allSales = await Sale.find();
    const totalSalesCount = allSales.length;
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthlyRevenue = 0;

    allSales.forEach((sale) => {
      totalRevenue += sale.grandTotal;
      const saleDate = new Date(sale.date);
      if (saleDate >= today) {
        todayRevenue += sale.grandTotal;
      }
      if (saleDate >= firstDayOfMonth) {
        monthlyRevenue += sale.grandTotal;
      }
    });

    // 2. Count metrics
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'Admin' });
    const totalCustomers = await Customer.countDocuments();

    // 3. Stock metrics
    const lowStockCount = await Product.countDocuments({
      $expr: { $and: [{ $lte: ['$quantity', '$minimumStock'] }, { $gt: ['$quantity', 0] }] },
    });
    const outOfStockCount = await Product.countDocuments({ quantity: 0 });

    // 4. Order metrics
    const pendingPurchasesCount = await Purchase.countDocuments({ status: 'Pending' });

    // --- EXPENSES & P&L CALCULATIONS ---
    const allExpenses = await Expense.find();
    let totalExpenses = 0;
    let monthlyExpenses = 0;

    allExpenses.forEach((exp) => {
      totalExpenses += exp.amount;
      if (new Date(exp.date) >= firstDayOfMonth) {
        monthlyExpenses += exp.amount;
      }
    });

    // Cost of Goods Sold (COGS) - calculate from sale items using product costPrice
    let costOfGoodsSold = 0;
    // Pre-cache product cost prices for quick lookup
    const productsList = await Product.find({}, '_id costPrice');
    const costMap = {};
    productsList.forEach((p) => {
      costMap[p._id.toString()] = p.costPrice;
    });

    allSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const costPrice = costMap[item.product.toString()] || 0;
        costOfGoodsSold += costPrice * item.quantity;
      });
    });

    const netProfit = totalRevenue - costOfGoodsSold - totalExpenses;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - costOfGoodsSold) / totalRevenue) * 100 : 0;

    // --- CHART CALCULATIONS ---

    // 1. Daily Sales for last 7 days
    const dailySalesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySales = allSales.filter((s) => {
        const sd = new Date(s.date);
        return sd >= d && sd < nextDay;
      });

      const total = daySales.reduce((acc, curr) => acc + curr.grandTotal, 0);
      dailySalesData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        sales: total,
      });
    }

    // 2. Monthly Sales for current year
    const monthlySalesData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      const start = new Date(today.getFullYear(), m, 1);
      const end = new Date(today.getFullYear(), m + 1, 1);

      const monthSales = allSales.filter((s) => {
        const sd = new Date(s.date);
        return sd >= start && sd < end;
      });

      const salesSum = monthSales.reduce((acc, curr) => acc + curr.grandTotal, 0);
      const expenseSum = allExpenses
        .filter((e) => {
          const ed = new Date(e.date);
          return ed >= start && ed < end;
        })
        .reduce((acc, curr) => acc + curr.amount, 0);

      monthlySalesData.push({
        month: months[m],
        sales: salesSum,
        expenses: expenseSum,
        profit: salesSum - expenseSum,
      });
    }

    // 3. Best Selling Products
    const salesProductCountMap = {};
    const salesProductRevenueMap = {};
    const productNameMap = {};

    allSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prodId = item.product.toString();
        salesProductCountMap[prodId] = (salesProductCountMap[prodId] || 0) + item.quantity;
        salesProductRevenueMap[prodId] = (salesProductRevenueMap[prodId] || 0) + item.price * item.quantity;
        productNameMap[prodId] = item.name;
      });
    });

    const bestSellingProducts = Object.keys(salesProductCountMap)
      .map((id) => ({
        id,
        name: productNameMap[id],
        quantitySold: salesProductCountMap[id],
        revenueGenerated: salesProductRevenueMap[id],
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // 4. Category Sales Analytics
    const categoryRevenueMap = {};
    const categoryCountMap = {};

    // Populated list of products to find category names
    const populatedProducts = await Product.find().populate('category');
    const categoryNameMap = {};
    populatedProducts.forEach((p) => {
      if (p.category) {
        categoryNameMap[p._id.toString()] = p.category.name;
      }
    });

    allSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const catName = categoryNameMap[item.product.toString()] || 'Uncategorized';
        categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + item.price * item.quantity;
        categoryCountMap[catName] = (categoryCountMap[catName] || 0) + item.quantity;
      });
    });

    const categoryAnalytics = Object.keys(categoryRevenueMap).map((name) => ({
      name,
      value: categoryRevenueMap[name],
      quantity: categoryCountMap[name],
    }));

    // 5. Admin (Cashier) Performance
    const cashiers = await User.find({ role: 'Admin' }, '_id name');
    const adminPerformance = [];
    
    // Map cashier ID to name
    const cashierNameMap = {};
    cashiers.forEach(c => { cashierNameMap[c._id.toString()] = c.name; });
    // Also include CEO if they cashiered
    const ceos = await User.find({ role: 'CEO' }, '_id name');
    ceos.forEach(c => { cashierNameMap[c._id.toString()] = `${c.name} (CEO)`; });

    const cashierRevenueMap = {};
    allSales.forEach((sale) => {
      const cashierId = sale.cashier.toString();
      cashierRevenueMap[cashierId] = (cashierRevenueMap[cashierId] || 0) + sale.grandTotal;
    });

    Object.keys(cashierRevenueMap).forEach((id) => {
      adminPerformance.push({
        name: cashierNameMap[id] || 'System User',
        salesTotal: cashierRevenueMap[id],
      });
    });

    adminPerformance.sort((a, b) => b.salesTotal - a.salesTotal);

    // 6. Customer Growth over time (aggregated daily count of customer creations)
    const allCustomers = await Customer.find().sort('createdAt');
    const customerGrowth = [];
    let runningTotal = 0;
    
    // Group by creation date
    const customerCountByDate = {};
    allCustomers.forEach(cust => {
      const dateStr = new Date(cust.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      customerCountByDate[dateStr] = (customerCountByDate[dateStr] || 0) + 1;
    });

    Object.keys(customerCountByDate).forEach(date => {
      runningTotal += customerCountByDate[date];
      customerGrowth.push({
        date,
        customers: runningTotal,
      });
    });

    // Fallback if no customers yet
    if (customerGrowth.length === 0) {
      customerGrowth.push({ date: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), customers: 0 });
    }

    return sendSuccess(res, 'Dashboard metrics compiled successfully', {
      cards: {
        totalRevenue,
        todayRevenue,
        monthlyRevenue,
        totalProducts,
        totalCategories,
        totalSales: totalSalesCount,
        totalAdmins,
        totalCustomers,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        pendingOrders: pendingPurchasesCount,
      },
      profitAndLoss: {
        revenue: totalRevenue,
        cost: costOfGoodsSold,
        expenses: totalExpenses,
        monthlyExpenses,
        profit: netProfit > 0 ? netProfit : 0,
        loss: netProfit < 0 ? Math.abs(netProfit) : 0,
        grossMargin,
      },
      charts: {
        dailySales: dailySalesData,
        monthlySales: monthlySalesData,
        bestSellingProducts,
        categoryAnalytics,
        adminPerformance,
        customerGrowth,
      },
    });
  } catch (error) {
    return sendError(res, 'Failed to compile dashboard metrics', error, 500);
  }
};
