import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

let io = null;

export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl || '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required for real-time notifications'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Invalid or deactivated user'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user) return;

    // Join user-specific notification room
    const userRoom = `user:${user._id.toString()}`;
    socket.join(userRoom);

    // Join hostel room
    const hostelRoom = `hostel:${user.hostelId.toUpperCase()}`;
    socket.join(hostelRoom);

    // Join role room within hostel
    const roleRoom = `role:${user.role}:${user.hostelId.toUpperCase()}`;
    socket.join(roleRoom);

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  console.log('Socket.IO real-time notification engine initialized');
  return io;
}

export function getIo() {
  return io;
}
