import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Skeleton';
import GateSearch from '../../components/guard/GateSearch';
import GateQueues from '../../components/guard/GateQueues';
import HandoverPanel from '../../components/guard/HandoverPanel';
import ActivityFeed from '../../components/guard/ActivityFeed';
import ReceiveDrawer from '../../components/guard/ReceiveDrawer';
import UnexpectedDeliveryModal from '../../components/guard/UnexpectedDeliveryModal';
import * as guard from '../../api/guardService';

export default function GuardDashboard() {
  const { user } = useAuth();
  const { notifications } = useSocket();

  const [custody, setCustody] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [unexpectedFor, setUnexpectedFor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [c, a, l] = await Promise.all([guard.getCustodyParcels(), guard.getDeliveryAttempts(), guard.getRecentActivity()]);
      setCustody(c);
      setAttempts(a);
      setLogs(l);
      setLoadError('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setLoadError(guard.errorMessage(err, 'Could not load gate data'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The server pushes only `notification:new`; reload gate data whenever a new notification lands.
  useEffect(() => {
    if (notifications?.length) load();
  }, [notifications?.length, load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
            <Shield className="w-4 h-4" aria-hidden="true" />Gate desk · Hostel {user?.hostelId}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">Reception &amp; handover</h1>
          <p className="text-sm text-slate-500">{user?.name} · {custody.length} parcel{custody.length === 1 ? '' : 's'} in custody</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={load} loading={refreshing}>Refresh</Button>
      </header>

      {loadError && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">{loadError}</p>}

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-3"><div className="lg:col-span-2"><CardSkeleton lines={5} /></div><CardSkeleton lines={5} /></div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2 space-y-6">
              <GateSearch refreshKey={refreshKey} onReceive={(kind, item) => setReceiveTarget({ kind, item })} onRegisterUnexpected={setUnexpectedFor} />
              <GateQueues attempts={attempts} onReceive={(kind, item) => setReceiveTarget({ kind, item })} />
            </div>
            <div className="space-y-6">
              <HandoverPanel parcels={custody} onDone={load} />
              <ActivityFeed logs={logs} />
            </div>
          </div>
        </>
      )}

      <ReceiveDrawer key={`receive-${receiveTarget?.item?._id || 'none'}`} target={receiveTarget} onClose={() => setReceiveTarget(null)} onDone={load} />
      <UnexpectedDeliveryModal key={`unexpected-${unexpectedFor?._id || 'none'}`} student={unexpectedFor} onClose={() => setUnexpectedFor(null)} onDone={load} />
    </div>
  );
}
