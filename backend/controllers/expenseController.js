import Expense from '../models/Expense.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  const { type, startDate, endDate } = req.query;

  try {
    const query = {};

    if (type) {
      query.type = type;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const expenses = await Expense.find(query)
      .populate('recordedBy', 'name email')
      .sort('-date');

    return sendSuccess(res, 'Expenses retrieved successfully', expenses);
  } catch (error) {
    return sendError(res, 'Failed to fetch expenses', error, 500);
  }
};

// @desc    Record new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  const { type, amount, description, date } = req.body;

  if (!type || !amount) {
    return sendError(res, 'Type and Amount are required fields', null, 400);
  }

  try {
    const expense = await Expense.create({
      type,
      amount,
      description,
      date: date || new Date(),
      recordedBy: req.user._id,
    });

    await logActivity(
      req.user._id,
      'EXPENSE_ADD',
      `Recorded expense: ${expense.type} - Amount: ${expense.amount}`,
      req
    );

    const populatedExpense = await Expense.findById(expense._id).populate('recordedBy', 'name email');
    return sendSuccess(res, 'Expense recorded successfully', populatedExpense, 201);
  } catch (error) {
    return sendError(res, 'Failed to record expense', error, 500);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  const { type, amount, description, date } = req.body;

  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return sendError(res, 'Expense record not found', null, 404);
    }

    if (type) expense.type = type;
    if (amount) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (date) expense.date = date;

    await expense.save();

    await logActivity(
      req.user._id,
      'EXPENSE_UPDATE',
      `Updated expense ID: ${expense._id} (${expense.type})`,
      req
    );

    const populatedExpense = await Expense.findById(expense._id).populate('recordedBy', 'name email');
    return sendSuccess(res, 'Expense updated successfully', populatedExpense);
  } catch (error) {
    return sendError(res, 'Failed to update expense', error, 500);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return sendError(res, 'Expense record not found', null, 404);
    }

    await Expense.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'EXPENSE_DELETE',
      `Deleted expense ID: ${expense._id} (${expense.type})`,
      req
    );

    return sendSuccess(res, 'Expense record deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete expense', error, 500);
  }
};
