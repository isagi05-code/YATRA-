import { AGENCY_BASE, request, getAgencyId } from './httpClient';

export const agencyApi = {
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
  createExpenseBatch: (expenses) => {
    const aid = getAgencyId();
    return request(`${AGENCY_BASE}/expenses/batch${aid ? `?agency_id=${aid}` : ''}`, {
      method: "POST",
      body: JSON.stringify(expenses)
    });
  },
  batchOcrReceipts: (files) => {
    const aid = getAgencyId();
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });
    return request(`${AGENCY_BASE}/expenses/ocr/batch${aid ? `?agency_id=${aid}` : ''}`, {
      method: "POST",
      body: formData
    });
  },
  ocrReceipt: (file) => {
    const aid = getAgencyId();
    const formData = new FormData();
    formData.append("file", file);
    return request(`${AGENCY_BASE}/expenses/ocr${aid ? `?agency_id=${aid}` : ''}`, {
      method: "POST",
      body: formData
    });
  },
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
    return request(`${AGENCY_BASE}/vehicles/${num}${aid ? `&agency_id=${aid}` : ''}`, { method: "DELETE" });
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
};
