import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    return sendSuccess(res, 'Categories retrieved successfully', categories);
  } catch (error) {
    return sendError(res, 'Failed to fetch categories', error, 500);
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', null, 404);
    }
    return sendSuccess(res, 'Category retrieved successfully', category);
  } catch (error) {
    return sendError(res, 'Failed to fetch category', error, 500);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return sendError(res, 'Please provide category name', null, 400);
  }

  try {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return sendError(res, 'Category already exists', null, 400);
    }

    const category = await Category.create({ name, description });

    await logActivity(
      req.user._id,
      'CATEGORY_ADD',
      `Category added: ${category.name}`,
      req
    );

    return sendSuccess(res, 'Category created successfully', category, 201);
  } catch (error) {
    return sendError(res, 'Failed to create category', error, 500);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
  const { name, description } = req.body;

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', null, 404);
    }

    if (name) category.name = name;
    if (description) category.description = description;

    await category.save();

    await logActivity(
      req.user._id,
      'CATEGORY_UPDATE',
      `Category updated: ${category.name}`,
      req
    );

    return sendSuccess(res, 'Category updated successfully', category);
  } catch (error) {
    return sendError(res, 'Failed to update category', error, 500);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', null, 404);
    }

    // Check if category is used in products
    const productsUsingCategory = await Product.countDocuments({ category: category._id });
    if (productsUsingCategory > 0) {
      return sendError(
        res,
        `Cannot delete category. There are ${productsUsingCategory} product(s) linked to it.`,
        null,
        400
      );
    }

    await Category.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'CATEGORY_DELETE',
      `Category deleted: ${category.name}`,
      req
    );

    return sendSuccess(res, 'Category deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete category', error, 500);
  }
};
