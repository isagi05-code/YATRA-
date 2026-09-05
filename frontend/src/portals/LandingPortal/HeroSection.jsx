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
      zIndex: 5,
      maxWidth: '1440px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Left Column: Copy, Badges & CTA */}
      <div style={{ paddingRight: '48px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '30px',
          background: 'rgba(37, 99, 235, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#60A5FA',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '20px'
        }}>
          <Icons.Sparkles size={14} />
          {slide.badge}
        </div>

        <h1 style={{
          fontSize: '52px',
          fontWeight: 900,
          lineHeight: '1.1',
          margin: '0 0 14px 0',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '-0.03em',
          color: '#FFFFFF'
        }}>
          {slide.title}
        </h1>

        <p style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#38BDF8',
          margin: '0 0 16px 0'
        }}>
          {slide.tagline}
        </p>

        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: 'rgba(255, 255, 255, 0.72)',
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
          marginBottom: '36px'
        }}>
          {slide.features.map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
                <Icons.Check size={12} strokeWidth={3} />
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
              padding: '14px 32px',
              borderRadius: '10px',
              background: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#1D4ED8'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#2563EB'; }}
          >
            Sign In / Register <Icons.ArrowRight size={16} />
          </button>

          <button
            onClick={() => onSelectRole(getActiveRole())}
            style={{
              padding: '14px 26px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            Explore Guest Demo
          </button>
        </div>
      </div>

      {/* Right Column: Interactive Carousel Card */}
      <div style={{ position: 'relative' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              PORTAL 0{activeSlide + 1} / 03
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrev}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <Icons.ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <Icons.ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{
            height: '240px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9))',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '24px'
          }}>
            {activeSlide === 0 && <Icons.Building2 size={50} color="#60A5FA" style={{ marginBottom: '16px' }} />}
            {activeSlide === 1 && <Icons.Compass size={50} color="#34D399" style={{ marginBottom: '16px' }} />}
            {activeSlide === 2 && <Icons.ShieldCheck size={50} color="#818CF8" style={{ marginBottom: '16px' }} />}

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>{slide.caption}</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Click "Explore Guest Demo" to test live features instantly.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
