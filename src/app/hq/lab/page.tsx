"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API_BASE = "https://api.guardiacontent.com";

interface InboxFile {
  name: string;
  url: string;
  size: number;
  modified: string;
  type: string;
}

interface StyleOption {
  name: string;
  display_name: string;
  description: string;
  default_strength: number;
}

interface ProspectJob {
  job_id: string;
  status: string;
  styled_url?: string;
  composite_url?: string;
  engine?: string;
  generation_time?: number;
  error?: string;
}

interface LabOutputFile {
  name: string;
  url: string;
  size: number;
  modified: string;
  type: string;
}

// ─────────────────────────────────────────────────────────
// UPLOAD DROPBOX
// ─────────────────────────────────────────────────────────

function Dropbox({ onUploaded }: { onUploaded?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>();

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (files.length === 0) {
      setMessage("No supported files found");
      return;
    }

    setUploading(true);
    let uploaded = 0;

    for (const file of files) {
      setMessage(`Uploading ${uploaded + 1}/${files.length}: ${file.name}`);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`${API_BASE}/lab/upload`, { method: "POST", body: form });
        if (res.ok) uploaded++;
      } catch {
        // continue
      }
    }

    setMessage(uploaded === files.length
      ? `${uploaded} file${uploaded > 1 ? "s" : ""} uploaded to inbox`
      : `${uploaded}/${files.length} files uploaded`
    );
    setUploading(false);
    if (uploaded > 0) onUploaded?.();
  }, [onUploaded]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
        dragging ? "border-teal-500 bg-teal-500/5" : "border-[#2a2a2f] hover:border-[#3a3a3f]"
      }`}
    >
      <div className="text-[#555] mb-1">
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        ) : (
          <p className="text-sm">Drop images here to add to inbox</p>
        )}
      </div>
      {message && (
        <p className={`text-xs mt-1 ${message.includes("uploaded") ? "text-teal-400" : "text-[#666]"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// INBOX GRID
// ─────────────────────────────────────────────────────────

function InboxGrid({
  files,
  selected,
  onSelect,
}: {
  files: InboxFile[];
  selected: InboxFile | null;
  onSelect: (f: InboxFile | null) => void;
}) {
  const images = files.filter(f => f.type === "image");

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-[#444]">
        <p className="text-sm">Inbox empty</p>
        <p className="text-xs mt-1">Drop images above to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {images.map(f => (
        <div
          key={f.name}
          onClick={() => onSelect(selected?.name === f.name ? null : f)}
          className={`relative bg-[#0d0d0e] border rounded-lg overflow-hidden cursor-pointer transition-all ${
            selected?.name === f.name
              ? "border-teal-500 ring-1 ring-teal-500/30"
              : "border-[#1a1a1f] hover:border-[#2a2a2f]"
          }`}
        >
          <div className="aspect-square bg-[#0a0a0a]">
            <img
              src={`${API_BASE}${f.url}`}
              alt={f.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-2">
            <p className="text-[#888] text-[10px] truncate">{f.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TASK GEM PANEL
// ─────────────────────────────────────────────────────────

interface AnalysisResult {
  analysis: {
    subject: string;
    has_text: boolean;
    text_content: string | null;
    dominant_colors: string[];
    composition: string;
    quality_notes: string;
  };
  gem: string;
  warnings: string[];
  recommended_intensity: string;
  recommended_engine: string;
}

const QUICK_STYLES = ["warm", "cinematic", "clean", "vibrant", "rich", "cool"];

function TaskGemPanel({
  file,
  onClose,
  onComplete,
}: {
  file: InboxFile;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [gem, setGem] = useState("");
  const [businessName, setBusinessName] = useState(() =>
    file.name.replace(/\.[^.]+$/, "").replace(/_/g, " ")
  );
  const [businessContext, setBusinessContext] = useState("");
  const [engine, setEngine] = useState<"gemini" | "replicate">("gemini");
  const [intensity, setIntensity] = useState<"light" | "balanced" | "heavy">("balanced");
  const [analyzing, setAnalyzing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "complete" | "error">("idle");
  const [job, setJob] = useState<ProspectJob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setWarnings([]);
    try {
      const res = await fetch(`${API_BASE}/lab/prospect/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          business_name: businessName || undefined,
          business_context: businessContext || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }
      const data: AnalysisResult = await res.json();
      setGem(data.gem);
      setWarnings(data.warnings || []);
      if (data.recommended_intensity) setIntensity(data.recommended_intensity as typeof intensity);
      if (data.recommended_engine) setEngine(data.recommended_engine as typeof engine);
    } catch (e: unknown) {
      setWarnings([e instanceof Error ? e.message : "Analysis failed — write gem manually"]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleQuickStyle = async (styleName: string) => {
    submitJob({ style: styleName });
  };

  const handleStyleGem = async () => {
    if (!gem.trim()) return;
    const strengthMap = { light: 0.35, balanced: 0.55, heavy: 0.75 };
    submitJob({ gem: gem.trim(), strength: strengthMap[intensity] });
  };

  const submitJob = async (params: { gem?: string; style?: string; strength?: number }) => {
    setStatus("processing");
    setElapsed(0);
    setJob(null);

    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    try {
      const res = await fetch(`${API_BASE}/lab/prospect/style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          business_name: businessName || "Your Business",
          engine,
          ...params,
        }),
      });
      const data = await res.json();
      if (!data.job_id) throw new Error(data.detail || "Failed to submit");

      let attempts = 0;
      const maxAttempts = 45;
      pollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollRef.current!);
          clearInterval(timerRef.current!);
          setStatus("error");
          setJob({ job_id: data.job_id, status: "error", error: "Timed out — try again" });
          return;
        }
        try {
          const r = await fetch(`${API_BASE}/lab/prospect/status/${data.job_id}`);
          const j: ProspectJob = await r.json();
          if (j.status === "complete") {
            clearInterval(pollRef.current!);
            clearInterval(timerRef.current!);
            setJob(j);
            setStatus("complete");
            onComplete();
          } else if (j.status === "error") {
            clearInterval(pollRef.current!);
            clearInterval(timerRef.current!);
            setJob(j);
            setStatus("error");
          }
        } catch { /* keep polling */ }
      }, 2000);
    } catch (e: unknown) {
      clearInterval(timerRef.current!);
      setStatus("error");
      setJob({ job_id: "", status: "error", error: e instanceof Error ? e.message : "Request failed" });
    }
  };

  return (
    <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0a0a] flex-shrink-0">
            <img src={`${API_BASE}${file.url}`} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm text-[#ccc]">{file.name}</p>
            <p className="text-[10px] text-[#555]">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[#555] hover:text-[#888] text-lg leading-none">&times;</button>
      </div>

      <div className="p-4 space-y-4">
        {/* Two-column: preview + controls */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Image preview */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-[#0a0a0a] rounded-lg overflow-hidden">
              <img src={`${API_BASE}${file.url}`} alt={file.name} className="w-full" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-3">
            {/* Task Gem textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#555] text-xs font-semibold tracking-wider">TASK GEM</label>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="text-xs text-teal-400 hover:text-teal-300 disabled:text-[#555] transition-colors"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 border border-teal-500 border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : "Analyze"}
                </button>
              </div>
              <textarea
                value={gem}
                onChange={e => setGem(e.target.value)}
                rows={4}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-[#ccc] focus:border-teal-500/50 focus:outline-none resize-none"
                placeholder="Click Analyze or write your own creative direction..."
              />
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    <p className="text-amber-400 text-xs">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Business fields */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[#555] text-[10px] font-semibold tracking-wider block mb-1">BUSINESS</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg px-3 py-1.5 text-xs text-[#ccc] focus:border-teal-500/50 focus:outline-none"
                  placeholder="Business name"
                />
              </div>
              <div className="flex-1">
                <label className="text-[#555] text-[10px] font-semibold tracking-wider block mb-1">CONTEXT</label>
                <input
                  type="text"
                  value={businessContext}
                  onChange={e => setBusinessContext(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg px-3 py-1.5 text-xs text-[#ccc] focus:border-teal-500/50 focus:outline-none"
                  placeholder="Fashion, jewelry, salon..."
                />
              </div>
            </div>

            {/* Engine + Intensity + Style It */}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[#555] text-[10px] font-semibold tracking-wider block mb-1">ENGINE</label>
                <div className="flex bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden">
                  <button onClick={() => setEngine("gemini")} className={`px-3 py-1.5 text-xs transition-colors ${engine === "gemini" ? "bg-teal-500/10 text-teal-400" : "text-[#555] hover:text-[#888]"}`}>Fast</button>
                  <button onClick={() => setEngine("replicate")} className={`px-3 py-1.5 text-xs transition-colors ${engine === "replicate" ? "bg-teal-500/10 text-teal-400" : "text-[#555] hover:text-[#888]"}`}>Detailed</button>
                </div>
              </div>
              <div>
                <label className="text-[#555] text-[10px] font-semibold tracking-wider block mb-1">INTENSITY</label>
                <div className="flex bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden">
                  {(["light", "balanced", "heavy"] as const).map(v => (
                    <button key={v} onClick={() => setIntensity(v)} className={`px-3 py-1.5 text-xs capitalize transition-colors ${intensity === v ? "bg-teal-500/10 text-teal-400" : "text-[#555] hover:text-[#888]"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStyleGem}
                disabled={status === "processing" || !gem.trim()}
                className="px-5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-[#1a1a1f] disabled:text-[#555] text-white text-sm font-medium rounded-lg transition-colors"
              >
                {status === "processing" ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {elapsed}s
                  </span>
                ) : "Style It"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Styles */}
        <div>
          <label className="text-[#555] text-[10px] font-semibold tracking-wider block mb-2">QUICK STYLES</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_STYLES.map(s => (
              <button
                key={s}
                onClick={() => handleQuickStyle(s)}
                disabled={status === "processing"}
                className="px-3 py-1 bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg text-xs text-[#888] hover:border-[#2a2a2f] hover:text-teal-400 disabled:opacity-50 transition-all capitalize"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {status === "error" && job?.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-xs">{job.error}</p>
          </div>
        )}

        {status === "complete" && job && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <span className="text-teal-400">Done</span>
              <span>&middot;</span>
              <span>{job.generation_time}s via {job.engine}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job.styled_url && (
                <div className="bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden">
                  <img src={`${API_BASE}${job.styled_url}`} alt="Styled" className="w-full" />
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-xs text-[#888]">Styled</span>
                    <a href={`${API_BASE}${job.styled_url}`} download className="text-xs text-teal-400 hover:text-teal-300">Download</a>
                  </div>
                </div>
              )}
              {job.composite_url && (
                <div className="bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden">
                  <img src={`${API_BASE}${job.composite_url}`} alt="Before/After" className="w-full" />
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-xs text-[#888]">Before / After</span>
                    <a href={`${API_BASE}${job.composite_url}`} download className="text-xs text-teal-400 hover:text-teal-300">Download</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// OUTPUT GALLERY
// ─────────────────────────────────────────────────────────

function OutputGallery({ files }: { files: LabOutputFile[] }) {
  const images = files.filter(f => f.type === "image");

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-[#444]">
        <p className="text-sm">No outputs yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {images.map(f => (
        <div key={f.name} className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg overflow-hidden hover:border-[#2a2a2f] transition-colors">
          <div className="aspect-square bg-[#0a0a0a]">
            <img src={`${API_BASE}${f.url}`} alt={f.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-2 flex items-center justify-between">
            <p className="text-[#888] text-[10px] truncate flex-1">{f.name}</p>
            <a
              href={`${API_BASE}${f.url}`}
              download
              className="text-teal-400 hover:text-teal-300 ml-2 flex-shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────

export default function LabPage() {
  const [inbox, setInbox] = useState<InboxFile[]>([]);
  const [outputs, setOutputs] = useState<LabOutputFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InboxFile | null>(null);

  const loadInbox = useCallback(() => {
    fetch(`${API_BASE}/lab/inbox`)
      .then(r => r.json())
      .then(d => setInbox(d.files || []))
      .catch(() => {});
  }, []);

  const loadOutputs = useCallback(() => {
    fetch(`${API_BASE}/lab/outputs`)
      .then(r => r.json())
      .then(d => setOutputs(d.files || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/lab/inbox`).then(r => r.json()),
      fetch(`${API_BASE}/lab/outputs`).then(r => r.json()),
    ])
      .then(([inboxData, outputData]) => {
        setInbox(inboxData.files || []);
        setOutputs(outputData.files || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const inboxImages = inbox.filter(f => f.type === "image");

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e8e8]">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <h1 className="text-teal-400 font-semibold text-sm tracking-wider">LAB</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-[#555]">Inbox <span className="text-teal-400">{inboxImages.length}</span></span>
            <span className="text-[#555]">Outputs <span className="text-amber-400">{outputs.filter(f => f.type === "image").length}</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Upload */}
        <section>
          <h2 className="text-[#555] text-xs font-semibold tracking-wider mb-3">UPLOAD</h2>
          <Dropbox onUploaded={loadInbox} />
        </section>

        {/* Inbox */}
        <section>
          <h2 className="text-[#555] text-xs font-semibold tracking-wider mb-3">INBOX</h2>
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg overflow-hidden">
                  <div className="aspect-square bg-[#1a1a1f] animate-pulse" />
                  <div className="p-2"><div className="h-2 bg-[#1a1a1f] rounded animate-pulse w-2/3" /></div>
                </div>
              ))}
            </div>
          ) : (
            <InboxGrid files={inbox} selected={selected} onSelect={setSelected} />
          )}
        </section>

        {/* Style Panel */}
        {selected && (
          <section>
            <h2 className="text-[#555] text-xs font-semibold tracking-wider mb-3">TASK GEM</h2>
            <TaskGemPanel
              file={selected}
              onClose={() => setSelected(null)}
              onComplete={loadOutputs}
            />
          </section>
        )}

        {/* Outputs */}
        <section>
          <h2 className="text-[#555] text-xs font-semibold tracking-wider mb-3">OUTPUTS</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg overflow-hidden">
                  <div className="aspect-square bg-[#1a1a1f] animate-pulse" />
                  <div className="p-2"><div className="h-2 bg-[#1a1a1f] rounded animate-pulse w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : (
            <OutputGallery files={outputs} />
          )}
        </section>
      </main>
    </div>
  );
}
