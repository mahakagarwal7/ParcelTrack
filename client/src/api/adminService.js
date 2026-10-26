import axiosClient from './axiosClient';

export const getStats = () => axiosClient.get('/admin/stats').then((r) => r.data.stats);

export const getUsers = ({ search = '', role = '', hostelId = '', limit = 100 } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  if (hostelId) params.set('hostelId', hostelId);
  return axiosClient.get(`/admin/users?${params}`).then((r) => r.data.users || []);
};

export const updateUser = (id, body) => axiosClient.patch(`/admin/users/${id}`, body).then((r) => r.data);
export const getActivity = (limit = 40) => axiosClient.get(`/activity-logs?limit=${limit}`).then((r) => r.data.logs || []);
export const getPolicy = (hostelId) => axiosClient.get(`/hostel/policy?hostelId=${encodeURIComponent(hostelId)}`).then((r) => r.data.policy);
export const errorMessage = (err, fallback) => err.response?.data?.message || fallback;
