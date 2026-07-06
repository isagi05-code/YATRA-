import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleAddDriver = () => {
    const names = ["Rajesh Kumar", "Mohan Lal", "Sunil Dutt", "Dinesh Karthik"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomSuffix = Math.floor(Math.random() * 900000) + 100000;
    const newDriver = {
      name: randomName,
      license: `MH-${randomSuffix}-DL`,
      aadhar: `1234-5678-${Math.floor(Math.random() * 9000) + 1000}`,
      experience: Math.floor(Math.random() * 10) + 3,
      trips_completed: Math.floor(Math.random() * 100) + 20,
      assigned_tour: "None",
      current_location: "Mumbai, MH",
      contact: `+91 99999 ${Math.floor(Math.random() * 90000) + 10000}`,
      emergency_contact: `+91 99999 ${Math.floor(Math.random() * 90000) + 10000}`,
      salary: 24000.0,
      expense: 0.0,
      ratings: parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)),
      documents: "{}"
    };

    api.agency.createDriver(newDriver)
      .then(() => {
        loadDrivers();
      })
      .catch((err) => console.error("Failed to add driver", err));
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Driver Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage driver profiles, license verification, ratings, and active assignments.</p>
        </div>
        <button onClick={handleAddDriver} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> Add Driver
        </button>
      </div>

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
                  {drv.name.split(' ').map(n => n[0]).join('')}
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
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>₹{drv.salary / 1000}k</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Salary</div>
                </div>
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Assignment</span>
                  <strong>{drv.assigned_tour}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}>Call: {drv.contact}</button>
                <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}>View Profile</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
