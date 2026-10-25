import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Phone, Mail, Shield, Sparkles, Database } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { authService } from '../../services/authService';

export const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await storeService.getSettings();
      setSettings(data);
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await storeService.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#8F7263' }}>Loading store settings...</div>;
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Store Settings & WhatsApp Integration
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8F7263', margin: 0 }}>
            Configure your verified business contact numbers, shipping rules, and platform credentials.
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
          <span>{savedSuccess ? 'Settings Saved!' : isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Card 1: WhatsApp Ordering Configuration */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem' }}>
            <Phone size={18} color="#525B3A" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
              1. WhatsApp Business Ordering Concierge
            </h3>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#8F7263', margin: 0 }}>
            When patrons click <strong>"Proceed to WhatsApp"</strong> from their bag or <strong>"Enquire on WhatsApp"</strong> on a saree page, prefilled order inquiries will be directed to this exact number.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                WhatsApp Business Number (Include Country Code without +)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="e.g. 919490658858"
                required
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#8F7263', marginTop: '0.25rem', display: 'block' }}>
                Example for India (+91): <code>919490658858</code>
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Concierge Contact Email
              </label>
              <input
                type="email"
                value={settings.conciergeEmail}
                onChange={(e) => setSettings({ ...settings, conciergeEmail: e.target.value })}
                placeholder="concierge@rodhe.in"
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Financial & Shipping Thresholds */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem', margin: 0 }}>
            2. Shipping, Packaging & Header Announcement
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Free Shipping Threshold (₹ INR)
              </label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                min="0"
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Standard Shipping Fee (₹ INR)
              </label>
              <input
                type="number"
                value={settings.standardShippingFee}
                onChange={(e) => setSettings({ ...settings, standardShippingFee: parseFloat(e.target.value) || 0 })}
                min="0"
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                Signature Gift Wrap (₹ INR)
              </label>
              <input
                type="number"
                value={settings.giftWrapFee}
                onChange={(e) => setSettings({ ...settings, giftWrapFee: parseFloat(e.target.value) || 0 })}
                min="0"
                style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
              Top Announcement Bar Message
            </label>
            <input
              type="text"
              value={settings.announcementText}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Card 3: Cloud Database Connectivity */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="#B88D4A" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
              3. Database Infrastructure (Supabase)
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#8F7263', margin: 0, lineHeight: 1.6 }}>
            Status: <strong>{isSupabaseConfigured ? 'Active & Synchronized' : 'Local Persistence Engine Active'}</strong>.
            Database table: <code>public.admin_users</code> manages CRM administrator credentials with initial username <code>rodhe</code> and password <code>rodhe@admin</code>.
          </p>
        </div>

        {/* Card 4: Administrator Security & Password Management */}
        <AdminSecuritySection />
      </form>
    </div>
  );
};

const AdminSecuritySection = () => {
  const [currentUsername, setCurrentUsername] = useState('rodhe');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [secSuccess, setSecSuccess] = useState('');
  const [secError, setSecError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecError('');
    setSecSuccess('');

    if (!newPassword || newPassword.length < 4) {
      setSecError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecError('New password and confirm password do not match.');
      return;
    }

    setSecLoading(true);
    try {
      const res = await authService.resetPassword(currentUsername, newPassword);
      if (res.success) {
        setSecSuccess(res.message || 'Password successfully updated!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecError(res.message || 'Unable to update password.');
      }
    } catch (err) {
      setSecError('Failed to update password: ' + err.message);
    } finally {
      setSecLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFDF9', padding: '1.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.5rem' }}>
        <Shield size={18} color="#B88D4A" />
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
          4. Administrator Security & Password Management
        </h3>
      </div>

      <p style={{ fontSize: '0.78rem', color: '#8F7263', margin: 0 }}>
        Active CRM Account: <strong>{currentUsername}</strong>. You can change your password below; it updates immediately in the database and local session.
      </p>

      {secError && (
        <div style={{ backgroundColor: 'rgba(201, 130, 120, 0.15)', border: '1px solid #C98278', color: '#8A2A20', padding: '0.65rem 0.9rem', borderRadius: '3px', fontSize: '0.78rem' }}>
          {secError}
        </div>
      )}

      {secSuccess && (
        <div style={{ backgroundColor: 'rgba(78, 115, 65, 0.15)', border: '1px solid #7A9E6E', color: '#284E1F', padding: '0.65rem 0.9rem', borderRadius: '3px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <CheckCircle2 size={15} />
          <span>{secSuccess}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            style={{ width: '100%', padding: '0.7rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handlePasswordChange}
          disabled={secLoading || !newPassword}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: '#4B3024',
            color: '#FAF6EE',
            border: 'none',
            borderRadius: '3px',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: secLoading || !newPassword ? 'not-allowed' : 'pointer',
            opacity: secLoading || !newPassword ? 0.6 : 1
          }}
        >
          <span>{secLoading ? 'Updating Database...' : 'Update Password'}</span>
        </button>
      </div>
    </div>
  );
};
