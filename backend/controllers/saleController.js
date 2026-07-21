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
    return sendError(res, 'Failed to fetch sales logs', error, 500);
  }
};
