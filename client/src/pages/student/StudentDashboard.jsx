import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PackagePlus, RefreshCw, Package, Truck, CheckCircle2, KeyRound, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import ParcelCard, { displayStatus } from '../../components/parcels/ParcelCard';
import ConsentRequestCard from '../../components/authorization/ConsentRequestCard';
import RegisterParcelModal from '../../components/parcels/RegisterParcelModal';
import OtpModal from '../../components/parcels/OtpModal';
import TimelineModal from '../../components/parcels/TimelineModal';
import NotificationList from '../../components/notifications/NotificationList';
import * as student from '../../api/studentService';

const TABS = [
  ['ALL', 'All'],
  ['READY', 'Ready to collect'],
  ['EXPECTED', 'Expected'],
  ['COLLECTED', 'Collected'],
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" aria-hidden="true" /></span>
      <div><p className="text-2xl font-extrabold text-navy leading-none">{value}</p><p className="text-xs text-slate-500 mt-1">{label}</p></div>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { notifications, markAsRead } = useSocket();

  const [parcels, setParcels] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [otpParcel, setOtpParcel] = useState(null);
  const [timelineParcel, setTimelineParcel] = useState(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [p, a] = await Promise.all([student.getMyParcels(), student.getMyDeliveryAttempts()]);
      setParcels(p);
      setAttempts(a);
      setError('');
    } catch (err) {
      setError(student.errorMessage(err, 'Could not load your parcels'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The server pushes `notification:new`; reload so statuses and consent requests stay current.
  useEffect(() => {
    if (notifications?.length) load();
  }, [notifications?.length, load]);

  const decide = async (authId, decision) => {
    setActionError('');
    try {
      await student.decideConsent(authId, decision);
      await load();
    } catch (err) {
      setActionError(student.errorMessage(err, 'Could not record your decision'));
    }
  };

  const pendingConsent = attempts.filter((a) => a.status === 'AWAITING_AUTHORIZATION' && a.authorizationId?.status === 'PENDING_STUDENT');
  const ready = parcels.filter((p) => p.status === 'RECEIVED');
  const expected = parcels.filter((p) => ['EXPECTED', 'AUTHORIZED'].includes(p.status));
  const collected = parcels.filter((p) => p.status === 'COLLECTED');

  const q = search.trim().toLowerCase();
  const visible = parcels.filter((p) => {
    if (tab === 'READY' && p.status !== 'RECEIVED') return false;
    if (tab === 'EXPECTED' && !['EXPECTED', 'AUTHORIZED'].includes(p.status)) return false;
    if (tab === 'COLLECTED' && p.status !== 'COLLECTED') return false;
    return !q || [p.parcelId, p.trackingNumber, p.courierName, p.description, displayStatus(p)].some((v) => v?.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary-600">Hostel {user?.hostelId}{user?.roomNumber ? ` · Room ${user.roomNumber}` : ''}</p>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">{greeting()}, {user?.name?.split(' ')[0] || 'there'}</h1>
          <p className="text-slate-600 mt-1">{ready.length > 0 ? `${ready.length} parcel${ready.length === 1 ? ' is' : 's are'} waiting for you at the gate.` : 'Nothing waiting at the gate right now.'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={load} loading={refreshing}>Refresh</Button>
          <Button size="lg" icon={PackagePlus} onClick={() => setShowRegister(true)}>Register Expected Parcel</Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">{error}</p>}
      {actionError && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">{actionError}</p>}

      <AnimatePresence>
        {pendingConsent.map((a) => <ConsentRequestCard key={a._id} attempt={a} onDecide={decide} />)}
      </AnimatePresence>

      <section aria-label="Overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Truck} label="Expected" value={expected.length} tone="bg-primary-50 text-primary-600" />
        <Stat icon={KeyRound} label="Received · ready to collect" value={ready.length} tone="bg-teal-50 text-teal-600" />
        <Stat icon={CheckCircle2} label="Collected" value={collected.length} tone="bg-slate-100 text-slate-600" />
        <Stat icon={Package} label="All parcels" value={parcels.length} tone="bg-amber-50 text-amber-600" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <section className="lg:col-span-2 space-y-4" aria-label="Your parcels">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold overflow-x-auto" role="tablist">
              {TABS.map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`px-3.5 h-9 rounded-lg whitespace-nowrap ${tab === id ? 'bg-white shadow-soft text-navy' : 'text-slate-500'}`}>{label}</button>
              ))}
            </div>
            <div className="relative">
              <label htmlFor="parcel-search" className="sr-only">Search parcels</label>
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input id="parcel-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parcels"
                className="h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
          ) : visible.length === 0 ? (
            <Card><EmptyState icon={Package} title={parcels.length === 0 ? 'No parcels yet' : 'No parcels match'} hint={parcels.length === 0 ? 'Register an expected parcel so the hostel can receive it for you.' : 'Try another tab or search.'}
              action={parcels.length === 0 ? <Button icon={PackagePlus} onClick={() => setShowRegister(true)}>Register Expected Parcel</Button> : null} /></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((p) => <ParcelCard key={p._id} parcel={p} onOtp={setOtpParcel} onTimeline={setTimelineParcel} />)}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <NotificationList notifications={notifications || []} onRead={markAsRead} />
        </aside>
      </div>

      <RegisterParcelModal isOpen={showRegister} onClose={() => setShowRegister(false)} onDone={load} />
      <OtpModal key={otpParcel?._id || 'none'} parcel={otpParcel} onClose={() => { setOtpParcel(null); load(); }} />
      <TimelineModal parcel={timelineParcel} onClose={() => setTimelineParcel(null)} />
    </div>
  );
}
