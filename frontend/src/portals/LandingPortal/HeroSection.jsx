import React from 'react';
import * as Icons from 'lucide-react';

export function HeroSection({
  slides,
  activeSlide,
  handleNext,
  handlePrev,
  handleOpenAuth,
  onSelectRole,
  getActiveRole,
}) {
  const slide = slides[activeSlide];

  return (
    <main style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      alignItems: 'center',
      padding: '0 80px',
      position: 'relative',
      zIndex: 5
    }}>
      {/* Left Column: Copy, Badges & CTA */}
      <div style={{ paddingRight: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '30px',
          background: 'rgba(217, 119, 6, 0.15)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '24px'
        }}>
          <Icons.Sparkles size={14} />
          {slide.badge}
        </div>

        <h1 style={{
          fontSize: '56px',
          fontWeight: 900,
          lineHeight: '1.1',
          margin: '0 0 16px 0',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          textShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          {slide.title}
        </h1>

        <p style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--primary)',
          margin: '0 0 16px 0'
        }}>
          {slide.tagline}
        </p>

        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: 'rgba(255,255,255,0.75)',
          maxWidth: '520px',
          margin: '0 0 32px 0'
        }}>
          {slide.description}
        </p>

        {/* Feature List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          maxWidth: '520px',
          marginBottom: '40px'
        }}>
          {slide.features.map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Icons.Check size={12} />
              </div>
              {feat}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => handleOpenAuth('login')}
            style={{
              padding: '16px 36px',
              borderRadius: '12px',
              background: 'var(--primary)',
              color: '#000',
              fontWeight: 800,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(217, 119, 6, 0.4)',
              transition: 'transform 0.2s, boxShadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            Sign In / Register <Icons.ArrowRight size={18} />
          </button>

          <button
            onClick={() => onSelectRole(getActiveRole())}
            style={{
              padding: '16px 28px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'background 0.2s'
            }}
          >
            Explore Guest Demo
          </button>
        </div>
      </div>

      {/* Right Column: Interactive Carousel Card */}
      <div style={{ position: 'relative' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '36px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              PORTAL 0{activeSlide + 1} / 03
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePrev} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icons.ChevronLeft size={18} />
              </button>
              <button onClick={handleNext} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icons.ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{
            height: '240px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '24px'
          }}>
            {activeSlide === 0 && <Icons.Building2 size={54} color="var(--primary)" style={{ marginBottom: '16px' }} />}
            {activeSlide === 1 && <Icons.UserCheck size={54} color="var(--primary)" style={{ marginBottom: '16px' }} />}
            {activeSlide === 2 && <Icons.ShieldAlert size={54} color="var(--primary)" style={{ marginBottom: '16px' }} />}

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>{slide.caption}</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Click "Sign In / Register" to test real OTP authentication.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
