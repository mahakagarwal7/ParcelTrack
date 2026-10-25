import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: config.clientUrl || true,
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

// Authentication Routes
app.use('/api/auth', authRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
