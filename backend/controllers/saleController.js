import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitNotification } from '../utils/socketHelper.js';

// @desc    Get all sales logs
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res) => {
  const { customer, startDate, endDate } = req.query;

  try {
    const query = {};

    if (customer) {
      query.customer = customer;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sales = await Sale.find(query)
      .populate('customer')
      .populate('cashier', 'name email')
      .sort('-date');

    return sendSuccess(res, 'Sales logs retrieved successfully', sales);
  } catch (error) {
    return sendError(res, 'Failed to fetch sales logs', error, 500);
  }
};

// @desc    Get single invoice details
// @route   GET /api/sales/:invoiceNumber
// @access  Private
export const getSaleByInvoice = async (req, res) => {
  try {
    const sale = await Sale.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate('customer')
      .populate('cashier', 'name email')
      .populate('items.product');

    if (!sale) {
      return sendError(res, 'Invoice not found', null, 404);
    }

    return sendSuccess(res, 'Invoice retrieved successfully', sale);
  } catch (error) {
    return sendError(res, 'Failed to fetch invoice details', error, 500);
  }
};

// @desc    Perform Checkout (POS Sale transaction)
// @route   POST /api/sales
// @access  Private
export const createSale = async (req, res) => {
  const {
    customer: customerId,
    items,
    subTotal,
    discountAmount,
    taxAmount,
    grandTotal,
    paymentMethod,
    notes,
  } = req.body;

  if (!items || items.length === 0) {
    return sendError(res, 'Checkout cart cannot be empty', null, 400);
  }

  try {
    // Generate unique invoice number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${timestamp}-${random}`;

    // Verify quantities of products in inventory first
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return sendError(res, `Product ${item.name} not found in inventory`, null, 404);
      }
      if (product.quantity < item.quantity) {
        return sendError(
          res,
          `Insufficient stock for "${product.name}". Only ${product.quantity} units remaining.`,
          null,
          400
        );
      }
    }

    // Process actual stock decrements
    for (const item of items) {
      const product = await Product.findById(item.product);
      product.quantity -= Number(item.quantity);
      await product.save();

      // Emit notifications for stock changes
      if (product.quantity === 0) {
        emitNotification('OUT_OF_STOCK', 'Out of Stock Warning', `${product.name} is now completely out of stock!`, { sku: product.sku });
      } else if (product.quantity <= product.minimumStock) {
        emitNotification('LOW_STOCK', 'Low Stock Warning', `${product.name} has low stock remaining: ${product.quantity} units.`, { sku: product.sku });
      }

      await logActivity(
        req.user._id,
        'INVENTORY_ADJUST',
        `Stock-Out via Sale (${invoiceNumber}): -${item.quantity} for product ${product.name} (Remaining: ${product.quantity})`,
        req
      );
    }

    // Accumulate customer total spending if customer selected
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.totalSpending += Number(grandTotal);
        await customer.save();
      }
    }

    // Save final sale invoice
    const sale = await Sale.create({
      invoiceNumber,
      customer: customerId || null,
      cashier: req.user._id,
      items,
      subTotal,
      discountAmount: discountAmount || 0,
      taxAmount: taxAmount || 0,
      grandTotal,
      paymentMethod,
      notes,
    });

    await logActivity(
      req.user._id,
      'INVOICE_CREATE',
      `Completed sale transaction. Invoice: ${invoiceNumber}, Total: ${grandTotal}`,
      req
    );

    // Emit live sales broadcast event
    emitNotification('SALE_COMPLETED', 'Sale Completed', `New transaction checkout: ${invoiceNumber} for Total: ${grandTotal}`, { invoiceNumber });

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer')
      .populate('cashier', 'name email');

    return sendSuccess(res, 'Sale completed successfully', populatedSale, 201);
  } catch (error) {
    return sendError(res, 'POS Checkout failed', error, 500);
  }
};

// @desc    Delete/Refund Sale transaction
// @route   DELETE /api/sales/:id
// @access  Private
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return sendError(res, 'Sale record not found', null, 404);
    }

    // Restock items in inventory
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += Number(item.quantity);
        await product.save();
        await logActivity(
          req.user._id,
          'INVENTORY_ADJUST',
          `Stock-In via Sale Return/Refund (${sale.invoiceNumber}): +${item.quantity} for product ${product.name}`,
          req
        );
      }
    }

    // Deduct spending amount from customer profile
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.totalSpending = Math.max(0, customer.totalSpending - sale.grandTotal);
        await customer.save();
      }
    }

    await Sale.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'SALE_DELETE',
      `Cancelled and refunded transaction Invoice: ${sale.invoiceNumber}`,
      req
    );

    return sendSuccess(res, 'Sale record deleted and stock refunded');
  } catch (error) {
    return sendError(res, 'Failed to refund sale', error, 500);
  }
};
