const AGENCY_BASE = "http://localhost:8000";
const TRAVELLER_BASE = "http://localhost:8001";
const ADMIN_BASE = "http://localhost:8002";

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // --- AGENCY API (Port 8000) ---
  agency: {
    getSummary: () => request(`${AGENCY_BASE}/dashboard/summary`),
    getGraphs: () => request(`${AGENCY_BASE}/dashboard/graphs`),
    getTours: (status) => request(`${AGENCY_BASE}/tours${status ? `?status=${status}` : ""}`),
    createTour: (data) => request(`${AGENCY_BASE}/tours`, { method: "POST", body: JSON.stringify(data) }),
    getTour: (id) => request(`${AGENCY_BASE}/tours/${id}`),
    updateTour: (id, status, timeline_status) => {
      let url = `${AGENCY_BASE}/tours/${id}?status=${status}`;
      if (timeline_status) url += `&timeline_status=${timeline_status}`;
      return request(url, { method: "PUT" });
    },
    deleteTour: (id) => request(`${AGENCY_BASE}/tours/${id}`, { method: "DELETE" }),
    getJourney: (id) => request(`${AGENCY_BASE}/tours/${id}/journey`),
    updateJourney: (id, lat, lng) => request(`${AGENCY_BASE}/tours/${id}/journey?lat=${lat}&lng=${lng}`, { method: "PUT" }),
    getDayWiseExpenses: (id) => request(`${AGENCY_BASE}/tours/${id}/day-wise-expenses`),
    assignVehicle: (id, vehicleNum) => request(`${AGENCY_BASE}/tours/${id}/vehicle-assignment?vehicle_number=${vehicleNum}`, { method: "PUT" }),
    assignDriver: (id, driverId) => request(`${AGENCY_BASE}/tours/${id}/driver-assignment?driver_id=${driverId}`, { method: "PUT" }),
    getTimeline: (id) => request(`${AGENCY_BASE}/tours/${id}/timeline`),
    addTimelineEvent: (id, name, status, date) => request(`${AGENCY_BASE}/tours/${id}/timeline?event_name=${name}&status=${status}&updated_at=${date}`, { method: "POST" }),
    getAnalytics: (id) => request(`${AGENCY_BASE}/tours/${id}/analytics`),
    
    getExpenses: (cat, status, q) => {
      const p = new URLSearchParams();
      if (cat) p.append("category", cat);
      if (status) p.append("status", status);
      if (q) p.append("search", q);
      return request(`${AGENCY_BASE}/expenses?${p.toString()}`);
    },
    createExpense: (data) => request(`${AGENCY_BASE}/expenses`, { method: "POST", body: JSON.stringify(data) }),
    getExpense: (id) => request(`${AGENCY_BASE}/expenses/${id}`),
    updateExpense: (id, status, approved_by) => request(`${AGENCY_BASE}/expenses/${id}?status=${status}&approved_by=${approved_by}`, { method: "PUT" }),
    deleteExpense: (id) => request(`${AGENCY_BASE}/expenses/${id}`, { method: "DELETE" }),
    ocrReceipt: (imageName) => request(`${AGENCY_BASE}/expenses/ocr?receipt_image=${imageName}`, { method: "POST" }),
    
    getVehicles: () => request(`${AGENCY_BASE}/vehicles`),
    createVehicle: (data) => request(`${AGENCY_BASE}/vehicles`, { method: "POST", body: JSON.stringify(data) }),
    getVehicle: (num) => request(`${AGENCY_BASE}/vehicles/${num}`),
    updateVehicle: (num, avail, loc) => request(`${AGENCY_BASE}/vehicles/${num}?availability=${avail}&current_location=${loc}`, { method: "PUT" }),
    deleteVehicle: (num) => request(`${AGENCY_BASE}/vehicles/${num}`, { method: "DELETE" }),
    
    getDrivers: () => request(`${AGENCY_BASE}/drivers`),
    createDriver: (data) => request(`${AGENCY_BASE}/drivers`, { method: "POST", body: JSON.stringify(data) }),
    getDriver: (id) => request(`${AGENCY_BASE}/drivers/${id}`),
    
    getCustomers: () => request(`${AGENCY_BASE}/customers`),
    getCustomer: (id) => request(`${AGENCY_BASE}/customers/${id}`),
    
    generateItinerary: (dest, days, budget) => request(`${AGENCY_BASE}/ai-itinerary?destination=${dest}&days=${days}&budget=${budget}`, { method: "POST" }),
    
    getInvoices: () => request(`${AGENCY_BASE}/invoices`),
    getInvoice: (id, day) => request(`${AGENCY_BASE}/invoices/${id}${day ? `?day=${day}` : ""}`),
    downloadInvoice: (id) => request(`${AGENCY_BASE}/invoices/download/${id}`),
    
    getReports: (type) => request(`${AGENCY_BASE}/reports?report_type=${type}`),
    getNotifications: (unread) => request(`${AGENCY_BASE}/notifications${unread ? "?unread_only=true" : ""}`),
    markNotificationRead: (id) => request(`${AGENCY_BASE}/notifications/${id}/read`, { method: "PUT" }),
    getSettings: () => request(`${AGENCY_BASE}/settings`),
    updateSetting: (key, val) => request(`${AGENCY_BASE}/settings/${key}`, { method: "PUT", body: JSON.stringify({ value: val }) }),
  },

  // --- TRAVELLER API (Port 8001) ---
  traveller: {
    getSummary: () => request(`${TRAVELLER_BASE}/dashboard/summary`),
    getTrips: (status) => request(`${TRAVELLER_BASE}/trips${status ? `?status=${status}` : ""}`),
    createTrip: (data) => request(`${TRAVELLER_BASE}/trips`, { method: "POST", body: JSON.stringify(data) }),
    getTrip: (id) => request(`${TRAVELLER_BASE}/trips/${id}`),
    getExpenses: (cat) => request(`${TRAVELLER_BASE}/expenses${cat ? `?category=${cat}` : ""}`),
    createExpense: (data) => request(`${TRAVELLER_BASE}/expenses`, { method: "POST", body: JSON.stringify(data) }),
    deleteExpense: (id) => request(`${TRAVELLER_BASE}/expenses/${id}`, { method: "DELETE" }),
    getExpensesAnalytics: () => request(`${TRAVELLER_BASE}/expenses/analytics`),
    getBookings: () => request(`${TRAVELLER_BASE}/bookings`),
    createBooking: (data) => request(`${TRAVELLER_BASE}/bookings`, { method: "POST", body: JSON.stringify(data) }),
    getDocuments: () => request(`${TRAVELLER_BASE}/documents`),
    uploadDocument: (data) => request(`${TRAVELLER_BASE}/documents`, { method: "POST", body: JSON.stringify(data) }),
    getProfile: () => request(`${TRAVELLER_BASE}/profile`),
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
};
