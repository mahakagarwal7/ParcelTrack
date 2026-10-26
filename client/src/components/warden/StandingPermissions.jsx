import React, { useEffect, useState } from 'react';
import { Search, ShieldOff, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import * as warden from '../../api/wardenService';

// Suspending standing permission only removes the shortcut: consent is still required per parcel.
export default function StandingPermissions() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query.trim().length < 2) { setStudents([]); return undefined; }
    const t = setTimeout(() => warden.searchStudents(query.trim()).then(setStudents).catch((e) => setError(warden.errorMessage(e, 'Search failed'))), 250);
    return () => clearTimeout(t);
  }, [query]);

  const toggle = async (s) => {
    setBusyId(s._id);
    setError('');
    try {
      const updated = await warden.setSuspension(s._id, !s.standingPermissionSuspended);
      setStudents((list) => list.map((x) => (x._id === s._id ? { ...x, standingPermissionSuspended: updated.standingPermissionSuspended } : x)));
    } catch (e) {
      setError(warden.errorMessage(e, 'Could not update student'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="font-bold text-navy">Standing permissions</h2>
        <p className="text-sm text-slate-600">Suspend or restore a student&apos;s standing permission. Guards still need authorization for every parcel.</p>
      </div>
      <div className="relative">
        <label htmlFor="sp-search" className="sr-only">Search students</label>
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input id="sp-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Student ID, name or room"
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
      {students.length === 0 ? <EmptyState title="Search for a student" hint="Type at least 2 characters." /> : (
        <ul className="divide-y divide-slate-100">
          {students.map((s) => (
            <li key={s._id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{s.name}</p>
                <p className="text-xs text-slate-500">Room {s.roomNumber || 'N/A'} · {s.studentId}</p>
              </div>
              <Button size="sm" variant={s.standingPermissionSuspended ? 'success' : 'secondary'} icon={s.standingPermissionSuspended ? ShieldCheck : ShieldOff}
                loading={busyId === s._id} onClick={() => toggle(s)}>
                {s.standingPermissionSuspended ? 'Restore permission' : 'Suspend permission'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
