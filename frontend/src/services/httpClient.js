const API_BASE = "http://localhost:8000";

export const AGENCY_BASE = API_BASE;
export const TRAVELLER_BASE = `${API_BASE}/traveller`;
export const ADMIN_BASE = `${API_BASE}/team`;
export const AUTH_BASE = API_BASE;

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

export async function request(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };
  // Do not set Content-Type for FormData so browser can set boundary
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    ...options,
    headers,
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
