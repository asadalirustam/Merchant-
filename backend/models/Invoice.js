import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const invoiceEditSchema = new mongoose.Schema({
  editedBy: {
    type: String,
    required: true,
  },
  editedAt: {
    type: Date,
    default: Date.now,
  },
  previousGrandTotal: {
    type: Number,
    required: true,
  },
  newGrandTotal: {
    type: Number,
    required: true,
  },
  summary: {
    type: String,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    customerName: {
      type: String,
      default: 'Guest',
    },
    cashierName: {
      type: String,
      required: true,
    },
    items: [invoiceItemSchema],
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    editHistory: [invoiceEditSchema],
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;

