import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  Settings,
  RefreshCw,
  Search,
  Sliders,
  History,
  FileText,
} from 'lucide-react';

export default function WardenDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'policy' | 'suspensions' | 'logs'
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Policy Form State
  const [policyForm, setPolicyForm] = useState({
    mode: 'HYBRID',
    maxActiveParcelsPerStudent: 5,
    autoApproveVerifiedVendors: true,
  });
  const [policySaving, setPolicySaving] = useState(false);
  const [policyNotice, setPolicyNotice] = useState('');

  // Suspension Management State
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [suspensionModal, setSuspensionModal] = useState({
    open: false,
    student: null,
    reason: 'Disciplinary review',
    action: 'suspend', // 'suspend' | 'reinstate'
  });
  const [suspensionLoading, setSuspensionLoading] = useState(false);

  // Fetch pending authorizations, hostel policy, and audit logs
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [authRes, policyRes, logsRes] = await Promise.all([
        axiosClient.get('/authorizations/pending'),
        axiosClient.get('/hostel/policy'),
        axiosClient.get('/activity-logs?limit=30'),
      ]);

      if (authRes.data.success) {
        setPendingApprovals(authRes.data.authorizations || []);
      }
      if (policyRes.data.success && policyRes.data.policy) {
        setPolicy(policyRes.data.policy);
        setPolicyForm({
          mode: policyRes.data.policy.mode || 'HYBRID',
          maxActiveParcelsPerStudent: policyRes.data.policy.maxActiveParcelsPerStudent || 5,
          autoApproveVerifiedVendors: Boolean(policyRes.data.policy.autoApproveVerifiedVendors),
        });
      }
      if (logsRes.data.success) {
        setLogs(logsRes.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load warden data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchData();
    };
    socket.on('authorization:new', handleUpdate);
    socket.on('parcel:updated', handleUpdate);
    socket.on('policy:updated', handleUpdate);
    return () => {
      socket.off('authorization:new', handleUpdate);
      socket.off('parcel:updated', handleUpdate);
      socket.off('policy:updated', handleUpdate);
    };
  }, [socket, fetchData]);

  // Handle Warden Decision on pending authorization
  const handleWardenDecision = async (id, decision) => {
    try {
      const res = await axiosClient.post(`/authorizations/${id}/warden-decision`, {
        decision,
        notes: `Warden ${user?.name} approved via dashboard`,
      });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit warden decision');
    }
  };

  // Handle Policy Update
  const handlePolicySave = async (e) => {
    e.preventDefault();
    try {
      setPolicySaving(true);
      setPolicyNotice('');

      const res = await axiosClient.patch('/hostel/policy', {
        hostelId: user?.hostelId,
        mode: policyForm.mode,
        maxActiveParcelsPerStudent: parseInt(policyForm.maxActiveParcelsPerStudent, 10),
        autoApproveVerifiedVendors: policyForm.autoApproveVerifiedVendors,
      });

      if (res.data.success) {
        setPolicyNotice('Hostel Policy updated successfully!');
        setPolicy(res.data.policy);
      }
    } catch (err) {
      setPolicyNotice(`Error: ${err.response?.data?.message || 'Failed to update policy'}`);
    } finally {
      setPolicySaving(false);
    }
  };

  // Search Student for Suspension Management
  const handleSearchStudent = async (val) => {
    setStudentQuery(val);
    if (val.trim().length < 2) {
      setStudentResults([]);
      return;
    }

    try {
      const res = await axiosClient.get(`/delivery-attempts/students/search?query=${encodeURIComponent(val)}`);
      if (res.data.success) {
        setStudentResults(res.data.students || []);
      }
    } catch (err) {
      console.error('Error searching students:', err);
    }
  };

  // Handle Suspension Toggle
  const handleToggleSuspension = async () => {
    if (!suspensionModal.student) return;

    try {
      setSuspensionLoading(true);
      const isSuspending = suspensionModal.action === 'suspend';
      const res = await axiosClient.patch(`/hostel/students/${suspensionModal.student._id}/suspension`, {
        isSuspended: isSuspending,
        reason: suspensionModal.reason,
      });

      if (res.data.success) {
        setSuspensionModal({ open: false, student: null, reason: '', action: 'suspend' });
        setStudentQuery('');
        setStudentResults([]);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student standing status');
    } finally {
      setSuspensionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>Hostel Warden Console • Hostel {user?.hostelId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Hostel Supervisory & Policy Oversight
          </h1>
          <p className="text-sm text-amber-100 mt-1">
            Warden: <strong className="text-white">{user?.name}</strong> • Current Policy Mode:{' '}
            <span className="font-bold uppercase underline">{policy?.mode || 'HYBRID'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition border border-white/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'queue', label: `Pending Approvals (${pendingApprovals.length})`, icon: Clock },
          { id: 'policy', label: 'Hostel Policy Configuration', icon: Sliders },
          { id: 'suspensions', label: 'Student Suspensions', icon: UserX },
          { id: 'logs', label: 'Hostel Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PENDING APPROVALS QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Pending Authorizations Requiring Warden Consent</h2>
              <p className="text-xs text-slate-500">
                Parcels or delivery attempts flagged for supervisory review under the active hostel intake policy.
              </p>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-700">No pending approvals</p>
              <p className="text-slate-400 mt-0.5">All courier delivery requests are processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Carrier / Courier</th>
                    <th className="py-3 px-4">Policy Mode</th>
                    <th className="py-3 px-4">Request Reason</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pendingApprovals.map((auth) => (
                    <tr key={auth._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{auth.studentId?.name || 'Student'}</div>
                        <div className="text-[11px] text-slate-500">
                          Room {auth.studentId?.roomNumber || 'N/A'} • {auth.studentId?.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{auth.carrier || 'Courier'}</div>
                        <div className="text-[11px] font-mono text-slate-400">{auth.trackingNumber || 'No tracking'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                          {auth.policyMode || 'INDIVIDUAL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {auth.notes || 'Awaiting warden sign-off'}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-400">
                        {new Date(auth.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleWardenDecision(auth._id, 'APPROVE')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleWardenDecision(auth._id, 'REJECT')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOSTEL POLICY CONFIGURATION */}
      {activeTab === 'policy' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Hostel Delivery Intake Policy</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure how courier deliveries are authorized for Hostel {user?.hostelId}. Changes take effect immediately.
            </p>
          </div>

          {policyNotice && (
            <div
              className={`p-3 text-xs rounded-lg font-semibold ${
                policyNotice.startsWith('Success') || policyNotice.includes('updated')
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}
            >
              {policyNotice}
            </div>
          )}

          <form onSubmit={handlePolicySave} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-2">
                Authorization Mode
              </label>
              <div className="space-y-2">
                {[
                  {
                    mode: 'INDIVIDUAL_APPROVAL',
                    title: 'Individual Approval (Strict)',
                    desc: 'Every unexpected courier delivery requires explicit student consent before guard intake.',
                  },
                  {
                    mode: 'STANDING_PERMISSION',
                    title: 'Standing Permission (Open)',
                    desc: 'Gate guards automatically accept courier deliveries unless the student is specifically suspended.',
                  },
                  {
                    mode: 'HYBRID',
                    title: 'Hybrid (Recommended)',
                    desc: 'Auto-approves verified top carriers (Amazon, Flipkart) under standing policy; requires consent for others.',
                  },
                ].map((item) => (
                  <label
                    key={item.mode}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      policyForm.mode === item.mode
                        ? 'bg-amber-50/60 border-amber-500 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="policyMode"
                      value={item.mode}
                      checked={policyForm.mode === item.mode}
                      onChange={(e) => setPolicyForm({ ...policyForm, mode: e.target.value })}
                      className="mt-1 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Max Active Parcels Per Student
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={policyForm.maxActiveParcelsPerStudent}
                onChange={(e) => setPolicyForm({ ...policyForm, maxActiveParcelsPerStudent: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Prevents parcel hoarding at the intake counter.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={policySaving}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                {policySaving ? (
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    <span>Apply Policy Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: STUDENT SUSPENSIONS */}
      {activeTab === 'suspensions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              <span>Student Standing Permission Management</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Search a student to suspend or reinstate their automatic standing reception privileges (e.g. for unclaimed parcel accumulation or disciplinary actions).
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={studentQuery}
                onChange={(e) => handleSearchStudent(e.target.value)}
                placeholder="Search student by name or room..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {studentResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl divide-y max-h-60 overflow-y-auto">
                {studentResults.map((stu) => {
                  const isSuspended = stu.standingPermissionSuspended;
                  return (
                    <div key={stu._id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-800">{stu.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Room {stu.roomNumber || 'N/A'} • {stu.email}
                        </div>
                        {isSuspended && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded">
                            Standing Permission Suspended
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setSuspensionModal({
                            open: true,
                            student: stu,
                            reason: isSuspended ? '' : 'Disciplinary review',
                            action: isSuspended ? 'reinstate' : 'suspend',
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isSuspended
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isSuspended ? 'Reinstate Permission' : 'Suspend Permission'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Hostel Activity Audit Stream</h2>
            <p className="text-xs text-slate-500">Immutable ledger of gate operations, OTP verifications, and approvals</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target / Notes</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{log.actorId?.name || 'System'}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({log.actorRole})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {log.parcelId ? `Parcel ${log.parcelId}` : ''}
                      {log.notes ? ` • ${log.notes}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspension Confirmation Modal */}
      <Modal
        isOpen={suspensionModal.open}
        onClose={() => setSuspensionModal({ ...suspensionModal, open: false })}
        title={suspensionModal.action === 'suspend' ? 'Suspend Standing Permission' : 'Reinstate Standing Permission'}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            {suspensionModal.action === 'suspend'
              ? `Are you sure you want to suspend standing courier permission for ${suspensionModal.student?.name}? All their future gate arrivals will require explicit manual consent.`
              : `Reinstate automatic standing courier reception privileges for ${suspensionModal.student?.name}?`}
          </p>

          {suspensionModal.action === 'suspend' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Suspension</label>
              <input
                type="text"
                value={suspensionModal.reason}
                onChange={(e) => setSuspensionModal({ ...suspensionModal, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setSuspensionModal({ ...suspensionModal, open: false })}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleSuspension}
              disabled={suspensionLoading}
              className={`px-4 py-2 font-bold text-white rounded-lg shadow-sm transition ${
                suspensionModal.action === 'suspend'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {suspensionLoading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
