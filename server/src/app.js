import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import parcelRoutes from './routes/parcelRoutes.js';
import authorizationRoutes from './routes/authorizationRoutes.js';
import deliveryAttemptRoutes from './routes/deliveryAttemptRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'ParcelTrack API is operational',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Root ping
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'ParcelTrack API',
    description: 'Hostel Parcel Reception and Secure Handover System',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hostel', policyRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/authorizations', authorizationRoutes);
app.use('/api/delivery-attempts', deliveryAttemptRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
