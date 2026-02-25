'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type Asset = {
  id: number;
  original_url: string;
  styled_url: string | null;
  style_applied: string | null;
  created_at: string;
};

type Upload = {
  id: string;
  original_url: string;
  filename: string;
  status: string;
  style_to_apply: string;
  created_at: string;
};

type Post = {
  id: number;
  platform: string;
  content: string;
  caption: string;
  scheduled_for: string;
  status: string;
  asset_url?: string;
};

type Client = {
  id: string;
  business_name: string;
  tier: string;
  preferred_style?: string;
  tier_config?: {
    images_per_month: number;
    posts_per_month: number;
  };
};

type Usage = {
  images_styled: number;
  posts_created: number;
};

const STYLES = [
  { code: 'ghibli', name: 'Studio Ghibli', emoji: '🏯', desc: 'Whimsical, dreamy' },
  { code: 'anime', name: 'Anime', emoji: '✨', desc: 'Bold, expressive' },
  { code: 'pixel', name: 'Retro Pixel', emoji: '👾', desc: 'Nostalgic, fun' },
  { code: 'oil_painting', name: 'Oil Painting', emoji: '🎨', desc: 'Classic, elegant' },
  { code: 'cartoon', name: 'Modern Cartoon', emoji: '🎪', desc: 'Playful, friendly' },
  { code: 'cyberpunk', name: 'Cyberpunk', emoji: '🌆', desc: 'Futuristic, edgy' },
  { code: 'watercolor', name: 'Watercolor', emoji: '💧', desc: 'Soft, organic' },
  { code: 'modern', name: 'Clean Modern', emoji: '◻️', desc: 'Professional, sleek' },
];

