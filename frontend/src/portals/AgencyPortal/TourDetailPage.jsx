import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function TourDetailPage({ tourId, onBack }) {
  const [tour, setTour] = useState(null);
  const [dayWise, setDayWise] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.agency.getTour(tourId),
      api.agency.getDayWiseExpenses(tourId)
    ])
      .then(([tourData, dayWiseData]) => {
        setTour(tourData);
        setDayWise(dayWiseData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tour details", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [tourId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading workspace details...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: 'var(--danger)' }}>Tour details could not be found.</p>
        <button onClick={onBack} className="btn btn-outline" style={{ marginTop: '12px' }}>Go Back</button>
      </div>
    );
  }

  // Format day wise charts
  const dayBreakdown = dayWise?.day_wise_breakdown || {};
  const dayLabels = Object.keys(dayBreakdown).map((d, i) => `Day ${i + 1} (${d.slice(5)})`);
  
  const dayExpenseData = {
    labels: dayLabels.length > 0 ? dayLabels : ['Day 1'],
    datasets: [
      {
        label: 'Fuel',
        data: Object.values(dayBreakdown).map(d => d.Fuel || 0),
        backgroundColor: 'rgba(37,99,235,0.8)'
      },
      {
        label: 'Stay',
        data: Object.values(dayBreakdown).map(d => d.Stay || 0),
        backgroundColor: 'rgba(245,158,11,0.8)'
      },
      {
        label: 'Food',
        data: Object.values(dayBreakdown).map(d => d.Food || 0),
        backgroundColor: 'rgba(16,185,129,0.8)'
      },
      {
        label: 'Toll',
        data: Object.values(dayBreakdown).map(d => d.Toll || 0),
        backgroundColor: 'rgba(239,68,68,0.8)'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true },
      y: { stacked: true }
    }
  };

  // Timeline events mapping
  const timelineEvents = tour.timeline || [];
  
  return (
    <div className="fade-in">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} className="btn btn-outline btn-sm" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.ChevronLeft size={14} /> Back
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{tour.destination} (#TRIP-{tour.trip_id})</h2>
          <span className={`badge ${tour.status === 'Active' ? 'green' : tour.status === 'Completed' ? 'blue' : 'orange'}`}>
            {tour.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm"><Icons.Share size={12} /> Share</button>
          <button className="btn btn-primary btn-sm"><Icons.Edit size={12} /> Edit</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Left Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Stats */}
          <div className="card card-padded">
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Tour Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Duration</span><div style={{ fontSize: '13px', fontWeight: 600 }}>{tour.start_date} to {tour.end_date}</div></div>
              <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Passengers</span><div style={{ fontSize: '13px', fontWeight: 600 }}>{tour.passengers} Pax</div></div>
              <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Budget</span><div style={{ fontSize: '13px', fontWeight: 600 }}>₹{tour.budget?.toLocaleString()}</div></div>
              <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Spent</span><div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>₹{dayWise?.grand_total?.toLocaleString() || '0'}</div></div>
            </div>
          </div>

          {/* Driver & Vehicle */}
          <div className="card card-padded">
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Driver & Vehicle</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
              <div className="avatar sm" style={{ background: '#2563EB', color: 'white' }}>{tour.driver ? tour.driver.slice(0, 2).toUpperCase() : 'UA'}</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{tour.driver || 'Driver Not Assigned'}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Status: Active Duty</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '18px' }}>🚐</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{tour.vehicle || 'Vehicle Not Assigned'}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>National Permit Compliance</div>
              </div>
            </div>
          </div>

          {/* Passengers */}
          <div className="card card-padded">
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Client & Guides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span className="avatar xs" style={{ background: '#10B981', color: 'white' }}>{tour.customer ? tour.customer.slice(0,2).toUpperCase() : 'CL'}</span>
                <span>Client: {tour.customer}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span className="avatar xs" style={{ background: '#64748B', color: 'white' }}>GD</span>
                <span>Guide: {tour.guide || 'None'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Details/Map Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Map Preview */}
          <div style={{ height: '240px', border: '1px solid var(--border)', borderRadius: '16px', background: 'linear-gradient(135deg, #cfe8f3 0%, #b3d9f2 20%, #dff0e8 40%, #c8e6c9 60%, #dcedc8 80%, #cfe8f3 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            {/* SVG Path Route */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path d="M 50 180 Q 200 80 350 150 T 600 60" fill="none" stroke="#2563EB" strokeWidth="4" strokeDasharray="8,4" />
              <circle cx="50" cy="180" r="6" fill="#10B981" />
              <circle cx="350" cy="150" r="6" fill="#F59E0B" />
              <circle cx="600" cy="60" r="8" fill="#2563EB" />
            </svg>
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border)' }}>
              📍 Current Location: {tour?.current_lat != null ? Number(tour.current_lat).toFixed(4) : '19.0760'}, {tour?.current_lng != null ? Number(tour.current_lng).toFixed(4) : '72.8777'}
            </div>
          </div>

          {/* Timeline Checkpoints */}
          <div className="card card-padded">
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Trip Checkpoints</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {timelineEvents.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No checkpoints logged yet.</div>
              ) : (
                timelineEvents.map((evt) => (
                  <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <span style={{ color: evt.status === 'Completed' ? 'var(--success)' : 'var(--text-muted)' }}>
                      {evt.status === 'Completed' ? '✓' : '○'}
                    </span>
                    <span><strong>{evt.event_name}</strong> {evt.updated_at !== '-' && `— ${evt.updated_at}`}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Expenses Chart */}
          <div className="card card-padded" style={{ height: '300px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Day-wise Expenses</h3>
            <div style={{ height: '220px' }}>
              <Bar data={dayExpenseData} options={chartOptions} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
