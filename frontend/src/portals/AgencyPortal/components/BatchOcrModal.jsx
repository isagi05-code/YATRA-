import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { api } from '../../../services/api';

const CATEGORIES = ['Fuel', 'Stay', 'Food', 'Toll', 'Vehicle Maintenance', 'Salary', 'Miscellaneous'];
const PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Fuel Card', 'FASTag'];

export default function BatchOcrModal({ tours, onClose, onSaved }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [batchResult, setBatchResult] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [error, setError] = useState('');
  const [activeRawJson, setActiveRawJson] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  // Generate object URLs for selected files
  useEffect(() => {
    const urls = selectedFiles.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      url: URL.createObjectURL(f)
    }));
    setPreviews(urls);
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u.url));
    };
  }, [selectedFiles]);

  const handleFilesChosen = (filesList) => {
    setError('');
    const newFiles = Array.from(filesList).filter(f => f.type.startsWith('image/'));
    if (newFiles.length === 0) {
      setError('Please select valid image files (PNG, JPG, JPEG, WebP).');
      return;
    }
    const combined = [...selectedFiles, ...newFiles].slice(0, 5);
    if (selectedFiles.length + newFiles.length > 5) {
      setError('Maximum 5 receipts allowed per batch. Excess files were ignored.');
    }
    setSelectedFiles(combined);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startBatchOcr = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least 1 receipt to scan.');
      return;
    }
    setLoading(true);
    setError('');
    setElapsedMs(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);

    try {
      const response = await api.agency.batchOcrReceipts(selectedFiles);
      clearInterval(timerRef.current);
      setElapsedMs(response.total_latency_ms || (Date.now() - startTime));
      setBatchResult(response);

      // Pre-fill editable state for each extracted receipt
      const formatted = (response.items || []).map((item, idx) => ({
        ...item,
        trip_id: '',
        preview_url: previews[idx]?.url || '',
        status: item.status === 'Failed' ? 'Failed' : 'Pending',
        approved_by: 'Pending'
      }));
      setExtractedItems(formatted);
    } catch (err) {
      clearInterval(timerRef.current);
      setError(err.message || 'Batch OCR extraction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'amount') {
        const amt = parseFloat(value) || 0;
        updated[index].gst = parseFloat((amt * 0.18).toFixed(2));
      }
      return updated;
    });
  };

  const removeItemFromBatch = (index) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    const validItems = extractedItems.filter(it => it.status !== 'Failed');
    if (validItems.length === 0) {
      setError('No valid extracted items to save.');
      return;
    }

    setSavingBatch(true);
    setError('');

    try {
      const payload = validItems.map(it => ({
        trip_id: it.trip_id ? parseInt(it.trip_id) : null,
        amount: parseFloat(it.amount) || 0,
        gst: parseFloat(it.gst) || 0,
        vendor: it.vendor || 'Unknown Vendor',
        category: it.category || 'Miscellaneous',
        date: it.date || new Date().toISOString().split('T')[0],
        time: it.time || '12:00:00',
        description: it.description || `${it.category} expense at ${it.vendor}`,
        payment_mode: it.payment_mode || 'UPI',
        approved_by: 'Pending',
        status: 'Pending',
        receipt_image: it.filename || 'receipt.jpg',
        ocr_extracted_data: JSON.stringify({
          receipt_id: it.receipt_id,
          confidence_score: it.confidence_score,
          raw_json_file: it.raw_json_file
        })
      }));

      await api.agency.createExpenseBatch(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save batch expenses to database.');
    } finally {
      setSavingBatch(false);
    }
  };

  const totalBatchAmount = extractedItems
    .filter(it => it.status !== 'Failed')
    .reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1050px',
        maxHeight: '92vh',
        boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)',
          padding: '22px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Icons.Zap size={13} style={{ color: '#FDE047' }} /> Parallel OCR Engine
              </span>
              <span style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 600 }}>
                ⚡ Sub 2-3s Target SLA
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 2px', color: '#FFFFFF' }}>
              AI Receipt & Bill Extraction
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              Upload up to 5 receipts simultaneously. Extracted to JSON, filtered, and filled automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading || savingBatch}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 12px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            margin: '16px 28px 0',
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            color: '#B91C1C',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Icons.AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{error}</div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* STEP 1: Upload View (when no extraction has run yet) */}
          {!batchResult && !loading && (
            <div>
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files) handleFilesChosen(e.dataTransfer.files);
                }}
                style={{
                  border: '2px dashed #94A3B8',
                  borderRadius: '16px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) handleFilesChosen(e.target.files);
                  }}
                />
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}>
                  <Icons.UploadCloud size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                    Drag & drop receipts or click to select
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                    Support for fuel receipts, toll tickets, hotel bills, food checks (up to 5 images)
                  </p>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  background: '#E2E8F0',
                  padding: '4px 10px',
                  borderRadius: '20px'
                }}>
                  JPG, PNG, WebP • Max 10MB each
                </span>
              </div>

              {/* Selected Files Preview List */}
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                      Selected Receipts ({selectedFiles.length} / 5)
                    </h4>
                    <button
                      onClick={() => setSelectedFiles([])}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                    {previews.map((item, idx) => (
                      <div key={idx} style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        position: 'relative'
                      }}>
                        <div style={{ height: '110px', background: '#F1F5F9', position: 'relative' }}>
                          <img
                            src={item.url}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            onClick={() => removeFile(idx)}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              color: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Icons.X size={13} />
                          </button>
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.size}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Loading State (Live Timer & Parallel Worker Animation) */}
          {loading && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <Icons.Loader
                  className="animate-spin"
                  size={80}
                  style={{ color: '#2563EB', opacity: 0.25 }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}>
                  <Icons.Zap size={36} />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                  Processing {selectedFiles.length} Receipts in Parallel
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  Executing multimodal vision model, archiving raw JSON, and distilling expense fields...
                </p>
              </div>

              {/* Real-time timer badge */}
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '30px',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icons.Clock size={16} /> Elapsed: {elapsedMs}ms
                {elapsedMs <= 3000 ? (
                  <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '12px' }}>
                    Within 2–3s SLA ⚡
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '12px' }}>
                    Exceeded SLA
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Filtered Review Grid (Shown upon completion) */}
          {batchResult && !loading && (
            <div>
              {/* Timing & Summary Banner */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '12px',
                padding: '14px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#22C55E',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icons.Check size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>
                      Extracted {batchResult.success_count} of {batchResult.count} Receipts Successfully
                    </div>
                    <div style={{ fontSize: '12px', color: '#15803D' }}>
                      💾 Full raw extractions archived into <code style={{ background: '#DCFCE7', padding: '1px 5px', borderRadius: '4px' }}>backend/data/ocr/</code>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Icons.Zap size={14} style={{ color: '#16A34A' }} /> Total Execution: {batchResult.total_latency_ms}ms ({(batchResult.total_latency_ms / 1000).toFixed(2)}s)
                </div>
              </div>

              {/* Items Card List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {extractedItems.map((item, idx) => (
                  <div key={idx} style={{
                    border: item.status === 'Failed' ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                    borderRadius: '14px',
                    background: item.status === 'Failed' ? '#FEF2F2' : '#FFFFFF',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: '18px',
                    alignItems: 'start'
                  }}>
                    {/* Left: Thumbnail Preview */}
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => item.preview_url && setPreviewImageModal(item.preview_url)}
                        style={{
                          height: '130px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#F1F5F9',
                          cursor: 'pointer',
                          border: '1px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {item.preview_url ? (
                          <img
                            src={item.preview_url}
                            alt={item.filename}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Icons.FileText size={32} style={{ color: '#94A3B8' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', textAlign: 'center', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.filename}
                      </div>
                      {item.confidence_score && (
                        <div style={{
                          marginTop: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textAlign: 'center',
                          color: '#1E40AF',
                          background: '#DBEAFE',
                          borderRadius: '10px',
                          padding: '2px 4px'
                        }}>
                          {(item.confidence_score * 100).toFixed(0)}% Confidence
                        </div>
                      )}
                    </div>

                    {/* Right: Filtered Required Fields Form */}
                    <div>
                      {item.status === 'Failed' ? (
                        <div style={{ padding: '20px 0' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626', marginBottom: '4px' }}>
                            Extraction Failed
                          </div>
                          <div style={{ fontSize: '12px', color: '#B91C1C' }}>
                            {item.error || 'The receipt image could not be processed.'}
                          </div>
                          <button
                            onClick={() => removeItemFromBatch(idx)}
                            style={{
                              marginTop: '10px',
                              background: '#FEE2E2',
                              border: '1px solid #FCA5A5',
                              color: '#991B1B',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Remove from Batch
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Row 1: Vendor + Category */}
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Vendor / Merchant *
                              </label>
                              <input
                                type="text"
                                value={item.vendor || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'vendor', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#0F172A',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Category *
                              </label>
                              <select
                                value={item.category || 'Miscellaneous'}
                                onChange={(e) => handleItemFieldChange(idx, 'category', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  background: '#FFFFFF',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Amount + GST + Payment Mode */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Total Amount (₹) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'amount', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: '#1D4ED8',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                GST (₹)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.gst || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'gst', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Payment Mode
                              </label>
                              <select
                                value={item.payment_mode || 'UPI'}
                                onChange={(e) => handleItemFieldChange(idx, 'payment_mode', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  background: '#FFFFFF',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Row 3: Date + Linked Tour + Description */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Date *
                              </label>
                              <input
                                type="date"
                                value={item.date || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'date', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Linked Tour
                              </label>
                              <select
                                value={item.trip_id || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'trip_id', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  background: '#FFFFFF',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <option value="">General Agency</option>
                                {tours.map(t => (
                                  <option key={t.trip_id} value={t.trip_id}>
                                    #{t.trip_id} — {t.destination}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Description / Notes
                              </label>
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>

                          {/* Action row per card */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                              JSON archive: <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: '4px' }}>{item.raw_json_file}</code>
                            </span>
                            <button
                              onClick={() => removeItemFromBatch(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#DC2626',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Icons.Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 28px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {batchResult && (
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Total Verified:{' '}
                <span style={{ color: '#2563EB', fontSize: '17px' }}>
                  ₹{totalBatchAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748B', marginLeft: '8px' }}>
                  ({extractedItems.filter(it => it.status !== 'Failed').length} expenses)
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || savingBatch}
              style={{
                padding: '10px 18px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            {!batchResult ? (
              <button
                type="button"
                onClick={startBatchOcr}
                disabled={loading || selectedFiles.length === 0}
                style={{
                  padding: '10px 22px',
                  border: 'none',
                  borderRadius: '8px',
                  background: selectedFiles.length === 0 ? '#94A3B8' : 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: selectedFiles.length > 0 ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'
                }}
              >
                <Icons.Zap size={15} style={{ color: '#FDE047' }} />
                Scan {selectedFiles.length > 0 ? selectedFiles.length : ''} Receipt{selectedFiles.length === 1 ? '' : 's'} (Parallel AI)
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setBatchResult(null);
                    setSelectedFiles([]);
                  }}
                  disabled={savingBatch}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#1E293B',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Scan More
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={savingBatch || extractedItems.filter(it => it.status !== 'Failed').length === 0}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: savingBatch ? '#93C5FD' : '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: savingBatch ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  {savingBatch ? (
                    <><Icons.Loader className="animate-spin" size={15} /> Saving...</>
                  ) : (
                    <><Icons.CheckCircle2 size={15} /> Save All {extractedItems.filter(it => it.status !== 'Failed').length} Expenses</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full Image Preview Modal */}
        {previewImageModal && (
          <div
            onClick={() => setPreviewImageModal(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <img
                src={previewImageModal}
                alt="Receipt Preview"
                style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
              />
              <button
                onClick={() => setPreviewImageModal(null)}
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '-14px',
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#0F172A',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
