import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/common/Timeline';
import Modal from '../../components/common/Modal';
import {
  Package,
  PlusCircle,
  KeyRound,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  History,
  ShieldAlert,
  Send,
  Calendar,
  Truck,
  MapPin,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [parcels, setParcels] = useState([]);
  const [deliveryAttempts, setDeliveryAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Register Parcel Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    carrier: 'Amazon',
    trackingNumber: '',
    description: '',
    vendor: '',
    expectedArrivalDate: new Date().toISOString().split('T')[0],
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // OTP Modal State
  const [otpModal, setOtpModal] = useState({
    open: false,
    parcel: null,
    otp: '',
    expiresAt: null,
    loading: false,
    error: '',
  });

  // Timeline / History Modal State
  const [timelineModal, setTimelineModal] = useState({
    open: false,
    parcel: null,
  });

  // Fetch student parcels and pending delivery attempts
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [parcelsRes, attemptsRes] = await Promise.all([
        axiosClient.get('/parcels/my'),
        axiosClient.get('/delivery-attempts'),
      ]);

      if (parcelsRes.data.success) {
        setParcels(parcelsRes.data.parcels || []);
      }
      if (attemptsRes.data.success) {
        setDeliveryAttempts(attemptsRes.data.deliveryAttempts || []);
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchData();
    };

    socket.on('parcel:updated', handleUpdate);
    socket.on('notification:new', handleUpdate);
    socket.on('delivery_attempt:new', handleUpdate);

    return () => {
      socket.off('parcel:updated', handleUpdate);
      socket.off('notification:new', handleUpdate);
      socket.off('delivery_attempt:new', handleUpdate);
    };
  }, [socket, fetchData]);

  // Handle registering an expected parcel
  const handleRegisterParcel = async (e) => {
    e.preventDefault();
    if (!registerForm.carrier || !registerForm.trackingNumber) {
      setRegisterError('Carrier and Tracking Number are required');
      return;
    }

    try {
      setRegisterLoading(true);
      setRegisterError('');
      const res = await axiosClient.post('/parcels', registerForm);
      if (res.data.success) {
        setShowRegisterModal(false);
        setRegisterForm({
          carrier: 'Amazon',
          trackingNumber: '',
          description: '',
          vendor: '',
          expectedArrivalDate: new Date().toISOString().split('T')[0],
        });
        fetchData();
      }
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Failed to register parcel');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handle Student Decision on unexpected delivery attempt
  const handleStudentDecision = async (authorizationId, decision) => {
    try {
      await axiosClient.post(`/authorizations/${authorizationId}/student-decision`, {
        decision,
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${decision.toLowerCase()} delivery attempt`);
    }
  };

  // Handle Request Collection OTP
  const handleRequestOtp = async (parcel) => {
    try {
      setOtpModal({
        open: true,
        parcel,
        otp: '',
        expiresAt: null,
        loading: true,
        error: '',
      });

      const res = await axiosClient.post(`/parcels/${parcel._id}/collection-otp`);
      if (res.data.success) {
        setOtpModal({
          open: true,
          parcel,
          otp: res.data.otp,
          expiresAt: res.data.expiresAt,
          loading: false,
          error: '',
        });
      }
    } catch (err) {
      setOtpModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to generate collection OTP',
      }));
    }
  };

  // Filtered parcels
  const filteredParcels = parcels.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.parcelId?.toLowerCase().includes(q) ||
      p.trackingNumber?.toLowerCase().includes(q) ||
      p.carrier?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    );
  });

  // Pending gate delivery attempts needing student consent
  const pendingAttempts = deliveryAttempts.filter(
    (a) => a.status === 'AWAITING_AUTHORIZATION' && a.authorizationId
  );

  // Metrics
  const activeCount = parcels.filter((p) => p.status !== 'COLLECTED').length;
  const inCustodyCount = parcels.filter((p) => p.status === 'RECEIVED').length;
  const collectedCount = parcels.filter((p) => p.status === 'COLLECTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            <Package className="w-4 h-4" />
            <span>Student Portal • Hostel {user?.hostelId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-indigo-100 mt-1">
            Room {user?.roomNumber || 'N/A'} • Student ID: {user?.studentId || 'N/A'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition border border-white/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Expected Parcel</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Parcels</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{activeCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">In transit or at gate</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Ready to Collect</p>
            <KeyRound className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{inCustodyCount}</p>
          <span className="text-xs text-emerald-600 mt-1 block">In guard custody (OTP ready)</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Consent</p>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingAttempts.length}</p>
          <span className="text-xs text-amber-600 mt-1 block">Couriers waiting at gate</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{collectedCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Successfully handed over</span>
        </div>
      </div>

      {/* Real-time Consent Requests from Gate */}
      {pendingAttempts.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-600 animate-bounce" />
            <span>Action Required: Courier Delivery Awaiting Your Consent</span>
          </div>
          <p className="text-xs text-amber-800">
            A courier has arrived at Hostel Gate with a parcel in your name. Please grant or reject permission for reception into hostel custody.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {pendingAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      Gate Courier Arrival
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{attempt.courierName}</h4>
                  <p className="text-xs text-slate-600">
                    Tracking: <span className="font-mono font-medium">{attempt.trackingNumber || 'N/A'}</span>
                  </p>
                  {attempt.deliveryPersonContact && (
                    <p className="text-xs text-slate-500">Contact: {attempt.deliveryPersonContact}</p>
                  )}
                  {attempt.notes && (
                    <p className="text-xs text-slate-500 italic">"{attempt.notes}"</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleStudentDecision(attempt.authorizationId?._id || attempt.authorizationId, 'GRANT')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Grant Consent</span>
                  </button>
                  <button
                    onClick={() => handleStudentDecision(attempt.authorizationId?._id || attempt.authorizationId, 'REJECT')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parcels List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">My Deliveries & Parcels</h2>
            <p className="text-xs text-slate-500">Monitor tracking status and generate handover collection OTPs</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parcel, tracking..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading parcel records...
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No parcels found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm ? 'Try a different search keyword' : 'Pre-register your upcoming parcel to speed up intake at the gate'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Carrier & Tracking</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Shelf / Gate Location</th>
                  <th className="py-3 px-4">Expected / Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredParcels.map((p) => {
                  const isReceived = p.status === 'RECEIVED';
                  const isCollected = p.status === 'COLLECTED';

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {p.parcelId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{p.carrier}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {p.trackingNumber || 'No tracking #'}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {p.shelfLocation ? (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <MapPin className="w-3 h-3" />
                            {p.shelfLocation}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not in custody</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {p.receivedAt ? (
                          <div>
                            <span className="text-[11px] font-semibold text-slate-700">Received</span>
                            <div className="text-[10px]">
                              {new Date(p.receivedAt).toLocaleDateString()}{' '}
                              {new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : p.expectedArrivalDate ? (
                          <div>
                            <span className="text-[11px] text-slate-600">Expected</span>
                            <div className="text-[10px]">
                              {new Date(p.expectedArrivalDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* OTP Button if parcel is RECEIVED in custody */}
                          {isReceived && (
                            <button
                              onClick={() => handleRequestOtp(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Show OTP</span>
                            </button>
                          )}

                          {isCollected && (
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Handed Over
                            </span>
                          )}

                          {/* Lifecycle History Button */}
                          <button
                            onClick={() => setTimelineModal({ open: true, parcel: p })}
                            title="View Lifecycle History"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Expected Parcel */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register Upcoming Parcel"
      >
        <form onSubmit={handleRegisterParcel} className="space-y-4">
          <p className="text-xs text-slate-500">
            Pre-registering authorizes the gate guard to receive your parcel directly upon arrival without gate delay.
          </p>

          {registerError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Courier Carrier *
            </label>
            <div className="relative">
              <Truck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={registerForm.carrier}
                onChange={(e) => setRegisterForm({ ...registerForm, carrier: e.target.value })}
                placeholder="Amazon, BlueDart, Flipkart, Delhivery..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tracking / AWB Number *
            </label>
            <input
              type="text"
              required
              value={registerForm.trackingNumber}
              onChange={(e) => setRegisterForm({ ...registerForm, trackingNumber: e.target.value })}
              placeholder="e.g. TRK-9876543210"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Expected Arrival Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                value={registerForm.expectedArrivalDate}
                onChange={(e) => setRegisterForm({ ...registerForm, expectedArrivalDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Item Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={registerForm.description}
              onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
              placeholder="Books, electronics, clothing..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-60"
            >
              {registerLoading ? (
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Pre-Authorization</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Single-Use Collection OTP */}
      <Modal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ ...otpModal, open: false })}
        title="Secure Collection OTP"
      >
        <div className="space-y-5 text-center py-2">
          {otpModal.loading ? (
            <div className="py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500">Generating cryptographically salted OTP...</p>
            </div>
          ) : otpModal.error ? (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {otpModal.error}
            </div>
          ) : (
            <>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Present this OTP to Guard at Intake Counter
                </p>
                <div className="text-4xl font-mono font-extrabold tracking-widest text-indigo-600 bg-white py-3 px-6 rounded-xl border border-indigo-100 shadow-inner inline-block">
                  {otpModal.otp}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Single-use • Expires in 10 minutes</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-left text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Handover Verification Protocol:
                </div>
                <p>• The guard will input this 6-digit code on their gate terminal to confirm your identity.</p>
                <p>• Once verified, the parcel status will automatically update to <strong>COLLECTED</strong>.</p>
                <p>• Do not share this code with anyone other than the on-duty hostel guard.</p>
              </div>

              {otpModal.parcel?.shelfLocation && (
                <div className="text-xs text-slate-600">
                  Storage Shelf: <strong className="font-mono text-slate-900">{otpModal.parcel.shelfLocation}</strong>
                </div>
              )}
            </>
          )}

          <div className="pt-2">
            <button
              onClick={() => setOtpModal({ ...otpModal, open: false })}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Parcel Lifecycle Timeline */}
      <Modal
        isOpen={timelineModal.open}
        onClose={() => setTimelineModal({ ...timelineModal, open: false })}
        title={`Parcel Lifecycle • ${timelineModal.parcel?.parcelId || ''}`}
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Carrier:</span>
              <span className="font-semibold text-slate-800">{timelineModal.parcel?.carrier}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Tracking #:</span>
              <span className="font-mono font-medium text-slate-800">{timelineModal.parcel?.trackingNumber || 'N/A'}</span>
            </div>
            {timelineModal.parcel?.shelfLocation && (
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Shelf Location:</span>
                <span className="font-mono font-bold text-emerald-700">{timelineModal.parcel.shelfLocation}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Audit Timeline</h4>
            <Timeline statusHistory={timelineModal.parcel?.statusHistory || []} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
