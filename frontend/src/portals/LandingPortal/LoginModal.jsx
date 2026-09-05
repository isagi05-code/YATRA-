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
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '440px',
        padding: '36px 32px',
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
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <Icons.X size={16} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            overflow: 'hidden', border: '2px solid #2563EB',
            background: 'rgba(255,255,255,0.04)',
            boxShadow: '0 4px 16px rgba(37,99,235,0.3)'
          }}>
            <img src="/yatralogo.jpg" alt="VittAro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Portal badge */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(37, 99, 235, 0.15)', color: '#60A5FA',
            padding: '4px 14px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
            border: '1px solid rgba(59, 130, 246, 0.25)'
          }}>
            <Icons.ShieldCheck size={12} />
            {portalLabel}
          </span>
        </div>

        {/* Heading */}
        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 800, color: 'white', margin: '12px 0 4px', letterSpacing: '-0.02em' }}>
          Sign in to VittAro
        </h2>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 28px' }}>
          Access your personalized operational workspace.
        </p>

        {/* Portal tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { label: 'Agency', slide: 0, icon: Icons.Building2 },
            { label: 'Traveller', slide: 1, icon: Icons.Compass },
            { label: 'Team', slide: 2, icon: Icons.ShieldCheck },
          ].map(({ label, slide, icon: Icon }) => (
            <div
              key={label}
              style={{
                flex: 1, textAlign: 'center', padding: '10px 4px',
                borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                background: activeSlide === slide ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.04)',
                color: activeSlide === slide ? '#60A5FA' : 'rgba(255,255,255,0.5)',
                border: activeSlide === slide ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.07)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={15} />
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
          </div>
        )}

        {/* Footer note */}
        <p style={{
          textAlign: 'center', marginTop: '20px', fontSize: '11px',
          color: 'rgba(255,255,255,0.35)', lineHeight: '1.5'
        }}>
          Single sign-on protected by VittAro Identity Services.
        </p>
      </div>
    </div>
  );
}
