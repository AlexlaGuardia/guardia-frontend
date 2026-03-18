"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ClientContext } from "./LobbyShell";
import WeekView from "./WeekView";

/**
 * GUARDIA CALENDAR — Factory Floor Edition v3
 * 
 * New in v3:
 * - Manual slot creation (click empty day → create slot)
 * - Ghost slots display (unfilled slots with dashed border)
 * - Slot management (edit/delete unfilled slots)
 * - Desert Mirage design tokens
 */

const API_BASE = "https://api.guardiacontent.com";

interface CalendarPost {
  id: number;
  caption: string;
  scheduled_for: string;
  posted_at: string | null;
  status: "draft" | "pending_approval" | "scheduled" | "posted" | "failed";
  platform: string;
  thumbnail_url?: string;
  preview_url?: string;
  asset_id?: number | null;
  predicted_score?: number;
  likes?: number;
  comments_count?: number;
  shares?: number;
}

interface CalendarTabProps {
  client: ClientContext | null;
  jwt: string | null;
  onMessage: (msg: string) => void;
  onDateSelect?: (date: string) => void;
  onCreatePost?: (date: string) => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

// ─────────────────────────────────────────────────────────────
// SVG Components
// ─────────────────────────────────────────────────────────────

function GlowFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="amberGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feFlood floodColor="#e8a060" floodOpacity="0.8" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="greenGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feFlood floodColor="#22c55e" floodOpacity="0.7" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="redGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feFlood floodColor="#ef4444" floodOpacity="0.8" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

function StatusLight({ state, size = 12 }: { state: "off" | "waiting" | "ready" | "failed" | "slot"; size?: number }) {
  if (state === 'off') return null;
  
  const configs = {
    waiting: { filter: 'url(#amberGlow)', color: '#fbbf24' },
    ready: { filter: 'url(#greenGlow)', color: '#22c55e' },
    failed: { filter: 'url(#redGlow)', color: '#ef4444' },
    slot: { filter: 'url(#amberGlow)', color: '#e8a060' },
  };
  
  const c = configs[state];
  
  // Slot gets a clock icon instead of dot
  if (state === 'slot') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: c.filter }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={c.color} strokeWidth="2" strokeDasharray="4 2" />
        <path d="M12 7v5l3 3" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <g style={{ filter: c.filter }}>
        <circle cx="12" cy="12" r="8" fill={c.color} opacity="0.6" />
        <circle cx="12" cy="12" r="4" fill={c.color} />
      </g>
    </svg>
  );
}

function GuardiaSeal({ size = 32 }: { size?: number }) {
  return (
    <img 
      src="/wax-seal.png" 
      alt="Posted" 
      width={size} 
      height={size}
      className="object-contain"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
    />
  );
}

function TodayCheckmark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: 'url(#greenGlow)' }}>
      <circle cx="12" cy="12" r="10" fill="#22c55e" opacity="0.2" />
      <circle cx="12" cy="12" r="8" fill="#22c55e" opacity="0.3" />
      <path 
        d="M8 12l3 3 5-6" 
        fill="none" 
        stroke="#22c55e" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function TodayStatusBanner({ posts }: { posts: CalendarPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
        <span className="text-xs text-[var(--text-muted)]">Today</span>
        <span className="text-xs text-[var(--text-secondary)]">No posts scheduled</span>
      </div>
    );
  }

  const failed = posts.filter(p => p.status === "failed").length;
  const posted = posts.filter(p => p.status === "posted").length;
  const scheduled = posts.filter(p => p.status === "scheduled").length;
  const pending = posts.filter(p => p.status === "draft" || p.status === "pending_approval").length;
  const slots = posts.filter(p => p.status === "draft" && !p.asset_id).length;
  
  const allGood = failed === 0 && pending === 0 && scheduled === 0 && posted > 0;
  const hasFailed = failed > 0;
  
  return (
    <div 
      className="flex items-center gap-3 px-3 py-2 rounded-xl border transition-all"
      style={{
        background: hasFailed 
          ? 'linear-gradient(145deg, rgba(239,68,68,0.1), transparent)'
          : allGood 
            ? 'linear-gradient(145deg, rgba(34,197,94,0.1), transparent)'
            : 'var(--bg-elevated)',
        borderColor: hasFailed 
          ? 'rgba(239,68,68,0.3)' 
          : allGood 
            ? 'rgba(34,197,94,0.3)' 
            : 'var(--border)'
      }}
    >
      <span className="text-xs font-medium text-[var(--text-secondary)]">Today</span>
      
      {allGood ? (
        <div className="flex items-center gap-1.5">
          <TodayCheckmark size={16} />
          <span className="text-xs text-emerald-400">All {posted} post{posted > 1 ? 's' : ''} delivered</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-xs">
          {posted > 0 && <span className="text-emerald-400">{posted} posted</span>}
          {scheduled > 0 && <span className="text-green-400">{scheduled} scheduled</span>}
          {pending > 0 && <span className="text-amber-400">{pending} pending</span>}
          {slots > 0 && <span className="text-[var(--accent)]">{slots} slot{slots > 1 ? 's' : ''}</span>}
          {failed > 0 && <span className="text-red-400 font-medium">{failed} failed</span>}
        </div>
      )}
    </div>
  );
}

