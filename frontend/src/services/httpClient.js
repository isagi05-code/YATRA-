export const AGENCY_BASE = "http://localhost:8000";
export const TRAVELLER_BASE = "http://localhost:8001";
export const ADMIN_BASE = "http://localhost:8002";
export const AUTH_BASE = "http://localhost:8003";

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
