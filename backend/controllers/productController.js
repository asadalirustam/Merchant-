import Product from '../models/Product.js';
import { generateQRCode } from '../utils/qrCodeGenerator.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitNotification } from '../utils/socketHelper.js';

// @desc    Get all products with query filters
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  const { search, category, stockStatus, page = 1, limit = 100 } = req.query;

  try {
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    // Filter by stock alert status
    if (stockStatus === 'low') {
      query.$expr = { $and: [{ $lte: ['$quantity', '$minimumStock'] }, { $gt: ['$quantity', 0] }] };
    } else if (stockStatus === 'out') {
      query.quantity = 0;
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category')
      .sort('-createdAt')
      .skip(skipIndex)
      .limit(parseInt(limit));

    return sendSuccess(res, 'Products retrieved successfully', {
      products,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch products', error, 500);
  }
};

// @desc    Get single product by ID or SKU or Barcode
// @route   GET /api/products/:idOrSku
// @access  Private
export const getProductById = async (req, res) => {
  const { idOrSku } = req.params;

  try {
    let product;

    // Check if it's a valid MongoDB ObjectId format
    if (idOrSku.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSku).populate('category');
    } else {
      // Find by SKU or Barcode (useful for POS scanning)
      product = await Product.findOne({
        $or: [{ sku: idOrSku }, { barcode: idOrSku }],
      }).populate('category');
    }

    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    return sendSuccess(res, 'Product retrieved successfully', product);
  } catch (error) {
    return sendError(res, 'Failed to fetch product', error, 500);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  const {
    name,
    sku,
    barcode,
    category,
    brand,
    costPrice,
    sellingPrice,
    discount,
    quantity,
    minimumStock,
    description,
  } = req.body;

  if (!name || !sku || !category || !costPrice || !sellingPrice) {
    return sendError(res, 'Required fields: name, sku, category, costPrice, sellingPrice', null, 400);
  }

  try {
    const productExists = await Product.findOne({ sku });
    if (productExists) {
      return sendError(res, 'Product with this SKU already exists', null, 400);
    }

    // Process image
    let productImage = '';
    if (req.file) {
      productImage = await uploadToCloudinary(req.file.path);
    }

    // Auto-generate unique QR code from SKU
    const qrCode = await generateQRCode(sku);

    const product = await Product.create({
      name,
      sku,
      barcode: barcode || sku,
      qrCode,
      category,
      brand,
      costPrice,
      sellingPrice,
      discount: discount || 0,
      quantity: quantity || 0,
      minimumStock: minimumStock || 5,
      productImage,
      description,
    });

    // Activities and sockets
    await logActivity(req.user._id, 'PRODUCT_ADD', `Added product: ${product.name} (SKU: ${product.sku})`, req);
    emitNotification('PRODUCT_ADD', 'Product Added', `${product.name} was successfully created.`, { sku: product.sku });

    // Check low stock alert immediately
    if (product.quantity === 0) {
      emitNotification('OUT_OF_STOCK', 'Out of Stock Alert', `${product.name} is out of stock!`, { sku: product.sku });
    } else if (product.quantity <= product.minimumStock) {
      emitNotification('LOW_STOCK', 'Low Stock Alert', `${product.name} has low stock (${product.quantity} remaining).`, { sku: product.sku });
    }

    const populatedProduct = await Product.findById(product._id).populate('category');
    return sendSuccess(res, 'Product created successfully', populatedProduct, 201);
  } catch (error) {
    return sendError(res, 'Failed to create product', error, 500);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  const {
    name,
    sku,
    barcode,
    category,
    brand,
    costPrice,
    sellingPrice,
    discount,
    quantity,
    minimumStock,
    description,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    // Handle name, brand, description
    if (name) product.name = name;
    if (brand !== undefined) product.brand = brand;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (barcode) product.barcode = barcode;

    // Handle prices and track change logs
    let priceChanged = false;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (sellingPrice !== undefined) {
      if (Number(sellingPrice) !== product.sellingPrice) {
        priceChanged = true;
      }
      product.sellingPrice = sellingPrice;
    }
    if (discount !== undefined) product.discount = discount;
    if (minimumStock !== undefined) product.minimumStock = minimumStock;

    // Handle stock quantity directly
    if (quantity !== undefined) product.quantity = quantity;

    // If SKU changes, regenerate QR code and check unique
    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return sendError(res, 'Another product with this SKU already exists', null, 400);
      }
      product.sku = sku;
      product.qrCode = await generateQRCode(sku);
    }

    // Process file image updates
    if (req.file) {
      product.productImage = await uploadToCloudinary(req.file.path);
    }

    await product.save();

    await logActivity(req.user._id, 'PRODUCT_UPDATE', `Updated product: ${product.name} (SKU: ${product.sku})`, req);
    
    if (priceChanged) {
      await logActivity(req.user._id, 'PRICE_CHANGED', `Price updated for ${product.name} (SKU: ${product.sku}) to ${product.sellingPrice}`, req);
      emitNotification('PRICE_UPDATED', 'Price Updated', `${product.name} price is now ${product.sellingPrice}.`, { sku: product.sku });
    }

    // Check low stock status
    if (product.quantity === 0) {
      emitNotification('OUT_OF_STOCK', 'Out of Stock Alert', `${product.name} is out of stock!`, { sku: product.sku });
    } else if (product.quantity <= product.minimumStock) {
      emitNotification('LOW_STOCK', 'Low Stock Alert', `${product.name} has low stock (${product.quantity} remaining).`, { sku: product.sku });
    }

    const populatedProduct = await Product.findById(product._id).populate('category');
    return sendSuccess(res, 'Product updated successfully', populatedProduct);
  } catch (error) {
    return sendError(res, 'Failed to update product', error, 500);
  }
};

// @desc    Specific adjustments for price and quantity
// @route   PATCH /api/products/:id/adjust
// @access  Private
export const adjustProduct = async (req, res) => {
  const { sellingPrice, quantity, actionType } = req.body; // actionType: 'IN', 'OUT', 'SET'

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    let detail = '';

    if (sellingPrice !== undefined && sellingPrice !== product.sellingPrice) {
      const oldPrice = product.sellingPrice;
      product.sellingPrice = sellingPrice;
      detail += `Price updated from ${oldPrice} to ${sellingPrice}. `;
      await logActivity(req.user._id, 'PRICE_CHANGED', `Price updated for ${product.name}: ${sellingPrice}`, req);
      emitNotification('PRICE_UPDATED', 'Price Updated', `${product.name} price changed to ${sellingPrice}.`, { sku: product.sku });
    }

    if (quantity !== undefined) {
      const oldQty = product.quantity;
      if (actionType === 'IN') {
        product.quantity += Number(quantity);
        detail += `Stock In adjusted: +${quantity}. `;
      } else if (actionType === 'OUT') {
        product.quantity = Math.max(0, product.quantity - Number(quantity));
        detail += `Stock Out adjusted: -${quantity}. `;
      } else {
        product.quantity = Number(quantity);
        detail += `Stock level set to: ${quantity}. `;
      }
      
      await logActivity(req.user._id, 'INVENTORY_ADJUST', `Stock change for ${product.name} (SKU: ${product.sku}) from ${oldQty} to ${product.quantity}. ${detail}`, req);
    }

    await product.save();

    // Check inventory stock warning thresholds
    if (product.quantity === 0) {
      emitNotification('OUT_OF_STOCK', 'Out of Stock Alert', `${product.name} is out of stock!`, { sku: product.sku });
    } else if (product.quantity <= product.minimumStock) {
      emitNotification('LOW_STOCK', 'Low Stock Alert', `${product.name} has low stock (${product.quantity} remaining).`, { sku: product.sku });
    }

    const populatedProduct = await Product.findById(product._id).populate('category');
    return sendSuccess(res, 'Product adjusted successfully', populatedProduct);
  } catch (error) {
    return sendError(res, 'Failed to adjust product', error, 500);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    await Product.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'PRODUCT_DELETE', `Deleted product: ${product.name} (SKU: ${product.sku})`, req);
    emitNotification('PRODUCT_DELETED', 'Product Deleted', `${product.name} was removed from inventory.`, { sku: product.sku });

    return sendSuccess(res, 'Product deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete product', error, 500);
  }
};
