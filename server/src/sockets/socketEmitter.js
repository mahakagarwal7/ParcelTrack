import { getIo } from './socketServer.js';

export function emitToUser(userId, event, payload) {
  try {
    const io = getIo();
    if (!io) return;
    const room = `user:${userId.toString()}`;
    io.to(room).emit(event, payload);
  } catch (err) {
    console.error('Socket emitToUser error:', err);
  }
}

export function emitToHostel(hostelId, event, payload) {
  try {
    const io = getIo();
    if (!io) return;
    const room = `hostel:${hostelId.toUpperCase()}`;
    io.to(room).emit(event, payload);
  } catch (err) {
    console.error('Socket emitToHostel error:', err);
  }
}

export function emitToRoleInHostel(role, hostelId, event, payload) {
  try {
    const io = getIo();
    if (!io) return;
    const room = `role:${role}:${hostelId.toUpperCase()}`;
    io.to(room).emit(event, payload);
  } catch (err) {
    console.error('Socket emitToRoleInHostel error:', err);
  }
}
