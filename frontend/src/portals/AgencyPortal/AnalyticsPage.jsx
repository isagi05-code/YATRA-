import React from 'react';
import * as Icons from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const lineData = {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [{
      label: 'Growth Trend (Lakhs)',
      data: [12.2, 14.5, 13.8, 18.2, 21.0, 19.5, 24.6],
      borderColor: '#2563EB',
      tension: 0.4,
      fill: false
    }]
  };

  const donutData = {
    labels: ['Stay', 'Fuel', 'Food', 'Toll', 'Maintenance'],
    datasets: [{
      data: [35, 30, 17, 8, 10],
      backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6366F1']
    }]
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Analytics & Insights</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Deep dive into operational efficiencies, revenue streams, and cost drivers.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card card-padded" style={{ height: '320px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Revenue Growth (MoM)</h3>
          <div style={{ height: '220px' }}>
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="card card-padded" style={{ height: '320px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Expense Distribution</h3>
          <div style={{ height: '220px' }}>
            <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}
