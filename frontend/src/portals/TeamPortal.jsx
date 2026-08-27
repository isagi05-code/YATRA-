import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { api } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function TeamPortal({ page }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [health, setHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = () => {
    setLoading(true);
    Promise.all([
      api.admin.getSummary(),
      api.admin.getAnalytics(),
      api.admin.getAgencies(),
      api.admin.getHealth()
    ])
      .then(([summaryData, analyticsData, agenciesData, healthData]) => {
        setSummary(summaryData);
        setAnalytics(analyticsData);
        setAgencies(agenciesData);
        setHealth(healthData.gateways || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load admin platform stats", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={48} style={{ color: '#6366F1' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading platform control panel...</p>
      </div>
    );
  }

  const lineData = {
    labels: analytics?.revenue_growth?.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [{
      label: 'Platform Revenue (Crores)',
      data: analytics?.revenue_growth?.data || [3.2, 3.8, 4.1, 4.8, 5.2, 5.0, 6.1],
      borderColor: '#6366F1',
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
      fill: true,
      tension: 0.4
    }]
  };

  const donutData = {
    labels: analytics?.regional_spread?.labels || ['Maharashtra', 'Gujarat', 'Rajasthan', 'Others'],
    datasets: [{
      data: analytics?.regional_spread?.data || [34, 17, 15, 34],
      backgroundColor: ['#10B981', '#2563EB', '#F59E0B', '#6366F1', '#14B8A6']
    }]
  };

  return (
    <div className="fade-in">
      {/* Super Hero Welcome Banner */}
      <div className="super-hero" style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 30%, #312e81 70%, #4338ca 100%)',
        borderRadius: '20px', padding: '36px 40px', color: 'white',
        marginBottom: '28px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="platform-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
            color: '#A5B4FC', fontSize: '12px', fontWeight: 700,
            padding: '5px 14px', borderRadius: '999px', letterSpacing: '0.5px', marginBottom: '16px'
          }}>
            <Icons.Shield size={12} /> VittAro Platform — Super Admin
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '36px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1 }}>Platform Overview</h1>
          <p style={{ fontSize: '14px', opacity: 0.65, marginTop: '8px' }}>Real-time metrics across all agencies, drivers, and operations.</p>
        </div>

        <div className="hero-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px', marginTop: '28px' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{summary?.total_agencies || 0}</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Total Agencies</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{summary?.active_tours?.toLocaleString() || '0'}</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Active Trips</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₹{summary?.total_revenue_cr || 4.8}Cr</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Platform Revenue</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{summary?.platform_uptime || '99.8%'}</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Platform Uptime</div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card card-padded" style={{ height: '320px', background: 'white' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Platform Revenue Growth (MoM)</h3>
          <div style={{ height: '220px' }}>
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card card-padded" style={{ height: '320px', background: 'white' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Agency Regional Spread</h3>
          <div style={{ height: '220px' }}>
            <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Agencies & Health Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
        <div className="card" style={{ background: 'white' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div className="card-title">Top Performing Partner Agencies</div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Agency</th>
                  <th>Active Tours</th>
                  <th>Drivers / Fleet</th>
                  <th>Subscription</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <strong>{ag.name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Contact: {ag.contact}</div>
                    </td>
                    <td>{ag.active_tours}</td>
                    <td>{ag.drivers_count} Drv / {ag.vehicles_count} Veh</td>
                    <td><strong>{ag.subscription_status}</strong></td>
                    <td>
                      <span className={`badge ${ag.status === 'Active' ? 'green' : 'orange'}`}>
                        {ag.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-padded" style={{ background: 'white' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>System Health Monitor</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {health.map((sh, i) => (
              <div key={i} className="health-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sh.status === 'Healthy' || sh.status === 'Online' ? '#10B981' : '#F59E0B' }}></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{sh.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sh.latency}</div>
                </div>
                <span className={`badge ${sh.status === 'Healthy' || sh.status === 'Online' ? 'green' : 'orange'}`} style={{ fontSize: '10px' }}>
                  {sh.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
