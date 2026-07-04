import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    productCode: {
      type: String,
      required: [true, 'Please add a product code'],
      unique: true,
      trim: true,
    },
    qrCode: {
      type: String, // Base64 data URI representing product _id
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a selling price'],
      min: [0, 'Price must be positive'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price must be positive'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    description: {
      type: String,
    },
    productImage: {
      type: String, // Base64 or Cloudinary URL or local path
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
