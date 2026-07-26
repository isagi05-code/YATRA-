import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid'];

function AddVehicleModal({ onClose, onSaved }) {
  const nextYear = new Date().getFullYear() + 1;
  const [form, setForm] = useState({
    vehicle_number: '',
    model: '',
    owner: '',
    fuel_type: 'Diesel',
    mileage: '',
    current_location: '',
    insurance: `Active (Expires: ${nextYear}-06-30)`,
    permit: `State Permit (Expires: ${nextYear + 1}-01-01)`,
    fitness: 'Valid',
    puc: 'Valid',
    upcoming_maintenance: `${nextYear}-01-15 (General Service)`,
    availability: 'Available',
    service_history: '[]',
    expenses: '0',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validateVehicleNumber = (num) => {
    // Basic Indian vehicle number format: XX-00-XX-0000
    return num.trim().length >= 5;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_number.trim()) { setError('Vehicle number is required'); return; }
    if (!validateVehicleNumber(form.vehicle_number)) { setError('Enter a valid vehicle number'); return; }
    if (!form.model.trim()) { setError('Vehicle model is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.agency.createVehicle({
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        model: form.model.trim(),
        owner: form.owner.trim() || 'Agency Fleet',
        fuel_type: form.fuel_type,
        mileage: parseFloat(form.mileage) || 0,
        current_location: form.current_location.trim() || 'Not Set',
        insurance: form.insurance.trim(),
        permit: form.permit.trim(),
        fitness: form.fitness,
        puc: form.puc,
        upcoming_maintenance: form.upcoming_maintenance.trim(),
        availability: 'Available',
        service_history: '[]',
        expenses: 0,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F766E)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: 0 }}>Register New Vehicle</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '2px 0 0' }}>Add a vehicle to your agency fleet</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer' }}>
            <Icons.X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Vehicle Number + Model */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Vehicle Number *</label>
              <input type="text" placeholder="e.g. MH-01-AB-1234" value={form.vehicle_number}
                onChange={e => handleChange('vehicle_number', e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '1px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Vehicle Model *</label>
              <input type="text" placeholder="e.g. Toyota Innova Crysta" value={form.model}
                onChange={e => handleChange('model', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Owner + Fuel Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Owner Name</label>
              <input type="text" placeholder="e.g. Agency Name / Your Name" value={form.owner}
                onChange={e => handleChange('owner', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Fuel Type</label>
              <select value={form.fuel_type} onChange={e => handleChange('fuel_type', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Mileage + Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Mileage (km/l)</label>
              <input type="number" min="0" step="0.1" placeholder="e.g. 12.5" value={form.mileage}
                onChange={e => handleChange('mileage', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Current Location</label>
              <input type="text" placeholder="e.g. Mumbai, MH" value={form.current_location}
                onChange={e => handleChange('current_location', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Insurance */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Insurance Status</label>
            <input type="text" placeholder="Active (Expires: YYYY-MM-DD)" value={form.insurance}
              onChange={e => handleChange('insurance', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>

          {/* Permit + Maintenance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Permit</label>
              <input type="text" placeholder="State Permit (Expires: YYYY-MM-DD)" value={form.permit}
                onChange={e => handleChange('permit', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Next Maintenance</label>
              <input type="text" placeholder="e.g. 2027-01-15 (General Service)" value={form.upcoming_maintenance}
                onChange={e => handleChange('upcoming_maintenance', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Fitness + PUC */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Fitness Certificate</label>
              <select value={form.fitness} onChange={e => handleChange('fitness', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
                <option value="Valid">Valid</option>
                <option value="Expired">Expired</option>
                <option value="Renewal Pending">Renewal Pending</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>PUC Certificate</label>
              <select value={form.puc} onChange={e => handleChange('puc', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
                <option value="Valid">Valid</option>
                <option value="Expired">Expired</option>
                <option value="Renewal Pending">Renewal Pending</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', background: saving ? '#5EEAD4' : '#0F766E', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saving ? <><Icons.Loader className="animate-spin" size={14} /> Saving...</> : <><Icons.Truck size={14} /> Register Vehicle</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadVehicles = () => {
    setLoading(true);
    api.agency.getVehicles()
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load vehicles", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleDelete = (vehicleNumber) => {
    if (!window.confirm(`Remove vehicle "${vehicleNumber}" from your fleet?`)) return;
    api.agency.deleteVehicle(vehicleNumber)
      .then(() => loadVehicles())
      .catch(err => alert('Failed to delete: ' + err.message));
  };

  const utilChartData = {
    labels: vehicles.map(v => v.vehicle_number.slice(-6)),
    datasets: [
      { 
        label: 'Active', 
        data: vehicles.map(v => v.availability === 'Assigned' ? 20 : 10), 
        backgroundColor: '#2563EB', 
        borderRadius: 4 
      },
      { 
        label: 'Idle', 
        data: vehicles.map(v => v.availability === 'Assigned' ? 10 : 20), 
        backgroundColor: '#E5E7EB', 
        borderRadius: 4 
      }
    ]
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading fleet registry...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {showModal && (
        <AddVehicleModal
          onClose={() => setShowModal(false)}
          onSaved={loadVehicles}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Fleet Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monitor all vehicles, mileage, insurance status, and assigned trips.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> Add Vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px', opacity: 0.3 }}>🚐</span>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No vehicles in your fleet yet</h3>
          <p style={{ fontSize: '13px', marginBottom: '20px' }}>Register your first vehicle to start managing your fleet</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Plus size={14} /> Register First Vehicle
          </button>
        </div>
      ) : (
        <>
          {/* Utilization Chart */}
          <div className="card card-padded" style={{ height: '240px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Vehicle Utilization Overview</h3>
            <div style={{ height: '160px' }}>
              <Bar data={utilChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
            </div>
          </div>

          {/* Vehicles Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {vehicles.map(vh => {
              const isAssigned = vh.availability === 'Assigned';
              const bgGradient = isAssigned 
                ? 'linear-gradient(135deg,#1e3a5f,#2563EB)' 
                : 'linear-gradient(135deg,#64748B,#94A3B8)';
              
              return (
                <div key={vh.vehicle_number} className="vehicle-card" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ background: bgGradient, height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', color: 'white' }}>
                    <span style={{ fontSize: '48px' }}>🚐</span>
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'white', color: '#1e3a5f', fontWeight: 800, fontSize: '11px', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                      {vh.vehicle_number}
                    </div>
                    <span className={`badge ${isAssigned ? 'green' : 'gray'}`} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      {vh.availability}
                    </span>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{vh.model}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Owner: {vh.owner} · Fuel: {vh.fuel_type}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                      <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Location</span><div style={{ fontSize: '12px', fontWeight: 600 }}>{vh.current_location}</div></div>
                      <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mileage</span><div style={{ fontSize: '12px', fontWeight: 600 }}>{vh.mileage} km/l</div></div>
                    </div>

                    {/* Insurance Status */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>🛡️ Insurance & Permit Status</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {vh.insurance}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 16px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Next: {vh.upcoming_maintenance}
                    </div>
                    <button
                      onClick={() => handleDelete(vh.vehicle_number)}
                      style={{ padding: '4px 10px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icons.Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
