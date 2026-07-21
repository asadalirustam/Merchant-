import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Sale from './models/Sale.js';
import Invoice from './models/Invoice.js';
import ActivityLog from './models/ActivityLog.js';
import RefreshToken from './models/RefreshToken.js';
import ShopSettings from './models/ShopSettings.js';
import connectDB from './config/db.js';
import { generateQRCode } from './utils/qrCodeGenerator.js';

dotenv.config();

const demoProducts = [
  // Electronics
  { name: 'Wireless Ergonomic Mouse', productCode: 'ELEC-1001', category: 'Electronics', price: 29.99, quantity: 45, description: '2.4GHz wireless mouse with optical tracking and ergonomic design.' },
  { name: 'Mechanical Gaming Keyboard', productCode: 'ELEC-1002', category: 'Electronics', price: 79.99, quantity: 20, description: 'RGB backlit mechanical keyboard with blue tactile switches.' },
  { name: 'Ultra-HD Web Camera 4K', productCode: 'ELEC-1003', category: 'Electronics', price: 119.99, quantity: 4, description: '4K resolution streaming camera with built-in autofocus microphone.' }, // Low stock (4)
  { name: 'Noise Cancelling Headphones', productCode: 'ELEC-1004', category: 'Electronics', price: 199.99, quantity: 15, description: 'Over-ear Bluetooth headphones with active noise cancellation.' },
  { name: 'Fast Charging Power Bank 20k', productCode: 'ELEC-1005', category: 'Electronics', price: 34.99, quantity: 60, description: '20,000mAh external battery pack with dual USB ports.' },
  
  // Groceries
  { name: 'Organic Almond Milk 1L', productCode: 'GROC-2001', category: 'Groceries', price: 3.49, quantity: 120, description: 'Unsweetened organic almond milk, rich in calcium and vitamins.' },
  { name: 'Whole Wheat Sandwich Bread', productCode: 'GROC-2002', category: 'Groceries', price: 2.29, quantity: 3, description: 'Freshly baked sliced whole wheat bread rich in fiber.' }, // Low stock (3)
  { name: 'Extra Virgin Olive Oil 500ml', productCode: 'GROC-2003', category: 'Groceries', price: 9.99, quantity: 35, description: 'Cold-pressed extra virgin olive oil from Spanish olives.' },
  { name: 'Classic Tomato Ketchup 500g', productCode: 'GROC-2004', category: 'Groceries', price: 1.89, quantity: 80, description: 'Rich tomato ketchup made with organic vine-ripened tomatoes.' },
  { name: 'Japanese Green Tea Bags 40ct', productCode: 'GROC-2005', category: 'Groceries', price: 6.49, quantity: 50, description: 'Authentic sencha green tea bags packed with antioxidants.' },

  // Apparel
  { name: 'Classic Cotton Crewneck T-Shirt', productCode: 'APPA-3001', category: 'Apparel', price: 14.99, quantity: 75, description: '100% pre-shrunk cotton t-shirt in solid charcoal grey.' },
  { name: 'Slim Fit Denim Jeans', productCode: 'APPA-3002', category: 'Apparel', price: 44.99, quantity: 25, description: 'Stretchable classic blue denim jeans with a modern slim fit.' },
  { name: 'Comfy Cushioned Athletic Socks', productCode: 'APPA-3003', category: 'Apparel', price: 8.99, quantity: 110, description: 'Pack of 3 moisture-wicking compression ankle socks.' },
  { name: 'Full-Grain Leather Dress Belt', productCode: 'APPA-3004', category: 'Apparel', price: 24.99, quantity: 2, description: 'Premium black dress belt with silver buckle, size adjustable.' }, // Low stock (2)

  // Home & Kitchen
  { name: 'Insulated Stainless Water Bottle', productCode: 'HOME-4001', category: 'Home & Kitchen', price: 18.99, quantity: 40, description: 'Double-walled vacuum insulated bottle, keeps cold for 24 hours.' },
  { name: 'Ceramic Matte Coffee Mug 400ml', productCode: 'HOME-4002', category: 'Home & Kitchen', price: 7.99, quantity: 95, description: 'Minimalist stoneware coffee cup with comfortable grip handle.' },
  { name: 'Non-Stick Frying Pan 10"', productCode: 'HOME-4003', category: 'Home & Kitchen', price: 29.99, quantity: 18, description: 'Heavy-gauge aluminum skillet with triple-layer non-stick coating.' },
  { name: 'Digital Precision Kitchen Scale', productCode: 'HOME-4004', category: 'Home & Kitchen', price: 15.49, quantity: 30, description: 'Slim weight scale for baking and food prep with tare function.' },

  // Office Supplies
  { name: 'Premium Hardcover Notebook A5', productCode: 'OFFI-5001', category: 'Office Supplies', price: 11.99, quantity: 65, description: '160 pages dotted grid notebook with thick ink-friendly paper.' },
  { name: 'Retractable Gel Pens Black 12ct', productCode: 'OFFI-5002', category: 'Office Supplies', price: 12.99, quantity: 5, description: 'Smooth writing quick-dry black gel ink pens with soft rubber grip.' } // Low stock (5)
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Wiping database collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    await Invoice.deleteMany({});
    await ActivityLog.deleteMany({});
    await RefreshToken.deleteMany({});
    await ShopSettings.deleteMany({});

    console.log('Database collections wiped successfully.');

    // Seed default settings
    console.log('Seeding shop settings...');
    await ShopSettings.create({
      shopName: 'Elite Merchant Store',
      logo: '',
      address: '786 Market Avenue, Capital City',
      phone: '+92 (300) 123-4567',
      email: 'support@elitemerchants.com',
      currency: 'USD',
      taxPercentage: 15,
      invoiceFooter: 'Thank you for shopping with Elite Merchant!',
      theme: 'dark'
    });

    // Create CEO account
    console.log('Creating CEO account...');
    const ceo = await User.create({
      name: 'Executive CEO',
      email: 'ceo@shop.com',
      password: 'password123',
      role: 'CEO',
      status: 'Enabled'
    });
    console.log(`CEO account created: ceo@shop.com / password123`);

    // Create Admin account
    console.log('Creating Admin account...');
    const admin = await User.create({
      name: 'Cashier Admin',
      email: 'admin@shop.com',
      password: 'password123',
      role: 'Admin',
      status: 'Enabled'
    });
    console.log(`Admin account created: admin@shop.com / password123`);

    // Seed 20 products
    console.log('Seeding 20 demo products...');
    for (const item of demoProducts) {
      const product = new Product({
        ...item,
        createdBy: admin._id,
        productImage: ''
      });

      // Generate base64 QR code matching product ID
      const qrCode = await generateQRCode(product._id.toString());
      product.qrCode = qrCode;

      await product.save();
      console.log(`- Seeded product: ${product.name} (Code: ${product.productCode})`);
    }

    console.log('\n=========================================');
    console.log('Database seeding successfully completed!');
    console.log('=========================================');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
}

// Delay execution slightly to ensure setup matches connection
setTimeout(seed, 2000);
