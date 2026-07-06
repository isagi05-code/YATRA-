import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

export default function ToursPage({ onSelectTour }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTours = () => {
    setLoading(true);
    api.agency.getTours()
      .then((data) => {
        setTours(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tours", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTours();
  }, []);

  const handleCreateTour = () => {
    const destinations = ["Kerala Backwater Tour", "Kashmir Valley Paradise", "Sikkim & Darjeeling Retreat", "Hampi Cultural Walk"];
    const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
    const newTourData = {
      destination: randomDest,
      customer: "Aditya Sen",
      agency: "Yatra Travels Ltd",
      start_date: "2026-07-20",
      end_date: "2026-07-27",
      status: "Upcoming",
      vehicle: "MH-01-DK-4507",
      driver: "Vikram Singh",
      passengers: 8,
      guide: "Ananya Sen",
      budget: 35000.0,
      current_lat: 19.0760,
      current_lng: 72.8777,
      timeline_status: "Booking Created"
    };

    api.agency.createTour(newTourData)
      .then(() => {
        loadTours();
      })
      .catch(err => console.error("Failed to create tour", err));
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Tour Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Plan, track, and manage travel routes and itineraries.</p>
        </div>
        <button onClick={handleCreateTour} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> New Tour
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: '200px' }}>
          <Icons.Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search tours..." 
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
      {filteredTours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'white', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <Icons.Map size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No tours match your search criteria.</p>
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
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icons.MapPin size={12} /> {tour.destination}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Client: {tour.customer}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Departure</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{tour.start_date}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Budget / Driver</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(tour.budget / 1000).toFixed(0)}k · {tour.driver || 'Unassigned'}</div>
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
