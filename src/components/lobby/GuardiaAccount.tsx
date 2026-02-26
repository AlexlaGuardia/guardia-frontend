"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import MyServicesSection from '../gio/MyServicesSection';

/**
 * GUARDIA ACCOUNT — Settings & Profile
 * 
 * 2B Calm aesthetic with slide-out profile editor
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.guardiacontent.com';

const getClientId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guardia_client_id') || localStorage.getItem('clientId');
  }
  return null;
};

// Desert Mirage Design System — references CSS custom properties
const tokens = {
  bg: {
    base: 'var(--bg-base)',
    surface: 'var(--bg-surface)',
    elevated: 'var(--bg-elevated)',
    overlay: 'var(--bg-surface)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-muted)',
  },
  accent: {
    primary: 'var(--accent)',
    glow: 'var(--accent-muted)',
  },
  status: {
    connected: '#22c55e',
    needs_refresh: '#f59e0b',
    limited: '#f59e0b',
    disconnected: 'var(--text-muted)',
  },
  tier: {
    spark: '#f59e0b',
    pro: '#3b82f6',
    unleashed: '#8b5cf6',
    free: 'var(--text-muted)',
  },
  shadow: {
    inset: '0 1px 3px rgba(0,0,0,0.08)',
    raised: 'var(--shadow-soft)',
    button: '0 1px 3px rgba(0,0,0,0.08)',
  }
};

// Types
interface IconProps { size?: number; color?: string; }

interface Connection {
  platform: string;
  handle?: string;
  display_name?: string;
  connected_at?: string;
  status: 'connected' | 'needs_refresh' | 'limited' | 'disconnected';
  days_until_expiry?: number | null;
  message?: string;
  needs_action?: boolean;
}

interface UserProfile {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  tier?: 'free' | 'spark' | 'pro' | 'unleashed';
  username: string;
  profile_image_url?: string;
}

// Icons
const Icons = {
  User: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="12" cy="8" r="4"/>
      <path d="M20 21a8 8 0 10-16 0"/>
    </svg>
  ),
  CreditCard: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M2 10h20"/>
    </svg>
  ),
  BarChart: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 20V10M18 20V4M6 20v-4"/>
    </svg>
  ),
  Bell: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  Shield: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  HelpCircle: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
      <circle cx="12" cy="17" r="0.5" fill={color}/>
    </svg>
  ),
  LogOut: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronRight: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  X: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Lock: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  Mail: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
    </svg>
  ),
  ChevronDown: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  Check: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  Camera: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Facebook: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  Instagram: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  TikTok: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.15a8.16 8.16 0 005.58 2.2v-3.45a4.85 4.85 0 01-1-.17 4.83 4.83 0 01-3.77-4.25V6.69h4.77z"/>
    </svg>
  ),
  LinkedIn: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  YouTube: ({ size = 24, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
};

// =============================================================================
// PROFILE PANEL (Slide-out editor)
// =============================================================================
interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

function ProfilePanel({ isOpen, onClose, profile, onSave }: ProfilePanelProps) {
  const [businessName, setBusinessName] = useState(profile?.business_name || '');
  const [contactName, setContactName] = useState(profile?.contact_name || '');
  const [contactEmail, setContactEmail] = useState(profile?.contact_email || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [imageUrl, setImageUrl] = useState(profile?.profile_image_url || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when profile changes
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setContactName(profile.contact_name || '');
      setContactEmail(profile.contact_email || '');
      setUsername(profile.username || '');
      setImageUrl(profile.profile_image_url || '');
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const jwt = localStorage.getItem('guardia_jwt');
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_BASE}/lobby/client/profile-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        business_name: businessName,
        contact_name: contactName,
        contact_email: contactEmail,
        username,
        profile_image_url: imageUrl,
      });
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  };

  const hasChanges = profile && (
    businessName !== profile.business_name ||
    contactName !== profile.contact_name ||
    contactEmail !== profile.contact_email ||
    username !== profile.username ||
    imageUrl !== (profile.profile_image_url || '')
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          background: 'var(--bg-surface)',
          boxShadow: isOpen ? '-4px 0 24px rgba(0,0,0,0.5)' : 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: tokens.shadow.button
            }}
          >
            <Icons.X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: imageUrl ? 'none' : `linear-gradient(145deg, ${tokens.accent.glow}, ${tokens.bg.elevated})`,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold" style={{ color: tokens.accent.primary }}>
                    {(contactName || businessName || 'U').charAt(0)}
                  </span>
                )}
              </div>
              
              {/* Upload button overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, #f59e0b, #d97706)',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
                }}
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icons.Camera size={14} color="white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">Tap to change photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-base)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)',
                  border: 'none'
                }}
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-base)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)',
                  border: 'none'
                }}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-base)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)',
                  border: 'none'
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-base)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)',
                  border: 'none'
                }}
                placeholder="username"
              />
            </div>
          </div>

        </div>

        {/* Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border-subtle)]" style={{ background: 'var(--bg-base)' }}>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
            style={{
              background: hasChanges 
                ? 'linear-gradient(145deg, #f59e0b, #d97706)' 
                : 'var(--bg-elevated)',
              boxShadow: hasChanges
                ? '0 2px 8px rgba(245,158,11,0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
                : 'inset 0 1px 2px rgba(0,0,0,0.3)',
              color: hasChanges ? 'white' : 'var(--text-muted)'
            }}
          >
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// PROFILE HEADER (clickable)
// =============================================================================
interface ProfileHeaderProps {
  name: string;
  email: string;
  imageUrl?: string;
  onClick: () => void;
}

const ProfileHeader = ({ name, email, imageUrl, onClick }: ProfileHeaderProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-5 rounded-2xl flex items-center gap-4 text-left transition-all active:scale-[0.99]"
      style={{
        background: 'var(--bg-surface)',
        boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}`
      }}
    >
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0"
        style={{
          background: imageUrl ? 'none' : `linear-gradient(145deg, ${tokens.accent.glow}, ${tokens.bg.elevated})`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span style={{ color: tokens.accent.primary }}>{name.charAt(0)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold truncate" style={{ color: tokens.text.primary }}>
          {name}
        </h2>
        <p className="text-sm truncate" style={{ color: tokens.text.tertiary }}>
          {email}
        </p>
      </div>

      {/* Edit indicator */}
      <Icons.ChevronRight size={20} color={tokens.text.tertiary} />
    </button>
  );
};

