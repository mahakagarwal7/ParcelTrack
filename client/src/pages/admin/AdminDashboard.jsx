import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Package, KeyRound, ClipboardCheck, Truck, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { CardSkeleton } from '../../components/ui/Skeleton';
import UsersPanel from '../../components/admin/UsersPanel';
import HostelsPanel from '../../components/admin/HostelsPanel';
import ActivityTable from '../../components/warden/ActivityTable';
import * as admin from '../../api/adminService';

const TABS = [['users', 'Users & roles'], ['hostels', 'Hostels & configuration'], ['audit', 'Audit log']];

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" aria-hidden="true" /></span>
      <div><p className="text-2xl font-extrabold text-navy leading-none">{value ?? '–'}</p><p className="text-xs text-slate-500 mt-1">{label}</p></div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, l] = await Promise.all([admin.getStats(), admin.getActivity()]);
      setStats(s);
      setLogs(l);
      setError('');
    } catch (err) {
      setError(admin.errorMessage(err, 'Could not load system data'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary-600">System administration</p>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Admin console</h1>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={load} loading={refreshing}>Refresh</Button>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">{error}</p>}

      {loading ? <CardSkeleton lines={3} /> : (
        <section aria-label="System statistics" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Stat icon={Users} label="Active users" value={stats?.totalUsers} tone="bg-primary-50 text-primary-600" />
          <Stat icon={Package} label="Total parcels" value={stats?.totalParcels} tone="bg-amber-50 text-amber-600" />
          <Stat icon={KeyRound} label="Awaiting collection" value={stats?.parcelsAwaitingCollection} tone="bg-teal-50 text-teal-600" />
          <Stat icon={CheckCircle2} label="Collected" value={stats?.parcelsCollected} tone="bg-slate-100 text-slate-600" />
          <Stat icon={ClipboardCheck} label="Pending warden approvals" value={stats?.pendingWardenApprovals} tone="bg-amber-50 text-amber-600" />
          <Stat icon={Truck} label="Open delivery attempts" value={stats?.activeDeliveryAttempts} tone="bg-primary-50 text-primary-600" />
        </section>
      )}

      <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold overflow-x-auto max-w-full" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-4 h-9 rounded-lg whitespace-nowrap ${tab === id ? 'bg-white shadow-soft text-navy' : 'text-slate-500'}`}>{label}</button>
        ))}
      </div>

      <div hidden={tab !== 'users'}><UsersPanel onUsersLoaded={setAllUsers} /></div>
      {tab === 'hostels' && <HostelsPanel users={allUsers} />}
      {tab === 'audit' && <ActivityTable logs={logs} title="System activity & audit log" />}
    </div>
  );
}
