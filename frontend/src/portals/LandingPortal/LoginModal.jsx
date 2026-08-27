import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function LoginModal({
  showModal,
  setShowModal,
  onSelectRole,
  getActiveRole,
  activeSlide,
}) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  if (!showModal) return null;

  const portalLabels = { agency: 'Agency Portal', user: 'Traveller App', 'yatra-team': 'Team Admin' };
  const role = getActiveRole();
  const portalLabel = portalLabels[role] || role;

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.auth.googleLogin(role, credentialResponse.credential);
      if (res.success && res.user) {
        login(res);
        setSuccess(`Welcome${res.is_new_user ? ' — account created!' : ' back!'}`);
        setTimeout(() => {
          setShowModal(false);
          onSelectRole(role);
        }, 800);
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(14px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0d131f 0%, #111827 100%)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '440px',
        padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
        position: 'relative'
      }}>
        {/* Close */}
        <button
          onClick={() => setShowModal(false)}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.5)',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
        >
          <Icons.X size={16} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            overflow: 'hidden', border: '2px solid var(--primary)',
            background: 'rgba(255,255,255,0.04)'
          }}>
            <img src="/yatralogo.jpg" alt="VittAro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Portal badge */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(217,119,6,0.15)', color: 'var(--primary)',
            padding: '4px 14px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            <Icons.ShieldCheck size={12} />
            {portalLabel}
          </span>
        </div>

        {/* Heading */}
        <h2 style={{ textAlign: 'center', fontSize: '26px', fontWeight: 900, color: 'white', margin: '12px 0 4px' }}>
          Sign in to VittAro
        </h2>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 32px' }}>
          Use your Google account — no password needed.
        </p>

        {/* Portal tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {[
            { label: 'Agency', slide: 0, icon: Icons.Building2 },
            { label: 'Traveller', slide: 1, icon: Icons.UserCheck },
            { label: 'Team', slide: 2, icon: Icons.ShieldAlert },
          ].map(({ label, slide, icon: Icon }) => (
            <div
              key={label}
              style={{
                flex: 1, textAlign: 'center', padding: '8px 4px',
                borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                background: activeSlide === slide ? 'rgba(217,119,6,0.18)' : 'rgba(255,255,255,0.04)',
                color: activeSlide === slide ? 'var(--primary)' : 'rgba(255,255,255,0.45)',
                border: activeSlide === slide ? '1px solid rgba(217,119,6,0.35)' : '1px solid rgba(255,255,255,0.07)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
              }}
            >
              <Icon size={14} />
              {label}
            </div>
          ))}
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
            color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Icons.AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
            color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Icons.CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {/* Google Sign-In Button */}
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px'
          }}>
            <Icons.Loader2 size={20} className="spin" />
            Signing you in...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
            {(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').includes('.apps.googleusercontent.com') ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signin_with_google"
                width="360"
                logo_alignment="left"
              />
            ) : (
              <button
                onClick={() => handleGoogleSuccess({ credential: "mock_demo_google_jwt_token" })}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#1f2937',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  transition: 'transform 0.2s, background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        )}

        {/* Footer note */}
        <p style={{
          textAlign: 'center', marginTop: '24px', fontSize: '11px',
          color: 'rgba(255,255,255,0.3)', lineHeight: '1.5'
        }}>
          By signing in you agree to VittAro's terms. New accounts are auto-created on first sign-in.
        </p>
      </div>
    </div>
  );
}
