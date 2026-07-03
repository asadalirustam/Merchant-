import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().populate('products').sort('name');
    return sendSuccess(res, 'Suppliers retrieved successfully', suppliers);
  } catch (error) {
    return sendError(res, 'Failed to fetch suppliers', error, 500);
  }
};

// @desc    Get single supplier details
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate('products');
    if (!supplier) {
      return sendError(res, 'Supplier not found', null, 404);
    }
    return sendSuccess(res, 'Supplier retrieved successfully', supplier);
  } catch (error) {
    return sendError(res, 'Failed to fetch supplier', error, 500);
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private
export const createSupplier = async (req, res) => {
  const { name, phone, email, address, products } = req.body;

  if (!name || !phone) {
    return sendError(res, 'Name and Phone are required', null, 400);
  }

  try {
    const supplier = await Supplier.create({
      name,
      phone,
      email,
      address,
      products: products || [],
    });

    await logActivity(req.user._id, 'SUPPLIER_ADD', `Added supplier: ${supplier.name}`, req);

    return sendSuccess(res, 'Supplier created successfully', supplier, 201);
  } catch (error) {
    return sendError(res, 'Failed to create supplier', error, 500);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
export const updateSupplier = async (req, res) => {
  const { name, phone, email, address, products } = req.body;

  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return sendError(res, 'Supplier not found', null, 404);
    }

    if (name) supplier.name = name;
    if (phone) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;
    if (products) supplier.products = products;

    await supplier.save();

    await logActivity(req.user._id, 'SUPPLIER_UPDATE', `Updated supplier: ${supplier.name}`, req);

    const updatedSupplier = await Supplier.findById(supplier._id).populate('products');
    return sendSuccess(res, 'Supplier updated successfully', updatedSupplier);
  } catch (error) {
    return sendError(res, 'Failed to update supplier', error, 500);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return sendError(res, 'Supplier not found', null, 404);
    }

    await Supplier.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'SUPPLIER_DELETE', `Deleted supplier: ${supplier.name}`, req);

    return sendSuccess(res, 'Supplier deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete supplier', error, 500);
  }
};

// @desc    Get purchase logs history for a supplier
// @route   GET /api/suppliers/:id/history
// @access  Private
export const getSupplierHistory = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return sendError(res, 'Supplier not found', null, 404);
    }

    const purchases = await Purchase.find({ supplier: req.params.id })
      .populate('product')
      .sort('-date');

    return sendSuccess(res, 'Supplier purchase history retrieved successfully', purchases);
  } catch (error) {
    return sendError(res, 'Failed to fetch supplier history', error, 500);
  }
};
