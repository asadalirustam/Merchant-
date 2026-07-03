import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please add an SKU'],
      unique: true,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String, // Base64 image data URI or link
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
    },
    brand: {
      type: String,
      trim: true,
    },
    costPrice: {
      type: Number,
      required: [true, 'Please add cost price'],
      min: [0, 'Cost price must be positive'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add selling price'],
      min: [0, 'Selling price must be positive'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    minimumStock: {
      type: Number,
      default: 5,
      min: [0, 'Minimum stock cannot be negative'],
    },
    productImage: {
      type: String, // Cloudinary URL or local relative path
      default: '',
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
