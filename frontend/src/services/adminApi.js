import { ADMIN_BASE, request } from './httpClient';

export const adminApi = {
  getSummary: () => request(`${ADMIN_BASE}/dashboard/summary`),
  getAgencies: () => request(`${ADMIN_BASE}/agencies`),
  getAgency: (id) => request(`${ADMIN_BASE}/agencies/${encodeURIComponent(id)}`),
  updateAgency: (id, status, subStatus) => request(`${ADMIN_BASE}/agencies/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status, subscription_status: subStatus }) }),
  getTravellers: () => request(`${ADMIN_BASE}/travellers`),
  getTraveller: (id) => request(`${ADMIN_BASE}/travellers/${encodeURIComponent(id)}`),
  getPayments: () => request(`${ADMIN_BASE}/payments`),
  getSubscriptions: () => request(`${ADMIN_BASE}/subscriptions`),
  getAnalytics: () => request(`${ADMIN_BASE}/analytics`),
  getTickets: () => request(`${ADMIN_BASE}/support/tickets`),
  updateTicket: (id, status) => request(`${ADMIN_BASE}/support/tickets/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status }) }),
  getSettings: () => request(`${ADMIN_BASE}/settings`),
  getHealth: () => request(`${ADMIN_BASE}/health`),
  getAiUsage: () => request(`${ADMIN_BASE}/ai-usage`),
  getLogs: () => request(`${ADMIN_BASE}/logs`),
  getSecurity: () => request(`${ADMIN_BASE}/security`),
  getNotifications: () => request(`${ADMIN_BASE}/notifications`),
  globalSearch: (q, cat) => {
    const p = new URLSearchParams({ q });
    if (cat) p.append("category", cat);
    return request(`${ADMIN_BASE}/search?${p.toString()}`);
  },
};
