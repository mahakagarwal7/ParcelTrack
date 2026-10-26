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
  Box,
  Compass,
  ChevronRight,
  PhoneCall,
  BellRing,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [parcels, setParcels] = useState([]);
  const [deliveryAttempts, setDeliveryAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters, Selection & Views
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'READY' | 'EXPECTED' | 'COLLECTED'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedParcelId, setSelectedParcelId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Inline Quick-Register State
  const [quickTracking, setQuickTracking] = useState('');

  // Register Modal State
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
        const fetchedParcels = parcelsRes.data.parcels || [];
        setParcels(fetchedParcels);
        if (!selectedParcelId && fetchedParcels.length > 0) {
          // Default to the first RECEIVED parcel or latest parcel
          const readyParcel = fetchedParcels.find((p) => p.status === 'RECEIVED');
          setSelectedParcelId(readyParcel?._id || fetchedParcels[0]._id);
        }
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
  }, [selectedParcelId]);

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

  // Copy tracking number with visual feedback
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open register modal pre-filled with inline quick tracking
  const handleOpenRegisterWithTracking = (e) => {
    e.preventDefault();
    setRegisterForm((prev) => ({
      ...prev,
      trackingNumber: quickTracking.trim().toUpperCase(),
    }));
    setShowRegisterModal(true);
  };

  // Submit register parcel form
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
        setQuickTracking('');
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

  // Student Decision on unannounced gate courier
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

  // Request single-use collection OTP
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

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Carrier styling helper
  const getCarrierBadge = (carrier = '') => {
    const c = carrier.toLowerCase();
    if (c.includes('amazon')) {
      return { bg: 'bg-amber-500/10 text-amber-900 border-amber-300', dot: 'bg-amber-500', name: 'Amazon' };
    }
    if (c.includes('flipkart')) {
      return { bg: 'bg-blue-500/10 text-blue-900 border-blue-300', dot: 'bg-blue-500', name: 'Flipkart' };
    }
    if (c.includes('bluedart')) {
      return { bg: 'bg-red-500/10 text-red-900 border-red-300', dot: 'bg-red-500', name: 'BlueDart' };
    }
    if (c.includes('delhivery')) {
      return { bg: 'bg-rose-500/10 text-rose-900 border-rose-300', dot: 'bg-rose-500', name: 'Delhivery' };
    }
    return { bg: 'bg-indigo-500/10 text-indigo-900 border-indigo-200', dot: 'bg-indigo-500', name: carrier || 'Courier' };
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

  // Selected Parcel for Live Tracking Drawer (Delisas reference)
  const activeTrackedParcel =
    parcels.find((p) => p._id === selectedParcelId) ||
    parcels.find((p) => p.status === 'RECEIVED') ||
    parcels[0] ||
    null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 ambient-glow">
      {/* 1. TOP HEADER & GREETING BAR (Delisas Style) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Hostel {user?.hostelId} Resident Portal</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono font-medium">Room {user?.roomNumber || '101'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}</span>
            <span className="text-2xl animate-pulse">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            You have <strong className="text-indigo-600 font-bold">{inCustodyCount} package(s)</strong> waiting for pickup at Gate 1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Pre-Register Parcel</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS CARDS (Delisas & Shadcn Reference Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Shipping (Signature Electric Cobalt Card from Delisas Image 0) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-between group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Total Deliveries</span>
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight">{parcels.length}</div>
            <div className="mt-2 text-xs text-indigo-100 flex items-center gap-1.5 font-medium">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">
                {activeCount} Active
              </span>
              <span>• Lifetime Logged</span>
            </div>
          </div>
        </div>

        {/* Card 2: Ready for Pickup (Highlighted Emerald Card) */}
        <div className="rounded-3xl p-6 bg-white border-2 border-emerald-400/80 shadow-md shadow-emerald-500/5 flex flex-col justify-between hover:shadow-lg transition ring-4 ring-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Ready for Pickup</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-700">
              {inCustodyCount}
            </div>
            <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>In Gate Custody (OTP Ready)</span>
            </div>
          </div>
        </div>

        {/* Card 3: In Transit / Pre-Authorized */}
        <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">In Transit</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">
              {expectedCount}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span>Pre-authorized for intake</span>
            </div>
          </div>
        </div>

        {/* Card 4: Successfully Collected */}
        <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Handed Over</span>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">
              {collectedCount}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span>Verified OTP handovers</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INLINE "ADD NEW PACKAGE" HERO BANNER (Purrweb & Pinterest Image 1 & 3 Pattern) */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-blue-50/80 border border-indigo-100 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 flex-shrink-0 mt-0.5">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Got a new courier arriving today?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              Paste the tracking number from Amazon, Flipkart, or BlueDart to pre-authorize intake. The guard will directly receive and tag it to your shelf upon arrival.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleOpenRegisterWithTracking}
          className="flex items-center gap-2 w-full lg:w-auto flex-shrink-0"
        >
          <div className="relative flex-1 lg:w-72">
            <input
              type="text"
              value={quickTracking}
              onChange={(e) => setQuickTracking(e.target.value)}
              placeholder="Paste Tracking # (e.g. TRK-AMZ-2026)"
              className="w-full pl-3.5 pr-3 py-2.5 text-xs font-mono border border-slate-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs uppercase font-semibold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5 flex-shrink-0 active:scale-95"
          >
            <span>Pre-Authorize</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 4. GATE COURIER APPROVAL ALERT (Approval Workflow Reference Pattern) */}
      {pendingAttempts.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border-2 border-amber-300 p-6 shadow-md shadow-amber-500/5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 flex-shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Gate Arrival Alert: Courier Awaiting Your Permission
                </h3>
                <p className="text-xs text-amber-900/80">
                  A delivery agent has arrived at Gate 1 with an unannounced parcel. Please grant or deny permission to accept it.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200 text-amber-900 font-extrabold text-xs rounded-full uppercase tracking-wider">
              {pendingAttempts.length} Urgent Request
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {pendingAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
                      Hostel Gate 1 Desk
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-base">{attempt.courierName}</h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Tracking: {attempt.trackingNumber || 'Unassigned'}
                    </p>
                  </div>

                  {attempt.deliveryPersonContact && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Delivery Person Phone: <strong className="font-mono text-slate-900">{attempt.deliveryPersonContact}</strong></span>
                    </div>
                  )}

                  {attempt.notes && (
                    <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                      "{attempt.notes}"
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() =>
                      handleStudentDecision(attempt.authorizationId?._id || attempt.authorizationId, 'GRANT')
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Grant Permission</span>
                  </button>
                  <button
                    onClick={() =>
                      handleStudentDecision(attempt.authorizationId?._id || attempt.authorizationId, 'REJECT')
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition active:scale-95"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. 2-COLUMN MAIN CONTENT (Left: Deliveries List / Right: Live Tracking Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: FILTERS, TOOLBAR & PARCEL LIST (8 COLS) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Status Filter Pill Tabs (Purrweb Style) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: 'ALL', label: 'All', count: parcels.length },
                { id: 'READY', label: 'Ready for Pickup', count: inCustodyCount, highlight: inCustodyCount > 0 },
                { id: 'EXPECTED', label: 'In Transit', count: expectedCount },
                { id: 'COLLECTED', label: 'Completed', count: collectedCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3.5 rounded-2xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : tab.highlight
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Bar & View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter parcels..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
                />
              </div>

              <div className="flex items-center p-0.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                <button
                  onClick={() => setViewMode('cards')}
                  title="Card View"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* PARCELS DISPLAY */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 shadow-xs">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading your deliveries...
            </div>
          ) : filteredParcels.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
                <Package className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-800">No parcels match this filter</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'Try clearing your search query'
                  : 'Pre-register a parcel to authorize reception at the hostel gate'}
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* CARD GRID VIEW (Purrweb & Delisas Reference Pattern) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredParcels.map((p) => {
                const isSelected = activeTrackedParcel?._id === p._id;
                const isReceived = p.status === 'RECEIVED';
                const isCollected = p.status === 'COLLECTED';
                const carrierBadge = getCarrierBadge(p.carrier);

                return (
                  <div
                    key={p._id}
                    onClick={() => setSelectedParcelId(p._id)}
                    className={`rounded-3xl border p-5 transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg ${
                      isSelected
                        ? 'border-indigo-600 bg-white ring-4 ring-indigo-500/10 shadow-md'
                        : isReceived
                        ? 'border-emerald-300 bg-white shadow-xs hover:border-emerald-400'
                        : 'border-slate-200/90 bg-white shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header: Carrier Pill + StatusBadge */}
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${carrierBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${carrierBadge.dot}`} />
                          <span>{p.carrier}</span>
                        </span>
                        <StatusBadge status={p.status} />
                      </div>

                      {/* Tracking Number Row with Copy */}
                      <div className="bg-slate-50/90 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-700 font-bold truncate max-w-[170px]">
                          {p.trackingNumber || 'No tracking #'}
                        </span>
                        {p.trackingNumber && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(p.trackingNumber, p._id);
                            }}
                            title="Copy tracking number"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                          >
                            {copiedId === p._id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Gate Shelf Location */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Storage Rack:</span>
                        {p.shelfLocation ? (
                          <span className="inline-flex items-center gap-1 font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-xs">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {p.shelfLocation}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Gate reception</span>
                        )}
                      </div>

                      {/* Cloudinary Inspection Photo Preview (if present) */}
                      {p.photoUrl && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoModal({
                              open: true,
                              url: p.photoUrl,
                              title: `Gate Inspection Photo • ${p.parcelId}`,
                            });
                          }}
                          className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-2.5 hover:bg-indigo-100/60 transition"
                        >
                          <img
                            src={p.photoUrl}
                            alt="Parcel Condition"
                            className="w-10 h-10 object-cover rounded-xl border border-indigo-200"
                          />
                          <div className="text-[11px] text-indigo-900 flex-1">
                            <p className="font-bold flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Inspection Photo</span>
                            </p>
                            <span className="text-[10px] text-indigo-600 hover:underline">Click to expand</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                      )}

                      {p.description && (
                        <p className="text-[11px] text-slate-500 italic truncate">{p.description}</p>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTimelineModal({ open: true, parcel: p });
                        }}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 text-xs font-bold transition"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>

                      {isReceived && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestOtp(p);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition active:scale-95"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Show OTP</span>
                        </button>
                      )}

                      {isCollected && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Collected</span>
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
            /* TABLE VIEW (Shadcn Admin Pattern) */
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-600 font-extrabold">
                    <tr>
                      <th className="py-3.5 px-4">Carrier & Tracking</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Storage Shelf</th>
                      <th className="py-3.5 px-4">Timeline</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredParcels.map((p) => {
                      const isReceived = p.status === 'RECEIVED';
                      const isCollected = p.status === 'COLLECTED';

                      return (
                        <tr
                          key={p._id}
                          onClick={() => setSelectedParcelId(p._id)}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">{p.carrier}</div>
                            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{p.trackingNumber || 'No tracking'}</span>
                              {p.trackingNumber && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(p.trackingNumber, p._id);
                                  }}
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
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="py-3.5 px-4">
                            {p.shelfLocation ? (
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                                {p.shelfLocation}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Gate reception</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {p.receivedAt ? (
                              <span className="text-[11px] font-semibold text-slate-800">
                                {new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">In Transit</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isReceived && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRequestOtp(p);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span>OTP</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTimelineModal({ open: true, parcel: p });
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
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

        {/* RIGHT COLUMN: "LIVE TRACKING" INTERACTIVE PANEL (Delisas Image 0 Signature Pattern) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600 animate-spin-slow" />
                <h3 className="font-extrabold text-slate-900 text-sm">Live Package Tracker</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Gate Terminal</span>
            </div>

            {activeTrackedParcel ? (
              <div className="space-y-5">
                {/* Active Parcel Info Card */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{activeTrackedParcel.carrier}</span>
                    <StatusBadge status={activeTrackedParcel.status} />
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Tracking #: <strong className="text-slate-800">{activeTrackedParcel.trackingNumber || 'N/A'}</strong>
                  </div>

                  {activeTrackedParcel.shelfLocation && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                      <span className="font-semibold">Assigned Rack:</span>
                      <strong className="font-mono font-extrabold text-emerald-800 text-sm">
                        {activeTrackedParcel.shelfLocation}
                      </strong>
                    </div>
                  )}
                </div>

                {/* 4-Step Interactive Stepper Progress (Delisas & Ofspace pattern) */}
                <div className="space-y-4 py-1">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Handover Milestones
                  </h4>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {/* Step 1: Pre-Registered */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center">
                        <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">Pre-Authorization Registered</div>
                        <span className="text-[10px] text-slate-400 font-mono">Student submitted consent</span>
                      </div>
                    </div>

                    {/* Step 2: Gate Security Arrival */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                          activeTrackedParcel.status !== 'EXPECTED'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-slate-300 text-slate-300'
                        }`}
                      >
                        {activeTrackedParcel.status !== 'EXPECTED' ? (
                          <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">Hostel Gate Verification</div>
                        <span className="text-[10px] text-slate-400 font-mono">Courier ID checked by guard</span>
                      </div>
                    </div>

                    {/* Step 3: Shelf Storage */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                          activeTrackedParcel.status === 'RECEIVED' || activeTrackedParcel.status === 'COLLECTED'
                            ? 'border-emerald-600 text-emerald-600 ring-2 ring-emerald-100'
                            : 'border-slate-300 text-slate-300'
                        }`}
                      >
                        {activeTrackedParcel.status === 'RECEIVED' || activeTrackedParcel.status === 'COLLECTED' ? (
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">Stored at Intake Counter</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {activeTrackedParcel.shelfLocation ? `Placed on ${activeTrackedParcel.shelfLocation}` : 'Pending custody'}
                        </span>
                      </div>
                    </div>

                    {/* Step 4: OTP Handover */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                          activeTrackedParcel.status === 'COLLECTED'
                            ? 'border-emerald-600 text-emerald-600 ring-2 ring-emerald-100'
                            : 'border-slate-300 text-slate-300'
                        }`}
                      >
                        {activeTrackedParcel.status === 'COLLECTED' ? (
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">OTP Handover Verification</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {activeTrackedParcel.status === 'COLLECTED' ? 'Successfully Handed Over' : 'Awaiting OTP at gate'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary CTA in Live Tracker */}
                {activeTrackedParcel.status === 'RECEIVED' && (
                  <button
                    onClick={() => handleRequestOtp(activeTrackedParcel)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 transform active:scale-98 animate-pulse-subtle"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Get Handover OTP Now</span>
                  </button>
                )}

                {/* Cloudinary Inspection Photo Preview */}
                {activeTrackedParcel.photoUrl && (
                  <div
                    onClick={() =>
                      setPhotoModal({
                        open: true,
                        url: activeTrackedParcel.photoUrl,
                        title: `Gate Inspection Photo • ${activeTrackedParcel.parcelId}`,
                      })
                    }
                    className="rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group relative"
                  >
                    <img
                      src={activeTrackedParcel.photoUrl}
                      alt="Inspection"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                      <Camera className="w-4 h-4" />
                      <span>View Full Image</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Compass className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>Select any parcel to track live milestones.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. MODAL: PRE-REGISTER EXPECTED PARCEL */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Pre-Register Upcoming Delivery"
      >
        <form onSubmit={handleRegisterParcel} className="space-y-4">
          <p className="text-xs text-slate-500">
            Pre-registering notifies the gate security officer and automatically authorizes receipt without gate delays.
          </p>

          {registerError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Courier Carrier *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {['Amazon', 'Flipkart', 'BlueDart', 'Delhivery'].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setRegisterForm({ ...registerForm, carrier: c })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    registerForm.carrier === c
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={registerForm.carrier}
              onChange={(e) => setRegisterForm({ ...registerForm, carrier: e.target.value })}
              placeholder="Or enter carrier name..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tracking / AWB Number *
            </label>
            <input
              type="text"
              required
              value={registerForm.trackingNumber}
              onChange={(e) => setRegisterForm({ ...registerForm, trackingNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. TRK-AMZ-987654"
              className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 uppercase"
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
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerLoading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-60"
            >
              {registerLoading ? (
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Authorize Delivery</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. MODAL: SECURE SINGLE-USE COLLECTION OTP */}
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
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
              {otpModal.error}
            </div>
          ) : (
            <>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Present this code to the Gate Security Guard
                </p>
                <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-indigo-600 bg-white py-4 px-8 rounded-2xl border border-indigo-100 shadow-sm inline-block">
                  {otpModal.otp}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Valid for 10 minutes • Single-use only</span>
                </div>
              </div>

              {otpModal.parcel?.shelfLocation && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>
                    Storage Rack:{' '}
                    <strong className="font-mono font-extrabold text-emerald-800 text-sm">
                      {otpModal.parcel.shelfLocation}
                    </strong>
                  </span>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Handover Security Guarantee</span>
                </div>
                <p>• The guard enters this 6-digit code on their gate terminal to verify your identity.</p>
                <p>• Once verified, the parcel status will automatically transition to <strong>COLLECTED</strong>.</p>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              onClick={() => setOtpModal({ ...otpModal, open: false })}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      </Modal>

      {/* 8. MODAL: PARCEL LIFECYCLE TIMELINE */}
      <Modal
        isOpen={timelineModal.open}
        onClose={() => setTimelineModal({ ...timelineModal, open: false })}
        title={`Audit Lifecycle • ${timelineModal.parcel?.parcelId || ''}`}
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Carrier:</span>
              <span className="font-bold text-slate-800">{timelineModal.parcel?.carrier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Number:</span>
              <span className="font-mono font-bold text-slate-800">
                {timelineModal.parcel?.trackingNumber || 'Unassigned'}
              </span>
            </div>
            {timelineModal.parcel?.shelfLocation && (
              <div className="flex justify-between">
                <span className="text-slate-500">Shelf Location:</span>
                <span className="font-mono font-extrabold text-emerald-700">
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

      {/* 9. MODAL: CLOUDINARY INSPECTION PHOTO PREVIEW */}
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
