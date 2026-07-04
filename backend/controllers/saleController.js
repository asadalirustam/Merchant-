import Sale from '../models/Sale.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitNotification } from '../utils/socketHelper.js';

// @desc    Perform Checkout (POS Sale transaction)
// @route   POST /api/sales
// @access  Private (Admin Only)
export const createSale = async (req, res) => {
  const {
    customerName,
    items,
    subTotal,
    discount,
    tax,
    grandTotal,
    paymentMethod,
  } = req.body;

  if (!items || items.length === 0) {
    return sendError(res, 'Checkout cart cannot be empty', null, 400);
  }

  try {
    // Generate unique invoice number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${timestamp}-${random}`;

    // Load products once, verify stock, snapshot costPrice
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return sendError(res, `Product "${item.name}" not found in inventory`, null, 404);
      }
      if (product.quantity < item.quantity) {
        return sendError(
          res,
          `Insufficient stock for "${product.name}". Only ${product.quantity} units remaining.`,
          null,
          400
        );
      }
      enrichedItems.push({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        costPrice: product.costPrice || 0, // Snapshot at time of sale
      });
    }

    // Process actual stock decrements using enriched items
    for (const item of enrichedItems) {
      const product = await Product.findById(item.product);
      product.quantity -= Number(item.quantity);
      await product.save();

      // Emit notifications for stock changes
      if (product.quantity === 0) {
        emitNotification('OUT_OF_STOCK', 'Out of Stock Warning', `${product.name} is now completely out of stock!`, { id: product._id });
        await logActivity(null, 'Out of Stock', `${product.name} stock level reached 0`, req);
      } else if (product.quantity <= 5) {
        emitNotification('LOW_STOCK', 'Low Stock Warning', `${product.name} has low stock remaining: ${product.quantity} units.`, { id: product._id });
        await logActivity(null, 'Low Stock', `${product.name} stock level is low: ${product.quantity}`, req);
      }

      await logActivity(
        req.user._id,
        'Product Updated',
        `POS checkout reduced stock of ${product.name} by ${item.quantity}. Remaining: ${product.quantity}`,
        req
      );
    }

    // Save final sale log with costPrice snapshots
    const sale = await Sale.create({
      invoiceNumber,
      items: enrichedItems,
      subTotal,
      discount: discount || 0,
      tax: tax || 0,
      grandTotal,
      paymentMethod,
      cashier: req.user._id,
      customerName: customerName || 'Guest',
    });

    // Save corresponding Invoice log in the Invoices collection
    const invoice = await Invoice.create({
      invoiceNumber,
      sale: sale._id,
      customerName: customerName || 'Guest',
      cashierName: req.user.name,
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      grandTotal,
      paymentMethod,
      date: new Date(),
    });

    await logActivity(
      req.user._id,
      'Sale Completed',
      `Completed sale transaction. Invoice: ${invoiceNumber}, Grand Total: ${grandTotal}`,
      req
    );

    emitNotification('SALE_COMPLETED', 'Sale Completed', `New invoice generated: ${invoiceNumber} (${paymentMethod})`, { invoiceNumber });

    return sendSuccess(res, 'Sale completed successfully', invoice, 201);
  } catch (error) {
    return sendError(res, 'POS Checkout failed', error, 500);
  }
};

// @desc    Get Invoices (Invoice History with Search and Filters)
// @route   GET /api/invoices
// @access  Private (CEO & Admin)
export const getInvoices = async (req, res) => {
  const { search, product, date, customerName } = req.query;

  try {
    const query = {};

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' };
    }

    if (product) {
      query['items.name'] = { $regex: product, $options: 'i' };
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: targetDate,
        $lt: nextDay,
      };
    }

    const invoices = await Invoice.find(query).sort('-date');
    return sendSuccess(res, 'Invoices retrieved successfully', invoices);
  } catch (error) {
    return sendError(res, 'Failed to fetch invoices history', error, 500);
  }
};

// @desc    Get single invoice details by Invoice Number
// @route   GET /api/invoices/:invoiceNumber
// @access  Private (CEO & Admin)
export const getInvoiceDetails = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber }).populate('items.product');
    if (!invoice) {
      return sendError(res, 'Invoice not found', null, 404);
    }
    return sendSuccess(res, 'Invoice details retrieved successfully', invoice);
  } catch (error) {
    return sendError(res, 'Failed to fetch invoice details', error, 500);
  }
};

// @desc    Get raw sales log list (useful for CEO sales reports filtering)
// @route   GET /api/sales
// @access  Private (CEO & Admin)
export const getSalesList = async (req, res) => {
  const { startDate, endDate, admin, product } = req.query;

  try {
    const query = {};

    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = {
        $gte: new Date(startDate),
        $lte: end,
      };
    } else if (startDate) {
      query.date = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = {
        $lte: end,
      };
    }

    if (admin) {
      query.cashier = admin;
    }

    if (product) {
      query['items.product'] = product;
    }

    const sales = await Sale.find(query)
      .populate('cashier', 'name email role')
      .sort('-date');

    return sendSuccess(res, 'Sales logs retrieved successfully', sales);
  } catch (error) {
    return sendError(res, 'Failed to fetch sales logs', error, 500);
  }
};
