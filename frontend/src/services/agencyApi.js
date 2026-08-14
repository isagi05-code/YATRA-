import { AGENCY_BASE, request } from './httpClient';

export const agencyApi = {
  getSummary: () => request(`${AGENCY_BASE}/dashboard/summary`),
  getGraphs: () => request(`${AGENCY_BASE}/dashboard/graphs`),
  getTours: (status) => {
    const p = new URLSearchParams();
    if (status) p.append("status", status);
    const qs = p.toString();
    return request(`${AGENCY_BASE}/tours${qs ? `?${qs}` : ''}`);
  },
  createTour: (data) => request(`${AGENCY_BASE}/tours`, { method: "POST", body: JSON.stringify(data) }),
  getTour: (id) => request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}`),
  updateTour: (id, status, timeline_status) => {
    const p = new URLSearchParams();
    if (status) p.append("status", status);
    if (timeline_status) p.append("timeline_status", timeline_status);
    return request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}?${p.toString()}`, { method: "PUT" });
  },
  deleteTour: (id) => request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getJourney: (id) => request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/journey`),
  updateJourney: (id, lat, lng) => {
    const p = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    return request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/journey?${p.toString()}`, { method: "PUT" });
  },
  getDayWiseExpenses: (id) => request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/day-wise-expenses`),
  assignVehicle: (id, vehicleNum) => {
    const p = new URLSearchParams({ vehicle_number: vehicleNum });
    return request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/vehicle-assignment?${p.toString()}`, { method: "PUT" });
  },
  assignDriver: (id, driverId) => {
    const p = new URLSearchParams({ driver_id: String(driverId) });
    return request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/driver-assignment?${p.toString()}`, { method: "PUT" });
  },
  getTimeline: (id) => request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/timeline`),
  addTimelineEvent: (id, name, status, date) => {
    const p = new URLSearchParams({ event_name: name, status, updated_at: date });
    return request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/timeline?${p.toString()}`, { method: "POST" });
  },
  getAnalytics: (id) => request(`${AGENCY_BASE}/tours/${encodeURIComponent(id)}/analytics`),
  getExpenses: (cat, status, q) => {
    const p = new URLSearchParams();
    if (cat) p.append("category", cat);
    if (status) p.append("status", status);
    if (q) p.append("search", q);
    const qs = p.toString();
    return request(`${AGENCY_BASE}/expenses${qs ? `?${qs}` : ''}`);
  },
  createExpense: (data) => request(`${AGENCY_BASE}/expenses`, { method: "POST", body: JSON.stringify(data) }),
  getExpense: (id) => request(`${AGENCY_BASE}/expenses/${encodeURIComponent(id)}`),
  updateExpense: (id, status) => {
    const p = new URLSearchParams();
    if (status) p.append("status", status);
    return request(`${AGENCY_BASE}/expenses/${encodeURIComponent(id)}?${p.toString()}`, { method: "PUT" });
  },
  deleteExpense: (id) => request(`${AGENCY_BASE}/expenses/${encodeURIComponent(id)}`, { method: "DELETE" }),
  ocrReceipt: (imageOrFile) => {
    if (typeof FormData !== 'undefined' && imageOrFile instanceof FormData) {
      return request(`${AGENCY_BASE}/expenses/ocr`, { method: "POST", body: imageOrFile });
    }
    return request(`${AGENCY_BASE}/expenses/ocr?receipt_image=${encodeURIComponent(imageOrFile || '')}`, { method: "POST" });
  },
  getVehicles: () => request(`${AGENCY_BASE}/vehicles`),
  createVehicle: (data) => request(`${AGENCY_BASE}/vehicles`, { method: "POST", body: JSON.stringify(data) }),
  getVehicle: (num) => request(`${AGENCY_BASE}/vehicles/${encodeURIComponent(num)}`),
  updateVehicle: (num, avail, loc) => {
    const p = new URLSearchParams({ availability: avail, current_location: loc });
    return request(`${AGENCY_BASE}/vehicles/${encodeURIComponent(num)}?${p.toString()}`, { method: "PUT" });
  },
  deleteVehicle: (num) => request(`${AGENCY_BASE}/vehicles/${encodeURIComponent(num)}`, { method: "DELETE" }),
  getDrivers: () => request(`${AGENCY_BASE}/drivers`),
  createDriver: (data) => request(`${AGENCY_BASE}/drivers`, { method: "POST", body: JSON.stringify(data) }),
  deleteDriver: (id) => request(`${AGENCY_BASE}/drivers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getDriver: (id) => request(`${AGENCY_BASE}/drivers/${encodeURIComponent(id)}`),
  getCustomers: () => request(`${AGENCY_BASE}/customers`),
  getCustomer: (id) => request(`${AGENCY_BASE}/customers/${encodeURIComponent(id)}`),
  generateItinerary: (dest, days, budget) => {
    const p = new URLSearchParams({ destination: dest, days: String(days) });
    if (budget) p.append("budget", String(budget));
    return request(`${AGENCY_BASE}/ai-itinerary?${p.toString()}`, { method: "POST" });
  },
  getInvoices: () => request(`${AGENCY_BASE}/invoices`),
  getInvoice: (id, day) => {
    const p = new URLSearchParams();
    if (day) p.append("day", day);
    const qs = p.toString();
    return request(`${AGENCY_BASE}/invoices/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`);
  },
  downloadInvoice: (id) => request(`${AGENCY_BASE}/invoices/download/${encodeURIComponent(id)}`),
  getReports: (type) => request(`${AGENCY_BASE}/reports?report_type=${encodeURIComponent(type)}`),
  getNotifications: (unread) => {
    const p = new URLSearchParams();
    if (unread) p.append("unread_only", "true");
    const qs = p.toString();
    return request(`${AGENCY_BASE}/notifications${qs ? `?${qs}` : ''}`);
  },
  markNotificationRead: (id) => request(`${AGENCY_BASE}/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" }),
  getSettings: () => request(`${AGENCY_BASE}/settings`),
  updateSetting: (key, val) => request(`${AGENCY_BASE}/settings/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value: val }) }),
};
