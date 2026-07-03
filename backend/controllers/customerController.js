import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort('-totalSpending');
    return sendSuccess(res, 'Customers retrieved successfully', customers);
  } catch (error) {
    return sendError(res, 'Failed to fetch customers', error, 500);
  }
};

// @desc    Get single customer details
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return sendError(res, 'Customer not found', null, 404);
    }
    return sendSuccess(res, 'Customer retrieved successfully', customer);
  } catch (error) {
    return sendError(res, 'Failed to fetch customer', error, 500);
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  const { name, phone, email, address } = req.body;

  if (!name || !phone) {
    return sendError(res, 'Name and Phone are required', null, 400);
  }

  try {
    const customerExists = await Customer.findOne({ phone });
    if (customerExists) {
      return sendSuccess(res, 'Customer already exists', customerExists, 200);
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
    });

    await logActivity(req.user._id, 'CUSTOMER_ADD', `Added customer: ${customer.name} (Phone: ${customer.phone})`, req);

    return sendSuccess(res, 'Customer created successfully', customer, 201);
  } catch (error) {
    return sendError(res, 'Failed to create customer', error, 500);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  const { name, phone, email, address } = req.body;

  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return sendError(res, 'Customer not found', null, 404);
    }

    if (name) customer.name = name;
    if (phone) {
      const phoneExists = await Customer.findOne({ phone, _id: { $ne: customer._id } });
      if (phoneExists) {
        return sendError(res, 'Phone number already registered to another customer', null, 400);
      }
      customer.phone = phone;
    }
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;

    await customer.save();

    await logActivity(req.user._id, 'CUSTOMER_UPDATE', `Updated customer: ${customer.name}`, req);

    return sendSuccess(res, 'Customer updated successfully', customer);
  } catch (error) {
    return sendError(res, 'Failed to update customer', error, 500);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return sendError(res, 'Customer not found', null, 404);
    }

    await Customer.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'CUSTOMER_DELETE', `Deleted customer: ${customer.name}`, req);

    return sendSuccess(res, 'Customer deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete customer', error, 500);
  }
};

// @desc    Get customer purchase history
// @route   GET /api/customers/:id/history
// @access  Private
export const getCustomerHistory = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return sendError(res, 'Customer not found', null, 404);
    }

    const sales = await Sale.find({ customer: req.params.id })
      .populate('cashier', 'name')
      .sort('-date');

    return sendSuccess(res, 'Customer history retrieved successfully', {
      customer,
      sales,
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch customer history', error, 500);
  }
};
