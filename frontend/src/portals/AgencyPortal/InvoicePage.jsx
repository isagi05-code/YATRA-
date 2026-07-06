import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(2); // default to trip 2 (seeded)
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load list of completed invoices
    api.agency.getInvoices()
      .then((data) => {
        setInvoices(data);
      })
      .catch((err) => console.error("Failed to load invoices", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.agency.getInvoice(selectedTripId)
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load invoice details", err);
        setLoading(false);
      });
  }, [selectedTripId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Icons.Loader className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading invoice details...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Selector & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Select Trip:</span>
          <select 
            value={selectedTripId} 
            onChange={(e) => setSelectedTripId(Number(e.target.value))}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          >
            {invoices.length === 0 ? (
              <option value="2">Trip #2 (Rajasthan Journey)</option>
            ) : (
              invoices.map(inv => (
                <option key={inv.trip_id} value={inv.trip_id}>
                  Trip #{inv.trip_id} ({inv.destination})
                </option>
              ))
            )}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm"><Icons.Printer size={12} /> Print</button>
          <a 
            href={invoice?.download_pdf_url ? `http://localhost:8000${invoice.download_pdf_url}` : "#"} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Icons.Download size={12} /> Download PDF
          </a>
        </div>
      </div>

      {invoice ? (
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'white' }}>
          {/* Invoice Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1e3a5f 100%)',
            padding: '36px 40px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'white' }}>
                  <img src={invoice.agency_logo || "/yatralogo.jpg"} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>Yatra AI</span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7, lineHeight: 1.6 }}>
                Yatra Travels Pvt. Ltd.<br />
                204, Andheri West, Mumbai — 400053<br />
                GSTIN: 27AAAAA1111A1Z1
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Invoice</div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, fontFamily: "'Poppins', sans-serif", margin: '4px 0' }}>{invoice.invoice_number}</h2>
              <span className={`badge ${invoice.payment_status === 'Paid' ? 'green' : 'orange'}`} style={{ display: 'inline-block', marginTop: '6px' }}>
                {invoice.payment_status}
              </span>
            </div>
          </div>

          {/* Invoice Body */}
          <div style={{ padding: '36px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '20px', marginBottom: '28px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Bill To</span>
                <div style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
                  <strong>{invoice.customer}</strong><br />
                  Lead Passenger
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tour Details</span>
                <div style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{invoice.destination}</span><br />
                  Trip ID: #{invoice.trip_id}<br />
                  Dates: {invoice.journey_dates}<br />
                  Vehicle: {invoice.vehicle} · Driver: {invoice.driver}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Billing Info</span>
                <div style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.5 }}>
                  Billing Type: <strong>{invoice.billing_type}</strong><br />
                  Signature: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{invoice.digital_signature?.slice(0, 10)}...</span>
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <table className="table" style={{ width: '100%', marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Vendor / Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.expenses && invoice.expenses.map((exp) => (
                  <tr key={exp.expense_id}>
                    <td><span className="badge gray">{exp.category}</span></td>
                    <td>
                      <strong>{exp.vendor}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exp.description}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{exp.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Notes</strong>
                <p style={{ marginTop: '6px', lineHeight: 1.6 }}>Thank you for travelling with Yatra. This invoice confirms full details of approved expenses. For questions or support, contact billing@yatraai.in.</p>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0' }}>
                  <span>Subtotal</span><span>₹{invoice.subtotal?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0' }}>
                  <span>GST (18%)</span><span>₹{invoice.gst?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--primary)', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  <span>Grand Total</span><span>₹{invoice.grand_total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Footer */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px 40px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Account</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Yatra Travels Pvt. Ltd. · HDFC Bank<br />
                A/C: 502000987654321 · IFSC: HDFC0001234
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>Authorized Signatory</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Yatra AI Platform</div>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p>No invoices available.</p>
        </div>
      )}
    </div>
  );
}
