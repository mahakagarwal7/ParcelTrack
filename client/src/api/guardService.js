import axiosClient from './axiosClient';

// Thin wrappers around existing guard endpoints. The backend response is the source of truth.
export const searchStudents = (query) =>
  axiosClient.get(`/delivery-attempts/students/search?query=${encodeURIComponent(query)}`).then((r) => r.data.students || []);

export const lookupByStudentId = (studentId) =>
  axiosClient.get(`/parcels/guard/lookup?studentId=${encodeURIComponent(studentId)}`).then((r) => r.data);

export const lookupByTracking = (trackingNumber) =>
  axiosClient.get(`/parcels/guard/lookup?trackingNumber=${encodeURIComponent(trackingNumber)}`).then((r) => r.data);

export const getCustodyParcels = () => axiosClient.get('/parcels/guard/active').then((r) => r.data.parcels || []);

export const getDeliveryAttempts = () => axiosClient.get('/delivery-attempts?limit=50').then((r) => r.data.attempts || []);

export const getRecentActivity = () => axiosClient.get('/activity-logs?limit=8').then((r) => r.data.logs || []);

export const receiveExpectedParcel = (parcelId, body) => axiosClient.post(`/parcels/${parcelId}/receive`, body).then((r) => r.data);

export const receiveUnexpectedDelivery = (attemptId, body) =>
  axiosClient.post(`/delivery-attempts/${attemptId}/receive`, body).then((r) => r.data);

export const registerDeliveryAttempt = (body) => axiosClient.post('/delivery-attempts', body).then((r) => r.data);

export const collectWithOtp = (parcelId, otp) => axiosClient.post(`/parcels/${parcelId}/collect`, { otp }).then((r) => r.data);

export const uploadPhoto = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return axiosClient.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

export const errorMessage = (err, fallback) => err.response?.data?.message || fallback;
