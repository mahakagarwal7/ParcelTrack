import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Bell, LogOut, Package, Shield, User, Building, Check, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const roleStyles = {
    STUDENT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    GUARD: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WARDEN: 'bg-amber-50 text-amber-800 border-amber-200',
    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1">
                Parcel<span className="text-indigo-600">Track</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 ml-1">
                  v2.0
                </span>
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-500 block -mt-0.5">
                Hostel Reception & Handover System
              </span>
            </div>
          </div>

          {/* Right Controls */}
          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Real-time Socket Live Sync Pill */}
              <div
                title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to live updates...'}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-600"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="hidden md:inline font-mono">{isConnected ? 'Live Sync' : 'Connecting'}</span>
              </div>

              {/* Hostel & Room Tag */}
              <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Hostel {user.hostelId}</span>
                {user.roomNumber && <span className="text-slate-400 font-mono">· Rm {user.roomNumber}</span>}
              </div>

              {/* Role Badge */}
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  roleStyles[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>{user.role}</span>
              </div>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Toggle notifications"
                  className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Live Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <Bell className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                          <p>No recent alerts</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && markAsRead(n._id)}
                            className={`p-3 transition cursor-pointer hover:bg-slate-50 ${
                              !n.isRead ? 'bg-indigo-50/40 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-slate-800 text-xs">{n.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div
                  title={user.name}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                >
                  {getInitials(user.name)}
                </div>
                <button
                  onClick={logout}
                  title="Sign out of ParcelTrack"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
