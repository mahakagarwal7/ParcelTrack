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
  Camera,
  Copy,
  Check,
  LayoutGrid,
  List,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [parcels, setParcels] = useState([]);
  const [deliveryAttempts, setDeliveryAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'READY' | 'EXPECTED' | 'COLLECTED'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [copiedId, setCopiedId] = useState(null);

  // Register Parcel Modal
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

  // Timeline Modal State
  const [timelineModal, setTimelineModal] = useState({
    open: false,
    parcel: null,
  });

  // Photo Preview Modal State
  const [photoModal, setPhotoModal] = useState({
    open: false,
    url: '',
    title: '',
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

  // Real-time socket listeners
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

  // Copy tracking number to clipboard
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Register expected parcel submit
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

  // Student Decision (Grant / Reject consent)
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

  // Request Single-Use Collection OTP
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

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Metrics
  const activeCount = parcels.filter((p) => p.status !== 'COLLECTED').length;
  const inCustodyCount = parcels.filter((p) => p.status === 'RECEIVED').length;
  const expectedCount = parcels.filter((p) => p.status === 'EXPECTED' || p.status === 'AUTHORIZED').length;
  const collectedCount = parcels.filter((p) => p.status === 'COLLECTED').length;

  // Pending gate delivery attempts needing student consent
  const pendingAttempts = deliveryAttempts.filter(
    (a) => a.status === 'AWAITING_AUTHORIZATION' && a.authorizationId
  );

  // Filtered parcels based on search & active tab
  const filteredParcels = parcels.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.parcelId?.toLowerCase().includes(q) ||
      p.trackingNumber?.toLowerCase().includes(q) ||
      p.carrier?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'READY') return p.status === 'RECEIVED';
    if (activeTab === 'EXPECTED') return p.status === 'EXPECTED' || p.status === 'AUTHORIZED';
    if (activeTab === 'COLLECTED') return p.status === 'COLLECTED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. TOP GREETING HEADER (Delisas Reference Pattern) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Hostel {user?.hostelId} • Resident Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Room <strong className="text-slate-800 font-semibold">{user?.roomNumber || 'N/A'}</strong> • Student ID:{' '}
            <span className="font-mono text-slate-800">{user?.studentId || 'N/A'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Pre-Register Parcel</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS CARDS (Delisas & Shadcn Reference Pattern) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deliveries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Parcels</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">{parcels.length}</p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-slate-700">{activeCount}</span> currently active
          </div>
        </div>

        {/* Ready for Collection (Highlight Card) */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-white p-5 rounded-2xl border border-emerald-300 shadow-xs hover:shadow-md transition ring-2 ring-emerald-500/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Ready for Pickup</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2 font-mono">{inCustodyCount}</p>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>At Gate Counter (OTP ready)</span>
          </div>
        </div>

        {/* In Transit / Pre-Authorized */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">In Transit</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">{expectedCount}</p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Pre-authorized for intake</span>
          </div>
        </div>

        {/* Successfully Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Handed Over</p>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">{collectedCount}</p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Verified OTP handovers</span>
          </div>
        </div>
      </div>

      {/* 3. GATE APPROVAL WORKFLOW BANNER (Approval Workflow Reference Pattern) */}
      {pendingAttempts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 text-amber-950 font-bold text-base">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3>Gate Arrival Alert: Courier Awaiting Your Permission</h3>
                <p className="text-xs text-amber-800 font-normal mt-0.5">
                  An unannounced delivery has reached the hostel gate. Please grant or reject permission to receive it.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold text-xs rounded-full uppercase tracking-wider">
              {pendingAttempts.length} Action Needed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {pendingAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                      Gate 1 Intake Counter
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{attempt.courierName}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Tracking: {attempt.trackingNumber || 'Unassigned'}
                    </p>
                  </div>

                  {attempt.deliveryPersonContact && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Delivery Executive Phone: <strong className="font-mono">{attempt.deliveryPersonContact}</strong>
                    </div>
                  )}

                  {attempt.notes && (
                    <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded-lg">
                      "{attempt.notes}"
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() =>
                      handleStudentDecision(attempt.authorizationId?._id || attempt.authorizationId, 'GRANT')
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Grant Permission</span>
                  </button>
                  <button
                    onClick={() =>
                      handleStudentDecision(attempt.authorizationId?._id || attempt.authorizationId, 'REJECT')
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN PARCELS SECTION (Purrweb & Shadcn Reference Pattern) */}
      <div className="space-y-4">
        {/* Toolbar: Tabs & Search & View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Status Filter Pill Tabs (Purrweb Style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: `All Deliveries (${parcels.length})` },
              { id: 'READY', label: `Ready for Pickup (${inCustodyCount})`, highlight: inCustodyCount > 0 },
              { id: 'EXPECTED', label: `In Transit (${expectedCount})` },
              { id: 'COLLECTED', label: `Completed (${collectedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-xl border transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search & Grid/Table Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tracking, carrier..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
              <button
                onClick={() => setViewMode('cards')}
                title="Card Grid View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Loading / Empty States */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 shadow-xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading parcel records...
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">No parcels found in this category</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? 'Try a different search keyword'
                  : 'Pre-register your upcoming parcel to speed up gate intake'}
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Pre-Register a Delivery</span>
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          /* CARD GRID VIEW (Purrweb & Delisas Reference Pattern) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredParcels.map((p) => {
              const isReceived = p.status === 'RECEIVED';
              const isCollected = p.status === 'COLLECTED';

              return (
                <div
                  key={p._id}
                  className={`bg-white rounded-3xl border p-5 transition-all flex flex-col justify-between hover:shadow-lg ${
                    isReceived
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm'
                      : 'border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Card Header: Carrier Pill + StatusBadge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase">
                          {p.carrier?.slice(0, 2) || 'PK'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{p.carrier}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{p.parcelId}</span>
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>

                    {/* Tracking Number Row with 1-Click Copy */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="font-mono text-slate-700 font-medium truncate max-w-[190px]">
                        {p.trackingNumber || 'No tracking #'}
                      </div>
                      {p.trackingNumber && (
                        <button
                          onClick={() => handleCopy(p.trackingNumber, p._id)}
                          title="Copy tracking number"
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition flex items-center gap-1 text-[11px]"
                        >
                          {copiedId === p._id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Gate Shelf Location</span>
                        {p.shelfLocation ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {p.shelfLocation}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Awaiting gate</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {p.receivedAt ? 'Received At' : 'Expected Date'}
                        </span>
                        <span className="text-slate-700 font-medium text-[11px] mt-0.5 block">
                          {p.receivedAt
                            ? new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : p.expectedArrivalDate
                            ? new Date(p.expectedArrivalDate).toLocaleDateString()
                            : 'In Transit'}
                        </span>
                      </div>
                    </div>

                    {/* Inspection Photo Preview (Cloudinary) */}
                    {p.photoUrl && (
                      <div
                        onClick={() =>
                          setPhotoModal({
                            open: true,
                            url: p.photoUrl,
                            title: `Inspection Photo • ${p.parcelId}`,
                          })
                        }
                        className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-indigo-100/60 transition group"
                      >
                        <img
                          src={p.photoUrl}
                          alt="Package inspection"
                          className="w-10 h-10 object-cover rounded-lg border border-indigo-200"
                        />
                        <div className="text-[11px] text-indigo-900 flex-1">
                          <p className="font-bold flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Inspection Photo</span>
                          </p>
                          <span className="text-[10px] text-indigo-600 group-hover:underline">
                            Click to view full image
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    )}

                    {p.description && (
                      <p className="text-[11px] text-slate-500 italic truncate">{p.description}</p>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setTimelineModal({ open: true, parcel: p })}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 text-xs font-semibold transition"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>

                    {isReceived && (
                      <button
                        onClick={() => handleRequestOtp(p)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-98"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Show Pickup OTP</span>
                      </button>
                    )}

                    {isCollected && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Handed Over</span>
                      </span>
                    )}

                    {!isReceived && !isCollected && (
                      <span className="text-[11px] text-slate-400 font-medium">In Transit</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW (Shadcn Admin Reference Pattern) */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-600 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Parcel ID</th>
                    <th className="py-3.5 px-4">Carrier & Tracking</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Shelf Location</th>
                    <th className="py-3.5 px-4">Expected / Received</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
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
                          <div className="font-bold text-slate-900">{p.carrier}</div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>{p.trackingNumber || 'No tracking'}</span>
                            {p.trackingNumber && (
                              <button
                                onClick={() => handleCopy(p.trackingNumber, p._id)}
                                title="Copy"
                                className="text-slate-400 hover:text-indigo-600"
                              >
                                {copiedId === p._id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          {p.photoUrl && (
                            <button
                              onClick={() =>
                                setPhotoModal({
                                  open: true,
                                  url: p.photoUrl,
                                  title: `Inspection Photo • ${p.parcelId}`,
                                })
                              }
                              className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"
                            >
                              <Camera className="w-3 h-3" />
                              <span>View Photo</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          {p.shelfLocation ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {p.shelfLocation}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Gate counter</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {p.receivedAt ? (
                            <div>
                              <span className="text-[11px] font-bold text-slate-800">Received</span>
                              <div className="text-[10px] text-slate-400">
                                {new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : p.expectedArrivalDate ? (
                            <div>
                              <span className="text-[11px] text-slate-600">Expected</span>
                              <div className="text-[10px] text-slate-400">
                                {new Date(p.expectedArrivalDate).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isReceived && (
                              <button
                                onClick={() => handleRequestOtp(p)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Show OTP</span>
                              </button>
                            )}

                            {isCollected && (
                              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Collected
                              </span>
                            )}

                            <button
                              onClick={() => setTimelineModal({ open: true, parcel: p })}
                              title="Audit History"
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
          </div>
        )}
      </div>

      {/* 5. MODAL: REGISTER EXPECTED PARCEL */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Pre-Register Expected Delivery"
      >
        <form onSubmit={handleRegisterParcel} className="space-y-4">
          <p className="text-xs text-slate-500">
            Pre-registering notifies the gate security officer and automatically authorizes receipt without gate delays.
          </p>

          {registerError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
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
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tracking / AWB Number *
            </label>
            <input
              type="text"
              required
              value={registerForm.trackingNumber}
              onChange={(e) => setRegisterForm({ ...registerForm, trackingNumber: e.target.value })}
              placeholder="e.g. TRK-AMZ-987654"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Expected Arrival Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                value={registerForm.expectedArrivalDate}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, expectedArrivalDate: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Item Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={registerForm.description}
              onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
              placeholder="Books, electronics, clothing..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-60"
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

      {/* 6. MODAL: SECURE COLLECTION OTP (Delisas Pattern) */}
      <Modal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ ...otpModal, open: false })}
        title="Single-Use Collection OTP"
      >
        <div className="space-y-5 text-center py-2">
          {otpModal.loading ? (
            <div className="py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500">Generating cryptographic salted OTP token...</p>
            </div>
          ) : otpModal.error ? (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {otpModal.error}
            </div>
          ) : (
            <>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Present this code to the Security Guard
                </p>
                <div className="text-4xl font-mono font-black tracking-widest text-indigo-600 bg-white py-3.5 px-8 rounded-2xl border border-indigo-100 shadow-sm inline-block">
                  {otpModal.otp}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Valid for 10 minutes • Single-use only</span>
                </div>
              </div>

              {otpModal.parcel?.shelfLocation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>
                    Storage Rack:{' '}
                    <strong className="font-mono font-extrabold text-emerald-800">
                      {otpModal.parcel.shelfLocation}
                    </strong>
                  </span>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-left text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Handover Protocol</span>
                </div>
                <p>• The guard will input this 6-digit code on their gate terminal.</p>
                <p>• Once verified, the parcel status will automatically update to <strong>COLLECTED</strong>.</p>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              onClick={() => setOtpModal({ ...otpModal, open: false })}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      </Modal>

      {/* 7. MODAL: PARCEL LIFECYCLE TIMELINE (Ofspace Pattern) */}
      <Modal
        isOpen={timelineModal.open}
        onClose={() => setTimelineModal({ ...timelineModal, open: false })}
        title={`Audit Lifecycle • ${timelineModal.parcel?.parcelId || ''}`}
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Carrier:</span>
              <span className="font-bold text-slate-800">{timelineModal.parcel?.carrier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Number:</span>
              <span className="font-mono font-medium text-slate-800">
                {timelineModal.parcel?.trackingNumber || 'Unassigned'}
              </span>
            </div>
            {timelineModal.parcel?.shelfLocation && (
              <div className="flex justify-between">
                <span className="text-slate-500">Shelf Location:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {timelineModal.parcel.shelfLocation}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Lifecycle Transitions
            </h4>
            <Timeline statusHistory={timelineModal.parcel?.statusHistory || []} />
          </div>
        </div>
      </Modal>

      {/* 8. MODAL: CLOUDINARY INSPECTION PHOTO PREVIEW */}
      <Modal
        isOpen={photoModal.open}
        onClose={() => setPhotoModal({ ...photoModal, open: false, url: '' })}
        title={photoModal.title || 'Inspection Photo'}
      >
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-[70vh]">
            <img
              src={photoModal.url}
              alt="Parcel condition inspection"
              className="max-h-[65vh] w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Hosted securely on Cloudinary CDN</span>
            <a
              href={photoModal.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
            >
              <span>Open original full-res</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
