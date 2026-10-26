import axiosClient from './axiosClient';

export const getPendingApprovals = () => axiosClient.get('/authorizations/pending').then((r) => r.data.authorizations || []);
export const getPolicy = () => axiosClient.get('/hostel/policy').then((r) => r.data.policy);
export const getActivity = (limit = 30) => axiosClient.get(`/activity-logs?limit=${limit}`).then((r) => r.data.logs || []);
export const searchStudents = (query) =>
  axiosClient.get(`/delivery-attempts/students/search?query=${encodeURIComponent(query)}`).then((r) => r.data.students || []);

// decision: 'APPROVE' | 'REJECT'. The backend field is `comments`.
export const decide = (authorizationId, decision, comments) =>
  axiosClient.post(`/authorizations/${authorizationId}/warden-decision`, { decision, comments }).then((r) => r.data);

// Backend only accepts: mode, maxStorageDays, allowCOD, maxParcelSize, requireWardenApprovalFor.
export const updatePolicy = (hostelId, body) => axiosClient.patch('/hostel/policy', { hostelId, ...body }).then((r) => r.data.policy);

export const setSuspension = (studentId, isSuspended) =>
  axiosClient.patch(`/hostel/students/${studentId}/suspension`, { isSuspended }).then((r) => r.data.student);

export const errorMessage = (err, fallback) => err.response?.data?.message || fallback;
