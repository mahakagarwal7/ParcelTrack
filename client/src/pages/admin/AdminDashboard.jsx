import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Modal from '../../components/common/Modal';
import {
  ShieldAlert,
  Users,
  Package,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  History,
  Building,
  Edit,
  Clock,
  Activity,
  Lock,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'audit'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User Filter & Search
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');

  // Edit User Modal
  const [editUserModal, setEditUserModal] = useState({
    open: false,
    user: null,
    role: 'STUDENT',
    hostelId: 'H-1',
    isActive: true,
    standingPermissionSuspended: false,
    roomNumber: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Fetch campus stats & users
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [statsRes, usersRes, logsRes] = await Promise.all([
        axiosClient.get('/admin/stats'),
        axiosClient.get(`/admin/users?search=${encodeURIComponent(searchUser)}&role=${roleFilter}&hostelId=${hostelFilter}`),
        axiosClient.get('/activity-logs?limit=40'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (usersRes.data.success) {
        setUsersList(usersRes.data.users || []);
      }
      if (logsRes.data.success) {
        setAuditLogs(logsRes.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchUser, roleFilter, hostelFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchData();
    };
    socket.on('parcel:updated', handleUpdate);
    socket.on('activity:new', handleUpdate);
    return () => {
      socket.off('parcel:updated', handleUpdate);
      socket.off('activity:new', handleUpdate);
    };
  }, [socket, fetchData]);

  // Open Edit User Modal
  const handleOpenEdit = (targetUser) => {
    setEditUserModal({
      open: true,
      user: targetUser,
      role: targetUser.role,
      hostelId: targetUser.hostelId,
      isActive: targetUser.isActive,
      standingPermissionSuspended: Boolean(targetUser.standingPermissionSuspended),
      roomNumber: targetUser.roomNumber || '',
    });
  };

  // Save User Edit
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editUserModal.user) return;

    try {
      setEditLoading(true);
      const res = await axiosClient.patch(`/admin/users/${editUserModal.user._id}`, {
        role: editUserModal.role,
        hostelId: editUserModal.hostelId,
        isActive: editUserModal.isActive,
        standingPermissionSuspended: editUserModal.standingPermissionSuspended,
        roomNumber: editUserModal.roomNumber,
      });

      if (res.data.success) {
        setEditUserModal({ ...editUserModal, open: false, user: null });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Campus Admin Oversight • Global Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            System Administration Console
          </h1>
          <p className="text-sm text-purple-200 mt-1">
            Administrator: <strong className="text-white">{user?.name}</strong> • Real-time Cross-Hostel Analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition border border-white/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Campus Overview & Metrics', icon: Activity },
          { id: 'users', label: `User Directory (${usersList.length})`, icon: Users },
          { id: 'audit', label: 'System-wide Audit Ledger', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CAMPUS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalUsers ?? '...'}</p>
              <span className="text-[11px] text-slate-400">Campus-wide</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Parcels</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats?.totalParcels ?? '...'}</p>
              <span className="text-[11px] text-slate-400">Lifetime logged</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">In Gate Storage</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{stats?.parcelsAwaitingCollection ?? '...'}</p>
              <span className="text-[11px] text-emerald-600">Awaiting student OTP</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Handed Over</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.parcelsCollected ?? '...'}</p>
              <span className="text-[11px] text-slate-400">Successfully collected</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Warden Queue</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{stats?.pendingWardenApprovals ?? '...'}</p>
              <span className="text-[11px] text-amber-600">Pending reviews</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gate Arrivals</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.activeDeliveryAttempts ?? '...'}</p>
              <span className="text-[11px] text-slate-400">Unexpected couriers</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              <span>Campus Security Architecture & Key Guarantees</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>State Invariant Enforcement</span>
                </div>
                <p className="text-slate-600">
                  Parcels can only enter <strong>RECEIVED</strong> state if pre-authorized or consent is granted. Invalid bypasses throw 400 Bad Request.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Atomic Collection Guard</span>
                </div>
                <p className="text-slate-600">
                  Handover uses atomic conditional DB updates. Concurrent OTP submissions trigger 409 Conflict with zero race-condition vulnerability.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hostel Multi-Tenancy</span>
                </div>
                <p className="text-slate-600">
                  Guards and Wardens are strictly scoped by <code>req.user.hostelId</code>. Cross-hostel data leakage is forbidden at middleware level.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Campus User Directory</h2>
              <p className="text-xs text-slate-500">Manage student, guard, warden, and admin access</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search name, email, roll..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="GUARD">Guards</option>
                <option value="WARDEN">Wardens</option>
                <option value="ADMIN">Admins</option>
              </select>

              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Hostels</option>
                <option value="H-1">Hostel H-1</option>
                <option value="H-2">Hostel H-2</option>
                <option value="H-3">Hostel H-3</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Room / Roll</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'WARDEN'
                            ? 'bg-amber-100 text-amber-700'
                            : u.role === 'GUARD'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{u.hostelId}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.roomNumber ? `Room ${u.roomNumber}` : '—'}
                      {u.studentId ? ` (${u.studentId})` : ''}
                    </td>
                    <td className="py-3 px-4">
                      {u.isActive ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LEDGER */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Campus-Wide Activity Audit Stream</h2>
            <p className="text-xs text-slate-500">Immutable ledger of all parcel lifecycles and administrative actions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{log.actorId?.name || 'System'}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({log.actorRole})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{log.hostelId}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {log.parcelId ? `Parcel: ${log.parcelId}` : ''}
                      {log.notes ? ` • ${log.notes}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right text-[11px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal
        isOpen={editUserModal.open}
        onClose={() => setEditUserModal({ ...editUserModal, open: false })}
        title={`Edit User: ${editUserModal.user?.name || ''}`}
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Role</label>
            <select
              value={editUserModal.role}
              onChange={(e) => setEditUserModal({ ...editUserModal, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="STUDENT">STUDENT</option>
              <option value="GUARD">GUARD</option>
              <option value="WARDEN">WARDEN</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hostel ID</label>
            <input
              type="text"
              required
              value={editUserModal.hostelId}
              onChange={(e) => setEditUserModal({ ...editUserModal, hostelId: e.target.value })}
              className="w-full px-3 py-2 uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Room Number</label>
            <input
              type="text"
              value={editUserModal.roomNumber}
              onChange={(e) => setEditUserModal({ ...editUserModal, roomNumber: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editUserModal.isActive}
                onChange={(e) => setEditUserModal({ ...editUserModal, isActive: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="font-semibold text-slate-700">Account Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editUserModal.standingPermissionSuspended}
                onChange={(e) =>
                  setEditUserModal({ ...editUserModal, standingPermissionSuspended: e.target.checked })
                }
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-semibold text-rose-700">Standing Permission Suspended</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditUserModal({ ...editUserModal, open: false })}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
