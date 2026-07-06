import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(null);

  const reports = [
    { title: 'Revenue Report', key: 'Profit', desc: 'Complete revenue breakdown by tour, customer, month, and payment method.', date: 'Jul 5, 2026 · 8:00 AM', emoji: '💰' },
    { title: 'Expense Report', key: 'Expense', desc: 'Itemized expense report categorized by fuel, accommodation, food, toll, and driver allowances.', date: 'Jul 4, 2026 · 6:30 PM', emoji: '🧾' },
    { title: 'Tour Summary Report', key: 'Tour', desc: 'Tour-wise summary with passenger counts, routes, revenue, and profitability.', date: 'Jul 5, 2026 · 9:15 AM', emoji: '🗺️' }
  ];

  const handleDownload = (key, title) => {
    setDownloading(title);
    api.agency.getReports(key)
      .then((data) => {
        alert(`Successfully generated report: ${data.report_type}\nDownload Link: http://localhost:8000${data.export_links.pdf}`);
        setDownloading(null);
      })
      .catch((err) => {
        console.error("Failed to generate report", err);
        setDownloading(null);
      });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Reports</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Generate, download, and schedule automated reports for your agency.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> Custom Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {reports.map((rep, idx) => (
          <div key={idx} className="card card-padded" style={{ display: 'flex', flexDirection: 'column', height: '220px', position: 'relative', background: 'white' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{rep.emoji}</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{rep.title}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', flex: 1 }}>{rep.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rep.date}</span>
              <button 
                onClick={() => handleDownload(rep.key, rep.title)} 
                disabled={downloading === rep.title}
                className="btn btn-outline btn-sm" 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
              >
                {downloading === rep.title ? (
                  <Icons.Loader className="animate-spin" size={12} />
                ) : (
                  <Icons.Download size={12} />
                )}
                {downloading === rep.title ? 'Generating...' : 'Download'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
