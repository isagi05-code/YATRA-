import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LandingPortal({ onSelectRole }) {
  const { login } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0); // 0: Agency, 1: Traveller, 2: Yatra Team

  const slides = [
    {
      id: 'agency',
      caption: 'Organize, manage, automate',
      title: 'AGENCY PORTAL',
      tagline: 'For Travel Agencies & Operators',
      description: 'The complete software suite for planning tours, managing expenses, tracking drivers, and maintaining fleets with real-time compliance dashboards.',
      badge: 'Best for Operators',
      features: ['Tour & Itinerary builder', 'Driver dispatch & tracking', 'Receipt scanner & billing', 'Invoice & report generator']
    },
    {
      id: 'traveller',
      caption: 'Your personal trip companion',
      title: 'TRAVELLER APP',
      tagline: 'For Individual Travellers & Groups',
      description: 'Your premium personal itinerary vault. Track trip timelines, log travel expenses, view active tours, and generate custom plans using our AI assistant.',
      badge: 'Best for Tourists',
      features: ['Interactive trip timeline', 'Expense ledger & charts', 'AI travel planner', 'Tour review system']
    },
    {
      id: 'team',
      caption: 'Super-admin platform overview',
      title: 'TEAM ADMIN',
      tagline: 'For Yatra Internal Control',
      description: 'Supervisory dashboard designed for platform operations. Check microservice health, review global revenue trends, and manage active travel agencies.',
      badge: 'Internal Operations',
      features: ['Microservice health checks', 'Global revenue reporting', 'Agency verification portal', 'Platform-wide telemetry']
    }
  ];

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // OTP Modal & Form states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpNotification, setOtpNotification] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);

  const getActiveRole = () => {
    if (activeSlide === 0) return 'agency';
    if (activeSlide === 1) return 'user';
    return 'yatra-team';
  };

  const handleOpenAuth = (mode) => {
    setModalMode(mode);
    setError('');
    setOtpNotification('');
    setOtpSent(false);
    setOtp('');
    setName('');
    setPhone('');
    setRegisteredUser(null);
    // Prefill default demo email for easier check
    if (mode === 'login') {
      if (activeSlide === 0) setEmail('ceo@yatratravels.com');
      else if (activeSlide === 1) setEmail('yugal@example.com');
      else setEmail('admin@yatra.ai');
    } else {
      setEmail('');
    }
    setShowModal(true);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid Email Address or Registered ID.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const role = getActiveRole();
      await api.auth.sendOtp(role, {
        email,
        phone: phone || undefined,
        mode: modalMode,
        name: modalMode === 'register' ? name : undefined
      });
      setOtpSent(true);
      setOtpNotification(`OTP sent to ${email}. Check the backend terminal for the code (dev mode).`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const role = getActiveRole();
      const res = await api.auth.verifyOtp(role, {
        email,
        otp,
        mode: modalMode,
        phone: phone || undefined,
        name: modalMode === 'register' ? name : undefined
      });
      // New auth API returns { success: true, user, access_token, refresh_token, agency_id, role, portal }
      if (res.success && res.user) {
        login(res);  // Store tokens + user in AuthContext + localStorage
        if (modalMode === 'register') {
          // After register, auto-navigate to their portal
          setShowModal(false);
          onSelectRole(role);
        } else {
          setShowModal(false);
          onSelectRole(role);
        }
      } else {
        setError('Verification failed. Invalid code.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(rgba(8, 12, 20, 0.45) 0%, rgba(8, 12, 20, 0.85) 100%), url(/ocean_waves_bg.png) center center / cover no-repeat',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* Header Navigation */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 60px',
        zIndex: 10
      }}>
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--primary)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/yatralogo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px' }}>
            Yatra <span style={{ color: 'var(--primary)' }}>AI</span>
          </span>
        </div>

        {/* Center Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button onClick={() => setActiveSlide(0)} style={{ background: 'none', border: 'none', color: activeSlide === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>Agency</button>
          <button onClick={() => setActiveSlide(1)} style={{ background: 'none', border: 'none', color: activeSlide === 1 ? 'var(--primary)' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>Traveller</button>
          <button onClick={() => setActiveSlide(2)} style={{ background: 'none', border: 'none', color: activeSlide === 2 ? 'var(--primary)' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>Team Admin</button>
        </nav>

        {/* Hamburger Toggle */}
        <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <Icons.Menu size={24} />
        </button>
      </header>

      {/* Main Grid Content */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        alignItems: 'center',
        padding: '0 80px',
        position: 'relative',
        zIndex: 5
      }}>
        
        {/* Left Side Content & Interactive Login Card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '580px' }}>
          
          {/* Subheading / Quote */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ width: '18px', height: '1.5px', background: 'var(--primary)' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary-light)' }}>
              {slides[activeSlide].caption}
            </span>
          </div>

          {/* Heading */}
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '42px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '8px' }}>
            {slides[activeSlide].tagline}
          </h2>

          {/* Description */}
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: '32px' }}>
            {slides[activeSlide].description}
          </p>

          {/* Interactive Dynamic Action Card */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px 32px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeSlide === 0 ? <Icons.Building2 size={20} color="var(--primary)" /> : 
                 activeSlide === 1 ? <Icons.Users size={20} color="var(--success)" /> : 
                 <Icons.Shield size={20} color="var(--info)" />}
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {slides[activeSlide].id} Portal Gateway
                </span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                {slides[activeSlide].badge}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '8px 0' }}>
              {slides[activeSlide].features.map((feature, fIdx) => (
                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  <Icons.CheckCircle2 size={13} color="var(--primary)" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginTop: '4px' }}>
              <button 
                onClick={() => handleOpenAuth('login')} 
                className="btn btn-primary" 
                style={{ 
                  padding: '12px', 
                  borderRadius: '10px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  background: activeSlide === 0 ? 'var(--primary)' : activeSlide === 1 ? 'var(--success)' : 'var(--info)',
                  borderColor: activeSlide === 0 ? 'var(--primary)' : activeSlide === 1 ? 'var(--success)' : 'var(--info)',
                  color: '#080C14'
                }}
              >
                Sign in to Dashboard
              </button>
              <button 
                onClick={() => handleOpenAuth('register')} 
                className="btn btn-outline" 
                style={{ 
                  padding: '12px', 
                  borderRadius: '10px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: 'white'
                }}
              >
                Register
              </button>
            </div>
          </div>

        </div>

        {/* Right Side Textured Big Font */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          userSelect: 'none',
          paddingRight: '40px'
        }}>
          {slides[activeSlide].title.split(' ').map((word, wIdx) => (
            <div 
              key={wIdx} 
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '90px',
                fontWeight: 900,
                lineHeight: '80px',
                textAlign: 'right',
                textTransform: 'uppercase',
                backgroundImage: 'url(/ocean_waves_bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'right center',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                letterSpacing: '-2px',
                filter: 'drop-shadow(0px 2px 10px rgba(0,0,0,0.4))'
              }}
            >
              {word}
            </div>
          ))}
        </div>

      </main>

      {/* Footer / Controls Section */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 80px',
        zIndex: 10
      }}>
        {/* Social Icons - Bottom Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="#" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.3s', display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="#" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.3s', display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
          </a>
          <a href="#" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.3s', display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
        </div>

        {/* Pagination & Arrows Slider Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Numbers Indicator */}
          <div style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', color: 'white' }}>0{activeSlide + 1}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>0{slides.length}</span>
          </div>

          {/* Slider Line Indicator */}
          <div style={{ width: '80px', height: '1.5px', background: 'rgba(255,255,255,0.15)', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: `${(activeSlide / slides.length) * 100}%`,
              width: `${100 / slides.length}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}></div>
          </div>

          {/* Nav Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handlePrev}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <Icons.ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNext}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <Icons.ChevronRight size={16} />
            </button>
          </div>
        </div>

      </footer>

      {/* --- PREMIUM GLASSMORPHIC AUTH OTP MODAL --- */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(8, 12, 20, 0.75)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            background: 'rgba(17, 24, 39, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '36px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <Icons.X size={16} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: activeSlide === 0 ? 'rgba(37, 99, 235, 0.15)' : activeSlide === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: activeSlide === 0 ? 'var(--primary)' : activeSlide === 1 ? 'var(--success)' : 'var(--info)',
                marginBottom: '16px'
              }}>
                {modalMode === 'login' ? <Icons.LogIn size={24} /> : <Icons.UserPlus size={24} />}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Poppins', sans-serif" }}>
                {modalMode === 'login' ? 'Portal Log In' : 'Portal Registration'}
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                Access the {slides[activeSlide].id} platform
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: '#FCA5A5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icons.AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Simulated Notification Toast for local PoC */}
            {otpNotification && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: '#A7F3D0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <Icons.MessageSquareCode size={16} />
                  <span>OTP Dispatched!</span>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                  {otpNotification}
                </p>
              </div>
            )}

            {/* Forms or Success Card */}
            {registeredUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10B981', fontWeight: 800, fontSize: '15px' }}>
                    <Icons.CheckCircle2 size={20} />
                    <span>Registration Successful!</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Your unique registered profile has been created in the database.
                  </p>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginTop: '4px',
                    border: '1px dashed rgba(16, 185, 129, 0.5)'
                  }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Assigned Registered ID</span>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#A7F3D0', letterSpacing: '2px', fontFamily: 'monospace' }}>
                      {registeredUser.id || registeredUser.user_id || registeredUser.agency_id}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                    All your travel data, trips, and expenses will be saved under this ID. You can use this ID or your registered email to log in anytime.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowModal(false);
                    onSelectRole(getActiveRole());
                  }}
                  style={{
                    width: '100%',
                    background: activeSlide === 0 ? 'var(--primary)' : activeSlide === 1 ? 'var(--success)' : 'var(--info)',
                    color: '#080C14',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Enter Dashboard Now
                </button>
              </div>
            ) : !otpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {modalMode === 'register' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Yugal Kishor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {modalMode === 'login' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Email Address or User ID / Agency ID</label>
                    <input 
                      type="text" 
                      required
                      placeholder={activeSlide === 0 ? "e.g. AGY-1001 or ceo@yatratravels.com" : "e.g. TRV-1001 or yugal@example.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="e.g. yugal@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          padding: '12px',
                          color: 'white',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Phone Number (Optional)</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. +91 99999 11111"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          padding: '12px',
                          color: 'white',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    background: activeSlide === 0 ? 'var(--primary)' : activeSlide === 1 ? 'var(--success)' : 'var(--info)',
                    color: '#080C14',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px',
                    transition: 'opacity 0.2s',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Generating Code...' : 'Request OTP Verification'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Enter Verification Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required
                    placeholder="******"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 800,
                      textAlign: 'center',
                      letterSpacing: '6px',
                      width: '180px',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2,
                      background: activeSlide === 0 ? 'var(--primary)' : activeSlide === 1 ? 'var(--success)' : 'var(--info)',
                      color: '#080C14',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

