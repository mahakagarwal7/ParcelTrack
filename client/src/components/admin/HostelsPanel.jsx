import React, { useMemo, useState } from 'react';
import { Building2, Info } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import PolicyForm from '../warden/PolicyForm';
import * as admin from '../../api/adminService';

// Hostels are derived from users' hostelId. The backend has no hostel or hostel-wise parcel statistics endpoint yet.
export default function HostelsPanel({ users }) {
  const [openId, setOpenId] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState('');

  const hostels = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      if (!u.hostelId) return;
      map[u.hostelId] ||= { id: u.hostelId, STUDENT: 0, GUARD: 0, WARDEN: 0, ADMIN: 0 };
      map[u.hostelId][u.role] += 1;
    });
    return Object.values(map).sort((a, b) => a.id.localeCompare(b.id));
  }, [users]);

  const open = async (id) => {
    setError('');
    setOpenId(id);
    setPolicy(null);
    try { setPolicy(await admin.getPolicy(id)); } catch (err) { setError(admin.errorMessage(err, 'Could not load policy')); }
  };

  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3 flex gap-2"><Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        Hostel creation and hostel-wise parcel statistics need new backend endpoints that do not exist yet. Hostels below are derived from user records; policy editing uses the existing policy API.</p>
      {hostels.length === 0 ? <Card><EmptyState icon={Building2} title="No hostels found" hint="Hostels appear once users are assigned to one." /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.map((h) => (
            <Card key={h.id} hover className="p-5">
              <p className="font-extrabold text-navy text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-600" aria-hidden="true" />Hostel {h.id}</p>
              <p className="text-sm text-slate-600 mt-2">{h.STUDENT} students · {h.GUARD} guards · {h.WARDEN} wardens</p>
              <Button size="sm" variant="secondary" className="mt-4" onClick={() => open(h.id)}>View &amp; edit policy</Button>
            </Card>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
      {openId && policy && (
        <div>
          <h2 className="font-bold text-navy mb-2">Policy · Hostel {openId}</h2>
          <PolicyForm key={openId} hostelId={openId} policy={policy} onSaved={setPolicy} />
        </div>
      )}
    </div>
  );
}