// =============================================================================
// USAGE STATS
// =============================================================================
interface UsageStatsProps {
  used: number;
  total: number;
  period: string;
}

const UsageStats = ({ used, total, period }: UsageStatsProps) => {
  const percentage = Math.round((used / total) * 100);
  
  return (
    <div 
      className="p-4 rounded-2xl"
      style={{ 
        background: 'var(--bg-surface)',
        boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}`
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium" style={{ color: tokens.text.secondary }}>Monthly Usage</h3>
        <span className="text-xs" style={{ color: tokens.text.tertiary }}>{period}</span>
      </div>
      
      {/* Progress track */}
      <div 
        className="h-2 rounded-full overflow-hidden mb-2"
        style={{ 
          background: 'var(--bg-base)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        <div 
          className="h-full rounded-full transition-all"
          style={{ 
            width: `${percentage}%`,
            background: percentage > 80 
              ? 'linear-gradient(90deg, #ef4444, #f87171)' 
              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            boxShadow: `0 0 8px ${percentage > 80 ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`
          }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: tokens.text.primary }}>
          <span className="font-semibold">{used}</span>
          <span style={{ color: tokens.text.tertiary }}> / {total} posts</span>
        </span>
        <span className="text-xs" style={{ color: percentage > 80 ? '#ef4444' : tokens.text.tertiary }}>
          {percentage}% used
        </span>
      </div>
    </div>
  );
};

// =============================================================================
// USAGE SECTION (fetches real data from API)
// =============================================================================
const UsageSection = () => {
  const [usage, setUsage] = useState<{ used: number; total: number; period: string } | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      const jwt = localStorage.getItem('guardia_jwt');
      const clientId = getClientId();
      if (!jwt || !clientId) return;

      try {
        const res = await fetch(`${API_BASE}/clients/${clientId}/usage`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          const period = data.period; // "2026-02"
          const [year, month] = period.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          setUsage({
            used: data.used?.posts_created || 0,
            total: data.limits?.posts_per_month || 30,
            period: monthName
          });
        }
      } catch (err) {
        console.error('Usage fetch error:', err);
      }
    };
    fetchUsage();
  }, []);

  if (!usage) return <UsageStats used={0} total={30} period="..." />;
  return <UsageStats used={usage.used} total={usage.total} period={usage.period} />;
};

// =============================================================================
// CONNECTED ACCOUNT
// =============================================================================
interface ConnectedAccountProps {
  platform: string;
  icon: React.ComponentType<IconProps>;
  connection?: Connection;
  onConnect?: () => void;
}

const ConnectedAccount = ({ platform, icon: Icon, connection, onConnect }: ConnectedAccountProps) => {
  const status = connection?.status || 'disconnected';
  const handle = connection?.handle;
  const isConnected = status === 'connected' || status === 'needs_refresh' || status === 'limited';

  const statusConfig = {
    connected: { color: tokens.status.connected, label: 'Connected', icon: 'connected' },
    needs_refresh: { color: tokens.status.needs_refresh, label: 'Reconnect', icon: 'needs_refresh' },
    limited: { color: tokens.status.limited, label: 'Limited', icon: 'limited' },
    disconnected: { color: tokens.status.disconnected, label: 'Disconnected', icon: 'disconnected' },
  };
  const config = statusConfig[status];

  const handleConnect = () => {
    const clientId = localStorage.getItem('guardia_client_id');
    window.location.href = `https://api.guardiacontent.com/auth/facebook/connect?client_id=${clientId}`;
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{ 
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ 
              background: 'var(--bg-elevated)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            <Icon size={20} color={isConnected ? tokens.text.primary : tokens.text.tertiary} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: tokens.text.primary }}>{platform}</p>
            {handle && (
              <p className="text-xs" style={{ color: tokens.text.tertiary }}>
                @{handle.replace('@', '')}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: config.color }} />
            <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
          </div>
          
          {status === 'connected' && (
            <button
              onClick={async () => {
                const clientId = getClientId();
                if (!clientId) return;
                if (!window.confirm(`Disconnect ${platform}? Posts won't publish to this platform until reconnected.`)) return;
                try {
                  const jwt = localStorage.getItem('guardia_jwt');
                  await fetch(`${API_BASE}/auth/facebook/disconnect?client_id=${clientId}&platform=${platform.toLowerCase()}`, {
                    headers: { Authorization: `Bearer ${jwt}` }
                  });
                  window.location.reload();
                } catch (err) {
                  console.error('Disconnect error:', err);
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
              style={{
                background: 'var(--bg-elevated)',
                color: tokens.text.tertiary,
                border: '1px solid var(--border-subtle)'
              }}
            >
              Disconnect
            </button>
          )}

          {(status === 'disconnected' || status === 'needs_refresh') && (
            <button
              onClick={onConnect || handleConnect}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
              style={{
                background: status === 'needs_refresh'
                  ? 'linear-gradient(145deg, #f59e0b, #d97706)'
                  : 'linear-gradient(145deg, var(--accent), var(--accent-hover))',
                color: 'white',
                boxShadow: status === 'needs_refresh'
                  ? '0 2px 6px rgba(245,158,11,0.3)'
                  : '0 2px 6px rgba(var(--accent-rgb),0.3)'
              }}
            >
              {status === 'needs_refresh' ? 'Reconnect' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SECTION & MENU ITEM
// =============================================================================
const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="mb-6">
    {title && (
      <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: tokens.text.tertiary }}>
        {title}
      </h3>
    )}
    <div 
      className="rounded-2xl overflow-hidden"
      style={{ 
        background: 'var(--bg-surface)',
        boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}`
      }}
    >
      {children}
    </div>
  </div>
);

interface MenuItemProps {
  icon: React.ComponentType<IconProps>;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggled?: boolean;
}

const MenuItem = ({ icon: Icon, label, onClick, danger, toggle, toggled }: MenuItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 border-b border-[var(--border-subtle)] last:border-0 transition-colors hover:bg-[var(--bg-surface)]"
  >
    <div className="flex items-center gap-3">
      <Icon size={20} color={danger ? '#ef4444' : tokens.text.tertiary} />
      <span className="text-sm" style={{ color: danger ? '#ef4444' : tokens.text.primary }}>{label}</span>
    </div>
    {toggle ? (
      <div 
        className="w-11 h-6 rounded-full p-0.5 transition-colors"
        style={{ backgroundColor: toggled ? tokens.accent.primary : tokens.bg.overlay }}
      >
        <div 
          className="w-5 h-5 rounded-full transition-transform"
          style={{ 
            backgroundColor: '#fff',
            transform: toggled ? 'translateX(20px)' : 'translateX(0)'
          }}
        />
      </div>
    ) : (
      <Icons.ChevronRight size={18} color={tokens.text.tertiary} />
    )}
  </button>
);

// =============================================================================
// LOCKED PLATFORM CARD (Add-on)
// =============================================================================
const LockedPlatformCard = ({ platform, icon: Icon }: { platform: string; icon: React.ComponentType<IconProps> }) => (
  <div
    className="flex items-center justify-between p-3 rounded-xl"
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      opacity: 0.5,
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'var(--bg-elevated)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}
      >
        <Icon size={18} color={tokens.text.tertiary} />
      </div>
      <span className="text-sm" style={{ color: tokens.text.tertiary }}>{platform}</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Icons.Lock size={12} color={tokens.text.tertiary} />
        <span className="text-xs" style={{ color: tokens.text.tertiary }}>Add-on</span>
      </div>
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{ backgroundColor: 'var(--bg-elevated)', color: tokens.text.tertiary }}
      >
        Coming Soon
      </span>
    </div>
  </div>
);

// =============================================================================
// CONNECTED ACCOUNTS SECTION
// =============================================================================
const ConnectedAccountsSection = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      const jwt = localStorage.getItem('guardia_jwt');
      const clientId = getClientId();
      if (!jwt || !clientId) { setLoading(false); return; }

      try {
        const res = await fetch(`${API_BASE}/auth/facebook/status?client_id=${clientId}`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConnections(data.connections || []);
        }
      } catch (err) {
        console.error('Connections fetch error:', err);
      }
      setLoading(false);
    };
    fetchConnections();
  }, []);

  const fbConnection = connections.find(c => c.platform === 'facebook');
  const igConnection = connections.find(c => c.platform === 'instagram');
  const needsAttention = connections.some(c => c.needs_action);

  return (
    <>
      <Section title="Connected Accounts">
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <ConnectedAccount platform="Facebook" icon={Icons.Facebook} connection={fbConnection} />
              {igConnection && igConnection.status !== 'disconnected' && (
                <div className="mt-2">
                  <ConnectedAccount platform="Instagram" icon={Icons.Instagram} connection={igConnection} />
                </div>
              )}
            </>
          )}
        </div>
        {needsAttention && (
          <div className="mx-4 mb-4 p-3 rounded-xl text-xs" style={{ backgroundColor: `${tokens.status.needs_refresh}15`, color: tokens.status.needs_refresh }}>
            <AlertTriangle size={14} className="inline mr-1 shrink-0" /> Your connection needs attention. Reconnect to maintain posting access.
          </div>
        )}
      </Section>

      <Section title="Platform Add-ons">
        <div className="p-4 space-y-2">
          {(!igConnection || igConnection.status === 'disconnected') && (
            <LockedPlatformCard platform="Instagram" icon={Icons.Instagram} />
          )}
          <LockedPlatformCard platform="TikTok" icon={Icons.TikTok} />
          <LockedPlatformCard platform="LinkedIn" icon={Icons.LinkedIn} />
          <LockedPlatformCard platform="YouTube" icon={Icons.YouTube} />
        </div>
      </Section>
    </>
  );
};

// =============================================================================
// HELP & SUPPORT PANEL
// =============================================================================
const FAQ_ITEMS = [
  { q: 'How do I upload photos?', a: 'Go to the Gallery tab and tap the upload button. You can select multiple images at once. Our AI will style them to match your brand.' },
  { q: 'When will my posts go live?', a: 'Posts are scheduled based on optimal engagement times for your audience. Check the Calendar tab to see your upcoming schedule.' },
  { q: 'How do I connect Instagram?', a: 'Instagram connects through your Facebook page. If your page has a linked Instagram Business account, it appears automatically in Connected Accounts after connecting Facebook.' },
  { q: 'How do add-ons work?', a: 'Visit the Store tab to browse and subscribe to add-ons like platform connections, analytics, and more. Your active services are shown in the My Services section of your Account.' },
  { q: 'How do I change my posting schedule?', a: 'Your posting schedule is automatically optimized, but you can adjust individual post times from the Calendar tab by tapping on any scheduled post.' },
];

function HelpSupportPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--bg-surface)', boxShadow: isOpen ? '-4px 0 24px rgba(0,0,0,0.5)' : 'none' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Help & Support</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95" style={{ background: 'var(--bg-elevated)', boxShadow: tokens.shadow.button }}>
            <Icons.X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 70px)' }}>
          {/* FAQ */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: tokens.text.tertiary }}>Frequently Asked Questions</h3>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}` }}>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-sm pr-4" style={{ color: tokens.text.primary }}>{item.q}</span>
                    <div className={`transition-transform duration-200 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                      <Icons.ChevronDown size={16} color={tokens.text.tertiary} />
                    </div>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4">
                      <p className="text-sm leading-relaxed" style={{ color: tokens.text.secondary }}>{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: tokens.text.tertiary }}>Contact Support</h3>
            <a
              href="mailto:support@guardiacontent.com"
              className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.99]"
              style={{ background: 'var(--bg-surface)', boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}` }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
                <Icons.Mail size={18} color={tokens.accent.primary} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: tokens.text.primary }}>Email Support</p>
                <p className="text-xs" style={{ color: tokens.text.tertiary }}>support@guardiacontent.com</p>
              </div>
              <Icons.ChevronRight size={18} color={tokens.text.tertiary} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// SECURITY PANEL
// =============================================================================
function SecurityPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [logins, setLogins] = useState<Array<{ ip_address: string; success: number; attempted_at: string }>>([]);
  const [loginsLoading, setLoginsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPin(''); setNewPin(''); setConfirmPin(''); setPinError(''); setPinSuccess('');
    const fetchLogins = async () => {
      setLoginsLoading(true);
      const jwt = localStorage.getItem('guardia_jwt');
      if (!jwt) { setLoginsLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/lobby/client/login-history`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogins(data.logins || []);
        }
      } catch (err) { console.error('Login history error:', err); }
      setLoginsLoading(false);
    };
    fetchLogins();
  }, [isOpen]);

  const handleChangePin = async () => {
    setPinError(''); setPinSuccess('');
    if (!/^\d{4,6}$/.test(newPin)) { setPinError('PIN must be 4-6 digits'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match'); return; }
    if (newPin === currentPin) { setPinError('New PIN must be different'); return; }

    setSaving(true);
    try {
      const jwt = localStorage.getItem('guardia_jwt');
      const res = await fetch(`${API_BASE}/lobby/client/change-pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_pin: currentPin, new_pin: newPin })
      });
      if (res.ok) {
        setPinSuccess('PIN updated successfully');
        setCurrentPin(''); setNewPin(''); setConfirmPin('');
      } else {
        const data = await res.json();
        setPinError(data.detail || 'Failed to update PIN');
      }
    } catch (_err) {
      setPinError('Something went wrong');
    }
    setSaving(false);
  };

  const inputStyle = {
    background: 'var(--bg-base)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)',
    border: 'none'
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--bg-surface)', boxShadow: isOpen ? '-4px 0 24px rgba(0,0,0,0.5)' : 'none' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Privacy & Security</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95" style={{ background: 'var(--bg-elevated)', boxShadow: tokens.shadow.button }}>
            <Icons.X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 70px)' }}>
          {/* Change PIN */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: tokens.text.tertiary }}>Change PIN</h3>
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-surface)', boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}` }}>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Current PIN</label>
                <input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none" style={inputStyle} placeholder="Enter current PIN" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">New PIN</label>
                <input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none" style={inputStyle} placeholder="4-6 digits" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Confirm New PIN</label>
                <input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none" style={inputStyle} placeholder="Confirm new PIN" />
              </div>

              {pinError && <p className="text-xs text-red-400 px-1">{pinError}</p>}
              {pinSuccess && <p className="text-xs text-green-400 px-1">{pinSuccess}</p>}

              <button
                onClick={handleChangePin}
                disabled={!currentPin || !newPin || !confirmPin || saving}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] mt-2"
                style={{
                  background: currentPin && newPin && confirmPin
                    ? 'linear-gradient(145deg, #f59e0b, #d97706)'
                    : 'var(--bg-elevated)',
                  boxShadow: currentPin && newPin && confirmPin
                    ? '0 2px 8px rgba(245,158,11,0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
                    : 'inset 0 1px 2px rgba(0,0,0,0.3)',
                  color: currentPin && newPin && confirmPin ? 'white' : 'var(--text-muted)'
                }}
              >
                {saving ? 'Updating...' : 'Update PIN'}
              </button>
            </div>
          </div>

          {/* Login Activity */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: tokens.text.tertiary }}>Recent Login Activity</h3>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}` }}>
              {loginsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                </div>
              ) : logins.length === 0 ? (
                <p className="p-4 text-sm text-center" style={{ color: tokens.text.tertiary }}>No login history</p>
              ) : (
                logins.slice(0, 10).map((login, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b border-[var(--border-subtle)] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${login.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-xs font-mono" style={{ color: tokens.text.secondary }}>
                          {login.ip_address?.length > 20 ? login.ip_address.slice(0, 18) + '...' : login.ip_address}
                        </p>
                        <p className="text-xs" style={{ color: tokens.text.tertiary }}>
                          {new Date(login.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: login.success ? '#22c55e' : '#ef4444' }}>
                      {login.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// BILLING HISTORY PANEL
// =============================================================================
const EVENT_LABELS: Record<string, string> = {
  'checkout_session_created': 'Subscription Started',
  'checkout.session.completed': 'Payment Completed',
  'invoice.paid': 'Payment Received',
  'invoice.payment_failed': 'Payment Failed',
  'customer.subscription.updated': 'Plan Updated',
  'customer.subscription.deleted': 'Subscription Cancelled',
};

function BillingHistoryPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [events, setEvents] = useState<Array<{ id: number; event_type: string; data: Record<string, unknown>; created_at: string }>>([]);
  const [subscription, setSubscription] = useState<{ tier: string; status: string; current_period_end: string; cancel_at_period_end: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchBilling = async () => {
      setLoading(true);
      const jwt = localStorage.getItem('guardia_jwt');
      if (!jwt) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/lobby/client/billing-history`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
          setSubscription(data.subscription || null);
        }
      } catch (err) { console.error('Billing history error:', err); }
      setLoading(false);
    };
    fetchBilling();
  }, [isOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--bg-surface)', boxShadow: isOpen ? '-4px 0 24px rgba(0,0,0,0.5)' : 'none' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Billing History</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95" style={{ background: 'var(--bg-elevated)', boxShadow: tokens.shadow.button }}>
            <Icons.X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 70px)' }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Current Subscription */}
              {subscription && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}` }}>
                  <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: tokens.text.tertiary }}>Current Subscription</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize" style={{ color: tokens.text.primary }}>{subscription.tier}</span>
                        <div className="px-2 py-0.5 rounded-full text-xs" style={{
                          backgroundColor: subscription.status === 'active' ? '#22c55e20' : '#f59e0b20',
                          color: subscription.status === 'active' ? '#22c55e' : '#f59e0b'
                        }}>
                          {subscription.status}
                        </div>
                      </div>
                      {subscription.current_period_end && (
                        <p className="text-xs mt-1" style={{ color: tokens.text.tertiary }}>
                          {subscription.cancel_at_period_end ? 'Ends' : 'Renews'} {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Events */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: tokens.text.tertiary }}>History</h3>
                {events.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-surface)', boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}` }}>
                    <Icons.CreditCard size={32} color={tokens.text.tertiary} />
                    <p className="text-sm mt-3" style={{ color: tokens.text.tertiary }}>No billing history yet</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', boxShadow: `${tokens.shadow.inset}, ${tokens.shadow.raised}` }}>
                    {events.map((event, i) => (
                      <div key={event.id || i} className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] last:border-0">
                        <div>
                          <p className="text-sm" style={{ color: tokens.text.primary }}>
                            {EVENT_LABELS[event.event_type] || event.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: tokens.text.tertiary }}>
                            {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {typeof event.data?.tier === 'string' && (
                          <div className="px-2 py-0.5 rounded-full text-xs capitalize" style={{
                            backgroundColor: `${tokens.tier[event.data.tier as keyof typeof tokens.tier] || tokens.text.tertiary}20`,
                            color: tokens.tier[event.data.tier as keyof typeof tokens.tier] || tokens.text.tertiary
                          }}>
                            {event.data.tier}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}


// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function GuardiaAccount({ jwt: jwtProp, onLogout, onNavigateToStore }: { jwt?: string | null; onLogout?: () => void; onNavigateToStore?: () => void } = {}) {
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [billingPanelOpen, setBillingPanelOpen] = useState(false);
  const [securityPanelOpen, setSecurityPanelOpen] = useState(false);
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);

  // Prefer prop jwt, fall back to localStorage
  const jwt = jwtProp || (typeof window !== 'undefined' ? localStorage.getItem('guardia_jwt') : null);

  useEffect(() => {
    const fetchProfile = async () => {
      const jwt = localStorage.getItem('guardia_jwt');
      if (!jwt) { setProfileLoading(false); return; }

      try {
        const res = await fetch(`${API_BASE}/lobby/client/me`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    const jwt = localStorage.getItem('guardia_jwt');
    if (!jwt) return;

    const res = await fetch(`${API_BASE}/lobby/client/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const updated = await res.json();
      setProfile(prev => prev ? { ...prev, ...updated } : null);
    } else {
      throw new Error('Save failed');
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('guardia_jwt');
      localStorage.removeItem('guardia_client_id');
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen pt-safe pb-4" style={{ backgroundColor: tokens.bg.base }}>
      {/* Header */}
      <header className="px-5 py-4">
        <h1 className="text-xl font-semibold" style={{ color: tokens.text.primary }}>Account</h1>
      </header>

      {/* Content */}
      <div className="px-4">
        {/* Profile */}
        <div className="mb-6">
          {profileLoading ? (
            <div className="p-5 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
              <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
          ) : (
            <ProfileHeader
              name={profile?.contact_name || profile?.business_name || 'User'}
              email={profile?.contact_email || ''}
              imageUrl={profile?.profile_image_url}
              onClick={() => setProfilePanelOpen(true)}
            />
          )}
        </div>

        {/* Usage */}
        <div className="mb-6">
          <UsageSection />
        </div>

        {/* My Services */}
        <MyServicesSection jwt={jwt} onNavigateToStore={onNavigateToStore} />

        {/* Connected Accounts */}
        <ConnectedAccountsSection />

        {/* Billing */}
        <Section title="Billing">
          <MenuItem icon={Icons.BarChart} label="Billing History" onClick={() => setBillingPanelOpen(true)} />
        </Section>

        {/* Settings */}
        <Section title="Settings">
          <MenuItem icon={Icons.Bell} label="Push Notifications" toggle toggled={notifications} onClick={() => setNotifications(!notifications)} />
          <MenuItem icon={Icons.Shield} label="Privacy & Security" onClick={() => setSecurityPanelOpen(true)} />
          <MenuItem icon={Icons.HelpCircle} label="Help & Support" onClick={() => setHelpPanelOpen(true)} />
        </Section>

        {/* Logout */}
        <Section>
          <MenuItem icon={Icons.LogOut} label="Log Out" danger onClick={handleLogout} />
        </Section>

        {/* Version */}
        <p className="text-center text-xs mt-6 mb-4" style={{ color: tokens.text.tertiary }}>
          Guardia v1.0.0
        </p>
      </div>

      {/* Profile Panel */}
      <ProfilePanel
        isOpen={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
      <BillingHistoryPanel isOpen={billingPanelOpen} onClose={() => setBillingPanelOpen(false)} />
      <SecurityPanel isOpen={securityPanelOpen} onClose={() => setSecurityPanelOpen(false)} />
      <HelpSupportPanel isOpen={helpPanelOpen} onClose={() => setHelpPanelOpen(false)} />

      <style jsx global>{`
        .pt-safe { padding-top: env(safe-area-inset-top, 12px); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 8px); }
      `}</style>
    </div>
  );
}
