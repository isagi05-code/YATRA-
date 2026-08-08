import { AUTH_BASE, request } from './httpClient';

export const authApi = {
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
};
