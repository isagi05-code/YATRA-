import React from 'react';
import * as Icons from 'lucide-react';

export function LoginModal({
  showModal,
  setShowModal,
  modalMode,
  setModalMode,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  otp,
  setOtp,
  otpSent,
  loading,
  error,
  otpNotification,
  handleSendOtp,
  handleVerifyOtp,
  getActiveRole,
}) {
  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.8)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0d131f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '460px',
        padding: '36px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={() => setShowModal(false)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer'
          }}
        >
          <Icons.X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(217,119,6,0.15)',
            color: 'var(--primary)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '12px'
          }}>
            <Icons.ShieldCheck size={14} />
            {getActiveRole().toUpperCase()} PORTAL
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'white' }}>
            {modalMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            {modalMode === 'login'
              ? 'Enter your registered email or ID to sign in.'
              : 'Register your account to access portal features.'}
          </p>
        </div>

        {/* Toggle Mode */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setModalMode('login')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: modalMode === 'login' ? 'var(--primary)' : 'transparent',
              color: modalMode === 'login' ? '#000' : 'rgba(255,255,255,0.7)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            onClick={() => setModalMode('register')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: modalMode === 'register' ? 'var(--primary)' : 'transparent',
              color: modalMode === 'register' ? '#000' : 'rgba(255,255,255,0.7)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Register
          </button>
        </div>

        {/* Error / Notification */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icons.AlertCircle size={16} />
            {error}
          </div>
        )}

        {otpNotification && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            color: '#34d399',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icons.CheckCircle2 size={16} />
            {otpNotification}
          </div>
        )}

        {/* Step 1: Request OTP */}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {modalMode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Full Name / Organization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Travels or Urva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                {modalMode === 'login' ? 'Email Address or ID (AGY / TRV)' : 'Email Address'}
              </label>
              <input
                type="text"
                required
                placeholder="urva546@gmail.com or AGY-1001"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {modalMode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: '#000',
                fontWeight: 800,
                fontSize: '14px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <Icons.Loader2 className="spin" size={18} />
                  Sending Code...
                </>
              ) : (
                <>
                  Send OTP Code <Icons.ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Verify OTP */
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--primary)',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '6px',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: '#000',
                fontWeight: 800,
                fontSize: '14px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <Icons.Loader2 className="spin" size={18} />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Enter Portal <Icons.ShieldCheck size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
