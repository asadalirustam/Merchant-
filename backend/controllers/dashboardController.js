import User from '../models/User.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// @desc    Get CEO Dashboard analytics metrics
// @route   GET /api/dashboard/stats
// @access  Private (CEO Only)
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // --- CARDS CALCULATIONS ---

    // 1. User & Product Counts
    const totalAdmins = await User.countDocuments({ role: 'Admin' });
    const totalProducts = await Product.countDocuments();

    // 2. Sales & Revenue Counts
    const allSales = await Sale.find();
    const totalSales = allSales.length;

    let totalRevenue = 0;
    let todaySales = 0;
    let monthlySales = 0;

    allSales.forEach((sale) => {
      totalRevenue += sale.grandTotal;
      const saleDate = new Date(sale.date);
      if (saleDate >= today) {
        todaySales += sale.grandTotal;
      }
      if (saleDate >= firstDayOfMonth) {
        monthlySales += sale.grandTotal;
      }
    });

    // 3. Stock metrics
    const productsList = await Product.find({}, 'quantity price name');
    let availableStock = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    productsList.forEach((prod) => {
      availableStock += prod.quantity;
      if (prod.quantity === 0) {
        outOfStockProducts += 1;
      } else if (prod.quantity <= 5) {
        lowStockProducts += 1;
      }
    });

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

    // 2. Monthly Sales for current year (Revenue Graph)
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
      monthlySalesData.push({
        month: months[m],
        sales: salesSum,
      });
    }

    // 3. Product Wise Sales (Grouped and sorted)
    const productSalesMap = {};
    const productNameMap = {};

    allSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prodId = item.product.toString();
        productSalesMap[prodId] = (productSalesMap[prodId] || 0) + item.price * item.quantity;
        productNameMap[prodId] = item.name;
      });
    });

    const productWiseSales = Object.keys(productSalesMap)
      .map((id) => ({
        name: productNameMap[id],
        sales: productSalesMap[id],
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10); // Top 10 products

    return sendSuccess(res, 'Dashboard metrics compiled successfully', {
      cards: {
        totalAdmins,
        totalProducts,
        totalSales,
        todaySales,
        monthlySales,
        totalRevenue,
        availableStock,
        lowStockProducts,
        outOfStockProducts,
      },
      charts: {
        dailySales: dailySalesData,
        monthlySales: monthlySalesData,
        productWiseSales,
        revenueGraph: dailySalesData, // Can use the daily sales trend as direct revenue graph curve
      },
    });
  } catch (error) {
    return sendError(res, 'Failed to compile dashboard metrics', error, 500);
  }
};
