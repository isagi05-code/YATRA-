import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

// ---------- Add Tour Modal ----------
function AddTourModal({ onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const defaultEnd = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const [form, setForm] = useState({
    destination: '',
    customer: '',
    start_date: today,
    end_date: defaultEnd,
    passengers: '2',
    budget: '',
    driver: '',
    vehicle: '',
    guide: '',
    status: 'Upcoming',
    current_lat: '',
    current_lng: '',
    timeline_status: 'Booking Created',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'start_date' && (!prev.end_date || prev.end_date < value)) {
        const d = new Date(value);
        d.setDate(d.getDate() + 3);
        updated.end_date = d.toISOString().split('T')[0];
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination.trim()) { setError('Destination is required'); return; }
    if (!form.customer.trim()) { setError('Customer name is required'); return; }
    if (!form.start_date) { setError('Start date is required'); return; }
    if (!form.end_date) { setError('End date is required'); return; }
    if (form.end_date < form.start_date) { setError('End date must be after start date'); return; }
    setSaving(true);
    setError('');
    try {
      await api.agency.createTour({
        destination: form.destination.trim(),
        customer: form.customer.trim(),
        agency: '',
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        vehicle: form.vehicle.trim() || null,
        driver: form.driver.trim() || null,
        passengers: parseInt(form.passengers) || 1,
        guide: form.guide.trim() || null,
        budget: parseFloat(form.budget) || 0,
        current_lat: parseFloat(form.current_lat) || 0,
        current_lng: parseFloat(form.current_lng) || 0,
        timeline_status: 'Booking Created',
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create tour');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '620px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A, #2563EB)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: 0 }}>Create New Tour</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '2px 0 0' }}>Add a new tour package to your agency</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer' }}>
            <Icons.X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Destination */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Destination *</label>
            <input type="text" placeholder="e.g. Manali, Kerala Backwaters, Rajasthan Circuit" value={form.destination}
              onChange={e => handleChange('destination', e.target.value)}
              style={inputStyle} />
          </div>

          {/* Customer + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Customer Name *</label>
              <input type="text" placeholder="e.g. Rahul Sharma" value={form.customer}
                onChange={e => handleChange('customer', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Status</label>
              <select value={form.status} onChange={e => handleChange('status', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="Upcoming">Upcoming</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Start Date *</label>
              <input type="date" value={form.start_date}
                onChange={e => handleChange('start_date', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>End Date *</label>
              <input type="date" value={form.end_date} min={form.start_date}
                onChange={e => handleChange('end_date', e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* Passengers + Budget */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Passengers</label>
              <input type="number" min="1" placeholder="e.g. 8" value={form.passengers}
                onChange={e => handleChange('passengers', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Budget (₹)</label>
              <input type="number" min="0" placeholder="e.g. 45000" value={form.budget}
                onChange={e => handleChange('budget', e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* Driver + Vehicle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Driver Name <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
              <input type="text" placeholder="e.g. Vikram Singh" value={form.driver}
                onChange={e => handleChange('driver', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Vehicle Number <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
              <input type="text" placeholder="e.g. MH-01-AB-1234" value={form.vehicle}
                onChange={e => handleChange('vehicle', e.target.value.toUpperCase())}
                style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
          </div>

          {/* Guide */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Tour Guide <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <input type="text" placeholder="e.g. Ananya Sen" value={form.guide}
              onChange={e => handleChange('guide', e.target.value)}
              style={inputStyle} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '6px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '11px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', background: saving ? '#93C5FD' : '#2563EB', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saving ? <><Icons.Loader className="animate-spin" size={14} /> Creating...</> : <><Icons.Map size={14} /> Create Tour</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function ToursPage({ onSelectTour }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadTours = () => {
    setLoading(true);
    api.agency.getTours()
      .then((data) => {
        setTours(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load tours', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTours();
  }, []);

  // Filter tours
  const filteredTours = tours.filter(tour => {
    const matchesStatus = statusFilter === 'All Status' || tour.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = tour.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tour.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tour.driver && tour.driver.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading tours registry...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {showModal && (
        <AddTourModal
          onClose={() => setShowModal(false)}
          onSaved={loadTours}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Tour Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Plan, track, and manage travel routes and itineraries.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> New Tour
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: '200px' }}>
          <Icons.Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by destination, customer, driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 12px 6px 30px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Upcoming</option>
          <option>Completed</option>
        </select>
      </div>

      {/* Tours Grid */}
      {tours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <Icons.Map size={48} style={{ margin: '0 auto 16px', opacity: 0.25, display: 'block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No tours created yet</h3>
          <p style={{ fontSize: '13px', marginBottom: '20px' }}>Create your first tour to start managing your travel operations.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Plus size={14} /> Create First Tour
          </button>
        </div>
      ) : filteredTours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'white', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <Icons.Search size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px', display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No tours match your search or filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredTours.map(tour => {
            const isCompleted = tour.status === 'Completed';
            const isActive = tour.status === 'Active';
            const progress = isCompleted ? '100%' : isActive ? '65%' : '0%';
            const bgGradient = isCompleted
              ? 'linear-gradient(135deg,#1e1b4b,#4338ca,#818cf8)'
              : isActive
                ? 'linear-gradient(135deg,#1e3a5f,#2563EB,#60a5fa)'
                : 'linear-gradient(135deg,#064e3b,#10B981,#34d399)';

            return (
              <div
                key={tour.trip_id}
                onClick={() => onSelectTour(tour.trip_id)}
                className="tour-card"
                style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ background: bgGradient, height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '48px', opacity: 0.25 }}>🧭</span>
                  <span className={`badge ${tour.status === 'Active' ? 'green' : tour.status === 'Upcoming' ? 'orange' : 'blue'}`} style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    {tour.status}
                  </span>
                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px' }}>
                    {tour.passengers} Pax
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{tour.destination}</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Client: {tour.customer}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Departure</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{tour.start_date}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Budget / Driver</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ₹{(tour.budget / 1000).toFixed(0)}k · {tour.driver || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  <div className="progress-bar" style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                    <div className="progress-fill" style={{ width: progress, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>{progress} Completed</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
