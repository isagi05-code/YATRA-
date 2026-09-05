import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { LoginModal } from './LoginModal';
import { HeroSection } from './HeroSection';
import GradientWaves from '../../components/ui/GradientWaves';

export default function LandingPortal({ onSelectRole }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showModal, setShowModal]     = useState(false);

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
      id: 'team',
      caption: 'Super-admin platform overview',
      title: 'TEAM ADMIN',
      tagline: 'For VittAro Internal Control',
      description: 'Supervisory dashboard designed for platform operations. Check microservice health, review global revenue trends, and manage active travel agencies.',
      badge: 'Internal Operations',
      features: ['Microservice health checks', 'Global revenue reporting', 'Agency verification portal', 'Platform-wide telemetry']
    }
  ];

  const handleNext = () => setActiveSlide((p) => (p + 1) % slides.length);
  const handlePrev = () => setActiveSlide((p) => (p - 1 + slides.length) % slides.length);

  const getActiveRole = () => {
    if (activeSlide === 0) return 'agency';
    return 'yatra-team';
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0a0f1d',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Live WebGL Gradient Waves Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'auto'
      }}>
        <GradientWaves
          horizonColor="#0a0f1d"
          waveColor="#2E4CBC"
          crestColor="#4B65D4"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={0.9}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.04}
        />
      </div>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--primary)', background: 'rgba(255,255,255,0.05)' }}>
            <img src="/yatralogo.jpg" alt="VittAro Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.5px' }}>VittAro</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Agency', 'Team Admin'].map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveSlide(i)}
              style={{
                background: 'none', border: 'none',
                color: activeSlide === i ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                fontSize: '13px', fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.3s'
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Sign-In Button in header */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            backdropFilter: 'blur(10px)', transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <Icons.LogIn size={16} />
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <HeroSection
        slides={slides}
        activeSlide={activeSlide}
        handleNext={handleNext}
        handlePrev={handlePrev}
        handleOpenAuth={() => setShowModal(true)}
        onSelectRole={onSelectRole}
        getActiveRole={getActiveRole}
      />

      {/* Google Sign-In Modal */}
      <LoginModal
        showModal={showModal}
        setShowModal={setShowModal}
        onSelectRole={onSelectRole}
        getActiveRole={getActiveRole}
        activeSlide={activeSlide}
      />
    </div>
  );
}
