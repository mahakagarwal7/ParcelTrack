import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axiosClient from '../api/axiosClient';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveToast, setLiveToast] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axiosClient.get('/notifications?limit=30');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  // Establish Socket.IO connection
  useEffect(() => {
    if (!token || !user) {
      if (socket) socket.disconnect();
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
      : '/';

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));

    socketInstance.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Trigger temporary alert toast
      setLiveToast({
        title: notification.title,
        message: notification.message,
        type: notification.type,
      });

      setTimeout(() => {
        setLiveToast(null);
      }, 6000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  const markAsRead = async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all read:', e);
    }
  };

  const value = {
    socket,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
    refreshNotifications: fetchNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {/* Live Toast Notification Banner */}
      {liveToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 left-6 sm:left-auto max-w-md z-50 bg-white border border-slate-200 border-l-4 border-l-primary-600 rounded-2xl shadow-lift p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-bold text-sm text-navy">{liveToast.title}</h4>
              <p className="text-sm text-slate-600 mt-0.5">{liveToast.message}</p>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-navy text-sm font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
