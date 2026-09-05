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
      tagline: 'For Tour Operators & Fleet Managers',
      description: 'The complete command center for planning custom tours, managing expenses, tracking drivers, and maintaining fleets with real-time analytics.',
      badge: 'For Tour Operators',
      features: ['Tour & Itinerary builder', 'Driver dispatch & tracking', 'Expense scanner & billing', 'Instant invoice generation']
    },
    {
      id: 'traveller',
      caption: 'Your personal trip companion',
      title: 'TRAVELLER APP',
      tagline: 'For Individual Travellers & Groups',
      description: 'Your premium personal travel vault. Track itineraries, log group expenses, view trip details, and generate day-by-day smart plans using our AI assistant.',
      badge: 'For Travellers',
      features: ['Interactive trip timeline', 'Expense ledger & charts', 'AI travel itinerary planner', 'Driver feedback & reviews']
    },
    {
      id: 'team',
      caption: 'Platform mission control',
      title: 'TEAM ADMIN',
      tagline: 'For VittAro Internal Operations',
      description: 'Supervisory dashboard designed for platform operations. Check microservice health, review global revenue trends, and manage verified travel agencies.',
      badge: 'Platform Control',
      features: ['Microservice health checks', 'Global revenue telemetry', 'Agency verification queue', 'System status monitoring']
    }
  ];

  const handleNext = () => setActiveSlide((p) => (p + 1) % slides.length);
  const handlePrev = () => setActiveSlide((p) => (p - 1 + slides.length) % slides.length);

  const getActiveRole = () => {
    if (activeSlide === 0) return 'agency';
    if (activeSlide === 1) return 'user';
    return 'yatra-team';
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0B0F19',
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
          horizonColor="#0B0F19"
          waveColor="#1E3A8A"
          crestColor="#3B82F6"
          speed={0.35}
          amplitude={2.2}
          waveScale={0.65}
          waveRatio={0.9}
          swell={30}
          turbulence={18}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={16}
          detail="medium"
          brightness={1.0}
          opacity={0.85}
          mouseInteraction={true}
          parallaxStrength={0.4}
          grain={true}
          grainIntensity={0.03}
        />
      </div>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', zIndex: 10, maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <img src="/yatralogo.jpg" alt="VittAro Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.5px' }}>VittAro</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
          {['Agency', 'Traveller', 'Team Admin'].map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveSlide(i)}
              style={{
                background: activeSlide === i ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: activeSlide === i ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                color: activeSlide === i ? '#60A5FA' : 'rgba(255,255,255,0.6)',
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px',
                padding: '7px 16px', borderRadius: '20px',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Sign-In Button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(10px)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <Icons.LogIn size={15} />
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
