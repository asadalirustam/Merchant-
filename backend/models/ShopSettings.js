import mongoose from 'mongoose';

const shopSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'Enterprise Merchant ERP',
    },
    logo: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '123 Enterprise Way, Suite 100',
    },
    phone: {
      type: String,
      default: '+1 (555) 019-2834',
    },
    email: {
      type: String,
      default: 'info@enterprisemerchant.com',
    },
    currency: {
      type: String,
      default: 'USD', // e.g., USD, EUR, GBP, PKR, etc.
    },
    taxPercentage: {
      type: Number,
      default: 0, // e.g. 15% sales tax
      min: 0,
      max: 100,
    },
    invoiceFooter: {
      type: String,
      default: 'Thank you for your business!',
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
  },
  {
    timestamps: true,
  }
);

const ShopSettings = mongoose.model('ShopSettings', shopSettingsSchema);
export default ShopSettings;
