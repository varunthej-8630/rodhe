import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { useShop } from '../../context/ShopContext';

export const AdminCollections = () => {
  const { navigateTo } = useShop();
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    bannerImage: '',
    displayOrder: 0,
    isPublished: true
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cols, prods] = await Promise.all([
        storeService.getCollections(),
        storeService.getProducts()
      ]);
      setCollections(cols);
      setProducts(prods);
    } catch (err) {
      console.warn('Error loading collections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCollection(null);
    setFormData({
      id: '',
      name: '',
      slug: '',
      description: '',
      bannerImage: '',
      displayOrder: collections.length + 1,
      isPublished: true
    });
    setErrorMsg('');
    setIsCreating(true);
  };

  const openEditModal = (col) => {
    setEditingCollection(col);
    setFormData({
      id: col.id,
      name: col.name,
      slug: col.slug,
      description: col.description || '',
      bannerImage: col.bannerImage || col.banner_image || '',
      displayOrder: col.displayOrder ?? col.display_order ?? 0,
      isPublished: col.isPublished ?? col.is_published ?? true
    });
    setErrorMsg('');
    setIsCreating(true);
  };

  const handleNameChange = (name) => {
    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingCollection || prev.slug === '' ? generatedSlug : prev.slug
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setErrorMsg('Collection Name and URL slug are required.');
      return;
    }

    try {
      await storeService.saveCollection(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsCreating(false);
        setEditingCollection(null);
      }, 600);
      loadData();
    } catch (err) {
      setErrorMsg('Failed to save collection: ' + err.message);
    }
  };

  const handleDelete = async (col) => {
    const assignedProducts = products.filter(p =>
      p.collectionId === col.id ||
      p.collection_id === col.id ||
      p.craftCategory === col.slug ||
      p.craft_category === col.slug
    );

    if (assignedProducts.length > 0) {
      alert(`Cannot delete collection "${col.name}" because it currently contains ${assignedProducts.length} saree(s). Please reassign or remove the sarees first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the collection "${col.name}"?`)) {
      await storeService.deleteCollection(col.id || col.slug);
      loadData();
    }
  };

  const handleTogglePublish = async (col) => {
    const updated = {
      ...col,
      isPublished: !(col.isPublished ?? col.is_published ?? true)
    };
    await storeService.saveCollection(updated);
    loadData();
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              Storefront Architecture
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Saree Collections & Craft Chapters
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#8F7263', margin: 0 }}>
            Organize handloom sarees into artisanal collections and botanical themes visible on the public boutique.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: '#4B3024',
            color: '#FAF6EE',
            border: 'none',
            borderRadius: '3px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#362219')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4B3024')}
        >
          <Plus size={16} />
          <span>Create New Collection</span>
        </button>
      </div>

      {/* Collections Table / Grid */}
      <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8F7263', fontSize: '0.88rem' }}>
            Loading boutique collections...
          </div>
        ) : collections.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8F7263' }}>
            <FolderTree size={36} color="#B88D4A" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4B3024', margin: '0 0 0.25rem' }}>No Collections Found</p>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>Create your first collection to organize your handcrafted sarees.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9F6F0', borderBottom: '1px solid rgba(75, 48, 36, 0.1)', color: '#4B3024' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Order</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Collection Name</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Slug / URL</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Sarees Assigned</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((col, idx) => {
                  const assignedCount = products.filter(p =>
                    p.collectionId === col.id ||
                    p.collection_id === col.id ||
                    p.craftCategory === col.slug ||
                    p.craft_category === col.slug
                  ).length;
                  const isPub = col.isPublished ?? col.is_published ?? true;

                  return (
                    <tr
                      key={col.id || col.slug || idx}
                      style={{
                        borderBottom: '1px solid rgba(75, 48, 36, 0.06)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FCF9F3')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.25rem', color: '#8F7263', fontWeight: 600 }}>
                        {col.displayOrder ?? col.display_order ?? idx + 1}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#4B3024' }}>{col.name}</div>
                        {col.description && (
                          <div style={{ fontSize: '0.74rem', color: '#8F7263', marginTop: '0.15rem', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {col.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <code style={{ fontSize: '0.78rem', backgroundColor: '#F4ECE1', padding: '0.2rem 0.45rem', borderRadius: '3px', color: '#6F4E3E' }}>
                          /{col.slug}
                        </code>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#F4ECE1', color: '#4B3024', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600 }}>
                          <Layers size={12} color="#B88D4A" />
                          {assignedCount} saree{assignedCount === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button
                          onClick={() => handleTogglePublish(col)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '3px',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            backgroundColor: isPub ? 'rgba(82, 91, 58, 0.15)' : 'rgba(111, 78, 62, 0.12)',
                            color: isPub ? '#3C432A' : '#6F4E3E'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isPub ? '#525B3A' : '#8F7263' }} />
                          {isPub ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                          <button
                            onClick={() => navigateTo('shop')}
                            title="Preview on Storefront"
                            style={{ padding: '0.4rem', border: 'none', background: 'none', color: '#6F4E3E', cursor: 'pointer' }}
                          >
                            <ExternalLink size={15} />
                          </button>
                          <button
                            onClick={() => openEditModal(col)}
                            title="Edit Collection"
                            style={{ padding: '0.4rem', border: 'none', background: 'none', color: '#4B3024', cursor: 'pointer' }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(col)}
                            title="Delete Collection"
                            style={{ padding: '0.4rem', border: 'none', background: 'none', color: '#C98278', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isCreating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(42, 26, 19, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 100
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreating(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFDF9',
              borderRadius: '4px',
              border: '1px solid rgba(184, 141, 74, 0.3)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#F9F6F0', borderBottom: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#4B3024', margin: 0 }}>
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </h3>
              <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: '#8F7263', cursor: 'pointer', padding: 0 }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {errorMsg && (
                <div style={{ backgroundColor: 'rgba(201, 130, 120, 0.15)', border: '1px solid #C98278', color: '#8A2A20', padding: '0.65rem 0.9rem', borderRadius: '3px', fontSize: '0.8rem' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Bagru Mud-Resist Reserve"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  placeholder="e.g. bagru-mud-resist"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the craft lineage, botanical dyes, or weave tradition..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.86rem', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                    Publish Status
                  </label>
                  <select
                    value={formData.isPublished ? 'published' : 'draft'}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.value === 'published' })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.86rem', boxSizing: 'border-box', backgroundColor: '#FFFDF9' }}
                  >
                    <option value="published">Published (Live on Store)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                  Banner Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                  placeholder="/assets/products/saree_indigo_shibori.jpg"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ padding: '0.6rem 1.15rem', backgroundColor: '#F4ECE1', border: 'none', borderRadius: '3px', fontSize: '0.82rem', fontWeight: 600, color: '#6F4E3E', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.35rem', backgroundColor: saveSuccess ? '#525B3A' : '#4B3024', color: '#FAF6EE', border: 'none', borderRadius: '3px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {saveSuccess ? 'Saved!' : editingCollection ? 'Update Collection' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCollections;
