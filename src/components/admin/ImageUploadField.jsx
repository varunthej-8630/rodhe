import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon, 
  ChevronDown, 
  ChevronUp, 
  Loader2 
} from 'lucide-react';
import { storeService } from '../../services/storeService';

export const ImageUploadField = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  helperText, 
  storageFolder = 'sarees' 
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(false);
    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Progress simulation for responsive UX feel
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 80 ? prev + 20 : prev));
      }, 150);

      const result = await storeService.uploadImage(file, storageFolder);

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (result && result.url) {
        onChange(result.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3500);
      }
    } catch (err) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this saree image?')) {
      onChange('');
      setUploadSuccess(false);
      setUploadError(null);
    }
  };

  const isDataUrl = value && value.startsWith('data:');
  const isLocalAsset = value && value.startsWith('/assets/');
  const isRemoteUrl = value && (value.startsWith('http://') || value.startsWith('https://'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Label and Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', letterSpacing: '0.04em' }}>
          {label} {required && <span style={{ color: '#C98278' }}>*</span>}
        </label>
        {value && (
          <span style={{ fontSize: '0.72rem', color: '#525B3A', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
            <CheckCircle2 size={12} color="#525B3A" />
            {isDataUrl ? 'Stored Persistently' : isLocalAsset ? 'Local Atelier Asset' : 'Cloud Stored'}
          </span>
        )}
      </div>

      {helperText && (
        <span style={{ fontSize: '0.72rem', color: '#8F7263', marginTop: '-0.2rem' }}>
          {helperText}
        </span>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {/* State A: Image Exists - Show Luxury Preview & Action Bar */}
      {value ? (
        <div
          style={{
            backgroundColor: '#FAF6EE',
            border: '1px solid rgba(184, 141, 74, 0.35)',
            borderRadius: '4px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Thumbnail Preview */}
            <div
              style={{
                position: 'relative',
                width: '90px',
                height: '115px',
                borderRadius: '3px',
                overflow: 'hidden',
                backgroundColor: '#2A1A13',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                flexShrink: 0
              }}
            >
              <img
                src={value}
                alt="Saree Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.backgroundColor = '#EADAB5';
                  }
                }}
              />
            </div>

            {/* Metadata & Actions */}
            <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.2rem' }}>
                  Saree Photograph Ready
                </div>
                <div 
                  title={value}
                  style={{ 
                    fontSize: '0.72rem', 
                    color: '#8F7263', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontFamily: 'monospace'
                  }}
                >
                  {isDataUrl ? 'base64:optimized-luxury-photo' : value}
                </div>
              </div>

              {/* Action Buttons: Replace & Remove */}
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    backgroundColor: '#FFFDF9',
                    border: '1px solid rgba(184, 141, 74, 0.45)',
                    borderRadius: '3px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#4B3024',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B88D4A')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(184, 141, 74, 0.45)')}
                >
                  <RefreshCw size={13} color="#B88D4A" />
                  <span>Replace Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.75rem',
                    backgroundColor: 'rgba(201, 130, 120, 0.1)',
                    border: '1px solid rgba(201, 130, 120, 0.3)',
                    borderRadius: '3px',
                    fontSize: '0.76rem',
                    fontWeight: 500,
                    color: '#A03A2C',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201, 130, 120, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201, 130, 120, 0.1)')}
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* State B: Empty - Interactive Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? '2px dashed #B88D4A' : '1.5px dashed rgba(184, 141, 74, 0.45)',
            backgroundColor: isDragging ? 'rgba(184, 141, 74, 0.08)' : '#FFFDF9',
            borderRadius: '4px',
            padding: '1.75rem 1.25rem',
            textAlign: 'center',
            cursor: isUploading ? 'wait' : 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
              <Loader2 size={26} color="#B88D4A" className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4B3024' }}>
                Optimizing & Uploading Saree Image ({uploadProgress}%)...
              </div>
              <div style={{ width: '160px', height: '4px', backgroundColor: 'rgba(75, 48, 36, 0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#B88D4A', transition: 'width 0.2s' }} />
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(184, 141, 74, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B88D4A'
                }}
              >
                <UploadCloud size={22} />
              </div>

              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.2rem' }}>
                  Click to Upload or Drag & Drop Saree Photo
                </div>
                <div style={{ fontSize: '0.74rem', color: '#8F7263' }}>
                  Supports JPG, JPEG, PNG, WebP • Max file size: 10MB
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  padding: '0.5rem 1.15rem',
                  backgroundColor: '#4B3024',
                  color: '#FAF6EE',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.25rem'
                }}
              >
                Browse Computer Files
              </button>
            </>
          )}
        </div>
      )}

      {/* Upload Success Alert */}
      {uploadSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.85rem',
            backgroundColor: 'rgba(82, 91, 58, 0.12)',
            border: '1px solid rgba(82, 91, 58, 0.3)',
            borderRadius: '3px',
            fontSize: '0.74rem',
            color: '#3B4329'
          }}
        >
          <CheckCircle2 size={14} color="#525B3A" />
          <span>Image uploaded and persisted successfully.</span>
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.85rem',
            backgroundColor: 'rgba(201, 130, 120, 0.12)',
            border: '1px solid rgba(201, 130, 120, 0.35)',
            borderRadius: '3px',
            fontSize: '0.74rem',
            color: '#A03A2C'
          }}
        >
          <AlertCircle size={14} color="#A03A2C" />
          <span style={{ flexGrow: 1 }}>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            style={{ background: 'none', border: 'none', color: '#A03A2C', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Collapsible Manual URL / Path Input for Power Users */}
      <div style={{ marginTop: '0.2rem' }}>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.25rem 0',
            fontSize: '0.72rem',
            color: '#8F7263',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            textDecoration: 'underline'
          }}
        >
          <LinkIcon size={11} />
          <span>{showManualUrl ? 'Hide manual path editor' : 'Or view / edit image path / URL manually'}</span>
          {showManualUrl ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {showManualUrl && (
          <div style={{ marginTop: '0.4rem', animation: 'fadeIn 0.2s ease' }}>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. /assets/products/saree_indigo_shibori.jpg or https://..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                fontSize: '0.76rem',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                borderRadius: '3px',
                backgroundColor: '#FFFDF9',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
