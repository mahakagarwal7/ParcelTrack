import React, { useEffect, useState } from 'react';
import { Search, Pencil } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';
import UserEditModal from './UserEditModal';
import * as admin from '../../api/adminService';

const ROLES = ['', 'STUDENT', 'GUARD', 'WARDEN', 'ADMIN'];
const TONE = { STUDENT: 'bg-primary-50 text-primary-700', GUARD: 'bg-teal-50 text-teal-700', WARDEN: 'bg-amber-50 text-amber-800', ADMIN: 'bg-navy text-white' };
const sel = 'h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

export default function UsersPanel({ onUsersLoaded }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [hostelId, setHostelId] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await admin.getUsers({ search, role, hostelId });
        if (cancelled) return;
        setUsers(list);
        setError('');
        if (!search && !role && !hostelId) onUsersLoaded?.(list);
      } catch (err) {
        if (!cancelled) setError(admin.errorMessage(err, 'Could not load users'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, role, hostelId, version]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100">
        <div className="relative flex-1 min-w-[12rem]">
          <label htmlFor="u-search" className="sr-only">Search users</label>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="u-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, student ID or room" className={`${sel} w-full pl-9`} />
        </div>
        <label className="sr-only" htmlFor="u-role">Role filter</label>
        <select id="u-role" value={role} onChange={(e) => setRole(e.target.value)} className={sel}>{ROLES.map((r) => <option key={r} value={r}>{r || 'All roles'}</option>)}</select>
        <label className="sr-only" htmlFor="u-hostel">Hostel filter</label>
        <input id="u-hostel" value={hostelId} onChange={(e) => setHostelId(e.target.value)} placeholder="Hostel" className={`${sel} w-28 uppercase`} />
      </div>
      {error && <p role="alert" className="px-4 py-3 text-sm text-rose-600">{error}</p>}
      {loading ? <div className="p-4"><CardSkeleton lines={4} /></div> : users.length === 0 ? <EmptyState title="No users match" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>{['User', 'Role', 'Hostel · Room', 'Status', ''].map((h, i) => <th key={i} scope="col" className="px-4 py-2.5">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3"><p className="font-semibold text-navy">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold rounded-full px-2.5 py-1 ${TONE[u.role]}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-slate-600">{u.hostelId || 'N/A'}{u.roomNumber ? ` · ${u.roomNumber}` : ''}</td>
                  <td className="px-4 py-3 text-xs">{u.isActive === false ? <span className="text-rose-600 font-semibold">Inactive</span> : <span className="text-teal-700 font-semibold">Active</span>}{u.standingPermissionSuspended && <span className="ml-2 text-amber-700 font-semibold">Standing suspended</span>}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(u)} aria-label={`Edit ${u.name}`}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <UserEditModal key={editing?._id || 'none'} user={editing} onClose={() => setEditing(null)} onSaved={() => setVersion((v) => v + 1)} />
    </Card>
  );
}
