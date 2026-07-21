import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initIO } from './utils/socketHelper.js';

// Import Route Handlers
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
initIO(server, frontendUrl);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  frontendUrl
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Express Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
app.use('/api', apiLimiter);

// Serve local static directories
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Map REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api', saleRoutes); // Mounts /api/sales and /api/invoices
app.use('/api/settings', settingsRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Merchant Management System API is running...');
});

// Route fallbacks & Global Exception handling
app.use(notFound);
app.use(errorHandler);

// Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
