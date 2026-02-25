"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://api.guardiacontent.com";

interface StyleCard {
  id: number;
  name: string;
  description: string;
  is_favorite: boolean;
  created_at: string;
}

interface StyleCardsProps {
  jwt: string;
  clientId: string;
  onUpdated?: () => void;
}

export default function StyleCards({ jwt, clientId, onUpdated }: StyleCardsProps) {
  const [cards, setCards] = useState<StyleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchCards();
  }, [jwt, clientId]);

  const fetchCards = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients/${clientId}/style-cards`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } catch (err) {
      console.error("Failed to fetch style cards:", err);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim() || newDescription.trim().length < 10) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/clients/${clientId}/style-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewName("");
        setNewDescription("");
        fetchCards();
        onUpdated?.();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create card");
      }
    } catch (_err) {
      setError("Connection error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const card = cards.find(c => c.id === id);
    if (card?.is_favorite && confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/clients/${clientId}/style-cards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        setCards(cards.filter(c => c.id !== id));
        onUpdated?.();
      }
    } catch (err) {
      console.error("Failed to delete card:", err);
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const handleToggleFavorite = async (id: number) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    const prevCards = [...cards];
    setCards(cards.map(c =>
      c.id === id ? { ...c, is_favorite: !c.is_favorite } : c
    ));

    try {
      const res = await fetch(`${API_BASE}/clients/${clientId}/style-cards/${id}/favorite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (!res.ok) {
        setCards(prevCards);
        const data = await res.json();
        if (data.detail?.includes("Maximum")) {
          setError(data.detail);
          setTimeout(() => setError(null), 3000);
        }
      } else {
        fetchCards();
        onUpdated?.();
      }
    } catch (_err) {
      setCards(prevCards);
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return b.is_favorite ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Style Cards</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Define style directives for your content. Favorites guide AI generation.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-[var(--bg-base)] hover:opacity-90 transition-opacity"
        >
          + Add Style
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {sortedCards.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)]">
          <p className="text-[var(--text-muted)]">No style cards yet</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create your first style directive to guide content generation
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCards.map((card) => (
            <div
              key={card.id}
              className={`relative p-4 rounded-2xl transition-all ${
                card.is_favorite
                  ? 'ring-2 ring-amber-400/50 bg-[var(--bg-elevated)]'
                  : 'bg-[var(--bg-surface)]'
              }`}
              style={{ border: '1px solid var(--border)' }}
            >
              {card.is_favorite && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-xs text-black font-semibold px-2 py-0.5 rounded-full">
                  Favorite
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-[var(--text-primary)] pr-8">
                  {card.name}
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleFavorite(card.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title={card.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {card.is_favorite ? (
                      <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    disabled={deletingId === card.id}
                    className={`p-1.5 rounded-lg transition-colors ${
                      confirmDeleteId === card.id
                        ? 'bg-red-500/20 text-red-400'
                        : 'hover:bg-white/5 text-[var(--text-muted)]'
                    }`}
                    title="Delete"
                  >
                    {deletingId === card.id ? (
                      <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] line-clamp-3">
                {card.description}
              </p>

              {confirmDeleteId === card.id && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400 mb-2">Delete this favorite?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-1.5 text-xs bg-[var(--bg-surface)] rounded-lg hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="flex-1 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md rounded-2xl pointer-events-auto"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Style Card</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Style Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Professional & Warm"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe this style in detail. What tone, colors, and feel should content have?"
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {newDescription.length}/500 characters (min 10)
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-5 border-t border-[var(--border)]">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || newName.trim().length < 2 || newDescription.trim().length < 10}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-[var(--accent)] text-[var(--bg-base)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
