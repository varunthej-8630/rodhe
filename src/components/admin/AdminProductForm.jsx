import React, { useState } from 'react';
import { ArrowLeft, Save, Eye, Sparkles, Image, CheckCircle2 } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { useShop } from '../../context/ShopContext';
import { ImageUploadField } from './ImageUploadField';

export const AdminProductForm = ({ product, onSaveComplete, onCancel }) => {
  const isEditing = Boolean(product && product.id);
  const { refreshProducts } = useShop();

  const [formData, setFormData] = useState({
    id: product?.id || `rodhe-saree-${Date.now()}`,
    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || `RODHE-SAR-${Math.floor(100 + Math.random() * 900)}`,
    tagline: product?.tagline || '',
    description: product?.description || '',
    craftStory: product?.craftStory || '',
    craft: product?.craft || 'Handblock Print',
    craftCategory: product?.craftCategory || 'handblock',
    fabric: product?.fabric || '100% Organic Mulmul Cotton',
    fabricType: product?.fabricType || 'mulmul',
    color: product?.color || 'Indigo Blue',
    colorFamily: product?.colorFamily || 'indigo',
    colorHex: product?.colorHex || '#26425A',
    originalPrice: product?.originalPrice ? Number(product.originalPrice) : null,
    price: Number(product?.price ?? product?.sellingPrice ?? product?.selling_price ?? 1250) || 1250,
    dimensions: product?.dimensions || 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 46 inches • Weight: 390 g',
    blousePiece: product?.blousePiece || 'Included — Running matching fabric with woven zari border',
    washCare: product?.washCare || 'Dry clean recommended for the first wash. Subsequent gentle cold water hand wash.',
    badge: product?.badge || '',
    stockCount: product?.stockCount ?? 8,
    isBestseller: Boolean(product?.isBestseller),
    isMostCoveted: Boolean(product?.isMostCoveted),
    isNewArrival: Boolean(product?.isNewArrival ?? true),
    featured: Boolean(product?.featured ?? true),
    status: product?.status || 'published',
    primaryImage: product?.primaryImage || '/assets/products/saree_indigo_shibori.jpg',
    secondaryImage: product?.secondaryImage || '/assets/products/saree_indigo_shibori_detail.jpg',
    gallery: product?.gallery || [
      product?.primaryImage || '/assets/products/saree_indigo_shibori.jpg',
      product?.secondaryImage || '/assets/products/saree_indigo_shibori_detail.jpg'
    ]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-generate slug when name changes if not manually set
  const handleNameChange = (val) => {
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug === generatedSlug.slice(0, -1) ? generatedSlug : prev.slug
    }));
  };

  const discountPercent = formData.originalPrice > formData.price 
    ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100) 
    : 0;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        gallery: [formData.primaryImage, formData.secondaryImage].filter(Boolean)
      };
      await storeService.saveProduct(payload);
      if (refreshProducts) {
        await refreshProducts();
      }
      setSaveSuccess(true);
      setTimeout(() => {
        onSaveComplete();
      }, 700);
    } catch (err) {
      alert('Error saving product: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.85rem',
            backgroundColor: '#FFFDF9',
            border: '1px solid rgba(75, 48, 36, 0.2)',
            borderRadius: '3px',
            color: '#4B3024',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Saree List</span>
        </button>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: 0 }}>
          {isEditing ? `Edit Saree: ${formData.name || 'Untitled'}` : 'Add New Handcrafted Saree'}
        </h2>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
            style={{
              padding: '0.6rem 1rem',
              backgroundColor: '#FAF6EE',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#4B3024',
              cursor: 'pointer'
            }}
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.4rem',
              backgroundColor: saveSuccess ? '#525B3A' : '#4B3024',
              border: 'none',
              borderRadius: '3px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#FAF6EE',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {saveSuccess ? <CheckCircle2 size={15} /> : <Save size={15} />}
            <span>{saveSuccess ? 'Saved!' : isSaving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Basic Identifiers */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem', margin: 0 }}>
            1. Saree Identity & Headline
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Saree Title *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Nilambari Shibori Mulmul Saree"
                required
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Unique SKU *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. RODHE-SHI-001"
                required
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
              Short Tagline (Shown on cards & preview)
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. Hand-knotted natural indigo tie-dye on gossamer organic cotton"
              style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
              Full Editorial Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the tactile drape, the natural dyes, weave characteristics, and mood..."
              style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
              Craft Heritage & Artisan Story
            </label>
            <textarea
              rows={3}
              value={formData.craftStory}
              onChange={(e) => setFormData({ ...formData, craftStory: e.target.value })}
              placeholder="Explain the human touch behind the piece (e.g. 5 days of Dabu mud resist, wooden block alignment)..."
              style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Section 2: Pricing, Stock, and Craft Classification */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem', margin: 0 }}>
            2. Pricing, Inventory & Craft Specifications
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Original Price (₹ INR) *
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                min="0"
                required
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Selling Price (₹ INR) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min="0"
                required
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
              {discountPercent > 0 && (
                <span style={{ fontSize: '0.72rem', color: '#C98278', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                  {discountPercent}% promotional discount
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Stock Available *
              </label>
              <input
                type="number"
                value={formData.stockCount}
                onChange={(e) => setFormData({ ...formData, stockCount: parseInt(e.target.value, 10) || 0 })}
                min="0"
                required
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Craft Category
              </label>
              <select
                value={formData.craftCategory}
                onChange={(e) => setFormData({ ...formData, craftCategory: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', backgroundColor: '#FFFDF9' }}
              >
                <option value="tie-dye">Tie & Dye</option>
                <option value="handblock">Handblock Bagru</option>
                <option value="chanderi">Chanderi Silk</option>
                <option value="mulmul">Mulmul Cotton</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Color Family
              </label>
              <select
                value={formData.colorFamily}
                onChange={(e) => setFormData({ ...formData, colorFamily: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', backgroundColor: '#FFFDF9' }}
              >
                <option value="indigo">Indigo Blue</option>
                <option value="ivory">Raw Ivory</option>
                <option value="olive">Forest Olive</option>
                <option value="earth">Earth Clay</option>
                <option value="gold">Muted Gold</option>
                <option value="rose">Soft Rose</option>
                <option value="madder">Madder Red</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Badge (e.g. Bestseller, Heirloom)
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. Signature Saree"
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Merchandising Toggles */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid rgba(75, 48, 36, 0.08)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#4B3024', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isBestseller}
                onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
              />
              <span>Feature in <strong>Best Sellers</strong> section</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#4B3024', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isMostCoveted}
                onChange={(e) => setFormData({ ...formData, isMostCoveted: e.target.checked })}
              />
              <span>Feature in <strong>Most Coveted</strong> section</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#4B3024', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
              />
              <span>Tag as <strong>New Arrival</strong></span>
            </label>
          </div>
        </div>

        {/* Section 3: Photography & Media Assets */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
              3. Photography & Media Assets
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#8F7263', margin: '0.25rem 0 0 0' }}>
              Upload authentic artisan photography directly from your computer (Drag & drop or browse) or view/edit path references.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(75, 48, 36, 0.08)' }}>
            <ImageUploadField
              label="Primary Saree Image"
              required={true}
              helperText="Main drape photograph shown on collection grids and product page"
              value={formData.primaryImage}
              onChange={(newUrl) => setFormData(prev => ({
                ...prev,
                primaryImage: newUrl,
                gallery: [newUrl, prev.secondaryImage].filter(Boolean)
              }))}
            />

            <ImageUploadField
              label="Secondary Detail / Pallu Image"
              required={false}
              helperText="Close-up detail shot of zari border, pallu tassels, or weave craft"
              value={formData.secondaryImage}
              onChange={(newUrl) => setFormData(prev => ({
                ...prev,
                secondaryImage: newUrl,
                gallery: [prev.primaryImage, newUrl].filter(Boolean)
              }))}
            />
          </div>
        </div>
      </form>
    </div>
  );
};
