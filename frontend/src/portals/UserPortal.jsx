import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import AiItineraryPage from './AgencyPortal/AiItineraryPage';
import { api } from '../services/api';

const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Taxi', 'Hotels', 'Entertainment', 'Activities', 'Misc'];

function AddExpenseModal({ userId, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: today,
    status: 'Paid',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Description is required'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Valid amount is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.traveller.createExpense({
        user_id: userId,
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        date: form.date,
        category: form.category,
        status: 'Paid',
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #064e3b, #10B981)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: 0 }}>Add Expense</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '2px 0 0' }}>Log a personal travel expense</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer' }}>
            <Icons.X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>
          )}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Description *</label>
            <input type="text" placeholder="e.g. Dinner at hotel, Uber ride..." value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Amount (₹) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Date</label>
            <input type="date" value={form.date}
              onChange={e => handleChange('date', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', background: saving ? '#6EE7B7' : '#10B981', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saving ? <><Icons.Loader className="animate-spin" size={14} /> Saving...</> : <><Icons.Plus size={14} /> Add Expense</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserPortal({ page, onNavigate }) {
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const getLoggedInUserId = () => {
    try {
      const stored = localStorage.getItem('yatra_user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.id || u.user_id || u.email;
      }
    } catch (e) {}
    return 'TRV-1001';
  };

  const userId = getLoggedInUserId();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.traveller.getTrips(undefined, userId),
      api.traveller.getExpenses(undefined, userId),
      api.traveller.getSummary(userId),
      api.traveller.getProfile(userId)
    ])
      .then(([tripsData, expensesData, summaryData, profileData]) => {
        setTrips(tripsData);
        setExpenses(expensesData);
        setSummary(summaryData);
        setProfile(profileData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load traveller data", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // No mock data — expense modal now handles real creation

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={48} style={{ color: '#10B981' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading traveller details...</p>
      </div>
    );
  }

  if (page === 'ai-assistant') {
    return <AiItineraryPage />;
  }

  if (page === 'trips') {
    return (
      <div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>My Trips</h1>
            <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track and manage all your past and upcoming travel itineraries.</p>
          </div>
          <button onClick={() => onNavigate('ai-assistant')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10B981', borderColor: '#10B981' }}>
            <Icons.Sparkles size={14} /> Plan New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <Icons.Map size={48} style={{ margin: '0 auto 16px', opacity: 0.25, display: 'block' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No trips yet</h3>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>Use the AI Assistant to plan and book your first trip.</p>
            <button onClick={() => onNavigate('ai-assistant')} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10B981', borderColor: '#10B981' }}>
              <Icons.Sparkles size={14} /> Plan First Trip
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {trips.map(trip => (
              <div key={trip.id} className="card card-padded" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 120px', gap: '16px', alignItems: 'center', background: 'white' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{trip.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{trip.route}</p>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Departure</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{trip.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Duration / Budget</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{trip.duration} · ₹{trip.budget?.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${trip.status === 'Completed' ? 'green' : 'orange'}`} style={{ padding: '4px 12px', fontSize: '11px' }}>
                    {trip.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (page === 'expenses') {
    return (
      <div className="fade-in">
        {showExpenseModal && (
          <AddExpenseModal
            userId={userId}
            onClose={() => setShowExpenseModal(false)}
            onSaved={loadData}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>My Expenses</h1>
            <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Keep track of your travel spending and reimbursement history.</p>
          </div>
          <button onClick={() => setShowExpenseModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10B981', borderColor: '#10B981' }}>
            <Icons.Plus size={14} /> Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <Icons.Receipt size={48} style={{ margin: '0 auto 16px', opacity: 0.25, display: 'block' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No expenses recorded yet</h3>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>Start logging your travel expenses to track your spending.</p>
            <button onClick={() => setShowExpenseModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10B981', borderColor: '#10B981' }}>
              <Icons.Plus size={14} /> Log First Expense
            </button>
          </div>
        ) : (
          <div className="card" style={{ background: 'white' }}>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td><strong>{exp.title}</strong></td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{exp.date}</td>
                      <td><span className="badge gray">{exp.category}</span></td>
                      <td><strong>₹{exp.amount.toLocaleString()}</strong></td>
                      <td><span className="badge green">{exp.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (page === 'reviews') {
    return (
      <div className="fade-in">
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Reviews & Feedback</h1>
        <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Share reviews of your trips, drivers, and hotels to help improve future tours.</p>
        
        <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', background: 'white' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Leave a Review for Lonavala Trip</h3>
          <div style={{ display: 'flex', gap: '4px', fontSize: '20px', color: '#FCD34D' }}>★★★★★</div>
          <textarea placeholder="Write your review..." style={{ width: '100%', minHeight: '100px', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', fontSize: '13px', resize: 'none', outline: 'none' }}></textarea>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start', background: '#10B981', borderColor: '#10B981' }}>Submit Feedback</button>
        </div>
      </div>
    );
  }

  // Next upcoming trip
  const upcomingTrip = trips.find(t => t.status === 'Confirmed' || t.status === 'Booked') || {};

  return (
    <div className="fade-in">
      {/* Welcome Banner */}
      <div className="traveller-hero" style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #10B981 50%, #34d399 100%)',
        borderRadius: '20px', padding: '36px 40px', color: 'white',
        marginBottom: '24px', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '6px' }}>Welcome back! 👋</div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '28px', fontWeight: 800, marginBottom: '8px', lineHeight: 1 }}>{profile?.name || 'Traveller'}</h1>
          <p style={{ fontSize: '13px', opacity: 0.75 }}>Your next adventure is just around the corner.</p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button onClick={() => onNavigate('trips')} className="btn btn-xl" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontSize: '13px', padding: '10px 20px', borderRadius: '10px' }}>View My Trips</button>
            <button onClick={() => onNavigate('ai-assistant')} className="btn btn-xl" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', color: '#10B981', fontSize: '13px', fontWeight: 700, padding: '10px 20px', borderRadius: '10px' }}>✨ Plan New Trip</button>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '28px', fontWeight: 900 }}>{summary?.trips_count || 0}</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Total Trips</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '28px', fontWeight: 900 }}>{trips.filter(t => t.status !== 'Completed').length}</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Upcoming</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '28px', fontWeight: 900 }}>₹{((summary?.total_spent || 0) / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Spent (Personal)</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        
        {/* Left: Upcoming Trip Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Next Upcoming Trip</div>
            <span className="badge orange">Upcoming</span>
          </div>
          {upcomingTrip.name ? (
            <div className="card-body" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{upcomingTrip.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{upcomingTrip.route}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', margin: '20px 0' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Departure</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{upcomingTrip.date}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Duration</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{upcomingTrip.duration}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Driver / Vehicle</span>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{upcomingTrip.driver} · {upcomingTrip.vehicle?.slice(-4)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div className="avatar sm" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white' }}>
                  {upcomingTrip.driver ? upcomingTrip.driver.split(' ').map(n => n[0]).join('') : 'UA'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{upcomingTrip.driver}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Your Driver is assigned · Active contact</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No upcoming trips booked yet.
            </div>
          )}
        </div>

        {/* Right: AI Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* AI Banner Card */}
          <div onClick={() => onNavigate('ai-assistant')} className="ai-quick-card" style={{
            background: 'linear-gradient(135deg, #1e3a5f, #2563EB)',
            borderRadius: '16px', padding: '24px', color: 'white', cursor: 'pointer',
            transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>✨</div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>AI Travel Assistant</h3>
              <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '16px', lineHeight: 1.5 }}>
                Plan your next trip with AI-powered suggestions and personalized itineraries.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                Ask AI Now <Icons.Send size={12} />
              </div>
            </div>
          </div>

          {/* Last Trip Card */}
          <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'white' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Preferences & Notes</span>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Travel Prefs:</strong> {profile?.preferences || 'Not Configured'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Contact email: {profile?.email} · Phone: {profile?.contact}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
