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

    // Save final sale log
    const sale = await Sale.create({
      invoiceNumber,
      cashier: req.user._id,
      customerName: customerName || 'Guest',
      items: enrichedItems,
      subTotal,
      discount: discount || 0,
      tax: tax || 0,
      grandTotal,
      paymentMethod,
      date: new Date(),
    });

    // Save invoice document
    const invoice = await Invoice.create({
      invoiceNumber,
      sale: sale._id,
      customerName: customerName || 'Guest',
      cashierName: req.user.name,
      items: enrichedItems,
      grandTotal,
      paymentMethod,
      date: sale.date,
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

// @desc    Get Sales list (with date/admin/product filters)
// @route   GET /api/sales
// @access  Private
export const getSalesList = async (req, res) => {
  const { startDate, endDate, admin, product } = req.query;

  try {
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
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

    return sendSuccess(res, 'Sales records fetched successfully', sales);
  } catch (error) {
    return sendError(res, 'Failed to fetch sales records', error, 500);
  }
};

// @desc    Get Invoices list
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  const { search, product, customerName, date } = req.query;

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
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      query.date = { $gte: d, $lt: nextD };
    }

    const invoices = await Invoice.find(query).sort('-date');
    return sendSuccess(res, 'Invoices retrieved successfully', invoices);
  } catch (error) {
    return sendError(res, 'Failed to fetch invoices', error, 500);
  }
};

// @desc    Get single invoice details by invoiceNumber
// @route   GET /api/invoices/:invoiceNumber
// @access  Private
export const getInvoiceDetails = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber }).populate('sale');
    if (!invoice) {
      return sendError(res, 'Invoice not found', null, 404);
    }
    return sendSuccess(res, 'Invoice details retrieved', invoice);
  } catch (error) {
    return sendError(res, 'Failed to fetch invoice details', error, 500);
  }
};

// @desc    Update invoice (Admin/CEO edit)
// @route   PUT /api/invoices/:invoiceNumber
// @access  Private
export const updateInvoice = async (req, res) => {
  const { customerName, paymentMethod, items, subTotal, discount, tax, grandTotal } = req.body;

  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber });
    if (!invoice) {
      return sendError(res, 'Invoice not found', null, 404);
    }

    const sale = await Sale.findOne({ invoiceNumber: req.params.invoiceNumber });

    // Handle stock quantity differentials between old items and new items
    if (items && items.length > 0) {
      const oldItemMap = {};
      (invoice.items || []).forEach((i) => {
        const prodId = i.product?._id ? i.product._id.toString() : i.product.toString();
        oldItemMap[prodId] = i.quantity;
      });

      const newItemMap = {};
      items.forEach((i) => {
        const prodId = i.product?._id ? i.product._id.toString() : i.product.toString();
        newItemMap[prodId] = i.quantity;
      });

      // Stock adjustment logic
      const allProductIds = new Set([...Object.keys(oldItemMap), ...Object.keys(newItemMap)]);
      for (const prodId of allProductIds) {
        const oldQty = oldItemMap[prodId] || 0;
        const newQty = newItemMap[prodId] || 0;
        const diff = newQty - oldQty; // positive means extra units sold; negative means units returned

        if (diff !== 0) {
          const productDoc = await Product.findById(prodId);
          if (productDoc) {
            if (diff > 0 && productDoc.quantity < diff) {
              return sendError(res, `Insufficient stock for ${productDoc.name}. Need ${diff} more, but only ${productDoc.quantity} available.`, null, 400);
            }
            productDoc.quantity -= diff;
            await productDoc.save();
          }
        }
      }
    }

    // Snapshot cost prices for new items
    const enrichedItems = [];
    if (items) {
      for (const item of items) {
        const prodId = item.product?._id || item.product;
        const prodDoc = await Product.findById(prodId);
        enrichedItems.push({
          product: prodId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          costPrice: prodDoc ? (prodDoc.costPrice || 0) : 0,
        });
      }
    }

    const previousGrandTotal = invoice.grandTotal;

    // Track edit history
    invoice.editHistory.push({
      editedBy: req.user.name,
      editedAt: new Date(),
      previousGrandTotal,
      newGrandTotal: grandTotal !== undefined ? grandTotal : invoice.grandTotal,
      summary: `Invoice modified by ${req.user.name}`,
    });

    if (customerName) invoice.customerName = customerName;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (enrichedItems.length > 0) invoice.items = enrichedItems;
    if (grandTotal !== undefined) invoice.grandTotal = grandTotal;

    await invoice.save();

    if (sale) {
      if (customerName) sale.customerName = customerName;
      if (paymentMethod) sale.paymentMethod = paymentMethod;
      if (enrichedItems.length > 0) sale.items = enrichedItems;
      if (subTotal !== undefined) sale.subTotal = subTotal;
      if (discount !== undefined) sale.discount = discount;
      if (tax !== undefined) sale.tax = tax;
      if (grandTotal !== undefined) sale.grandTotal = grandTotal;
      await sale.save();
    }

    await logActivity(
      req.user._id,
      'Invoice Modified',
      `Modified invoice ${invoice.invoiceNumber}. Total changed from ${previousGrandTotal} to ${invoice.grandTotal}`,
      req
    );

    return sendSuccess(res, 'Invoice updated successfully', invoice);
  } catch (error) {
    return sendError(res, 'Failed to update invoice', error, 500);
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
          'Inventory Restock',
          `Stock-In via Refund (${sale.invoiceNumber}): +${item.quantity} for ${product.name}`,
          req
        );
      }
    }

    await Invoice.findOneAndDelete({ invoiceNumber: sale.invoiceNumber });
    await Sale.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'Sale Cancelled',
      `Refunded transaction Invoice: ${sale.invoiceNumber}`,
      req
    );

    return sendSuccess(res, 'Sale record deleted and stock refunded');
  } catch (error) {
    return sendError(res, 'Failed to delete sale record', error, 500);
  }
};
