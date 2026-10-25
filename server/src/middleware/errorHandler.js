import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  let error = err;

  // Handle Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid resource ID format for: ${err.path}`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value for ${field}. Please use another value.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    error = new ApiError(400, 'Validation Error', messages);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    errors: error.errors || [],
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  };

  if (statusCode === 500 && !error.isOperational) {
    console.error('Unhandled System Error:', err);
  }

  res.status(statusCode).json(response);
}
