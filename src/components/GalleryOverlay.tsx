"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Clock, Check, Send, Loader2, Facebook, Instagram, Zap, ThumbsDown, Calendar } from 'lucide-react';

interface GalleryItem {
  id: number;
  url: string;
  original_url: string;
  styled_url: string | null;
  status: 'raw' | 'styling' | 'ready' | 'approved' | 'scheduled' | 'posted';
  created_at: string;
  styled_at: string | null;
  caption: string | null;
  hashtags: string | null;
  style: string | null;
  post?: {
    id: number;
    status: string;
    platform: string;
    scheduled_for: string | null;
    posted_at: string | null;
  };
}

interface GalleryResponse {
  ready: GalleryItem[];
  styling: GalleryItem[];
  raw: GalleryItem[];
  posted: GalleryItem[];
  counts: { ready: number; styling: number; raw: number; total: number };
  limits: { queue_cap: number; buffer_minutes: number };
}

interface GalleryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  token: string;
}

export default function GalleryOverlay({ isOpen, onClose, clientId, token }: GalleryOverlayProps) {
  const [gallery, setGallery] = useState<GalleryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch(`https://api.guardiacontent.com/clients/${clientId}/gallery`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: GalleryResponse = await res.json();
        setGallery(data);
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, token]);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchGallery();
      const interval = setInterval(fetchGallery, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, clientId, fetchGallery]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const removeFromGallery = (id: number, section: 'raw' | 'ready' | 'styling') => {
    if (!gallery) return;
    setGallery(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: prev[section].filter(item => item.id !== id),
        counts: { ...prev.counts, [section]: Math.max(0, prev.counts[section] - 1) }
      };
    });
  };

  const handleAction = async (item: GalleryItem, action: 'reject' | 'confirm' | 'approve' | 'rush', platform?: string) => {
    const section = item.status === 'raw' ? 'raw' : item.status === 'styling' ? 'styling' : 'ready';
    
    // Rush: fire-and-forget, optimistic remove, let Gio handle confirmation
    if (action === 'rush') {
      removeFromGallery(item.id, section);
      fetch(`https://api.guardiacontent.com/clients/${clientId}/assets/${item.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'rush', platform: platform || 'facebook' }),
      }).catch(() => fetchGallery());
      return;
    }

    setActionLoading(item.id);
    try {
      const res = await fetch(`https://api.guardiacontent.com/clients/${clientId}/assets/${item.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, platform }),
      });

      if (res.ok) {
        removeFromGallery(item.id, section);
        if (action === 'reject') showToast('Removed', 'success');
        else if (action === 'confirm') showToast('Sent to styling', 'success');
        else if (action === 'approve') showToast('Approved! Gio will schedule it.', 'success');
      } else {
        const data = await res.json();
        showToast(data.detail || 'Action failed', 'error');
      }
    } catch (_err) {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`https://api.guardiacontent.com/uploads/${clientId}/file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        showToast('Uploaded!', 'success');
        setTimeout(fetchGallery, 1000);
      } else {
        showToast('Upload failed', 'error');
      }
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const freshOut = [...(gallery?.ready || [])].filter(i => ['ready', 'styled', 'approved'].includes(i.status));
  const stylingItems = gallery?.styling || [];
  const rawItems = gallery?.raw || [];
  const postedItems = gallery?.posted || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {toast && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'} text-white text-sm font-medium`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="relative w-full max-w-6xl h-[85vh] bg-[#0a0a0a]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Content Gallery</h2>
            <p className="text-sm text-white/50">
              {gallery?.counts ? `${freshOut.length + stylingItems.length} ready • ${rawItems.length} in queue` : 'Your content factory'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/40" />
            </div>
          ) : (
            <>
              {/* FRESH OUT - Styled content ready for action */}
              <section className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl border border-emerald-500/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Fresh Out</h3>
                    <p className="text-xs text-white/50">Styled & ready • Reject, Approve for Gio to schedule, or Rush post now</p>
                  </div>
                  <span className="ml-auto text-sm text-emerald-400/70">{freshOut.length + stylingItems.length} items</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {stylingItems.map(item => (
                    <div key={`styling-${item.id}`} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-amber-500/30">
                      <img src={item.url} alt="" className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                        Styling...
                      </div>
                    </div>
                  ))}

                  {freshOut.length === 0 && stylingItems.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-white/30 text-sm">
                      Styled content will appear here
                    </div>
                  ) : (
                    freshOut.map(item => {
                      const isLoading = actionLoading === item.id;
                      return (
                        <div key={`ready-${item.id}`} className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                          
                          {/* Hover overlay with actions */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                            <div className="space-y-2">
                              {/* Row 1: Reject / Approve */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAction(item, 'reject')}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAction(item, 'approve')}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                              </div>
                              
                              {/* Row 2: Rush options */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAction(item, 'rush', 'facebook')}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <Facebook className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAction(item, 'rush', 'instagram')}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-purple-600/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-400 text-white text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <Instagram className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {item.style && (
                            <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs bg-black/60 text-white/80">
                              {item.style}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* TO THE FACTORY - Raw queue */}
              <section className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl border border-blue-500/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">To the Factory</h3>
                    <p className="text-xs text-white/50">Raw uploads • Reject or Confirm to send for styling</p>
                  </div>
                  <span className="ml-auto text-sm text-blue-400/70">{rawItems.length} waiting</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* Upload button */}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-blue-500/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : <Plus className="w-6 h-6 text-white/40" />}
                    <span className="text-xs text-white/40">{uploading ? 'Uploading...' : 'Add Photo'}</span>
                  </label>

                  {rawItems.map(item => {
                    const isLoading = actionLoading === item.id;
                    return (
                      <div key={`raw-${item.id}`} className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-blue-500/40 transition-all">
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                        
                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-2">
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleAction(item, 'reject')}
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAction(item, 'confirm')}
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium transition-colors disabled:opacity-50"
                              title="Confirm - Send to styling"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs bg-white/20 text-white/70">
                          Queued
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* PUBLISHED - Archive */}
              {postedItems.length > 0 && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Send className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Published</h3>
                      <p className="text-xs text-white/50">Content that's live</p>
                    </div>
                    <span className="ml-auto text-sm text-white/40">{postedItems.length} items</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {postedItems.slice(0, 16).map(item => (
                      <div key={`posted-${item.id}-${item.post?.id}`} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-green-500/20">
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                        {item.post?.platform && (
                          <div className="absolute bottom-1 left-1 p-1 rounded bg-black/60">
                            {item.post.platform === 'facebook' ? <Facebook className="w-3 h-3 text-blue-400" /> : <Instagram className="w-3 h-3 text-pink-400" />}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
