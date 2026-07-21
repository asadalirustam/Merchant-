import Product from '../models/Product.js';
import { generateQRCode } from '../utils/qrCodeGenerator.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';
import { emitNotification } from '../utils/socketHelper.js';

// @desc    Get all products with query filters
// @route   GET /api/products
// @access  Private (CEO & Admin)
export const getProducts = async (req, res) => {
  const { search, category, stockStatus, page = 1, limit = 100 } = req.query;

  try {
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Filter by stock level
    if (stockStatus === 'low') {
      // quantity <= 5 is standard low stock, let's make it 5
      query.$expr = { $and: [{ $lte: ['$quantity', 5] }, { $gt: ['$quantity', 0] }] };
    } else if (stockStatus === 'out') {
      query.quantity = 0;
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('createdBy', 'name email role')
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

// @desc    Get single product details
// @route   GET /api/products/:idOrCode
// @access  Private (CEO & Admin)
export const getProductById = async (req, res) => {
  const { idOrCode } = req.params;

  try {
    let product;

    if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrCode).populate('createdBy', 'name email role');
    } else {
      product = await Product.findOne({
        $or: [{ productCode: idOrCode }, { qrCode: idOrCode }],
      }).populate('createdBy', 'name email role');
    }

    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    return sendSuccess(res, 'Product retrieved successfully', product);
  } catch (error) {
    return sendError(res, 'Failed to fetch product details', error, 500);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin Only)
export const createProduct = async (req, res) => {
  // CEOs cannot directly edit products unless given permission (restricted to Admin role in route/controller)
  if (req.user.role === 'CEO') {
    return sendError(res, 'Access Denied: CEOs do not have permissions to write product data.', null, 403);
  }

  const {
    name,
    productCode,
    category,
    price,
    costPrice,
    quantity,
    description,
  } = req.body;

  if (!name || !productCode || !category || price === undefined) {
    return sendError(res, 'Required fields: name, productCode, category, price', null, 400);
  }

  try {
    const productExists = await Product.findOne({ productCode });
    if (productExists) {
      return sendError(res, 'Product with this Product Code already exists', null, 400);
    }

    // Process image
    let productImage = '';
    if (req.file) {
      productImage = await uploadToCloudinary(req.file.path);
    }

    // Instantiate model to get its _id for the QR Code
    const product = new Product({
      name,
      productCode,
      category,
      price,
      costPrice: costPrice !== undefined ? Number(costPrice) : 0,
      quantity: quantity || 0,
      productImage,
      description,
      createdBy: req.user._id,
    });

    // Auto-generate QR code representing product unique ID (_id)
    const qrCode = await generateQRCode(product._id.toString());
    product.qrCode = qrCode;

    await product.save();

    await logActivity(req.user._id, 'Product Added', `Admin added product: ${product.name} (Code: ${product.productCode})`, req);
    emitNotification('PRODUCT_ADD', 'Product Added', `${product.name} was successfully created.`, { id: product._id });

    // Check stock thresholds
    if (product.quantity === 0) {
      emitNotification('OUT_OF_STOCK', 'Out of Stock Warning', `${product.name} is out of stock.`, { id: product._id });
    } else if (product.quantity <= 5) {
      emitNotification('LOW_STOCK', 'Low Stock Warning', `${product.name} has low stock (${product.quantity} remaining).`, { id: product._id });
    }

    return sendSuccess(res, 'Product created successfully', product, 201);
  } catch (error) {
    return sendError(res, 'Failed to create product', error, 500);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin Only)
export const updateProduct = async (req, res) => {
  if (req.user.role === 'CEO') {
    return sendError(res, 'Access Denied: CEOs do not have permissions to edit product data.', null, 403);
  }

  const {
    name,
    productCode,
    category,
    price,
    costPrice,
    quantity,
    description,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (costPrice !== undefined) product.costPrice = Number(costPrice);

    let priceChanged = false;
    if (price !== undefined) {
      if (Number(price) !== product.price) {
        priceChanged = true;
      }
      product.price = Number(price);
    }

    if (quantity !== undefined) {
      product.quantity = Number(quantity);
    }

    if (productCode && productCode !== product.productCode) {
      const codeExists = await Product.findOne({ productCode });
      if (codeExists) {
        return sendError(res, 'Another product with this code already exists', null, 400);
      }
      product.productCode = productCode;
    }

    if (req.file) {
      product.productImage = await uploadToCloudinary(req.file.path);
    }

    await product.save();

    await logActivity(req.user._id, 'Product Updated', `Admin updated product: ${product.name} (Code: ${product.productCode})`, req);

    if (priceChanged) {
      await logActivity(req.user._id, 'Price Changed', `Admin changed price of ${product.name} to ${product.price}`, req);
    }

    // Check stock thresholds
    if (product.quantity === 0) {
      emitNotification('OUT_OF_STOCK', 'Out of Stock Warning', `${product.name} is out of stock.`, { id: product._id });
    } else if (product.quantity <= 5) {
      emitNotification('LOW_STOCK', 'Low Stock Warning', `${product.name} has low stock (${product.quantity} remaining).`, { id: product._id });
    }

    return sendSuccess(res, 'Product updated successfully', product);
  } catch (error) {
    return sendError(res, 'Failed to update product', error, 500);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin Only)
export const deleteProduct = async (req, res) => {
  if (req.user.role === 'CEO') {
    return sendError(res, 'Access Denied: CEOs do not have permissions to delete product data.', null, 403);
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    await Product.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'Product Deleted', `Admin deleted product: ${product.name} (Code: ${product.productCode})`, req);
    emitNotification('PRODUCT_DELETED', 'Product Deleted', `${product.name} was removed from catalogs.`, { id: product._id });

    return sendSuccess(res, 'Product deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete product', error, 500);
  }
};

// @desc    Adjust product stock level or price
// @route   PATCH /api/products/:id/adjust
// @access  Private (Admin Only)
export const adjustProduct = async (req, res) => {
  if (req.user.role === 'CEO') {
    return sendError(res, 'Access Denied: CEOs do not have permissions to adjust product data.', null, 403);
  }

  const { quantity, price, costPrice } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    let activityDetails = [];

    if (quantity !== undefined) {
      const oldQty = product.quantity;
      product.quantity = Number(quantity);
      activityDetails.push(`stock adjusted from ${oldQty} to ${product.quantity}`);
    }

    if (price !== undefined) {
      const oldPrice = product.price;
      product.price = Number(price);
      activityDetails.push(`price adjusted from ${oldPrice} to ${product.price}`);
      await logActivity(req.user._id, 'Price Changed', `Admin adjusted price of ${product.name} to ${product.price}`, req);
    }

    if (costPrice !== undefined) {
      product.costPrice = Number(costPrice);
      activityDetails.push(`cost price adjusted to ${product.costPrice}`);
    }

    await product.save();

    await logActivity(
      req.user._id,
      'Product Updated',
      `Admin adjusted product (${product.name}): ${activityDetails.join(', ')}`,
      req
    );

    // Emit alerts if needed
    if (product.quantity === 0) {
      emitNotification('OUT_OF_STOCK', 'Out of Stock Warning', `${product.name} is out of stock.`, { id: product._id });
    } else if (product.quantity <= 5) {
      emitNotification('LOW_STOCK', 'Low Stock Warning', `${product.name} has low stock (${product.quantity} remaining).`, { id: product._id });
    }

    return sendSuccess(res, 'Product adjusted successfully', product);
  } catch (error) {
    return sendError(res, 'Failed to adjust product data', error, 500);
  }
};
