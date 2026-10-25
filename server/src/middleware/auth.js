import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export async function protect(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Not authenticated. Please log in.'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Authentication token has expired. Please log in again.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized('User belonging to this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account is deactivated.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
