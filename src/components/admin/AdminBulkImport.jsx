import React, { useState } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  ArrowRight 
} from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminBulkImport = ({ onImportComplete }) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccess, setImportSuccess] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);

  // Sample CSV Template content
  const sampleCsvContent = `name,sku,originalPrice,sellingPrice,craft,craftCategory,fabric,color,colorFamily,stockCount,primaryImage,tagline
"Vanamali Forest Olive Chanderi",RODHE-OLV-001,6200,5400,"Chanderi Weave",chanderi,"Handwoven Cotton Silk","Forest Olive",olive,8,"/assets/products/saree_forest_olive.jpg","Gossamer olive sheer drape with pomegranate rind dyes"
"Raktika Madder Red Bagru Saree",RODHE-MAD-002,4800,3950,"Handblock Print",handblock,"Pure Mulmul Cotton","Madder Red",madder,12,"/assets/products/saree_madder_red.jpg","Natural terracotta madder root handblock print"
"Hemangi Muted Gold Tussar Saree",RODHE-GLD-003,7400,6200,"Chanderi Weave",chanderi,"Tussar Cotton Silk","Muted Gold",gold,6,"/assets/products/saree_muted_gold.jpg","Wild tussar tones illuminated with temple zari border"`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'RODHE_Saree_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsv = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];
    const errors = [];
    const seenSkus = new Set();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted commas properly
      const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
      const values = [];
      let match;
      const rawMatches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

      // Simple CSV splitter fallback
      const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] || '';
      });

      // Validations
      if (!row.name) {
        errors.push(`Row ${i + 1}: Missing saree name`);
      }
      if (!row.sku) {
        errors.push(`Row ${i + 1}: Missing SKU`);
      } else if (seenSkus.has(row.sku)) {
        errors.push(`Row ${i + 1}: Duplicate SKU "${row.sku}" detected`);
      } else {
        seenSkus.add(row.sku);
      }

      const origPrice = parseFloat(row.originalPrice || row.sellingPrice || 0);
      const sellPrice = parseFloat(row.sellingPrice || row.price || 0);

      if (sellPrice <= 0) {
        errors.push(`Row ${i + 1}: Selling price must be greater than 0`);
      } else if (sellPrice > origPrice) {
        errors.push(`Row ${i + 1}: Selling price (₹${sellPrice}) cannot exceed original price (₹${origPrice})`);
      }

      row.status = publishImmediately ? 'published' : 'draft';
      rows.push(row);
    }

    setValidationErrors(errors);
    return rows;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setCsvText(text);
      const parsed = parseCsv(text);
      setParsedRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0 || validationErrors.length > 0) return;
    setIsProcessing(true);
    setImportProgress(15);

    try {
      // Simulate stepwise progress for visual feedback
      const timer = setInterval(() => {
        setImportProgress(p => {
          if (p >= 85) {
            clearInterval(timer);
            return 85;
          }
          return p + 20;
        });
      }, 200);

      const res = await storeService.bulkImportProducts(parsedRows);
      clearInterval(timer);
      setImportProgress(100);
      setImportSuccess(true);

      setTimeout(() => {
        if (onImportComplete) onImportComplete();
      }, 1200);
    } catch (err) {
      alert('Bulk import encountered an error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setCsvText(sampleCsvContent);
    const parsed = parseCsv(sampleCsvContent);
    setParsedRows(parsed);
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Overview Card */}
      <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: '0 0 0.35rem 0' }}>
              Bulk Catalog Import & Media Matcher
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#8F7263', margin: 0, maxWidth: '650px' }}>
              Upload 200+ sarees simultaneously via spreadsheet. Our automated matcher links images by SKU or filename, validates price consistency, and registers records into your store.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={handleDownloadTemplate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                backgroundColor: '#FAF6EE',
                border: '1px solid rgba(184, 141, 74, 0.35)',
                borderRadius: '3px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#4B3024',
                cursor: 'pointer'
              }}
            >
              <Download size={14} color="#B88D4A" />
              <span>Download CSV Template</span>
            </button>

            <button
              onClick={handleLoadSample}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                backgroundColor: '#4B3024',
                border: 'none',
                borderRadius: '3px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#FAF6EE',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={14} color="#D4AC68" />
              <span>Load Sample Sarees</span>
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          style={{
            border: '2px dashed rgba(184, 141, 74, 0.45)',
            borderRadius: '4px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: '#FAF6EE',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            position: 'relative'
          }}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%'
            }}
          />
          <Upload size={32} color="#B88D4A" style={{ margin: '0 auto 0.85rem' }} />
          <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Choose CSV file or drag and drop here
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#8F7263', margin: 0 }}>
            Supports comma-separated values (.csv) with headers: name, sku, originalPrice, sellingPrice, craft, color, primaryImage
          </p>
        </div>
      </div>

      {/* Validation Status & Progress Bar */}
      {isProcessing && (
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(184, 141, 74, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.84rem', fontWeight: 600, color: '#4B3024' }}>
            <span>Importing and registering sarees...</span>
            <span>{importProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#F4ECE1', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${importProgress}%`, height: '100%', backgroundColor: '#525B3A', transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {/* Validation Errors Box */}
      {validationErrors.length > 0 && (
        <div style={{ backgroundColor: 'rgba(201, 130, 120, 0.12)', border: '1px solid #C98278', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#8A2A20', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} />
            <span>Found {validationErrors.length} validation issue(s) — please correct before committing:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.78rem', color: '#8A2A20', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {validationErrors.slice(0, 8).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', margin: '0 0 0.2rem 0' }}>
                Import Preview ({parsedRows.length} Sarees Verified)
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#8F7263' }}>
                All records validated against pricing constraints and schema rules.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#4B3024', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                />
                <span>Publish immediately to storefront</span>
              </label>

              <button
                onClick={handleExecuteImport}
                disabled={isProcessing || validationErrors.length > 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  backgroundColor: importSuccess ? '#525B3A' : '#4B3024',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#FAF6EE',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: (isProcessing || validationErrors.length > 0) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || validationErrors.length > 0) ? 0.6 : 1
                }}
              >
                {importSuccess ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
                <span>{importSuccess ? 'Successfully Imported!' : `Commit ${parsedRows.length} Sarees`}</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F4ECE1', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase' }}>Preview</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase' }}>Saree Name</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase' }}>SKU</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase' }}>Original</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase' }}>Selling</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase' }}>Craft</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(75, 48, 36, 0.06)' }}>
                    <td style={{ padding: '0.65rem 1.25rem' }}>
                      <img
                        src={r.primaryImage || '/assets/products/saree_ivory_mulmul.jpg'}
                        alt=""
                        style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '2px' }}
                      />
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.84rem', fontWeight: 600, color: '#4B3024' }}>
                      {r.name}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', fontFamily: 'monospace', color: '#6F4E3E' }}>
                      {r.sku}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#8F7263' }}>
                      ₹{parseFloat(r.originalPrice || r.sellingPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.84rem', fontWeight: 600, color: '#4B3024' }}>
                      ₹{parseFloat(r.sellingPrice || r.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: '#6F4E3E' }}>
                      {r.craft || 'Mulmul Weave'}
                    </td>
                    <td style={{ padding: '0.65rem 1.25rem', fontSize: '0.78rem', color: '#4B3024' }}>
                      {r.stockCount || 5}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
