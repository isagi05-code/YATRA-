import { TRAVELLER_BASE, request, getUserId } from './httpClient';

export const travellerApi = {
  getSummary: (userId) => {
    const uid = userId || getUserId();
    return request(`${TRAVELLER_BASE}/dashboard/summary${uid ? `?user_id=${uid}` : ''}`);
  },
  getTrips: (status, userId) => {
    const p = new URLSearchParams();
    if (status) p.append("status", status);
    const uid = userId || getUserId();
    if (uid) p.append("user_id", uid);
    return request(`${TRAVELLER_BASE}/trips?${p.toString()}`);
  },
  createTrip: (data) => request(`${TRAVELLER_BASE}/trips`, { method: "POST", body: JSON.stringify(data) }),
  getTrip: (id) => request(`${TRAVELLER_BASE}/trips/${id}`),
  getExpenses: (cat, userId) => {
    const p = new URLSearchParams();
    if (cat) p.append("category", cat);
    const uid = userId || getUserId();
    if (uid) p.append("user_id", uid);
    return request(`${TRAVELLER_BASE}/expenses?${p.toString()}`);
  },
  createExpense: (data) => request(`${TRAVELLER_BASE}/expenses`, { method: "POST", body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`${TRAVELLER_BASE}/expenses/${id}`, { method: "DELETE" }),
  getExpensesAnalytics: (userId) => {
    const uid = userId || getUserId();
    return request(`${TRAVELLER_BASE}/expenses/analytics${uid ? `?user_id=${uid}` : ''}`);
  },
  getBookings: (userId) => {
    const uid = userId || getUserId();
    return request(`${TRAVELLER_BASE}/bookings${uid ? `?user_id=${uid}` : ''}`);
  },
  createBooking: (data) => request(`${TRAVELLER_BASE}/bookings`, { method: "POST", body: JSON.stringify(data) }),
  getDocuments: (userId) => {
    const uid = userId || getUserId();
    return request(`${TRAVELLER_BASE}/documents${uid ? `?user_id=${uid}` : ''}`);
  },
  uploadDocument: (data) => request(`${TRAVELLER_BASE}/documents`, { method: "POST", body: JSON.stringify(data) }),
  getProfile: (userId) => {
    const uid = userId || getUserId();
    return request(`${TRAVELLER_BASE}/profile${uid ? `?user_id=${uid}` : ''}`);
  },
  updateProfile: (data) => request(`${TRAVELLER_BASE}/profile`, { method: "PUT", body: JSON.stringify(data) }),
  getSettings: () => request(`${TRAVELLER_BASE}/settings`),
};
