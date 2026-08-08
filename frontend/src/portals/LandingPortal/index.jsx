import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoginModal } from './LoginModal';
import { HeroSection } from './HeroSection';

export default function LandingPortal({ onSelectRole }) {
  const { login } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);

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

  const handleNext = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const handlePrev = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // OTP Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpNotification, setOtpNotification] = useState('');

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
    if (mode === 'login') {
      setEmail('urva546@gmail.com');
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
      setOtpNotification(`Verification code sent! Check your inbox for the OTP.`);
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
      if (res.success && res.user) {
        login(res);
        setShowModal(false);
        onSelectRole(role);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--primary)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/yatralogo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px' }}>
            Yatra
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button onClick={() => setActiveSlide(0)} style={{ background: 'none', border: 'none', color: activeSlide === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>Agency</button>
          <button onClick={() => setActiveSlide(1)} style={{ background: 'none', border: 'none', color: activeSlide === 1 ? 'var(--primary)' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>Traveller</button>
          <button onClick={() => setActiveSlide(2)} style={{ background: 'none', border: 'none', color: activeSlide === 2 ? 'var(--primary)' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>Team Admin</button>
        </nav>

        <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <Icons.Menu size={24} />
        </button>
      </header>

      {/* Hero Section */}
      <HeroSection
        slides={slides}
        activeSlide={activeSlide}
        handleNext={handleNext}
        handlePrev={handlePrev}
        handleOpenAuth={handleOpenAuth}
        onSelectRole={onSelectRole}
        getActiveRole={getActiveRole}
      />

      {/* Login Modal */}
      <LoginModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        setModalMode={setModalMode}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        otp={otp}
        setOtp={setOtp}
        otpSent={otpSent}
        loading={loading}
        error={error}
        otpNotification={otpNotification}
        handleSendOtp={handleSendOtp}
        handleVerifyOtp={handleVerifyOtp}
        getActiveRole={getActiveRole}
      />
    </div>
  );
}
