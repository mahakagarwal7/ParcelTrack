import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  Shield,
  Package,
  Search,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Truck,
  MapPin,
  User,
  PlusCircle,
  Phone,
  FileText,
  Clock,
  ArrowRight,
  Camera,
} from 'lucide-react';

export default function GuardDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('handover'); // 'handover' | 'intake-expected' | 'intake-unexpected' | 'custody'
  const [activeParcels, setActiveParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Handover & OTP Verification State ---
  const [handoverParcelId, setHandoverParcelId] = useState('');
  const [handoverOtp, setHandoverOtp] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverSuccess, setHandoverSuccess] = useState('');
  const [handoverError, setHandoverError] = useState('');

  // --- Expected Intake State ---
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [selectedExpectedParcel, setSelectedExpectedParcel] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    shelfLocation: 'Shelf A-1',
    condition: 'INTACT',
    damageNotes: '',
    photoUrl: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveMessage, setReceiveMessage] = useState('');

  // --- Unexpected Delivery Intake State ---
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [unexpectedForm, setUnexpectedForm] = useState({
    courierName: 'Delhivery',
    trackingNumber: '',
    deliveryPersonContact: '',
    notes: '',
  });
  const [unexpectedLoading, setUnexpectedLoading] = useState(false);
  const [unexpectedSuccess, setUnexpectedSuccess] = useState('');
  const [unexpectedError, setUnexpectedError] = useState('');

  // Fetch active parcels in custody
  const fetchCustody = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axiosClient.get('/parcels/guard/active');
      if (res.data.success) {
        setActiveParcels(res.data.parcels || []);
      }
    } catch (err) {
      console.error('Failed to fetch custody parcels:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustody();
  }, [fetchCustody]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchCustody();
    };
    socket.on('parcel:updated', handleUpdate);
    socket.on('delivery_attempt:new', handleUpdate);
    return () => {
      socket.off('parcel:updated', handleUpdate);
      socket.off('delivery_attempt:new', handleUpdate);
    };
  }, [socket, fetchCustody]);

  // Handle Verify OTP Handover
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!handoverParcelId || !handoverOtp) {
      setHandoverError('Please provide both Parcel ID and the 6-digit OTP');
      return;
    }

    try {
      setHandoverLoading(true);
      setHandoverError('');
      setHandoverSuccess('');

      const res = await axiosClient.post(`/parcels/${handoverParcelId.trim()}/collect`, {
        otp: handoverOtp.trim(),
      });

      if (res.data.success) {
        setHandoverSuccess(res.data.message || 'Parcel securely verified and handed over!');
        setHandoverOtp('');
        setHandoverParcelId('');
        fetchCustody();
      }
    } catch (err) {
      setHandoverError(err.response?.data?.message || 'Verification failed. Please recheck OTP.');
    } finally {
      setHandoverLoading(false);
    }
  };

  // Handle Expected Parcel Gate Lookup
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    try {
      setLookupLoading(true);
      setLookupError('');
      setSelectedExpectedParcel(null);
      setReceiveMessage('');

      const res = await axiosClient.get(`/parcels/guard/lookup?trackingNumber=${encodeURIComponent(lookupQuery.trim())}`);
      if (res.data.success) {
        setLookupResults(res.data.parcels || []);
        if (res.data.parcels?.length === 0) {
          setLookupError('No authorized expected parcel found with this tracking number');
        }
      }
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Receive Expected Parcel to Custody
  const handleReceiveExpected = async (e) => {
    e.preventDefault();
    if (!selectedExpectedParcel) return;

    try {
      setReceiveLoading(true);
      setReceiveMessage('');

      const res = await axiosClient.post(`/parcels/${selectedExpectedParcel._id}/receive`, receiveForm);
      if (res.data.success) {
        setReceiveMessage(`Success! Parcel ${res.data.parcel.parcelId} is logged into custody at ${res.data.parcel.shelfLocation}.`);
        setSelectedExpectedParcel(null);
        setLookupResults([]);
        setLookupQuery('');
        fetchCustody();
      }
    } catch (err) {
      setReceiveMessage(`Error: ${err.response?.data?.message || 'Failed to receive parcel'}`);
    } finally {
      setReceiveLoading(false);
    }
  };

  // Upload parcel/damage photo to Cloudinary
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await axiosClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setReceiveForm((prev) => ({ ...prev, photoUrl: res.data.url }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload photo to Cloudinary. Check that CLOUDINARY keys are set in server/.env.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Search Student for Unexpected Intake
  const handleStudentSearch = async (val) => {
    setStudentSearchQuery(val);
    if (val.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }

    try {
      setSearchingStudents(true);
      const res = await axiosClient.get(`/delivery-attempts/students/search?query=${encodeURIComponent(val)}`);
      if (res.data.success) {
        setStudentSearchResults(res.data.students || []);
      }
    } catch (err) {
      console.error('Student search error:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Handle Register Unexpected Delivery
  const handleUnexpectedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setUnexpectedError('Please search and select a recipient student first');
      return;
    }

    try {
      setUnexpectedLoading(true);
      setUnexpectedError('');
      setUnexpectedSuccess('');

      const payload = {
        studentId: selectedStudent._id,
        courierName: unexpectedForm.courierName,
        trackingNumber: unexpectedForm.trackingNumber,
        deliveryPersonContact: unexpectedForm.deliveryPersonContact,
        notes: unexpectedForm.notes,
      };

      const res = await axiosClient.post('/delivery-attempts', payload);
      if (res.data.success) {
        const auth = res.data.data?.authorization;
        if (auth?.status === 'AUTHORIZED') {
          setUnexpectedSuccess(
            `Authorization instantly APPROVED via Standing Hostel Policy! You may now physically receive this parcel.`
          );
        } else {
          setUnexpectedSuccess(
            `Consent request dispatched in real-time to student ${selectedStudent.name}. Awaiting student confirmation.`
          );
        }
        setSelectedStudent(null);
        setStudentSearchQuery('');
        setUnexpectedForm({
          courierName: 'Delhivery',
          trackingNumber: '',
          deliveryPersonContact: '',
          notes: '',
        });
        fetchCustody();
      }
    } catch (err) {
      setUnexpectedError(err.response?.data?.message || 'Failed to register delivery attempt');
    } finally {
      setUnexpectedLoading(false);
    }
  };

  const inCustodyCount = activeParcels.filter((p) => p.status === 'RECEIVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Guard Desk Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Gate Intake & Handover Desk • Hostel {user?.hostelId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Hostel Gate Security Terminal
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Officer on duty: <strong className="text-white">{user?.name}</strong> • Active Parcels in Custody: <strong className="text-emerald-400">{inCustodyCount}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustody}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition border border-white/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Custody</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'handover', label: 'Verify OTP & Handover', icon: KeyRound, highlight: true },
          { id: 'intake-expected', label: 'Intake Expected Parcel', icon: Package },
          { id: 'intake-unexpected', label: 'Unexpected Courier Arrival', icon: Truck },
          { id: 'custody', label: `Active Custody (${inCustodyCount})`, icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VERIFY OTP & HANDOVER */}
      {activeTab === 'handover' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>Single-Use OTP Verification Desk</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the Parcel ID and ask the student for their 6-digit collection code. The system performs constant-time cryptographic verification and locks the parcel from double-collection.
              </p>
            </div>

            {handoverSuccess && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{handoverSuccess}</span>
              </div>
            )}

            {handoverError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{handoverError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Parcel Reference ID *
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={handoverParcelId}
                    onChange={(e) => setHandoverParcelId(e.target.value.toUpperCase())}
                    placeholder="e.g. PKG-H1-..."
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select directly from the quick list on the right or type the Parcel ID on the package label.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Student's 6-Digit Collection OTP *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={handoverOtp}
                    onChange={(e) => setHandoverOtp(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-lg font-mono tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rate-limited to 3 attempts. Salted hash verified in constant-time.
                </p>
              </div>

              <button
                type="submit"
                disabled={handoverLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {handoverLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify OTP & Complete Handover</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Select from Active Parcels */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Awaiting Collection ({inCustodyCount})</span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </h3>

            {activeParcels.filter((p) => p.status === 'RECEIVED').length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No parcels currently awaiting collection in custody.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {activeParcels
                  .filter((p) => p.status === 'RECEIVED')
                  .map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setHandoverParcelId(p.parcelId)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                        handoverParcelId === p.parcelId
                          ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-700">{p.parcelId}</span>
                        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          {p.shelfLocation || 'Shelf N/A'}
                        </span>
                      </div>
                      <div className="text-slate-700 font-semibold mt-1">
                        {p.studentId?.name || 'Student'} (Room {p.studentId?.roomNumber || 'N/A'})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.carrier} • {p.trackingNumber || 'No tracking'}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTAKE EXPECTED PARCEL */}
      {activeTab === 'intake-expected' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                <span>Gate Lookup for Pre-Authorized Deliveries</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Scan barcode or enter the carrier tracking number to look up student pre-registration.
              </p>
            </div>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Scan or enter Tracking Number (e.g. TRK-...)"
                className="flex-1 px-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {lookupLoading ? (
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Lookup</span>
                  </>
                )}
              </button>
            </form>

            {lookupError && (
              <div className="p-3 text-xs bg-amber-50 border border-amber-300 text-amber-800 rounded-lg">
                {lookupError}
              </div>
            )}

            {receiveMessage && (
              <div
                className={`p-3 text-xs rounded-lg ${
                  receiveMessage.startsWith('Success')
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                {receiveMessage}
              </div>
            )}
          </div>

          {/* Search Result & Reception Form */}
          {lookupResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Matching Pre-Authorizations</h3>
                {lookupResults.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => setSelectedExpectedParcel(p)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedExpectedParcel?._id === p._id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-indigo-700">{p.parcelId}</span>
                        <h4 className="font-semibold text-slate-800 text-xs mt-1">{p.carrier}</h4>
                        <p className="text-[11px] font-mono text-slate-500">{p.trackingNumber}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Recipient: <strong>{p.studentId?.name || 'Student'}</strong> (Room {p.studentId?.roomNumber || 'N/A'})
                    </div>
                  </div>
                ))}
              </div>

              {selectedExpectedParcel && (
                <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    <span>Intake Reception Form</span>
                  </h3>

                  <form onSubmit={handleReceiveExpected} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Assigned Shelf / Storage Location *</label>
                      <input
                        type="text"
                        required
                        value={receiveForm.shelfLocation}
                        onChange={(e) => setReceiveForm({ ...receiveForm, shelfLocation: e.target.value })}
                        placeholder="Shelf A-1, Rack 2, Locker 5"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Package Condition</label>
                      <select
                        value={receiveForm.condition}
                        onChange={(e) => setReceiveForm({ ...receiveForm, condition: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="INTACT">INTACT (Clean / Undamaged)</option>
                        <option value="DAMAGED">DAMAGED (Crushed / Torn)</option>
                        <option value="OPENED">OPENED (Seal Broken)</option>
                        <option value="TAMPERED">TAMPERED (Possible Foul Play)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Condition Notes (Optional)</label>
                      <input
                        type="text"
                        value={receiveForm.damageNotes}
                        onChange={(e) => setReceiveForm({ ...receiveForm, damageNotes: e.target.value })}
                        placeholder="Minor tape tear on corner..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Inspection Photo (Cloudinary Upload)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      {uploadingPhoto && (
                        <p className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                        </p>
                      )}
                      {receiveForm.photoUrl && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                          <img
                            src={receiveForm.photoUrl}
                            alt="Inspection Preview"
                            className="w-10 h-10 object-cover rounded border border-emerald-300"
                          />
                          <div className="text-[11px] text-emerald-800">
                            <p className="font-bold">Photo Attached</p>
                            <a
                              href={receiveForm.photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              View on Cloudinary CDN
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={receiveLoading}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      {receiveLoading ? (
                        <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept & Receive Parcel into Custody</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UNEXPECTED COURIER ARRIVAL */}
      {activeTab === 'intake-unexpected' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>Unexpected Courier Gate Registration</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              When a courier arrives with an unannounced parcel, search the recipient student. If the hostel operates under Standing Permission, the parcel is auto-authorized. Under Individual Consent, the student is notified to approve.
            </p>
          </div>

          {unexpectedSuccess && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{unexpectedSuccess}</span>
            </div>
          )}

          {unexpectedError && (
            <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{unexpectedError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Search Student */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Search Recipient Student (by Name or Room) *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  placeholder="Type student name or room number..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {searchingStudents && <p className="text-xs text-slate-400">Searching directory...</p>}

              {studentSearchResults.length > 0 && !selectedStudent && (
                <div className="border border-slate-200 rounded-xl divide-y max-h-48 overflow-y-auto">
                  {studentSearchResults.map((stu) => (
                    <button
                      key={stu._id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(stu);
                        setStudentSearchResults([]);
                      }}
                      className="w-full p-2.5 text-left text-xs hover:bg-indigo-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{stu.name}</span>
                        <span className="text-slate-500 ml-2">Room {stu.roomNumber || 'N/A'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-600">{stu.studentId || stu.email}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedStudent && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-indigo-900">{selectedStudent.name}</p>
                    <p className="text-indigo-700">Room: {selectedStudent.roomNumber} • {selectedStudent.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Courier Details */}
            <form onSubmit={handleUnexpectedSubmit} className="space-y-3 text-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Courier Information
              </label>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courier Service Name *</label>
                <input
                  type="text"
                  required
                  value={unexpectedForm.courierName}
                  onChange={(e) => setUnexpectedForm({ ...unexpectedForm, courierName: e.target.value })}
                  placeholder="Amazon, BlueDart, Delhivery..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tracking Number (if visible on label)</label>
                <input
                  type="text"
                  value={unexpectedForm.trackingNumber}
                  onChange={(e) => setUnexpectedForm({ ...unexpectedForm, trackingNumber: e.target.value })}
                  placeholder="TRK-..."
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courier Delivery Agent Contact</label>
                <input
                  type="tel"
                  value={unexpectedForm.deliveryPersonContact}
                  onChange={(e) => setUnexpectedForm({ ...unexpectedForm, deliveryPersonContact: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Item Details</label>
                <input
                  type="text"
                  value={unexpectedForm.notes}
                  onChange={(e) => setUnexpectedForm({ ...unexpectedForm, notes: e.target.value })}
                  placeholder="Medium cardboard box, sender Flipkart..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={unexpectedLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {unexpectedLoading ? (
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Dispatch Authorization & Log Attempt</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE CUSTODY */}
      {activeTab === 'custody' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Parcels Currently in Gate Custody</h2>
              <p className="text-xs text-slate-500">Parcels held in storage shelf awaiting recipient collection</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              {inCustodyCount} in Storage
            </span>
          </div>

          {activeParcels.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No parcels currently held in custody.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Parcel ID</th>
                    <th className="py-3 px-4">Student Recipient</th>
                    <th className="py-3 px-4">Shelf Location</th>
                    <th className="py-3 px-4">Carrier & Tracking</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Received Time</th>
                    <th className="py-3 px-4 text-right">Quick Handover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeParcels.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {p.parcelId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{p.studentId?.name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500">
                          Room {p.studentId?.roomNumber || 'N/A'} • {p.studentId?.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {p.shelfLocation || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{p.carrier}</div>
                        <div className="font-mono text-[11px] text-slate-400">{p.trackingNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.condition === 'INTACT'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {p.condition || 'INTACT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {p.receivedAt ? new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setHandoverParcelId(p.parcelId);
                            setActiveTab('handover');
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center gap-1"
                        >
                          <span>Collect OTP</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
