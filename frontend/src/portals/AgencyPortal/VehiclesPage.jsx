import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleRegisterVehicle = () => {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const newVeh = {
      vehicle_number: `MH-01-XX-${randomSuffix}`,
      model: "Mahindra XUV700",
      owner: "Yatra Travels Ltd",
      insurance: "Active (Expires: 2027-04-12)",
      permit: "State Permit (Expires: 2028-01-01)",
      fitness: "Valid",
      puc: "Valid",
      fuel_type: "Diesel",
      mileage: 14.2,
      current_location: "Mumbai, MH",
      availability: "Available",
      service_history: "[]",
      expenses: 0.0,
      upcoming_maintenance: "2026-09-01 (General checkup)"
    };

    api.agency.createVehicle(newVeh)
      .then(() => {
        loadVehicles();
      })
      .catch((err) => console.error("Failed to register vehicle", err));
  };

  const utilChartData = {
    labels: vehicles.map(v => v.vehicle_number.slice(-4)),
    datasets: [
      { 
        label: 'Days Active', 
        data: vehicles.map(() => Math.floor(Math.random() * 10) + 15), 
        backgroundColor: '#2563EB', 
        borderRadius: 4 
      },
      { 
        label: 'Days Idle', 
        data: vehicles.map(() => Math.floor(Math.random() * 5) + 5), 
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Fleet Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monitor all vehicles, mileage, insurance status, and assigned trips.</p>
        </div>
        <button onClick={handleRegisterVehicle} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> Add Vehicle
        </button>
      </div>

      {/* Utilization Chart */}
      <div className="card card-padded" style={{ height: '240px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Vehicle Monthly Utilization</h3>
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
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'white', color: '#1e3a5f', fontWeight: 800, fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
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
                  <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mileage/L</span><div style={{ fontSize: '12px', fontWeight: 600 }}>{vh.mileage} km/l</div></div>
                </div>

                {/* Insurance Status */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🛡️ Insurance & Permit Status</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {vh.insurance}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '10px 16px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Maintenance: {vh.upcoming_maintenance}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
