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
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header" style={{ background: '#0F172A', color: '#fff', borderBottom: 'none' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: 800 }}>Add Expense</h2>
            <p style={{ color: '#94A3B8', fontSize: '12px', margin: '2px 0 0' }}>Log a personal travel expense</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px', color: '#fff', cursor: 'pointer' }}>
            <Icons.X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>
          )}
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dinner at hotel, Uber ride..."
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control form-select"
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={form.date}
              onChange={e => handleChange('date', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
              {saving ? <><Icons.Loader size={14} className="spin" /> Saving...</> : <><Icons.Plus size={14} /> Add Expense</>}
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
        setTrips(tripsData || []);
        setExpenses(expensesData || []);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader size={36} style={{ color: '#2563EB', animation: 'ui-spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading traveller workspace...</p>
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
            <h1 className="page-title">My Trips</h1>
            <p className="page-desc">Track and manage all your past and upcoming travel itineraries.</p>
          </div>
          <button onClick={() => onNavigate('ai-assistant')} className="btn btn-primary">
            <Icons.Sparkles size={14} /> Plan New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="card card-padded" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Icons.Map size={48} style={{ margin: '0 auto 16px', opacity: 0.25, display: 'block', color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No trips booked yet</h3>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>Use the AI Assistant to plan and book your first customized journey.</p>
            <button onClick={() => onNavigate('ai-assistant')} className="btn btn-primary">
              <Icons.Sparkles size={14} /> Plan First Trip
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {trips.map(trip => (
              <div key={trip.id} className="card card-padded card-hover" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 120px', gap: '16px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{trip.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{trip.route}</p>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTURE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{trip.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DURATION / BUDGET</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    {trip.duration} · ₹{trip.budget?.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${trip.status === 'Completed' ? 'green' : 'orange'}`}>
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
            <h1 className="page-title">My Expenses</h1>
            <p className="page-desc">Keep track of your travel spending and reimbursement history.</p>
          </div>
          <button onClick={() => setShowExpenseModal(true)} className="btn btn-primary">
            <Icons.Plus size={14} /> Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="card card-padded" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Icons.Receipt size={48} style={{ margin: '0 auto 16px', opacity: 0.25, display: 'block', color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No expenses recorded yet</h3>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>Start logging your travel expenses to track spending in real-time.</p>
            <button onClick={() => setShowExpenseModal(true)} className="btn btn-primary">
              <Icons.Plus size={14} /> Log First Expense
            </button>
          </div>
        ) : (
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
                    <td><span className="badge blue">{exp.category}</span></td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>₹{exp.amount.toLocaleString()}</td>
                    <td><span className="badge green">{exp.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (page === 'reviews') {
    return (
      <div className="fade-in">
        <h1 className="page-title" style={{ marginBottom: '6px' }}>Reviews & Feedback</h1>
        <p className="page-desc" style={{ marginBottom: '24px' }}>Share reviews of your trips, drivers, and fleet to help improve future tours.</p>
        
        <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Leave Feedback for your Recent Journey</h3>
          <div style={{ display: 'flex', gap: '4px', fontSize: '22px', color: '#F59E0B' }}>★★★★★</div>
          <textarea
            className="form-control"
            placeholder="How was your trip experience? Share highlights or areas for improvement..."
            style={{ minHeight: '120px', resize: 'none' }}
          ></textarea>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Submit Feedback</button>
        </div>
      </div>
    );
  }

  // Next upcoming trip
  const upcomingTrip = trips.find(t => t.status === 'Confirmed' || t.status === 'Booked') || {};

  return (
    <div className="fade-in">
      {/* Welcome Banner */}
      <div className="agency-hero" style={{ marginBottom: '24px' }}>
        <div className="agency-hero__content">
          <div className="agency-hero__eyebrow">Welcome back! 👋</div>
          <h1 className="agency-hero__title">{profile?.name || 'Traveller'}</h1>
          <p className="agency-hero__text">Your next adventure is just around the corner.</p>
          <div style={{ marginTop: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('trips')} className="btn btn-secondary">
              View My Trips
            </button>
            <button onClick={() => onNavigate('ai-assistant')} className="btn btn-primary">
              ✨ Plan New Trip
            </button>
          </div>
        </div>

        <div className="agency-hero__metrics">
          <div className="agency-hero__metric">
            <strong>{summary?.trips_count || 0}</strong>
            <span>Total Trips</span>
          </div>
          <div className="agency-hero__metric">
            <strong>{trips.filter(t => t.status !== 'Completed').length}</strong>
            <span>Upcoming</span>
          </div>
          <div className="agency-hero__metric">
            <strong>₹{((summary?.total_spent || 0) / 1000).toFixed(0)}k</strong>
            <span>Spent</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        
        {/* Left: Upcoming Trip Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">Next Upcoming Trip</div>
            <span className="badge orange">Upcoming</span>
          </div>
          {upcomingTrip.name ? (
            <div className="card-body">
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{upcomingTrip.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>{upcomingTrip.route}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', margin: '20px 0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTURE</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{upcomingTrip.date}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DURATION</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{upcomingTrip.duration}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DRIVER / FLEET</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {upcomingTrip.driver} · {upcomingTrip.vehicle?.slice(-4)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div className="avatar sm">
                  {upcomingTrip.driver ? upcomingTrip.driver.split(' ').map(n => n[0]).join('') : 'UA'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{upcomingTrip.driver}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dedicated driver assigned · On schedule</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No upcoming trips booked yet.
            </div>
          )}
        </div>

        {/* Right: AI Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* AI Banner Card */}
          <div
            onClick={() => onNavigate('ai-assistant')}
            className="card card-padded card-hover"
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
              color: '#fff',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              <span className="badge blue">AI Powered</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>AI Travel Assistant</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px', lineHeight: 1.5 }}>
              Generate day-by-day smart itineraries, hotel suggestions, and budget estimates instantly.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60A5FA', fontSize: '13px', fontWeight: 700 }}>
              Launch Assistant <Icons.ArrowRight size={14} />
            </div>
          </div>

          {/* Preferences & Contact */}
          <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Preferences & Account</span>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              <strong>Travel Style:</strong> {profile?.preferences || 'Standard Leisure'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Email: {profile?.email || 'N/A'} · Contact: {profile?.contact || 'N/A'}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
