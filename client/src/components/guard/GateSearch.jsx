import React, { useEffect, useState } from 'react';
import { Search, Hash, User, Loader2, Package, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import AuthDecisionBanner, { isAuthorized } from '../authorization/AuthDecisionBanner';
import StatusBadge from '../common/StatusBadge';
import Button from '../ui/Button';
import * as guard from '../../api/guardService';

const courierOf = (x) => x.courierName || x.carrier || 'Courier';

function Candidate({ kind, item, onReceive }) {
  const authStatus = item.authorizationId?.status;
  const open = kind === 'parcel' ? ['EXPECTED', 'AUTHORIZED'].includes(item.status) : !item.authorizationId?.parcelId;
  const canReceive = open && isAuthorized(authStatus);
  const Icon = kind === 'parcel' ? Package : Truck;
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="font-bold text-navy truncate">{courierOf(item)} · {kind === 'parcel' ? 'Pre-registered parcel' : 'Delivery attempt'}</p>
            <p className="text-xs font-mono text-slate-500 truncate">{item.trackingNumber || 'No tracking number'}</p>
            {item.studentId?.name && <p className="text-xs text-slate-600 mt-0.5">{item.studentId.name} · Room {item.studentId.roomNumber || 'N/A'}</p>}
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <AuthDecisionBanner status={authStatus} />
      {canReceive && (
        <Button size="lg" variant="success" className="w-full" onClick={() => onReceive(kind, item)}>
          Receive parcel
        </Button>
      )}
    </motion.li>
  );
}

export default function GateSearch({ onReceive, onRegisterUnexpected, refreshKey }) {
  const [mode, setMode] = useState('student'); // 'student' | 'tracking'
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [student, setStudent] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Student search-as-you-type (ID, name or room)
  useEffect(() => {
    if (mode !== 'student' || student || query.trim().length < 2) {
      setStudents([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        setBusy(true);
        setStudents(await guard.searchStudents(query.trim()));
      } catch (err) {
        setError(guard.errorMessage(err, 'Student search failed'));
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, mode, student]);

  const loadStudent = async (s) => {
    setStudent(s);
    setStudents([]);
    setError('');
    try {
      setBusy(true);
      setResult(await guard.lookupByStudentId(s.studentId));
    } catch (err) {
      setError(guard.errorMessage(err, 'Lookup failed'));
    } finally {
      setBusy(false);
    }
  };

  // Re-run the lookup after a reception so statuses reflect the backend.
  useEffect(() => {
    if (student && refreshKey) {
      guard.lookupByStudentId(student.studentId).then(setResult).catch(() => {});
    }
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitTracking = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError('');
    try {
      setBusy(true);
      setResult(await guard.lookupByTracking(query.trim()));
    } catch (err) {
      setError(guard.errorMessage(err, 'Lookup failed'));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setStudent(null); setResult(null); setQuery(''); setError(''); };
  const parcels = result?.parcels || [];
  const attempts = result?.deliveryAttempts || [];
  const nothing = result && parcels.length === 0 && attempts.length === 0;

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Gate search</h2>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist" aria-label="Search by">
          {[['student', 'Student', User], ['tracking', 'Tracking no.', Hash]].map(([id, label, Icon]) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => { setMode(id); reset(); }}
              className={`px-3.5 h-9 rounded-lg inline-flex items-center gap-1.5 ${mode === id ? 'bg-white shadow-soft text-navy' : 'text-slate-500'}`}>
              <Icon className="w-4 h-4" aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={mode === 'tracking' ? submitTracking : (e) => e.preventDefault()}>
        <label htmlFor="gate-search" className="sr-only">{mode === 'student' ? 'Search student by ID, name or room' : 'Tracking number'}</label>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="gate-search" value={query} onChange={(e) => { setQuery(e.target.value); if (student) { setStudent(null); setResult(null); } }}
            placeholder={mode === 'student' ? 'Student ID, name or room number' : 'Scan or type tracking number, then press Enter'}
            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-slate-300 text-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" autoComplete="off" />
          {busy && <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary-600" aria-label="Searching" />}
        </div>
      </form>

      {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}

      {students.length > 0 && (
        <ul className="rounded-2xl border border-slate-200 divide-y max-h-72 overflow-y-auto">
          {students.map((s) => (
            <li key={s._id}>
              <button onClick={() => loadStudent(s)} className="w-full text-left px-4 py-3 hover:bg-primary-50 flex justify-between gap-3">
                <span className="font-semibold text-navy">{s.name}</span>
                <span className="text-sm text-slate-500">Room {s.roomNumber || 'N/A'} · <span className="font-mono">{s.studentId}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {student && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-primary-50 px-4 py-3">
          <p className="text-sm text-navy"><strong>{student.name}</strong> · Room {student.roomNumber || 'N/A'} · <span className="font-mono">{student.studentId}</span></p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => onRegisterUnexpected(student)}>Register unexpected delivery</Button>
            <Button size="sm" variant="ghost" onClick={reset}>Clear</Button>
          </div>
        </div>
      )}

      {result && (
        <ul className="space-y-3">
          {parcels.map((p) => <Candidate key={p._id} kind="parcel" item={p} onReceive={onReceive} />)}
          {attempts.map((a) => <Candidate key={a._id} kind="attempt" item={a} onReceive={onReceive} />)}
        </ul>
      )}
      {nothing && (
        <EmptyState icon={Package} title="Nothing waiting for this search" hint="No expected parcel or delivery attempt found. For an unannounced courier, register an unexpected delivery."
          action={student ? <Button variant="secondary" onClick={() => onRegisterUnexpected(student)}>Register unexpected delivery</Button> : null} />
      )}
    </Card>
  );
}
