import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Helper to safely parse localStorage
function safeJsonParse(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeJsonParse('yatra_user'));
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('yatra_access_token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('yatra_refresh_token') || null);

  // Derived values from user object
  const agencyId = user?.agency_id || null;
  const role = user?.role || null;
  const portal = user?.portal || null;
  const permissions = user?.permissions || [];

  /**
   * login() — called after successful OTP verify or password login from auth API.
   * Expects the full API response: { user, agency_id, access_token, refresh_token, role, permissions, portal }
   */
  const login = useCallback((authResponse) => {
    const { user: userData, access_token, refresh_token, agency_id, role: userRole, permissions: perms, portal: userPortal } = authResponse;

    // Merge agency_id, role, permissions, portal into user object for easy access
    const enrichedUser = {
      ...userData,
      agency_id: agency_id || userData?.agency_id,
      role: userRole || userData?.role,
      permissions: perms || userData?.permissions || [],
      portal: userPortal || userData?.portal,
    };

    setUser(enrichedUser);
    setAccessToken(access_token || null);
    setRefreshToken(refresh_token || null);

    // Persist to localStorage
    localStorage.setItem('yatra_user', JSON.stringify(enrichedUser));
    localStorage.setItem('user', JSON.stringify(enrichedUser));  // legacy compatibility
    if (access_token) localStorage.setItem('yatra_access_token', access_token);
    if (refresh_token) localStorage.setItem('yatra_refresh_token', refresh_token);
  }, []);

  /**
   * logout() — clears all auth state and localStorage keys.
   */
  const logout = useCallback(async () => {
    // Optionally call auth API to revoke refresh token
    if (refreshToken) {
      try {
        const token = localStorage.getItem('yatra_access_token');
        await fetch('http://localhost:8003/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (e) {
        console.warn('[Auth] Logout API call failed (non-critical):', e);
      }
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    // Clear all auth-related localStorage keys
    ['yatra_user', 'user', 'yatra_access_token', 'yatra_refresh_token'].forEach(k => localStorage.removeItem(k));
  }, [refreshToken]);

  /**
   * refreshAccessToken() — refreshes JWT access token using refresh token.
   * Called automatically when a request returns 401.
   */
  const refreshAccessToken = useCallback(async () => {
    const rt = localStorage.getItem('yatra_refresh_token');
    if (!rt) return null;
    try {
      const res = await fetch('http://localhost:8003/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) {
        await logout();
        return null;
      }
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem('yatra_access_token', data.access_token);
        return data.access_token;
      }
    } catch (e) {
      console.warn('[Auth] Token refresh failed:', e);
    }
    return null;
  }, [logout]);

  // Sync state if localStorage changes (e.g., another tab logs in)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = safeJsonParse('yatra_user');
      const storedToken = localStorage.getItem('yatra_access_token');
      setUser(storedUser);
      setAccessToken(storedToken || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider value={{
      user,
      agencyId,
      role,
      portal,
      permissions,
      accessToken,
      refreshToken,
      isAuthenticated,
      login,
      logout,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
