const AGENCY_BASE = "http://localhost:8000";
const TRAVELLER_BASE = "http://localhost:8001";
const ADMIN_BASE = "http://localhost:8002";
const AUTH_BASE = "http://localhost:8003";

function getAuthToken() {
  try {
    return localStorage.getItem('yatra_access_token') || null;
  } catch { return null; }
}

async function request(url, options = {}) {
  const token = getAuthToken();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.detail) msg = parsed.detail;
      else if (parsed.message) msg = parsed.message;
    } catch (e) {}
    throw new Error(msg || `HTTP Error ${res.status}`);
  }
  return res.json();
}

// --- Helpers to get logged-in IDs ---
function getAgencyId() {
  try {
    const userStr = localStorage.getItem('yatra_user') || localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.agency_id || user.id || null;
  } catch { return null; }
}

function getUserId() {
  try {
    const userStr = localStorage.getItem('yatra_user') || localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.user_id || user.id || null;
  } catch { return null; }
}

export const api = {
  // --- AGENCY API (Port 8000) ---
  agency: {
    getSummary: () => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/dashboard/summary${aid ? `?agency_id=${aid}` : ''}`);
    },
    getGraphs: () => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/dashboard/graphs${aid ? `?agency_id=${aid}` : ''}`);
    },
    getTours: (status) => {
      const aid = getAgencyId();
      const p = new URLSearchParams();
      if (status) p.append("status", status);
      if (aid) p.append("agency_id", aid);
      return request(`${AGENCY_BASE}/tours?${p.toString()}`);
    },
    createTour: (data) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours${aid ? `?agency_id=${aid}` : ''}`, { method: "POST", body: JSON.stringify(data) });
    },
    getTour: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}${aid ? `?agency_id=${aid}` : ''}`);
    },
    updateTour: (id, status, timeline_status) => {
      const aid = getAgencyId();
      let url = `${AGENCY_BASE}/tours/${id}?status=${status}`;
      if (aid) url += `&agency_id=${aid}`;
      if (timeline_status) url += `&timeline_status=${timeline_status}`;
      return request(url, { method: "PUT" });
    },
    deleteTour: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}${aid ? `?agency_id=${aid}` : ''}`, { method: "DELETE" });
    },
    getJourney: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/journey${aid ? `?agency_id=${aid}` : ''}`);
    },
    updateJourney: (id, lat, lng) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/journey?lat=${lat}&lng=${lng}${aid ? `&agency_id=${aid}` : ''}`, { method: "PUT" });
    },
    getDayWiseExpenses: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/day-wise-expenses${aid ? `?agency_id=${aid}` : ''}`);
    },
    assignVehicle: (id, vehicleNum) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/vehicle-assignment?vehicle_number=${vehicleNum}${aid ? `&agency_id=${aid}` : ''}`, { method: "PUT" });
    },
    assignDriver: (id, driverId) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/driver-assignment?driver_id=${driverId}${aid ? `&agency_id=${aid}` : ''}`, { method: "PUT" });
    },
    getTimeline: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/timeline${aid ? `?agency_id=${aid}` : ''}`);
    },
    addTimelineEvent: (id, name, status, date) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/timeline?event_name=${name}&status=${status}&updated_at=${date}${aid ? `&agency_id=${aid}` : ''}`, { method: "POST" });
    },
    getAnalytics: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/tours/${id}/analytics${aid ? `?agency_id=${aid}` : ''}`);
    },
    
    getExpenses: (cat, status, q) => {
      const aid = getAgencyId();
      const p = new URLSearchParams();
      if (cat) p.append("category", cat);
      if (status) p.append("status", status);
      if (q) p.append("search", q);
      if (aid) p.append("agency_id", aid);
      return request(`${AGENCY_BASE}/expenses?${p.toString()}`);
    },
    createExpense: (data) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/expenses${aid ? `?agency_id=${aid}` : ''}`, { method: "POST", body: JSON.stringify(data) });
    },
    getExpense: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/expenses/${id}${aid ? `?agency_id=${aid}` : ''}`);
    },
    updateExpense: (id, status, approved_by) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/expenses/${id}?status=${status}&approved_by=${approved_by}${aid ? `&agency_id=${aid}` : ''}`, { method: "PUT" });
    },
    deleteExpense: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/expenses/${id}${aid ? `?agency_id=${aid}` : ''}`, { method: "DELETE" });
    },
    ocrReceipt: (imageName) => request(`${AGENCY_BASE}/expenses/ocr?receipt_image=${imageName}`, { method: "POST" }),
    
    getVehicles: () => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/vehicles${aid ? `?agency_id=${aid}` : ''}`);
    },
    createVehicle: (data) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/vehicles${aid ? `?agency_id=${aid}` : ''}`, { method: "POST", body: JSON.stringify(data) });
    },
    getVehicle: (num) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/vehicles/${num}${aid ? `?agency_id=${aid}` : ''}`);
    },
    updateVehicle: (num, avail, loc) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/vehicles/${num}?availability=${avail}&current_location=${loc}${aid ? `&agency_id=${aid}` : ''}`, { method: "PUT" });
    },
    deleteVehicle: (num) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/vehicles/${num}${aid ? `?agency_id=${aid}` : ''}`, { method: "DELETE" });
    },
    
    getDrivers: () => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/drivers${aid ? `?agency_id=${aid}` : ''}`);
    },
    createDriver: (data) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/drivers${aid ? `?agency_id=${aid}` : ''}`, { method: "POST", body: JSON.stringify(data) });
    },
    deleteDriver: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/drivers/${id}${aid ? `?agency_id=${aid}` : ''}`, { method: "DELETE" });
    },
    getDriver: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/drivers/${id}${aid ? `?agency_id=${aid}` : ''}`);
    },
    
    getCustomers: () => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/customers${aid ? `?agency_id=${aid}` : ''}`);
    },
    getCustomer: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/customers/${id}${aid ? `?agency_id=${aid}` : ''}`);
    },
    
    generateItinerary: (dest, days, budget) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/ai-itinerary?destination=${dest}&days=${days}&budget=${budget}${aid ? `&agency_id=${aid}` : ''}`, { method: "POST" });
    },
    
    getInvoices: () => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/invoices${aid ? `?agency_id=${aid}` : ''}`);
    },
    getInvoice: (id, day) => {
      const aid = getAgencyId();
      let url = `${AGENCY_BASE}/invoices/${id}`;
      const params = new URLSearchParams();
      if (day) params.append("day", day);
      if (aid) params.append("agency_id", aid);
      const queryStr = params.toString();
      return request(`${url}${queryStr ? `?${queryStr}` : ''}`);
    },
    downloadInvoice: (id) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/invoices/download/${id}${aid ? `?agency_id=${aid}` : ''}`);
    },
    
    getReports: (type) => {
      const aid = getAgencyId();
      return request(`${AGENCY_BASE}/reports?report_type=${type}${aid ? `&agency_id=${aid}` : ''}`);
    },
    getNotifications: (unread) => {
      const aid = getAgencyId();
      const p = new URLSearchParams();
      if (unread) p.append("unread_only", "true");
      if (aid) p.append("agency_id", aid);
      return request(`${AGENCY_BASE}/notifications?${p.toString()}`);
    },
    markNotificationRead: (id) => request(`${AGENCY_BASE}/notifications/${id}/read`, { method: "PUT" }),
    getSettings: () => request(`${AGENCY_BASE}/settings`),
    updateSetting: (key, val) => request(`${AGENCY_BASE}/settings/${key}`, { method: "PUT", body: JSON.stringify({ value: val }) }),
  },

  // --- TRAVELLER API (Port 8001) ---
  traveller: {
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
  },

  // --- PLATFORM SUPER ADMIN API (Port 8002) ---
  admin: {
    getSummary: () => request(`${ADMIN_BASE}/dashboard/summary`),
    getAgencies: () => request(`${ADMIN_BASE}/agencies`),
    getAgency: (id) => request(`${ADMIN_BASE}/agencies/${id}`),
    updateAgency: (id, status, subStatus) => request(`${ADMIN_BASE}/agencies/${id}`, { method: "PUT", body: JSON.stringify({ status, subscription_status: subStatus }) }),
    getTravellers: () => request(`${ADMIN_BASE}/travellers`),
    getTraveller: (id) => request(`${ADMIN_BASE}/travellers/${id}`),
    getPayments: () => request(`${ADMIN_BASE}/payments`),
    getSubscriptions: () => request(`${ADMIN_BASE}/subscriptions`),
    getAnalytics: () => request(`${ADMIN_BASE}/analytics`),
    getTickets: () => request(`${ADMIN_BASE}/support/tickets`),
    updateTicket: (id, status) => request(`${ADMIN_BASE}/support/tickets/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
    getSettings: () => request(`${ADMIN_BASE}/settings`),
    getHealth: () => request(`${ADMIN_BASE}/health`),
    getAiUsage: () => request(`${ADMIN_BASE}/ai-usage`),
    getLogs: () => request(`${ADMIN_BASE}/logs`),
    getSecurity: () => request(`${ADMIN_BASE}/security`),
    getNotifications: () => request(`${ADMIN_BASE}/notifications`),
    globalSearch: (q, cat) => {
      let url = `${ADMIN_BASE}/search?q=${q}`;
      if (cat) url += `&category=${cat}`;
      return request(url);
    },
  },
  
  // --- AUTH SERVICES (Port 8003 — dedicated Auth API) ---
  auth: {
    sendOtp: (portal, { email, phone, mode, name }) => {
      const portalMap = { agency: 'agency', user: 'traveller', 'yatra-team': 'team' };
      return request(`${AUTH_BASE}/auth/send-otp`, {
        method: "POST",
        body: JSON.stringify({ identifier: email || phone, portal: portalMap[portal] || portal, mode, name })
      });
    },
    verifyOtp: (portal, { email, phone, otp, mode, name }) => {
      const portalMap = { agency: 'agency', user: 'traveller', 'yatra-team': 'team' };
      return request(`${AUTH_BASE}/auth/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ identifier: email || phone, portal: portalMap[portal] || portal, otp, mode, name, phone })
      });
    },
    login: (portal, { email, phone, password }) => {
      const portalMap = { agency: 'agency', user: 'traveller', 'yatra-team': 'team' };
      return request(`${AUTH_BASE}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ identifier: email || phone, portal: portalMap[portal] || portal, password })
      });
    },
    setPassword: (data) => request(`${AUTH_BASE}/auth/set-password`, { method: "POST", body: JSON.stringify(data) }),
    refresh: (token) => request(`${AUTH_BASE}/auth/refresh`, { method: "POST", body: JSON.stringify({ refresh_token: token }) }),
    logout: (token) => request(`${AUTH_BASE}/auth/logout`, { method: "POST", body: JSON.stringify({ refresh_token: token }) }),
    getMe: () => request(`${AUTH_BASE}/auth/me`),
  }
};
