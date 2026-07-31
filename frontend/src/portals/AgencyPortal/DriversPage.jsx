import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

function AddDriverModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    license: '',
    aadhar: '',
    experience: '',
    contact: '',
    emergency_contact: '',
    current_location: '',
    salary: '',
    ratings: '5.0',
    trips_completed: '0',
    assigned_tour: 'None',
    expense: '0',
    documents: '{}',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Driver name is required'); return; }
    if (!form.license.trim()) { setError('License number is required'); return; }
    if (!form.contact.trim()) { setError('Contact number is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.agency.createDriver({
        name: form.name.trim(),
        license: form.license.trim(),
        aadhar: form.aadhar.trim() || 'Not Provided',
        experience: parseInt(form.experience) || 0,
        contact: form.contact.trim(),
        emergency_contact: form.emergency_contact.trim() || form.contact.trim(),
        current_location: form.current_location.trim() || 'Not Set',
        salary: parseFloat(form.salary) || 0,
        ratings: parseFloat(form.ratings) || 5.0,
        trips_completed: parseInt(form.trips_completed) || 0,
        assigned_tour: 'None',
        expense: 0,
        documents: '{}',
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add driver');
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
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1E293B, #6366F1)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: 0 }}>Add New Driver</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '2px 0 0' }}>Register a driver to your agency fleet</p>
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

          {/* Full Name */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Full Name *</label>
            <input type="text" placeholder="e.g. Vikram Singh" value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              style={inputStyle} />
          </div>

          {/* License + Aadhar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>License Number *</label>
              <input type="text" placeholder="e.g. DL-142018009283" value={form.license}
                onChange={e => handleChange('license', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Aadhar Number</label>
              <input type="text" placeholder="e.g. 1234-5678-9012" value={form.aadhar}
                onChange={e => handleChange('aadhar', e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* Contact + Emergency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Contact Number *</label>
              <input type="tel" placeholder="+91 99999 88888" value={form.contact}
                onChange={e => handleChange('contact', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Emergency Contact</label>
              <input type="tel" placeholder="+91 99999 77777" value={form.emergency_contact}
                onChange={e => handleChange('emergency_contact', e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* Experience + Salary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Experience (years)</label>
              <input type="number" min="0" max="50" placeholder="e.g. 8" value={form.experience}
                onChange={e => handleChange('experience', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Monthly Salary (₹)</label>
              <input type="number" min="0" placeholder="e.g. 22000" value={form.salary}
                onChange={e => handleChange('salary', e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* Current Location */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Current Location</label>
            <input type="text" placeholder="e.g. Mumbai, MH" value={form.current_location}
              onChange={e => handleChange('current_location', e.target.value)}
              style={inputStyle} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '11px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', background: saving ? '#A5B4FC' : '#6366F1', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saving ? <><Icons.Loader className="animate-spin" size={14} /> Saving...</> : <><Icons.UserPlus size={14} /> Register Driver</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadDrivers = () => {
    setLoading(true);
    api.agency.getDrivers()
      .then((data) => {
        setDrivers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load drivers", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleDelete = (driverId, name) => {
    if (!window.confirm(`Remove driver "${name}" from your agency?`)) return;
    api.agency.deleteDriver(driverId)
      .then(() => loadDrivers())
      .catch(err => alert('Failed to delete: ' + err.message));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading drivers registry...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {showModal && (
        <AddDriverModal
          onClose={() => setShowModal(false)}
          onSaved={loadDrivers}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Driver Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage driver profiles, license verification, ratings, and active assignments.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> Add Driver
        </button>
      </div>

      {drivers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <Icons.UserX size={48} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No drivers registered yet</h3>
          <p style={{ fontSize: '13px', marginBottom: '20px' }}>Add your first driver to start managing your fleet</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Plus size={14} /> Register First Driver
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {drivers.map(drv => {
            const isAssigned = drv.assigned_tour && drv.assigned_tour !== 'None';
            const bgGradient = isAssigned 
              ? 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' 
              : 'linear-gradient(135deg,#F1F5F9,#E2E8F0)';
            
            return (
              <div key={drv.driver_id} className="driver-card" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ background: bgGradient, padding: '24px 20px 16px', textAlign: 'center', position: 'relative' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 12px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 }}>
                    {drv.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{drv.name}</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>ID: DRV-00{drv.driver_id} · DL: {drv.license}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#FCD34D' }}>★★★★★</span>
                    <strong>{drv.ratings}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>({drv.trips_completed} trips)</span>
                  </div>
                  <span className={`badge ${isAssigned ? 'green' : 'gray'}`} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {isAssigned ? 'On Tour' : 'Available'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ textAlign: 'center', padding: '10px 0', borderRight: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{drv.trips_completed}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Trips</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 0', borderRight: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{drv.experience} yrs</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Experience</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>₹{(drv.salary / 1000).toFixed(0)}k</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Salary</div>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current Assignment</span>
                    <strong>{drv.assigned_tour}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Location</span>
                    <span>{drv.current_location}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}>
                    📞 {drv.contact}
                  </button>
                  <button
                    onClick={() => handleDelete(drv.driver_id, drv.name)}
                    style={{ padding: '6px 12px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icons.Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
