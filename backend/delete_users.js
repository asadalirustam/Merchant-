import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import connectDB from './config/db.js';

dotenv.config();

async function run() {
  try {
    await connectDB();
    console.log('Deleting all user accounts from database...');
    await User.deleteMany({});

    // Set all seeded products createdBy to a generic system ObjectId since users are deleted
    const systemId = new mongoose.Types.ObjectId('000000000000000000000000');
    await Product.updateMany({}, { createdBy: systemId });

    console.log('All user accounts successfully deleted. Database users collection is now empty.');
    process.exit(0);
  } catch (error) {
    console.error('Delete failed:', error);
    process.exit(1);
  }
}

setTimeout(run, 2000);
