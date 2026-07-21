import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  costPrice: {
    type: Number,
    default: 0, // Snapshot of product cost price at time of sale
  },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [saleItemSchema],
    subTotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0, // Discount amount in currency
    },
    tax: {
      type: Number,
      default: 0, // Tax amount in currency
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Online'],
      required: true,
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      default: 'Guest',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
