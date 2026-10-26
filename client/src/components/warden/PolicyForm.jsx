import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import * as warden from '../../api/wardenService';

const MODES = [
  ['INDIVIDUAL_APPROVAL', 'Individual approval', 'Every parcel needs the student\'s consent.'],
  ['STANDING_PERMISSION', 'Standing permission', 'Students can give a standing consent. Guards still cannot accept without authorization.'],
  ['HYBRID', 'Hybrid', 'Standing permission for ordinary parcels, approval for flagged ones.'],
];
const SIZES = ['SMALL', 'MEDIUM', 'LARGE', 'ANY'];
const FLAGS = [['HIGH_VALUE', 'High value'], ['OVERSIZED', 'Oversized'], ['COD', 'Cash on delivery'], ['ELECTRONICS', 'Electronics']];
const field = 'h-11 px-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

export default function PolicyForm({ hostelId, policy, onSaved }) {
  const [form, setForm] = useState({
    mode: policy?.mode || 'INDIVIDUAL_APPROVAL',
    maxStorageDays: policy?.maxStorageDays ?? 7,
    allowCOD: Boolean(policy?.allowCOD),
    maxParcelSize: policy?.maxParcelSize || 'ANY',
    requireWardenApprovalFor: policy?.requireWardenApprovalFor || [],
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ ok: true, text: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleFlag = (key) => set('requireWardenApprovalFor', form.requireWardenApprovalFor.includes(key) ? form.requireWardenApprovalFor.filter((k) => k !== key) : [...form.requireWardenApprovalFor, key]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice({ ok: true, text: '' });
    try {
      const saved = await warden.updatePolicy(hostelId, { ...form, maxStorageDays: Number(form.maxStorageDays) });
      onSaved(saved);
      setNotice({ ok: true, text: 'Policy saved.' });
    } catch (err) {
      const details = err.response?.data?.errors;
      setNotice({ ok: false, text: details?.length ? details.join(' ') : warden.errorMessage(err, 'Could not save policy') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={save} className="space-y-6">
        <fieldset>
          <legend className="font-bold text-navy mb-2">Authorization mode</legend>
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map(([id, label, hint]) => (
              <label key={id} className={`cursor-pointer rounded-xl border p-4 ${form.mode === id ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}>
                <input type="radio" name="mode" className="sr-only" checked={form.mode === id} onChange={() => set('mode', id)} />
                <span className="block font-semibold text-navy">{label}</span>
                <span className="block text-xs text-slate-600 mt-1">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pol-days" className="block text-sm font-semibold text-navy mb-1.5">Storage duration (days)</label>
            <input id="pol-days" type="number" min="1" max="60" className={`${field} w-full`} value={form.maxStorageDays} onChange={(e) => set('maxStorageDays', e.target.value)} />
          </div>
          <div>
            <label htmlFor="pol-size" className="block text-sm font-semibold text-navy mb-1.5">Largest parcel accepted</label>
            <select id="pol-size" className={`${field} w-full`} value={form.maxParcelSize} onChange={(e) => set('maxParcelSize', e.target.value)}>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-navy"><input type="checkbox" className="w-4 h-4" checked={form.allowCOD} onChange={(e) => set('allowCOD', e.target.checked)} />Allow cash-on-delivery parcels</label>

        <fieldset>
          <legend className="font-bold text-navy mb-2">Needs warden approval when</legend>
          <div className="flex flex-wrap gap-2">
            {FLAGS.map(([key, label]) => (
              <button type="button" key={key} aria-pressed={form.requireWardenApprovalFor.includes(key)} onClick={() => toggleFlag(key)}
                className={`h-10 px-4 rounded-xl text-sm font-semibold border ${form.requireWardenApprovalFor.includes(key) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200'}`}>{label}</button>
            ))}
          </div>
        </fieldset>

        {notice.text && <p role={notice.ok ? 'status' : 'alert'} className={`text-sm font-medium ${notice.ok ? 'text-teal-700' : 'text-rose-600'}`}>{notice.text}</p>}
        <Button type="submit" size="lg" loading={busy}>Save policy</Button>
      </form>
    </Card>
  );
}
