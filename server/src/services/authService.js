import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      hostelId: user.hostelId,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
}

export async function registerUser(userData) {
  const { name, email, password, role = 'STUDENT', hostelId, studentId, roomNumber, phone } = userData;

  if (!name || !email || !password || !hostelId) {
    throw ApiError.badRequest('Please provide all required fields: name, email, password, hostelId');
  }

  // Check if email already registered
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Create new user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    hostelId: hostelId.toUpperCase(),
    studentId: studentId || null,
    roomNumber: roomNumber || null,
    phone: phone || null,
  });

  const token = generateToken(user);
  return { user, token };
}

export async function loginUser(email, password) {
  if (!email || !password) {
    throw ApiError.badRequest('Please provide email and password');
  }

  // Query user including password field for verification
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user);

  // Return clean user object without password
  const cleanUser = user.toJSON();
  return { user: cleanUser, token };
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}
