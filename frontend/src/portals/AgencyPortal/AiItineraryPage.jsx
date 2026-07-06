import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export default function AiItineraryPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 1500);
  };

  const setSuggestedPrompt = (text) => {
    setPrompt(text);
  };

  return (
    <div className="fade-in">
      {/* AI Hero */}
      <div className="ai-hero" style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1e3a5f 40%, #312e81 100%)',
        borderRadius: '20px',
        padding: '36px 40px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        color: 'white'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="ai-hero-label" style={{
            display: 'inline-flex', alignBit: 'center', gap: '8px',
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC',
            fontSize: '12px', fontWeight: 700,
            padding: '5px 14px', borderRadius: '999px',
            marginBottom: '20px'
          }}>
            <Icons.Sparkles size={12} /> Yatra AI · Powered by Advanced Intelligence
          </div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '12px', letterSpacing: '-1px' }}>
            Plan Your Perfect Trip with <span style={{ background: 'linear-gradient(90deg, #60A5FA, #A5B4FC, #F0ABFC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Precision</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '600px' }}>
            Describe your dream trip and our AI will create a complete day-by-day itinerary with hotels, restaurants, activities, budget estimates, and route maps.
          </p>

          {/* Prompt Input Box */}
          <div className="prompt-box" style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '16px',
            backdropFilter: 'blur(8px)'
          }}>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your trip... e.g. 'Plan a 7-day spiritual tour for 12 people from Mumbai to Kedarnath...'"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                resize: 'none',
                minHeight: '70px',
                lineHeight: 1.6
              }}
            />
            <div className="prompt-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span onClick={() => setSuggestedPrompt('7-day Kedarnath Yatra from Mumbai')} className="prompt-chip" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer' }}>🕉️ Kedarnath</span>
                <span onClick={() => setSuggestedPrompt('5-day Goa family beach retreat')} className="prompt-chip" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer' }}>🏖️ Goa Beach</span>
                <span onClick={() => setSuggestedPrompt('8-day Royal Rajasthan tour')} className="prompt-chip" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer' }}>🏰 Rajasthan</span>
              </div>
              <button onClick={handleGenerate} className="generate-btn" style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {loading ? <Icons.Loader size={14} className="animate-spin" /> : <Icons.Sparkles size={14} />}
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      {!showResult && (
        <div className="fade-in">
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Popular Templates</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div onClick={() => setSuggestedPrompt('7-day Kedarnath Yatra pilgrimage for 12 pax')} className="card card-padded" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🕉️</div>
              <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Char Dham Yatra</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>7-10 days · Religious · Uttarakhand</p>
            </div>
            <div onClick={() => setSuggestedPrompt('5-day Goa beach retreat for family of 4')} className="card card-padded" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌊</div>
              <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Goa Beach Retreat</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>4-6 days · Leisure · West India</p>
            </div>
            <div onClick={() => setSuggestedPrompt('8-day Royal Rajasthan circuit from Delhi')} className="card card-padded" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏰</div>
              <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Royal Rajasthan</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>7-9 days · Heritage · Rajasthan</p>
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Results */}
      {showResult && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Generated Itinerary Summary</h3>
              <button className="btn btn-outline btn-sm">Save Itinerary</button>
            </div>
            <div className="day-card" style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'white', overflow: 'hidden', marginBottom: '16px' }}>
              <div className="day-header" style={{ padding: '14px 20px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>Day 1</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Mumbai → Nashik (Departure Day)</div>
                </div>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>₹16,120</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>06:00 AM</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Departure from Mumbai</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Assemble at Dadar East · Distribute welcome kits</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>10:00 AM</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Breakfast at Highway Dhaba</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Nashik Highway · Group Thali meal included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="card card-padded" style={{ background: 'linear-gradient(135deg, #0F172A, #1e3a5f)', color: 'white' }}>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>Budget Estimation</div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#60A5FA', fontFamily: "'Poppins', sans-serif", margin: '4px 0 16px' }}>₹2,40,000</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ opacity: 0.7 }}>🏨 Stay</span>
                  <span style={{ fontWeight: 600 }}>₹87,000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ opacity: 0.7 }}>⛽ Fuel</span>
                  <span style={{ fontWeight: 600 }}>₹68,000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ opacity: 0.7 }}>🍽️ Meals</span>
                  <span style={{ fontWeight: 600 }}>₹50,400</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
