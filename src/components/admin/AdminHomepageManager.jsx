import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Save, CheckCircle2, Sparkles, Sliders } from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminHomepageManager = () => {
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const cfg = await storeService.getHomepageConfig();
      const stg = await storeService.getSettings();
      setConfig(cfg);
      setSettings(stg);
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await storeService.updateHomepageConfig(config);
      await storeService.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert('Error updating homepage configuration: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!config || !settings) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#8F7263' }}>Loading homepage configuration...</div>;
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Homepage Merchandiser & Content Manager
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8F7263', margin: 0 }}>
            Configure editorial headlines, trust indicators, promotional banners, and storytelling chapters without modifying code.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.35rem',
            backgroundColor: savedSuccess ? '#525B3A' : '#4B3024',
            border: 'none',
            borderRadius: '3px',
            color: '#FAF6EE',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer'
          }}
        >
          {savedSuccess ? <CheckCircle2 size={15} /> : <Save size={15} />}
          <span>{savedSuccess ? 'Changes Published!' : isSaving ? 'Publishing...' : 'Publish to Storefront'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Card 1: Hero Section */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem', margin: 0 }}>
            1. Hero Cinematic Composition & Copy
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Hero Eyebrow Hallmark
              </label>
              <input
                type="text"
                value={config.heroEyebrow}
                onChange={(e) => setConfig({ ...config, heroEyebrow: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Verified Sarees Sold Counter
              </label>
              <input
                type="number"
                value={settings.sareesSoldCount}
                onChange={(e) => setSettings({ ...settings, sareesSoldCount: parseInt(e.target.value, 10) || 0 })}
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
              Main Cinematic Headline
            </label>
            <input
              type="text"
              value={config.heroHeadline}
              onChange={(e) => setConfig({ ...config, heroHeadline: e.target.value })}
              style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
              Supporting Text
            </label>
            <textarea
              rows={3}
              value={config.heroSubtext}
              onChange={(e) => setConfig({ ...config, heroSubtext: e.target.value })}
              style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Card 2: Bestsellers & Most Coveted Merchandising */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem', margin: 0 }}>
            2. Curated Sections & Promotions
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
              Best Sellers Promotional Banner Message
            </label>
            <input
              type="text"
              value={config.bestsellersPromo}
              onChange={(e) => setConfig({ ...config, bestsellersPromo: e.target.value })}
              placeholder="e.g. Complimentary Handcrafted Zari Blouse Fabric with select heirloom editions"
              style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Most Coveted Section Title
              </label>
              <input
                type="text"
                value={config.mostCovetedTitle}
                onChange={(e) => setConfig({ ...config, mostCovetedTitle: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                New Arrivals Section Title
              </label>
              <input
                type="text"
                value={config.newArrivalsTitle}
                onChange={(e) => setConfig({ ...config, newArrivalsTitle: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Storytelling Chapters Visibility */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem', margin: 0 }}>
            3. Code-Generated Storytelling Chapters Visibility
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', color: '#4B3024', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.isNatureChapterVisible}
                onChange={(e) => setConfig({ ...config, isNatureChapterVisible: e.target.checked })}
              />
              <span><strong>Chapter 1: Born from Nature</strong> (Cotton bolls, soil, and organic fiber journey)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', color: '#4B3024', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.isColourChapterVisible}
                onChange={(e) => setConfig({ ...config, isColourChapterVisible: e.target.checked })}
              />
              <span><strong>Chapter 2: Colours of the Earth</strong> (Interactive 7-tone botanical pigment selector)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', color: '#4B3024', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.isCraftChapterVisible}
                onChange={(e) => setConfig({ ...config, isCraftChapterVisible: e.target.checked })}
              />
              <span><strong>Chapter 3: The Hands Behind the Craft</strong> (Artisan teakwood carving & mud-resist gestures)</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
