export const AGENCY_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AGENCY_API_BASE) || "http://localhost:8000";
export const TRAVELLER_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TRAVELLER_API_BASE) || "http://localhost:8001";
export const ADMIN_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_API_BASE) || "http://localhost:8002";
export const AUTH_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AUTH_API_BASE) || "http://localhost:8003";

export function getAuthToken() {
  try {
    return localStorage.getItem('yatra_access_token') || null;
  } catch {
    return null;
  }
}

export function getAgencyId() {
  try {
    const userStr = localStorage.getItem('yatra_user') || localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.agency_id || user.id || null;
  } catch {
    return null;
  }
}

export function getUserId() {
  try {
    const userStr = localStorage.getItem('yatra_user') || localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.user_id || user.id || null;
  } catch {
    return null;
  }
}

export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('yatra_refresh_token');
    if (!refreshToken) return null;
    const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      localStorage.removeItem('yatra_access_token');
      localStorage.removeItem('yatra_refresh_token');
      return null;
    }
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('yatra_access_token', data.access_token);
      return data.access_token;
    }
  } catch {
    return null;
  }
  return null;
}

export async function request(url, options = {}) {
  let token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 && !options._retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        "Authorization": `Bearer ${newToken}`,
        ...options.headers,
      };
      res = await fetch(url, {
        ...options,
        _retry: true,
        headers: retryHeaders,
      });
    }
  }

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
