import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie, Radar } from 'react-chartjs-2';
import { api } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [graphs, setGraphs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.agency.getSummary(), api.agency.getGraphs()])
      .then(([summaryData, graphsData]) => {
        setSummary(summaryData);
        setGraphs(graphsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading live agency metrics...</p>
      </div>
    );
  }

  // Top Stats Cards mapping
  const s = summary?.stats || {};
  const safeNum = (val) => parseFloat(val) || 0;
  const toLakh = (val) => (safeNum(val) / 100000).toFixed(1);

  const stats = [
    { label: 'Total Revenue', value: `₹${toLakh(s.total_revenue)}L`, change: s.total_revenue > 0 ? '↑ From completed tours' : 'No tours completed yet', color: 'blue' },
    { label: 'Total Expenses', value: `₹${toLakh(s.total_expenses)}L`, change: s.expense_trend || 'No expenses yet', color: 'red' },
    { label: 'Active Tours', value: safeNum(s.active_tours).toString(), change: s.active_tours > 0 ? `${s.active_tours} ongoing` : 'No active tours', color: 'green' },
    { label: 'Net Profit', value: `₹${toLakh(s.profit)}L`, change: safeNum(s.profit) >= 0 ? '↑ Positive' : '↓ Loss', color: 'teal' },
    { label: 'Total Vehicles', value: safeNum(s.total_vehicles).toString(), change: s.total_vehicles > 0 ? `${s.total_vehicles} in fleet` : 'Add vehicles', color: 'indigo' },
    { label: 'Total Drivers', value: safeNum(s.total_drivers).toString(), change: s.total_drivers > 0 ? `${s.total_drivers} registered` : 'Add drivers', color: 'orange' },
    { label: 'Pending Payments', value: `₹${toLakh(s.pending_payments)}L`, change: s.pending_payments > 0 ? 'Invoices due' : 'All settled', color: 'red' },
    { label: 'Upcoming Trips', value: safeNum(s.upcoming_tours).toString(), change: s.upcoming_tours > 0 ? 'Next 30 days' : 'No upcoming trips', color: 'blue' }
  ];

  // Chart Mappings
  const monthlyExpenseData = {
    labels: graphs?.monthly_expense?.labels || [],
    datasets: [{
      label: 'Expenses (Lakhs)',
      data: graphs?.monthly_expense?.data || [],
      backgroundColor: '#2563EB',
      borderRadius: 6
    }]
  };

  const revVsExpData = {
    labels: graphs?.revenue_vs_expense?.labels || [],
    datasets: [
      {
        label: 'Revenue (Lakhs)',
        data: graphs?.revenue_vs_expense?.revenue || [],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Expenses (Lakhs)',
        data: graphs?.revenue_vs_expense?.expense || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const catExpenseData = {
    labels: graphs?.category_wise_expense?.labels || [],
    datasets: [{
      data: graphs?.category_wise_expense?.percentages || [],
      backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#94A3B8']
    }]
  };

  const tourStatusData = {
    labels: ['Active', 'Completed', 'Upcoming'],
    datasets: [{
      data: [
        graphs?.tours_status?.active || 0,
        graphs?.tours_status?.completed || 0,
        graphs?.tours_status?.upcoming || 0
      ],
      backgroundColor: ['#10B981', '#2563EB', '#F59E0B']
    }]
  };

  const driverPerformanceData = {
    labels: graphs?.driver_performance?.labels || [],
    datasets: [{
      label: 'Avg Ratings',
      data: graphs?.driver_performance?.ratings || [],
      borderColor: '#6366F1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true
    }]
  };

  return (
    <div className="fade-in">
      {/* Greeting Banner */}
      <div className="greeting-banner" style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: 'white',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Welcome back, Yatra Partner 👋</div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '26px', fontWeight: 700, marginBottom: '6px', lineHeight: 1 }}>Agency Control Room</h1>
          <p style={{ fontSize: '13px', opacity: 0.75 }}>Manage tours, expenses, drivers, and vehicles with AI assistance.</p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Poppins', sans-serif" }}>₹{toLakh(s.total_revenue)}L</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Revenue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Poppins', sans-serif" }}>{safeNum(s.active_tours)}</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Active Tours</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button onClick={() => onNavigate('tours')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
          <Icons.Map size={14} /> New Tour
        </button>
        <button onClick={() => onNavigate('expenses')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
          <Icons.Receipt size={14} /> Add Expense
        </button>
        <button onClick={() => onNavigate('ai-itinerary')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
          <Icons.Sparkles size={14} /> AI Planner
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {stats.map((stat, i) => (
          <div key={i} className="stat-card" style={{ background: 'white', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: stat.change.includes('↓') ? 'var(--danger)' : 'var(--success)' }}>
                {stat.change}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Poppins', sans-serif" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card card-padded" style={{ height: '340px' }}>
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div className="card-title" style={{ fontSize: '14px', fontWeight: 700 }}>Revenue vs Expenses</div>
          </div>
          <div style={{ height: '240px' }}>
            <Line data={revVsExpData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="card card-padded" style={{ height: '340px' }}>
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div className="card-title" style={{ fontSize: '14px', fontWeight: 700 }}>Expense Category Split</div>
          </div>
          <div style={{ height: '240px' }}>
            <Doughnut data={catExpenseData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Row 3 Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div className="card card-padded" style={{ height: '320px' }}>
          <div className="card-title" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Monthly Expense Trend</div>
          <div style={{ height: '220px' }}>
            <Bar data={monthlyExpenseData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card card-padded" style={{ height: '320px' }}>
          <div className="card-title" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Tour Package Status</div>
          <div style={{ height: '220px' }}>
            <Pie data={tourStatusData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card card-padded" style={{ height: '320px' }}>
          <div className="card-title" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Driver Ratings (Avg)</div>
          <div style={{ height: '220px' }}>
            <Radar data={driverPerformanceData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

    </div>
  );
}
