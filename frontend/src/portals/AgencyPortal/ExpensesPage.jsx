import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

const CATEGORIES = ['Fuel', 'Stay', 'Food', 'Toll', 'Vehicle Maintenance', 'Salary', 'Miscellaneous'];
const PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Fuel Card', 'FASTag'];

function AddExpenseModal({ tours, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    category: 'Fuel',
    vendor: '',
    amount: '',
    gst: '',
    payment_mode: 'UPI',
    date: today,
    description: '',
    trip_id: '',
    status: 'Pending',
    approved_by: 'Pending',
    receipt_image: '',
    ocr_extracted_data: null,
    time: new Date().toTimeString().slice(0, 8),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-compute GST at 18% when amount changes
      if (field === 'amount') {
        const amt = parseFloat(value) || 0;
        updated.gst = (amt * 0.18).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendor.trim()) { setError('Vendor name is required'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Valid amount is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        trip_id: form.trip_id ? parseInt(form.trip_id) : null,
        amount: parseFloat(form.amount),
        gst: parseFloat(form.gst) || 0,
        vendor: form.vendor.trim(),
        category: form.category,
        date: form.date,
        time: form.time,
        description: form.description.trim() || `${form.category} expense`,
        payment_mode: form.payment_mode,
        approved_by: 'Pending',
        status: 'Pending',
        receipt_image: form.receipt_image || null,
        ocr_extracted_data: null,
      };
      await api.agency.createExpense(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1E293B, #2563EB)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: 0 }}>Add New Expense</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '2px 0 0' }}>Log a new expense to the agency account</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer' }}>
            <Icons.X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Row 1: Category + Payment Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Category *</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Payment Mode *</label>
              <select value={form.payment_mode} onChange={e => handleChange('payment_mode', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Vendor / Merchant Name *</label>
            <input type="text" placeholder="e.g. HP Petrol Pump, Marriott Hotel" value={form.vendor}
              onChange={e => handleChange('vendor', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>

          {/* Row 2: Amount + GST */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Amount (₹) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>GST (₹) <span style={{ fontWeight: 400, opacity: 0.6 }}>auto 18%</span></label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.gst}
                onChange={e => handleChange('gst', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Row 3: Date + Linked Tour */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Date *</label>
              <input type="date" value={form.date} onChange={e => handleChange('date', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Linked Tour <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
              <select value={form.trip_id} onChange={e => handleChange('trip_id', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
                <option value="">No Tour (General)</option>
                {tours.map(t => (
                  <option key={t.trip_id} value={t.trip_id}>#{t.trip_id} — {t.destination}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Description</label>
            <textarea rows={2} placeholder="Brief notes about this expense..." value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Total preview */}
          {form.amount && (
            <div style={{ background: '#EFF6FF', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#1E40AF' }}>Total incl. GST</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#1E40AF' }}>
                ₹{(parseFloat(form.amount || 0) + parseFloat(form.gst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', background: saving ? '#93C5FD' : '#2563EB', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saving ? <><Icons.Loader className="animate-spin" size={14} /> Saving...</> : <><Icons.Plus size={14} /> Add Expense</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadExpenses = () => {
    setLoading(true);
    const cat = categoryFilter === 'All' ? null : categoryFilter;
    api.agency.getExpenses(cat, null, searchQuery)
      .then((data) => {
        setExpenses(data);
        if (data.length > 0) {
          const stillExists = data.find(x => x.expense_id === selectedExpense?.expense_id);
          setSelectedExpense(stillExists || data[0]);
        } else {
          setSelectedExpense(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load expenses", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // Load tours for dropdown in modal
    api.agency.getTours().then(setTours).catch(() => setTours([]));
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [categoryFilter, searchQuery]);

  const handleApprove = (expId) => {
    api.agency.updateExpense(expId, 'Approved', 'Agency Manager')
      .then(() => loadExpenses())
      .catch((err) => console.error("Failed to approve expense", err));
  };

  const handleDelete = (expId) => {
    if (!window.confirm('Delete this expense?')) return;
    api.agency.deleteExpense(expId)
      .then(() => loadExpenses())
      .catch((err) => console.error("Failed to delete expense", err));
  };

  return (
    <div className="fade-in">
      {showModal && (
        <AddExpenseModal
          tours={tours}
          onClose={() => setShowModal(false)}
          onSaved={loadExpenses}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Expense Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track and manage all agency expenses across tours, drivers, and general operations.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> Add Expense
        </button>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left Column - Table */}
        <div>
          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {['All', 'Fuel', 'Stay', 'Food', 'Toll', 'Vehicle Maintenance', 'Salary', 'Miscellaneous'].map((cat) => (
              <span 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`badge ${categoryFilter === cat ? 'blue' : 'gray'}`} 
                style={{ padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}
              >
                {cat === 'All' ? '📂 All' : cat}
              </span>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Icons.Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search expenses by vendor or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 12px 6px 30px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }} 
            />
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                        <Icons.Loader className="animate-spin" size={24} style={{ display: 'inline', color: 'var(--primary)' }} />
                        <span style={{ marginLeft: '8px', fontSize: '13px' }}>Loading...</span>
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <Icons.Receipt size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>No expenses yet</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Add Expense" to log your first expense</p>
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr 
                        key={exp.expense_id} 
                        onClick={() => setSelectedExpense(exp)} 
                        style={{ cursor: 'pointer', background: selectedExpense?.expense_id === exp.expense_id ? 'var(--primary-10)' : 'transparent' }}
                      >
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{exp.date}</td>
                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{exp.vendor}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exp.description}</div>
                        </td>
                        <td><span className="badge gray">{exp.category}</span></td>
                        <td><strong>₹{Number(exp.amount).toLocaleString()}</strong></td>
                        <td>
                          <span className={`badge ${exp.status === 'Approved' ? 'green' : 'orange'}`}>
                            {exp.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(exp.expense_id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '4px' }}
                          >
                            <Icons.Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Receipt Preview */}
        <div>
          <div className="card card-padded" style={{ position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Receipt Preview</h3>
            
            {selectedExpense ? (
              <div className="fade-in">
                <div style={{ background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
                  <Icons.FileText size={48} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Receipt: {selectedExpense.receipt_image || "Not Attached"}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AI OCR parsed successfully</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Merchant</span>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedExpense.vendor}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Amount / GST</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{Number(selectedExpense.amount).toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>(GST: ₹{selectedExpense.gst})</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Trip / Payment Mode</span>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>
                      {selectedExpense.trip_id ? `Trip #${selectedExpense.trip_id}` : 'General (No Tour)'} · {selectedExpense.payment_mode}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Category</span>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}><span className="badge gray">{selectedExpense.category}</span></div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Approved By</span>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}><span className="badge gray">{selectedExpense.approved_by}</span></div>
                  </div>
                </div>
                {selectedExpense.status !== 'Approved' && (
                  <button 
                    onClick={() => handleApprove(selectedExpense.expense_id)} 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '20px' }}
                  >
                    ✓ Approve Expense
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                <Icons.Receipt size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '12px' }}>Select an expense row to preview details.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
