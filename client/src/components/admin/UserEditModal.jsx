import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import * as admin from '../../api/adminService';

const ROLES = ['STUDENT', 'GUARD', 'WARDEN', 'ADMIN'];
const field = 'w-full h-11 px-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

export default function UserEditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    role: user?.role || 'STUDENT',
    hostelId: user?.hostelId || '',
    roomNumber: user?.roomNumber || '',
    isActive: user?.isActive !== false,
    standingPermissionSuspended: Boolean(user?.standingPermissionSuspended),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await admin.updateUser(user._id, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(admin.errorMessage(err, 'Could not update user'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={Boolean(user)} onClose={onClose} title={user ? `Edit ${user.name}` : 'Edit user'} maxWidth="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-600">{user?.email}</p>
        <div>
          <label htmlFor="ue-role" className="block text-sm font-semibold text-navy mb-1.5">Role</label>
          <select id="ue-role" className={field} value={form.role} onChange={(e) => set('role', e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ue-hostel" className="block text-sm font-semibold text-navy mb-1.5">Hostel</label>
            <input id="ue-hostel" className={`${field} uppercase`} value={form.hostelId} onChange={(e) => set('hostelId', e.target.value)} />
          </div>
          <div>
            <label htmlFor="ue-room" className="block text-sm font-semibold text-navy mb-1.5">Room</label>
            <input id="ue-room" className={field} value={form.roomNumber} onChange={(e) => set('roomNumber', e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm text-navy"><input type="checkbox" className="w-4 h-4" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />Account active</label>
        <label className="flex items-center gap-3 text-sm text-navy"><input type="checkbox" className="w-4 h-4" checked={form.standingPermissionSuspended} onChange={(e) => set('standingPermissionSuspended', e.target.checked)} />Standing permission suspended</label>
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        <Button type="submit" size="lg" loading={busy} className="w-full">Save changes</Button>
      </form>
    </Modal>
  );
}
