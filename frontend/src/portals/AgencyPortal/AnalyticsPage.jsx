import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { api } from '../../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

export default function AnalyticsPage() {
  const [graphs, setGraphs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.agency.getGraphs()
      .then((data) => {
        setGraphs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load analytics graphs', err);
        setError('Could not load analytics data. Make sure the backend is running.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <Icons.AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.4, display: 'block', color: 'var(--danger)' }} />
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>{error}</p>
      </div>
    );
  }

  // Revenue vs Expense — use as Line chart for revenue growth
  const revVsExp = graphs?.revenue_vs_expense || {};
  const lineLabels = revVsExp.labels || [];
  const lineData = {
    labels: lineLabels.length > 0 ? lineLabels : [],
    datasets: [
      {
        label: 'Revenue (Lakhs)',
        data: revVsExp.revenue || [],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses (Lakhs)',
        data: revVsExp.expense || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Category-wise expense Doughnut
  const catExp = graphs?.category_wise_expense || {};
  const donutData = {
    labels: catExp.labels || [],
    datasets: [{
      data: catExp.percentages || [],
      backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#94A3B8'],
    }],
  };

  const hasLineData = (revVsExp.labels || []).length > 0;
  const hasDonutData = (catExp.labels || []).length > 0;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Analytics &amp; Insights</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Deep dive into operational efficiencies, revenue streams, and cost drivers.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Revenue Growth Line Chart */}
        <div className="card card-padded" style={{ height: '320px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Revenue vs Expenses (Month-on-Month)</h3>
          {hasLineData ? (
            <div style={{ height: '220px' }}>
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)' }}>
              <Icons.TrendingUp size={36} style={{ opacity: 0.25 }} />
              <p style={{ fontSize: '13px' }}>No revenue data yet. Add tours and expenses to see trends.</p>
            </div>
          )}
        </div>

        {/* Expense Distribution Doughnut */}
        <div className="card card-padded" style={{ height: '320px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Expense Distribution by Category</h3>
          {hasDonutData ? (
            <div style={{ height: '220px' }}>
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)' }}>
              <Icons.PieChart size={36} style={{ opacity: 0.25 }} />
              <p style={{ fontSize: '13px' }}>No expense categories logged yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Row */}
      {graphs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Active Tours', value: graphs.tours_status?.active ?? 0, icon: <Icons.Map size={18} />, color: '#10B981' },
            { label: 'Completed Tours', value: graphs.tours_status?.completed ?? 0, icon: <Icons.CheckCircle size={18} />, color: '#2563EB' },
            { label: 'Upcoming Tours', value: graphs.tours_status?.upcoming ?? 0, icon: <Icons.Calendar size={18} />, color: '#F59E0B' },
            { label: 'Driver Avg Rating', value: (graphs.driver_performance?.ratings || []).length > 0 ? (graphs.driver_performance.ratings.reduce((a, b) => a + b, 0) / graphs.driver_performance.ratings.length).toFixed(1) + ' ★' : '—', icon: <Icons.Star size={18} />, color: '#6366F1' },
          ].map((kpi, i) => (
            <div key={i} className="card card-padded" style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'white' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, flexShrink: 0 }}>
                {kpi.icon}
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Poppins', sans-serif" }}>{kpi.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
