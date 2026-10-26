import axiosClient from './axiosClient';

export const getMyParcels = () => axiosClient.get('/parcels/my').then((r) => r.data.parcels || []);

// The backend returns { attempts, pagination } for this endpoint.
export const getMyDeliveryAttempts = () => axiosClient.get('/delivery-attempts?limit=50').then((r) => r.data.attempts || []);

// Backend contract: courierName and expectedDeliveryDate (not carrier / expectedArrivalDate).
export const registerParcel = (body) => axiosClient.post('/parcels', body).then((r) => r.data);

export const decideConsent = (authorizationId, decision) =>
  axiosClient.post(`/authorizations/${authorizationId}/student-decision`, { decision }).then((r) => r.data);

export const requestCollectionOtp = (parcelId) => axiosClient.post(`/parcels/${parcelId}/collection-otp`).then((r) => r.data);

export const errorMessage = (err, fallback) => err.response?.data?.message || fallback;
