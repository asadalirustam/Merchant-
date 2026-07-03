import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Rent', 'Electricity', 'Internet', 'Salary', 'Other'],
      required: [true, 'Please select an expense type'],
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the expense amount'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
