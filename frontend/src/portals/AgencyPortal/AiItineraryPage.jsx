import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

export default function AiItineraryPage() {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('7');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!destination.trim()) {
      setError('Please enter a destination.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await api.agency.generateItinerary(
        destination.trim(),
        parseInt(days) || 7,
        parseFloat(budget) || 0
      );
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setSuggestedPrompt = (dest, d, b) => {
    setDestination(dest);
    setDays(String(d));
    setBudget(String(b));
    setResult(null);
    setError('');
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
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC',
            fontSize: '12px', fontWeight: 700,
            padding: '5px 14px', borderRadius: '999px',
            marginBottom: '20px'
          }}>
            <Icons.Sparkles size={12} /> Yatra · Powered by Advanced Intelligence
          </div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '12px', letterSpacing: '-1px' }}>
            Plan Your Perfect Trip with <span style={{ background: 'linear-gradient(90deg, #60A5FA, #A5B4FC, #F0ABFC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Precision</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '600px' }}>
            Enter your destination, trip duration, and budget. Our AI will create a complete day-by-day itinerary.
          </p>

          {/* Input Fields */}
          <div className="prompt-box" style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(8px)'
          }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destination *</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Kedarnath, Rajasthan, Goa..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration (Days)</label>
                <input
                  type="number"
                  min="1" max="30"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 50000"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="prompt-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span onClick={() => setSuggestedPrompt('Kedarnath', 7, 50000)} className="prompt-chip" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer' }}>🕉️ Kedarnath</span>
                <span onClick={() => setSuggestedPrompt('Goa', 5, 30000)} className="prompt-chip" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer' }}>🏖️ Goa Beach</span>
                <span onClick={() => setSuggestedPrompt('Rajasthan', 8, 80000)} className="prompt-chip" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer' }}>🏰 Rajasthan</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="generate-btn"
                style={{
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {loading ? <Icons.Loader size={14} className="animate-spin" /> : <Icons.Sparkles size={14} />}
                {loading ? 'Generating...' : 'Generate Itinerary'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Cards — shown when no result yet */}
      {!result && !loading && (
        <div className="fade-in">
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Popular Templates</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div onClick={() => setSuggestedPrompt('Kedarnath', 7, 50000)} className="card card-padded" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🕉️</div>
              <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Char Dham Yatra</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>7-10 days · Religious · Uttarakhand</p>
            </div>
            <div onClick={() => setSuggestedPrompt('Goa', 5, 30000)} className="card card-padded" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌊</div>
              <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Goa Beach Retreat</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>4-6 days · Leisure · West India</p>
            </div>
            <div onClick={() => setSuggestedPrompt('Rajasthan', 8, 80000)} className="card card-padded" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏰</div>
              <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Royal Rajasthan</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>7-9 days · Heritage · Rajasthan</p>
            </div>
          </div>
        </div>
      )}

      {/* Real AI Result */}
      {result && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
          {/* Day-wise itinerary */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                {result.destination} — {result.days}-Day Itinerary
              </h3>
              <button onClick={() => setResult(null)} className="btn btn-outline btn-sm">New Plan</button>
            </div>

            {(result.itinerary || []).length === 0 ? (
              <div className="card card-padded" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icons.MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>No itinerary details returned. Try a different destination.</p>
              </div>
            ) : (
              (result.itinerary || []).map((day, idx) => (
                <div key={idx} className="day-card" style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'white', overflow: 'hidden', marginBottom: '16px' }}>
                  <div className="day-header" style={{ padding: '14px 20px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', opacity: 0.8 }}>Day {day.day || idx + 1}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{day.title || day.summary || 'Day Plan'}</div>
                    </div>
                    {day.estimated_cost != null && (
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        ₹{Number(day.estimated_cost).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    {(day.activities || []).map((act, ai) => (
                      <div key={ai} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        {act.time && (
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', minWidth: '64px' }}>{act.time}</div>
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{act.name || act.title}</div>
                          {act.description && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{act.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!day.activities || day.activities.length === 0) && day.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{day.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Budget Summary */}
          <div style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
            <div className="card card-padded" style={{ background: 'linear-gradient(135deg, #0F172A, #1e3a5f)', color: 'white' }}>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>AI Budget Estimation</div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#60A5FA', fontFamily: "'Poppins', sans-serif", margin: '4px 0 16px' }}>
                ₹{Number(result.estimated_budget || result.total_budget || 0).toLocaleString('en-IN')}
              </h2>
              {result.budget_breakdown && Object.entries(result.budget_breakdown).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                  <span style={{ opacity: 0.7, textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ fontWeight: 600 }}>₹{Number(val).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {result.notes && (
                <p style={{ fontSize: '11px', marginTop: '16px', opacity: 0.6, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                  {result.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
