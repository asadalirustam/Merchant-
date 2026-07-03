import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitNotification } from '../utils/socketHelper.js';

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier')
      .populate('product')
      .sort('-date');
    return sendSuccess(res, 'Purchases retrieved successfully', purchases);
  } catch (error) {
    return sendError(res, 'Failed to fetch purchases', error, 500);
  }
};

// @desc    Create new purchase (and adjust stock if status is Received)
// @route   POST /api/purchases
// @access  Private
export const createPurchase = async (req, res) => {
  const { supplier, product: productId, quantity, cost, status, date } = req.body;

  if (!supplier || !productId || !quantity || !cost) {
    return sendError(res, 'Please provide supplier, product, quantity and cost', null, 400);
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    const purchase = await Purchase.create({
      supplier,
      product: productId,
      quantity,
      cost,
      status: status || 'Pending',
      date: date || new Date(),
    });

    if (purchase.status === 'Received') {
      // Automatic inventory update
      product.quantity += Number(quantity);
      await product.save();

      await logActivity(
        req.user._id,
        'INVENTORY_ADJUST',
        `Stock-In via Purchase (Received): +${quantity} for product ${product.name} (SKU: ${product.sku})`,
        req
      );
    }

    await logActivity(
      req.user._id,
      'PURCHASE_ADD',
      `Recorded purchase for product: ${product.name} (Qty: ${quantity}, Status: ${purchase.status})`,
      req
    );

    emitNotification('PURCHASE_ADDED', 'Purchase Order Recorded', `Recorded purchase of ${quantity} units of ${product.name}.`, { sku: product.sku });

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplier')
      .populate('product');

    return sendSuccess(res, 'Purchase recorded successfully', populatedPurchase, 201);
  } catch (error) {
    return sendError(res, 'Failed to create purchase', error, 500);
  }
};

// @desc    Receive Stock (change status from Pending to Received & update stock)
// @route   PATCH /api/purchases/:id/receive
// @access  Private
export const receiveStock = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return sendError(res, 'Purchase log not found', null, 404);
    }

    if (purchase.status === 'Received') {
      return sendError(res, 'This purchase stock has already been received', null, 400);
    }

    const product = await Product.findById(purchase.product);
    if (!product) {
      return sendError(res, 'Linked product not found', null, 404);
    }

    // Update status and increment inventory stock
    purchase.status = 'Received';
    await purchase.save();

    product.quantity += purchase.quantity;
    await product.save();

    await logActivity(
      req.user._id,
      'INVENTORY_ADJUST',
      `Stock-In via Purchase (Received): +${purchase.quantity} for product ${product.name} (SKU: ${product.sku})`,
      req
    );

    await logActivity(
      req.user._id,
      'PURCHASE_UPDATE',
      `Updated purchase status to Received for: ${product.name}`,
      req
    );

    emitNotification('PURCHASE_ADDED', 'Purchase Received', `Stock incremented by ${purchase.quantity} for ${product.name}.`, { sku: product.sku });

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplier')
      .populate('product');

    return sendSuccess(res, 'Stock received and inventory updated', populatedPurchase);
  } catch (error) {
    return sendError(res, 'Failed to receive stock', error, 500);
  }
};

// @desc    Delete purchase log
// @route   DELETE /api/purchases/:id
// @access  Private
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return sendError(res, 'Purchase log not found', null, 404);
    }

    // If purchase was received, decrement the product quantity first before deleting
    if (purchase.status === 'Received') {
      const product = await Product.findById(purchase.product);
      if (product) {
        product.quantity = Math.max(0, product.quantity - purchase.quantity);
        await product.save();
        await logActivity(
          req.user._id,
          'INVENTORY_ADJUST',
          `Stock-Out via Purchase Deletion: -${purchase.quantity} for product ${product.name}`,
          req
        );
      }
    }

    await Purchase.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'PURCHASE_DELETE',
      `Deleted purchase log ID: ${purchase._id}`,
      req
    );

    return sendSuccess(res, 'Purchase log deleted and inventory adjusted');
  } catch (error) {
    return sendError(res, 'Failed to delete purchase', error, 500);
  }
};
