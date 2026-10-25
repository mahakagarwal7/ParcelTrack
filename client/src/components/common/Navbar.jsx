import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Bell, LogOut, Package, Shield, User, Building } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const roleColors = {
    STUDENT: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    GUARD: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    WARDEN: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ADMIN: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Parcel<span className="text-brand-400">Track</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-1">
                Hostel Reception & Handover
              </span>
            </div>
          </div>

          {/* Right Controls */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Hostel Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.hostelId}</span>
                {user.roomNumber && <span className="text-slate-500 font-mono">· {user.roomNumber}</span>}
              </div>

              {/* Role Badge */}
              <div
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  roleColors[user.role] || 'bg-slate-800 text-slate-300'
                }`}
              >
                <Shield className="w-3 h-3" />
                {user.role}
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && markAsRead(n._id)}
                            className={`p-3.5 text-left transition-colors cursor-pointer ${
                              n.isRead ? 'bg-slate-900/60' : 'bg-slate-800/80 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs font-bold text-slate-200">{n.title}</h5>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-2 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Name & Logout */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <span className="hidden lg:block text-xs font-medium text-slate-300">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
