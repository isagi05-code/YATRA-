import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../services/api';

export default function ExpensesPage() {
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadExpenses = () => {
    setLoading(true);
    const cat = categoryFilter === 'All' ? null : categoryFilter;
    api.agency.getExpenses(cat, null, searchQuery)
      .then((data) => {
        setExpenses(data);
        if (data.length > 0) {
          // Keep selection synchronized if it still exists in the search results
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
    loadExpenses();
  }, [categoryFilter, searchQuery]);

  const handleApprove = (expId) => {
    api.agency.updateExpense(expId, 'Approved', 'Agency Manager')
      .then(() => {
        loadExpenses();
      })
      .catch((err) => console.error("Failed to approve expense", err));
  };

  const handleAddExpense = () => {
    const randomTrip = 2; // Rajasthan trip
    const randomAmount = Math.floor(Math.random() * 8000) + 500;
    const gstVal = randomAmount * 0.18;
    const categories = ["Fuel", "Stay", "Food", "Toll", "Vehicle Maintenance", "Miscellaneous"];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const vendors = {"Fuel": "Shell Station Depot", "Stay": "Marriott Courtyard", "Food": "Punjabi Dhaba", "Toll": "NH-8 Plaza", "Vehicle Maintenance": "Toyota Workshop"};
    const vendor = vendors[randomCat] || "General Vendor";

    const newExpense = {
      trip_id: randomTrip,
      amount: randomAmount,
      gst: gstVal,
      vendor: vendor,
      category: randomCat,
      date: "2026-07-05",
      time: "14:20:00",
      description: `Mocked ${randomCat.toLowerCase()} expense entry`,
      payment_mode: "UPI",
      approved_by: "Pending",
      status: "Pending",
      receipt_image: "attached_receipt.png",
      ocr_extracted_data: JSON.stringify({ vendor: vendor, total: `₹${randomAmount}` })
    };

    api.agency.createExpense(newExpense)
      .then(() => {
        loadExpenses();
      })
      .catch((err) => console.error("Failed to add expense", err));
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Expense Management</h1>
          <p className="page-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track and manage all tour expenses across categories, drivers, and vehicles.</p>
        </div>
        <button onClick={handleAddExpense} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Plus size={14} /> Add Expense
        </button>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left Column - Table */}
        <div>
          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {['All', 'Fuel', 'Stay', 'Food', 'Toll', 'Vehicle Maintenance', 'Miscellaneous'].map((cat) => (
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
              placeholder="Search expenses by vendor or details..."
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
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>
                        <Icons.Loader className="animate-spin" size={24} style={{ display: 'inline', color: 'var(--primary)' }} />
                        <span style={{ marginLeft: '8px', fontSize: '13px' }}>Loading...</span>
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No expense logs found.</td>
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
                        <td><strong>₹{exp.amount.toLocaleString()}</strong></td>
                        <td>
                          <span className={`badge ${exp.status === 'Approved' ? 'green' : 'orange'}`}>
                            {exp.status}
                          </span>
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
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Receipt: {selectedExpense.receipt_image || "Not Available"}</div>
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
                      ₹{selectedExpense.amount.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>(GST: ₹{selectedExpense.gst})</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Trip ID / Payment Mode</span>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>Trip #{selectedExpense.trip_id} · {selectedExpense.payment_mode}</div>
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
                    Approve Expense
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                <Icons.Receipt size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '12px' }}>Select an expense row to preview the receipt attachment.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
