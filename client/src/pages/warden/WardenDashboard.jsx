import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, ClipboardCheck, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import ApprovalCard from '../../components/warden/ApprovalCard';
import PolicyForm from '../../components/warden/PolicyForm';
import StandingPermissions from '../../components/warden/StandingPermissions';
import ActivityTable from '../../components/warden/ActivityTable';
import * as warden from '../../api/wardenService';

const TABS = [['approvals', 'Approvals'], ['policy', 'Hostel policy'], ['permissions', 'Standing permissions'], ['activity', 'Activity']];

export default function WardenDashboard() {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const [tab, setTab] = useState('approvals');
  const [pending, setPending] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [p, pol, l] = await Promise.all([warden.getPendingApprovals(), warden.getPolicy(), warden.getActivity()]);
      setPending(p);
      setPolicy(pol);
      setLogs(l);
      setError('');
    } catch (err) {
      setError(warden.errorMessage(err, 'Could not load warden data'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (notifications?.length) load(); }, [notifications?.length, load]);

  const decide = async (id, decision, comments) => {
    try {
      await warden.decide(id, decision, comments);
    } catch (err) {
      throw new Error(warden.errorMessage(err, 'Could not record decision'));
    }
    await load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5"><Building2 className="w-4 h-4" aria-hidden="true" />Warden console · Hostel {user?.hostelId}</p>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Approvals &amp; oversight</h1>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <span><span className="text-2xl font-extrabold text-navy">{pending.length}</span> <span className="text-sm text-slate-500">pending approval{pending.length === 1 ? '' : 's'}</span></span>
          </Card>
          <Button variant="secondary" icon={RefreshCw} onClick={load} loading={refreshing}>Refresh</Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">{error}</p>}

      <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold overflow-x-auto max-w-full" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-4 h-9 rounded-lg whitespace-nowrap ${tab === id ? 'bg-white shadow-soft text-navy' : 'text-slate-500'}`}>{label}</button>
        ))}
      </div>

      {loading ? <CardSkeleton lines={5} /> : (
        <>
          {tab === 'approvals' && (pending.length === 0 ? (
            <Card><EmptyState icon={ClipboardCheck} title="No approvals waiting" hint="Requests that need warden approval under your hostel policy will appear here." /></Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <AnimatePresence>{pending.map((a) => <ApprovalCard key={a._id} auth={a} onDecide={decide} />)}</AnimatePresence>
            </div>
          ))}
          {tab === 'policy' && <PolicyForm key={policy?.updatedAt || 'p'} hostelId={user?.hostelId} policy={policy} onSaved={setPolicy} />}
          {tab === 'permissions' && <StandingPermissions />}
          {tab === 'activity' && <ActivityTable logs={logs} title="Recent parcel activity" />}
        </>
      )}
    </div>
  );
}