function AutoScheduleToggle({ 
  enabled, 
  loading, 
  onToggle 
}: { 
  enabled: boolean; 
  loading: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 active:scale-98"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--accent)',
        boxShadow: enabled ? 'inset 0 0 12px var(--accent-muted)' : 'none',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <div 
        className="w-8 h-4 rounded-full relative transition-all duration-200"
        style={{
          background: enabled 
            ? 'linear-gradient(90deg, var(--accent), var(--accent-hover))' 
            : 'var(--bg-surface)',
        }}
      >
        <div 
          className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200"
          style={{
            left: enabled ? '18px' : '2px',
            background: enabled ? '#fff' : 'var(--text-muted)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
      
      <span 
        className="text-xs font-medium transition-colors"
        style={{ color: enabled ? 'var(--accent)' : 'var(--text-muted)' }}
      >
        Auto
      </span>
      
      {loading && (
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" strokeDasharray="30 70" />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Slot Creation Modal
// ─────────────────────────────────────────────────────────────

interface SlotModalProps {
  day: number;
  month: number;
  year: number;
  jwt: string | null;
  onClose: () => void;
  onCreated: () => void;
  onMessage: (msg: string) => void;
  presetHour?: number;
}

function SlotCreationModal({ day, month, year, jwt, onClose, onCreated, onMessage, presetHour }: SlotModalProps) {
  const [hour, setHour] = useState(() => {
    if (presetHour !== undefined) {
      const h = presetHour % 12 || 12;
      return h;
    }
    return 10;
  });
  const [ampm, setAmpm] = useState<"AM" | "PM">(() => {
    if (presetHour !== undefined) return presetHour >= 12 ? "PM" : "AM";
    return "AM";
  });
  const [platform, setPlatform] = useState("facebook");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!jwt) return;
    setLoading(true);

    // Build datetime
    let hour24 = hour;
    if (ampm === "PM" && hour !== 12) hour24 += 12;
    if (ampm === "AM" && hour === 12) hour24 = 0;
    
    const scheduled = new Date(year, month, day, hour24, 0, 0);

    try {
      const res = await fetch(`${API_BASE}/lobby/slots`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          scheduled_for: scheduled.toISOString(),
          caption: caption.trim() || null,
        }),
      });

      if (res.ok) {
        onMessage("Slot created! Fill it from Gallery after approving content.");
        onCreated();
        onClose();
      } else {
        const err = await res.json();
        onMessage(err.detail || "Failed to create slot");
      }
    } catch (_e) {
      onMessage("Failed to create slot");
    }
    setLoading(false);
  };

  const dateStr = `${MONTHS[month]} ${day}, ${year}`;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-sm pointer-events-auto rounded-2xl overflow-hidden animate-slide-up"
          style={{
            background: 'var(--bg-surface)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
            border: '1px solid var(--border)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Create Slot</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{dateStr}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            {/* Time Picker */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                <ClockIcon size={14} className="inline mr-1.5 opacity-60" />
                Post Time
              </label>
              <div className="flex gap-2">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
                <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setAmpm("AM")}
                    className="px-3 py-2 text-sm font-medium transition-all"
                    style={{
                      background: ampm === "AM" ? 'var(--accent)' : 'var(--bg-base)',
                      color: ampm === "AM" ? 'var(--bg-base)' : 'var(--text-muted)',
                    }}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmpm("PM")}
                    className="px-3 py-2 text-sm font-medium transition-all"
                    style={{
                      background: ampm === "PM" ? 'var(--accent)' : 'var(--bg-base)',
                      color: ampm === "PM" ? 'var(--bg-base)' : 'var(--text-muted)',
                    }}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Caption <span className="text-[var(--text-muted)]">(optional)</span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Pre-write your caption or leave blank..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-98 disabled:opacity-50"
              style={{
                background: 'linear-gradient(145deg, var(--accent), var(--accent-hover))',
                color: 'var(--bg-base)',
                boxShadow: '0 4px 12px var(--accent-muted)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="30 70" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Slot"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function CalendarTab({ client, jwt, onMessage, onDateSelect, onCreatePost }: CalendarTabProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<CalendarPost[]>([]);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  // View mode
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Start of current week (Sunday)
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Slot creation
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotDay, setSlotDay] = useState<number | null>(null);
  const [slotHour, setSlotHour] = useState<number | null>(null);
  
  // Auto-schedule state
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editSaving, _setEditSaving] = useState(false);
  
  // Pending changes (local until Save)
  const [pendingDeletes, setPendingDeletes] = useState<Set<number>>(new Set());
  const [pendingCaptions, setPendingCaptions] = useState<Map<number, string>>(new Map());
  const [saving, setSaving] = useState(false);
  
  const hasChanges = pendingDeletes.size > 0 || pendingCaptions.size > 0;

  const loadCalendar = useCallback(async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/client/calendar`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to load calendar:", err);
    }
    setLoading(false);
  }, [jwt]);

  const loadAutoSchedule = useCallback(async () => {
    if (!jwt) return;
    try {
      const res = await fetch(`${API_BASE}/lobby/settings/auto-schedule`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAutoSchedule(data.enabled);
      }
    } catch (err) {
      console.error("Failed to load auto-schedule status:", err);
    }
  }, [jwt]);

  const toggleAutoSchedule = async () => {
    if (!jwt || autoScheduleLoading) return;
    setAutoScheduleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/lobby/settings/auto-schedule`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAutoSchedule(data.enabled);
        onMessage(data.message);
      }
    } catch (err) {
      console.error("Failed to toggle auto-schedule:", err);
      onMessage("Failed to update auto-schedule setting");
    }
    setAutoScheduleLoading(false);
  };

  // Mark post for deletion (local only until Save)
  const handleDeletePost = (postId: number) => {
    if (!postId) return;
    setPendingDeletes(prev => new Set([...prev, postId]));
    // Update local view
    const newPosts = selectedPosts.filter(p => p.id !== postId);
    setSelectedPosts(newPosts);
    if (newPosts.length === 0) {
      setSelectedDay(null);
    } else if (selectedPostIndex >= newPosts.length) {
      setSelectedPostIndex(newPosts.length - 1);
    }
    onMessage("Marked for deletion — click Save Changes");
  };
  
  // Open edit modal
  const openEditModal = (post: CalendarPost) => {
    setEditingPost(post);
    // Check if we have a pending caption change
    const pendingCaption = pendingCaptions.get(post.id);
    setEditCaption(pendingCaption !== undefined ? pendingCaption : (post.caption || ""));
    setShowEditModal(true);
  };
  
  // Save caption locally (not to server yet)
  const handleSaveCaption = () => {
    if (!editingPost) return;
    setPendingCaptions(prev => new Map(prev).set(editingPost.id, editCaption));
    // Update local view
    setSelectedPosts(prev => prev.map(p => 
      p.id === editingPost.id ? { ...p, caption: editCaption } : p
    ));
    setShowEditModal(false);
    setEditingPost(null);
    onMessage("Caption updated — click Save Changes");
  };
  
  // Commit all pending changes to server
  const saveAllChanges = async () => {
    if (!jwt || !hasChanges) return;
    setSaving(true);
    
    let errors = 0;
    
    // Process deletes
    for (const postId of pendingDeletes) {
      try {
        const res = await fetch(`${API_BASE}/lobby/calendar/${postId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) errors++;
      } catch (e) {
        console.error("Delete failed:", e);
        errors++;
      }
    }
    
    // Process caption updates
    for (const [postId, caption] of pendingCaptions) {
      // Skip if also deleted
      if (pendingDeletes.has(postId)) continue;
      try {
        const res = await fetch(`${API_BASE}/lobby/calendar/${postId}/caption`, {
          method: 'PATCH',
          headers: { 
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ caption })
        });
        if (!res.ok) errors++;
      } catch (e) {
        console.error("Caption update failed:", e);
        errors++;
      }
    }
    
    // Clear pending changes
    setPendingDeletes(new Set());
    setPendingCaptions(new Map());
    
    // Reload calendar
    await loadCalendar();
    
    setSaving(false);
    onMessage(errors > 0 ? `Saved with ${errors} error(s)` : "Changes saved!");
  };

  useEffect(() => {
    loadCalendar();
    loadAutoSchedule();
  }, [loadCalendar, loadAutoSchedule]);

  // Background poll so new scheduled posts appear without refresh
  useEffect(() => {
    const pollTimer = setInterval(async () => {
      if (!document.hidden && jwt) {
        try {
          const res = await fetch(`${API_BASE}/client/calendar`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          if (res.ok) {
            const data = await res.json();
            setPosts(data);
          }
        } catch (err) {
          console.error("Failed to poll calendar:", err);
        }
      }
    }, 120000);
    return () => clearInterval(pollTimer);
  }, [jwt]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length < totalCells) calendarDays.push(null);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const getPostsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts
      .filter(p => p.scheduled_for?.startsWith(dateStr) || p.posted_at?.startsWith(dateStr))
      .filter(p => !pendingDeletes.has(p.id)); // Exclude pending deletes
  };

  const isToday = (day: number) => 
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const isPast = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate < todayStart;
  };

  const isFuture = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate > todayStart;
  };

  // Check if a post is an unfilled slot
  const isUnfilledSlot = (p: CalendarPost) => p.status === "draft" && !p.asset_id;

  const getDayDisplay = (day: number): { 
    type: "off" | "checkmark" | "seal" | "light" | "slot";
    lightState?: "waiting" | "ready" | "failed" | "slot";
    hasSlot?: boolean;
  } => {
    const dayPosts = getPostsForDay(day);
    if (dayPosts.length === 0) return { type: "off" };

    const hasFailed = dayPosts.some(p => p.status === "failed");
    const hasPosted = dayPosts.some(p => p.status === "posted");
    const hasScheduled = dayPosts.some(p => p.status === "scheduled");
    const hasPending = dayPosts.some(p => (p.status === "draft" || p.status === "pending_approval") && p.asset_id);
    const hasUnfilledSlot = dayPosts.some(isUnfilledSlot);
    const allPostedSuccessfully = hasPosted && !hasFailed && !hasScheduled && !hasPending && !hasUnfilledSlot;

    // TODAY
    if (isToday(day)) {
      if (hasFailed) return { type: "light", lightState: "failed" };
      if (allPostedSuccessfully) return { type: "checkmark" };
      if (hasScheduled) return { type: "light", lightState: "ready", hasSlot: hasUnfilledSlot };
      if (hasPending) return { type: "light", lightState: "waiting", hasSlot: hasUnfilledSlot };
      if (hasUnfilledSlot) return { type: "slot", lightState: "slot" };
      return { type: "off" };
    }

    // PAST
    if (isPast(day)) {
      if (hasFailed) return { type: "light", lightState: "failed" };
      if (hasPosted) return { type: "seal" };
      return { type: "off" };
    }

    // FUTURE
    if (hasFailed) return { type: "light", lightState: "failed" };
    if (hasScheduled) return { type: "light", lightState: "ready", hasSlot: hasUnfilledSlot };
    if (hasPending) return { type: "light", lightState: "waiting", hasSlot: hasUnfilledSlot };
    if (hasUnfilledSlot) return { type: "slot", lightState: "slot" };
    return { type: "off" };
  };

  const handleDayClick = (day: number) => {
    const dayPosts = getPostsForDay(day);
    setSelectedDay(day);
    setSelectedPosts(dayPosts);
    setSelectedPostIndex(0);
  };

  const getDateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const openSlotModal = (day: number, presetHour?: number) => {
    setSlotDay(day);
    setSlotHour(presetHour ?? null);
    setShowSlotModal(true);
  };

  const prevWeek = () => {
    setWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const nextWeek = () => {
    setWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const weekEndDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const s = weekStart;
    const e = weekEndDate;
    const sMonth = s.toLocaleString("en-US", { month: "short" });
    const eMonth = e.toLocaleString("en-US", { month: "short" });
    if (s.getMonth() === e.getMonth()) {
      return `${sMonth} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}`;
  }, [weekStart, weekEndDate]);

  const handleWeekSlotClick = (day: number, month: number, year: number, hour: number) => {
    // Use the month/year from the clicked day (may differ from currentMonth)
    setCurrentMonth(month);
    setCurrentYear(year);
    openSlotModal(day, hour);
  };

  const handleWeekPostClick = (post: CalendarPost) => {
    const dateStr = post.scheduled_for || post.posted_at || "";
    const d = new Date(dateStr);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
    setSelectedDay(d.getDate());
    setSelectedPosts([post]);
    setSelectedPostIndex(0);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayPosts = posts
    .filter(p => p.scheduled_for?.startsWith(todayStr) || p.posted_at?.startsWith(todayStr))
    .filter(p => !pendingDeletes.has(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-[var(--bg-base)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  const numRows = Math.ceil(calendarDays.length / 7);

  return (
    <div className="flex flex-col bg-[var(--bg-base)]">
      <GlowFilters />
      
      {/* Today's Status Banner + Save Changes + Auto-Schedule Toggle */}
      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <TodayStatusBanner posts={todayPosts} />
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasChanges && (
            <button
              onClick={saveAllChanges}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(145deg, #22c55e, #16a34a)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <AutoScheduleToggle 
            enabled={autoSchedule} 
            loading={autoScheduleLoading}
            onToggle={toggleAutoSchedule}
          />
        </div>
      </div>
      
      {/* Header */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={viewMode === "month" ? prevMonth : prevWeek}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 bg-[var(--bg-elevated)] border border-[var(--border)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="text-center">
              {viewMode === "month" ? (
                <>
                  <span className="text-lg font-semibold text-[var(--text-primary)] tracking-wide">
                    {MONTHS[currentMonth]}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] ml-2">{currentYear}</span>
                </>
              ) : (
                <span className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
                  {weekLabel}
                </span>
              )}
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
              <button
                onClick={() => setViewMode("month")}
                className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-all"
                style={{
                  background: viewMode === "month" ? "var(--accent)" : "var(--bg-elevated)",
                  color: viewMode === "month" ? "var(--bg-base)" : "var(--text-muted)",
                }}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-all"
                style={{
                  background: viewMode === "week" ? "var(--accent)" : "var(--bg-elevated)",
                  color: viewMode === "week" ? "var(--bg-base)" : "var(--text-muted)",
                }}
              >
                Week
              </button>
            </div>
          </div>

          <button
            onClick={viewMode === "month" ? nextMonth : nextWeek}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 bg-[var(--bg-elevated)] border border-[var(--border)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {viewMode === "week" ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <WeekView
            weekStart={weekStart}
            posts={posts}
            clientId={client?.id}
            jwt={jwt}
            onSlotClick={handleWeekSlotClick}
            onPostClick={handleWeekPostClick}
          />
        </div>
      ) : (
      <>
      {/* Day headers */}
      <div className="overflow-x-auto px-3">
        <div className="grid grid-cols-7 min-w-[320px]">
          {DAYS.map((day, i) => (
            <div key={i} className="text-center py-2 text-xs font-medium text-[var(--text-muted)] tracking-wider">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="mx-3 mb-2 rounded-2xl overflow-x-auto border border-[var(--border)]"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="grid grid-cols-7 min-w-[320px]">
          {calendarDays.map((day, i) => {
            const display = day ? getDayDisplay(day) : { type: "off" as const };
            const dayPosts = day ? getPostsForDay(day) : [];
            const filledPosts = dayPosts.filter(p => !isUnfilledSlot(p) && (p.thumbnail_url || p.preview_url));
            const isSelected = day === selectedDay;
            const row = Math.floor(i / 7);
            const col = i % 7;
            const isTodayCell = day ? isToday(day) : false;
            const _isFutureCell = day ? isFuture(day) : false;
            const isPastCell = day ? isPast(day) : false;
            
            return (
              <button
                key={i}
                onClick={() => day && handleDayClick(day)}
                disabled={!day}
                className={`relative p-1 aspect-square transition-all duration-150 ${day ? 'hover:bg-white/5 cursor-pointer' : ''}`}
                style={{
                  background: isSelected
                    ? 'var(--bg-elevated)'
                    : isTodayCell
                      ? 'rgba(232, 160, 96, 0.05)'
                      : 'transparent',
                  borderRight: col < 6 ? '1px solid var(--border)' : 'none',
                  borderBottom: row < numRows - 1 ? '1px solid var(--border)' : 'none',
                  boxShadow: isSelected 
                    ? 'inset 0 0 12px var(--accent-muted)' 
                    : 'none'
                }}
              >
                {day && (
                  <>
                    {/* Day number */}
                    <span 
                      className="absolute top-1.5 right-2 text-xs font-medium transition-colors"
                      style={{ 
                        color: isTodayCell ? 'var(--accent)' : isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {day}
                    </span>
                    
                    {/* Today indicator ring */}
                    {isTodayCell && (
                      <div
                        className="absolute top-0.5 right-0.5 w-6 h-6 rounded-full pointer-events-none"
                        style={{ border: '1px solid var(--accent-muted)' }}
                      />
                    )}

                    {/* Thumbnail previews */}
                    {filledPosts.length > 0 && (
                      <div
                        className="absolute inset-1 flex flex-col items-center justify-center gap-0.5 pointer-events-none"
                        style={{ opacity: isPastCell ? 0.35 : 0.7 }}
                      >
                        {filledPosts.slice(0, 2).map((post, idx) => (
                          <img
                            key={post.id}
                            src={post.thumbnail_url || post.preview_url}
                            alt=""
                            className="rounded object-cover"
                            style={{
                              width: filledPosts.length === 1 ? '85%' : '80%',
                              height: filledPosts.length === 1 ? '70%' : '45%',
                              opacity: idx === 1 ? 0.6 : 1,
                            }}
                          />
                        ))}
                        {filledPosts.length > 2 && (
                          <span
                            className="absolute bottom-0 right-0 text-[8px] font-bold rounded-full px-1"
                            style={{
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            +{filledPosts.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Checkmark */}
                    {display.type === "checkmark" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TodayCheckmark size={32} />
                      </div>
                    )}
                    
                    {/* Seal */}
                    {display.type === "seal" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <GuardiaSeal size={32} />
                      </div>
                    )}
                    
                    {/* Slot indicator (unfilled) */}
                    {display.type === "slot" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            border: '2px dashed var(--accent)',
                            background: 'var(--accent-muted)',
                          }}
                        >
                          <ClockIcon size={16} className="text-[var(--accent)]" />
                        </div>
                      </div>
                    )}
                    
                    {/* Status light */}
                    {display.type === "light" && display.lightState && (
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5">
                        <StatusLight state={display.lightState} size={14} />
                        {dayPosts.length > 1 && (
                          <span className="text-[9px] font-medium text-[var(--text-muted)]">
                            {dayPosts.length}
                          </span>
                        )}
                        {display.hasSlot && (
                          <ClockIcon size={10} className="text-[var(--accent)] ml-0.5" />
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex justify-center gap-4 flex-wrap">
        {[
          { element: <StatusLight state="waiting" size={12} />, label: "Pending" },
          { element: <StatusLight state="ready" size={12} />, label: "Scheduled" },
          { element: <StatusLight state="failed" size={12} />, label: "Failed" },
          { element: <div className="w-3 h-3 rounded border border-dashed border-[var(--accent)] flex items-center justify-center"><ClockIcon size={8} className="text-[var(--accent)]" /></div>, label: "Slot" },
          { element: <TodayCheckmark size={14} />, label: "Today" },
          { element: <GuardiaSeal size={14} />, label: "Posted" },
        ].map(({ element, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            {element}
            <span className="text-xs text-[var(--text-muted)] tracking-wide">{label}</span>
          </div>
        ))}
      </div>
      </>
      )}

      {/* Day Modal */}
      {selectedDay !== null && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setSelectedDay(null)}
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="relative w-full max-w-md pointer-events-auto rounded-2xl overflow-hidden animate-slide-up"
              style={{
                background: 'var(--bg-surface)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
                border: '1px solid var(--border)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-[var(--text-primary)]">
                    {MONTHS[currentMonth]} {selectedDay}
                  </span>
                  {isToday(selectedDay) && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] font-medium">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Add Slot button - future days only (no same-day), max 3 per day */}
                  {isFuture(selectedDay) && !autoSchedule && selectedPosts.length < 3 && (
                    <button
                      onClick={() => {
                        setSelectedDay(null);
                        openSlotModal(selectedDay);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all"
                      title="Add slot"
                    >
                      <PlusIcon size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              {selectedPosts.length === 0 ? (
                /* Empty Day */
                <div
                  className={`px-5 py-12 text-center ${onCreatePost && isFuture(selectedDay) ? 'cursor-pointer hover:bg-white/5 transition-all' : ''}`}
                  onClick={() => {
                    if (onCreatePost && selectedDay && isFuture(selectedDay)) {
                      setSelectedDay(null);
                      onCreatePost(getDateStr(selectedDay));
                    }
                  }}
                >
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{
                      border: '2px dashed var(--border)',
                      background: 'var(--bg-base)'
                    }}
                  >
                    <ClockIcon size={28} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">No content scheduled</p>
                  {onCreatePost && isFuture(selectedDay) ? (
                    <span
                      className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #C9A227, #D4AF37)' }}
                    >
                      <PlusIcon size={14} />
                      Post Now
                    </span>
                  ) : isFuture(selectedDay) && !autoSchedule ? (
                    <p className="text-xs text-[var(--text-muted)] mt-2">Tap + to add a slot</p>
                  ) : autoSchedule ? (
                    <p className="text-xs text-[var(--text-muted)] mt-2">Auto-schedule is on</p>
                  ) : null}
                </div>
              ) : (
                <>
                  {/* Image Area */}
                  <div className="relative">
                    <div 
                      className="aspect-square w-full overflow-hidden"
                      style={{ background: 'var(--bg-base)' }}
                    >
                      {/* Check if current post is unfilled slot */}
                      {isUnfilledSlot(selectedPosts[selectedPostIndex]) ? (
                        <button
                          onClick={() => {
                            if (onCreatePost && selectedDay) {
                              setSelectedDay(null);
                              onCreatePost(getDateStr(selectedDay));
                            }
                          }}
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all"
                        >
                          <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                            style={{
                              border: '2px dashed var(--accent)',
                              background: 'var(--accent-muted)'
                            }}
                          >
                            <ClockIcon size={36} className="text-[var(--accent)]" />
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">Empty Slot</p>
                          {onCreatePost ? (
                            <span
                              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-sm font-medium text-white"
                              style={{ background: 'linear-gradient(135deg, #C9A227, #D4AF37)' }}
                            >
                              <PlusIcon size={14} />
                              Post Now
                            </span>
                          ) : (
                            <p className="text-xs text-[var(--text-muted)] mt-1">Fill from Gallery</p>
                          )}
                        </button>
                      ) : (selectedPosts[selectedPostIndex]?.preview_url || selectedPosts[selectedPostIndex]?.thumbnail_url) ? (
                        <img
                          src={selectedPosts[selectedPostIndex].preview_url || selectedPosts[selectedPostIndex].thumbnail_url}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ClockIcon size={48} className="text-[var(--text-muted)] opacity-30" />
                        </div>
                      )}
                    </div>
                    
                    {/* Navigation */}
                    {selectedPosts.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedPostIndex(i => Math.max(0, i - 1))}
                          disabled={selectedPostIndex === 0}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-30"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M15 18l-6-6 6-6"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedPostIndex(i => Math.min(selectedPosts.length - 1, i + 1))}
                          disabled={selectedPostIndex === selectedPosts.length - 1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-30"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </button>
                      </>
                    )}

                    {selectedPosts.length > 1 && (
                      <div
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        {selectedPostIndex + 1} / {selectedPosts.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Caption & Meta */}
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {selectedPosts[selectedPostIndex]?.caption || "No caption"}
                    </p>
                    
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <span 
                          className="text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wide bg-[var(--bg-base)] text-[var(--text-muted)]"
                        >
                          {selectedPosts[selectedPostIndex]?.platform}
                        </span>
                        <span 
                          className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                          style={{ 
                            background: isUnfilledSlot(selectedPosts[selectedPostIndex])
                              ? 'var(--accent-muted)'
                              : {
                                  draft: 'rgba(245,158,11,0.15)',
                                  pending_approval: 'rgba(245,158,11,0.15)', 
                                  scheduled: 'rgba(34,197,94,0.15)',
                                  posted: 'rgba(217,119,6,0.15)',
                                  failed: 'rgba(239,68,68,0.15)'
                                }[selectedPosts[selectedPostIndex]?.status] || 'var(--bg-base)',
                            color: isUnfilledSlot(selectedPosts[selectedPostIndex])
                              ? 'var(--accent)'
                              : {
                                  draft: '#f59e0b',
                                  pending_approval: '#f59e0b', 
                                  scheduled: '#22c55e',
                                  posted: '#d97706',
                                  failed: '#ef4444'
                                }[selectedPosts[selectedPostIndex]?.status] || 'var(--text-muted)' 
                          }}
                        >
                          {isUnfilledSlot(selectedPosts[selectedPostIndex]) ? 'Empty Slot' : selectedPosts[selectedPostIndex]?.status?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Predicted score badge (pre-publish) */}
                      {(() => {
                        const p = selectedPosts[selectedPostIndex];
                        if (!p || !p.predicted_score || p.predicted_score <= 0 || p.status === 'posted') return null;
                        const s = p.predicted_score;
                        return (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{
                              background: s >= 70 ? 'rgba(34,197,94,0.15)' : s >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                              color: s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          >
                            Score: {s}
                          </span>
                        );
                      })()}
                      {/* Engagement metrics (post-publish) */}
                      {(() => {
                        const p = selectedPosts[selectedPostIndex];
                        if (!p || p.status !== 'posted' || (!p.likes && !p.comments_count)) return null;
                        return (
                          <span className="text-xs text-[var(--text-muted)]">
                            {p.likes || 0} likes · {p.comments_count || 0} comments · {p.shares || 0} shares
                          </span>
                        );
                      })()}

                      {/* Edit & Delete buttons - only for non-posted content */}
                      {selectedPosts[selectedPostIndex]?.status !== 'posted' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(selectedPosts[selectedPostIndex])}
                            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(selectedPosts[selectedPostIndex]?.id)}
                            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:bg-red-500/20 text-red-400 border border-red-400/30"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  

                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Slot Creation Modal */}
      {showSlotModal && slotDay !== null && (
        <SlotCreationModal
          day={slotDay}
          month={currentMonth}
          year={currentYear}
          jwt={jwt}
          presetHour={slotHour ?? undefined}
          onClose={() => {
            setShowSlotModal(false);
            setSlotDay(null);
            setSlotHour(null);
          }}
          onCreated={loadCalendar}
          onMessage={onMessage}
        />
      )}
      
      {/* Edit Caption Modal */}
      {showEditModal && editingPost && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
            onClick={() => setShowEditModal(false)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="relative w-full max-w-md pointer-events-auto rounded-2xl overflow-hidden animate-slide-up"
              style={{
                background: 'var(--bg-surface)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                border: '1px solid var(--border)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <span className="text-base font-semibold text-[var(--text-primary)]">Edit Caption</span>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              {/* Caption textarea */}
              <div className="px-5 py-4">
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Write your caption..."
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {editCaption.length} characters
                </p>
              </div>
              
              {/* Actions */}
              <div className="px-5 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCaption}
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(145deg, var(--accent), var(--accent-hover))',
                    color: 'var(--bg-base)'
                  }}
                >
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
