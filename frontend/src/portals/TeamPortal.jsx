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
        setAgencies(agenciesData || []);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader size={36} style={{ color: '#2563EB', animation: 'ui-spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Connecting to platform mission control...</p>
      </div>
    );
  }

  const lineData = {
    labels: analytics?.revenue_growth?.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [{
      label: 'Platform Revenue (₹ Crores)',
      data: analytics?.revenue_growth?.data || [3.2, 3.8, 4.1, 4.8, 5.2, 5.0, 6.1],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      fill: true,
      tension: 0.35,
      borderWidth: 2.5,
      pointBackgroundColor: '#2563EB',
      pointHoverRadius: 6
    }]
  };

  const donutData = {
    labels: analytics?.regional_spread?.labels || ['Maharashtra', 'Gujarat', 'Rajasthan', 'Others'],
    datasets: [{
      data: analytics?.regional_spread?.data || [34, 17, 15, 34],
      backgroundColor: ['#2563EB', '#059669', '#D97706', '#6366F1', '#0D9488'],
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }]
  };

  return (
    <div className="fade-in">
      {/* Super Hero Welcome Banner */}
      <div className="agency-hero" style={{ marginBottom: '24px' }}>
        <div className="agency-hero__content">
          <div className="agency-hero__eyebrow">Platform Mission Control</div>
          <h1 className="agency-hero__title">Super Admin Overview</h1>
          <p className="agency-hero__text">Telemetry and vitals across all partner agencies, fleets, and payment gateways.</p>
        </div>

        <div className="agency-hero__metrics">
          <div className="agency-hero__metric">
            <strong>{summary?.total_agencies || 0}</strong>
            <span>Agencies</span>
          </div>
          <div className="agency-hero__metric">
            <strong>{summary?.active_tours?.toLocaleString() || '0'}</strong>
            <span>Active Tours</span>
          </div>
          <div className="agency-hero__metric">
            <strong>₹{summary?.total_revenue_cr || 4.8}Cr</strong>
            <span>Platform GMV</span>
          </div>
          <div className="agency-hero__metric">
            <strong>{summary?.platform_uptime || '99.9%'}</strong>
            <span>Uptime</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card card-padded" style={{ minHeight: '340px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>Platform Revenue Growth (MoM)</div>
          <div style={{ height: '250px' }}>
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { usePointStyle: true, boxWidth: 7, font: { family: "'Inter', sans-serif", size: 12, weight: 600 } } } },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: '#F1F5F9' }, border: { display: false } }
                }
              }}
            />
          </div>
        </div>
        <div className="card card-padded" style={{ minHeight: '340px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>Agency Regional Spread</div>
          <div style={{ height: '250px' }}>
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 7, font: { family: "'Inter', sans-serif", size: 11, weight: 600 } } } }
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Agencies & Health Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">Top Performing Partner Agencies</div>
            <span className="badge blue">{agencies.length} Active</span>
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
                    <td style={{ fontWeight: 600 }}>{ag.active_tours}</td>
                    <td style={{ fontSize: '12px' }}>{ag.drivers_count} Drv / {ag.vehicles_count} Veh</td>
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

        <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>System Health Telemetry</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {health.map((sh, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: sh.status === 'Healthy' || sh.status === 'Online' ? '#059669' : '#D97706', boxShadow: sh.status === 'Healthy' ? '0 0 8px #059669' : 'none' }}></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{sh.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latency: {sh.latency}</div>
                </div>
                <span className={`badge ${sh.status === 'Healthy' || sh.status === 'Online' ? 'green' : 'orange'}`}>
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