export default function DashboardPage() {
  const params = useParams();
  const token = params?.clientId as string ?? ''; // This is now "clientId-accessToken"
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [actualClientId, setActualClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'library' | 'assets' | 'calendar' | 'styles'>('library');
  const [usage, setUsage] = useState<Usage>({ images_styled: 0, posts_created: 0 });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchData = async () => {
    try {
      // First validate the token and get client data
      const accessRes = await fetch(`${API_URL}/access/client/${token}`);
      
      if (!accessRes.ok) {
        setError('invalid_link');
        setLoading(false);
        return;
      }
      
      const clientData = await accessRes.json();
      const realId = clientData.id;
      setActualClientId(realId);
      
      // Now fetch the rest using the actual client ID
      const [assetsRes, calendarRes, usageRes, uploadsRes, fullClientRes] = await Promise.all([
        fetch(`${API_URL}/clients/${realId}/assets`),
        fetch(`${API_URL}/clients/${realId}/calendar`),
        fetch(`${API_URL}/clients/${realId}/usage`),
        fetch(`${API_URL}/uploads/${realId}/queue`),
        fetch(`${API_URL}/clients/${realId}`),
      ]);

      const assetsData = await assetsRes.json();
      const calendarData = await calendarRes.json();
      const usageData = await usageRes.json();
      const uploadsData = await uploadsRes.json();
      const fullClient = await fullClientRes.json();
      
      setClient({ ...clientData, ...fullClient });
      setAssets(assetsData.assets || []);
      setPosts(calendarData.posts || []);
      setUsage(usageData.usage || { images_styled: 0, posts_created: 0 });
      setUploads(uploadsData.queue || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError('connection_error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">
            {error === 'invalid_link' ? '🔒' : '⚠️'}
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            {error === 'invalid_link' 
              ? "This link isn't valid" 
              : "Something went wrong"}
          </h1>
          <p className="text-gray-400 mb-6">
            {error === 'invalid_link'
              ? "The dashboard link you're using may have expired or been regenerated. Check your email for the latest link from Giovanni."
              : "We couldn't load your dashboard. Please try again in a moment."}
          </p>
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400">Client not found</div>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    spark: 'bg-yellow-500',
    pro: 'bg-green-500',
    unleashed: 'bg-purple-500',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#333]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-purple-500 text-2xl">⚡</span>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {client.business_name}
                </h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${tierColors[client.tier]} text-black font-medium uppercase`}>
                  {client.tier}
                </span>
              </div>
            </div>
            
            {client.tier_config && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <span className="text-gray-400">Images</span>
                  <p className="text-white font-medium">
                    {usage.images_styled}/{client.tier_config.images_per_month}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#1a1a1a] border-b border-[#333]">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            {(['library', 'assets', 'calendar', 'styles'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'library' && uploads.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                    {uploads.length}
                  </span>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'library' && (
          <LibraryTab clientId={actualClientId} uploads={uploads} onRefresh={fetchData} preferredStyle={client.preferred_style} />
        )}
        {activeTab === 'assets' && (
          <AssetsTab assets={assets} />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab posts={posts} />
        )}
        {activeTab === 'styles' && (
          <StylesTab 
            clientId={actualClientId} 
            currentStyle={client.preferred_style || 'ghibli'} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#333] py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Questions? Reply to any email from Giovanni or contact support.</p>
          <p className="mt-1">
            <a href="/" className="text-purple-400 hover:text-purple-300">
              guardiacontent.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function LibraryTab({ clientId, uploads, onRefresh, preferredStyle }: { clientId: string; uploads: Upload[]; onRefresh: () => void; preferredStyle?: string }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !clientId) return;
    
    setUploading(true);
    
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        await fetch(`${API_URL}/uploads/${clientId}/file`, {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    
    setUploading(false);
    onRefresh();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Upload Queue</h2>
      
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-[#333] hover:border-purple-500/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-4xl mb-4">📸</div>
        <p className="text-white font-medium mb-2">
          {uploading ? 'Uploading...' : 'Drop photos here'}
        </p>
        <p className="text-gray-400 text-sm">
          or click to browse • Style: <span className="text-purple-400">{preferredStyle || 'ghibli'}</span>
        </p>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Queue list */}
      {uploads.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">
            Pending ({uploads.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploads.map((upload) => (
              <div 
                key={upload.id}
                className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333]"
              >
                <div className="aspect-square bg-[#252525] flex items-center justify-center">
                  {upload.original_url ? (
                    <img src={upload.original_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🖼️</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm text-white truncate">{upload.filename}</p>
                  <p className="text-xs text-purple-400">{upload.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploads.length === 0 && (
        <p className="mt-8 text-center text-gray-500">
          No photos in queue. Upload some to get started!
        </p>
      )}
    </div>
  );
}

function AssetsTab({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎨</div>
        <h2 className="text-xl font-semibold text-white mb-2">No styled images yet</h2>
        <p className="text-gray-400">
          Upload some photos and we'll style them for you!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Styled Assets</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <div 
            key={asset.id}
            className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333] group"
          >
            <div className="aspect-square relative">
              <img 
                src={asset.styled_url || asset.original_url} 
                alt=""
                className="w-full h-full object-cover"
              />
              {asset.style_applied && (
                <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                  {asset.style_applied}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarTab({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-xl font-semibold text-white mb-2">No posts scheduled yet</h2>
        <p className="text-gray-400">
          Once we create content for you, it'll appear here.
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = posts.reduce((acc: Record<string, Post[]>, post: Post) => {
    const date = new Date(post.scheduled_for).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Content Calendar</h2>
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, datePosts]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-400 mb-3">{date}</h3>
            <div className="space-y-3">
              {datePosts.map((post: Post) => (
                <div 
                  key={post.id}
                  className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333] flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded bg-[#252525] flex items-center justify-center shrink-0 overflow-hidden">
                    {post.asset_url ? (
                      <img src={post.asset_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>📝</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">
                        {post.platform}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        post.status === 'posted' 
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-white text-sm line-clamp-2">{post.caption || post.content}</p>
                  </div>
                  <div className="text-gray-400 text-sm shrink-0">
                    {new Date(post.scheduled_for).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StylesTab({ 
  clientId, 
  currentStyle, 
}: { 
  clientId: string; 
  currentStyle: string; 
}) {
  const [selected, setSelected] = useState(currentStyle);
  const [saving, setSaving] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const handleSave = async () => {
    if (selected === currentStyle) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_style: selected }),
      });
      alert('Style updated! New uploads will use this style.');
    } catch (_e) {
      alert('Failed to save');
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Your Style</h2>
      <p className="text-gray-400 mb-6">
        Choose a default style for your AI-generated images.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STYLES.map((style) => (
          <button
            key={style.code}
            onClick={() => setSelected(style.code)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selected === style.code
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-[#333] bg-[#1a1a1a] hover:border-[#555]'
            }`}
          >
            <div className="text-3xl mb-3">{style.emoji}</div>
            <h3 className="font-medium text-white">{style.name}</h3>
            <p className="text-sm text-gray-400">{style.desc}</p>
            {selected === style.code && (
              <span className="inline-block mt-2 text-xs bg-purple-600 text-white px-2 py-1 rounded">
                {currentStyle === style.code ? 'Current' : 'Selected'}
              </span>
            )}
          </button>
        ))}
      </div>

      {selected !== currentStyle && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Style Preference'}
        </button>
      )}
    </div>
  );
}