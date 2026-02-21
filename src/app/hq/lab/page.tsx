"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileImage, FileVideo, FileAudio, FileText, FileCode,
  FileArchive, FileSpreadsheet, File, Upload, Search,
  LayoutList, LayoutGrid, Trash2, Download, X, ChevronDown,
  Eye, Paintbrush, RefreshCw,
} from "lucide-react";

const API = "https://api.guardiacontent.com";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

interface VaultFile {
  name: string;
  url: string;
  size: number;
  modified: string;
  type: string;
  ext: string;
  zone: string;
  subpath?: string;
}

interface VaultStats {
  total_files: number;
  total_size: number;
  by_type: Record<string, { count: number; size: number }>;
  by_zone: Record<string, { count: number; size: number; label: string }>;
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

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  image: "#14b8a6",
  video: "#8b5cf6",
  audio: "#f59e0b",
  document: "#3b82f6",
  data: "#10b981",
  code: "#6b7280",
  archive: "#ef4444",
  other: "#555555",
};

const ZONE_CONFIG = [
  { id: "inbox", label: "Inbox" },
  { id: "outputs", label: "Outputs" },
  { id: "uploads", label: "Uploads" },
  { id: "generated", label: "Generated" },
  { id: "archive", label: "Archive" },
];

const TYPE_FILTERS = ["all", "image", "video", "audio", "document", "data", "code", "archive", "other"];

const SORT_OPTIONS = [
  { value: "modified_desc", label: "Newest" },
  { value: "modified_asc", label: "Oldest" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "size_desc", label: "Largest" },
  { value: "size_asc", label: "Smallest" },
];

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────
// FILE ICON
// ─────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof File> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  data: FileSpreadsheet,
  code: FileCode,
  archive: FileArchive,
  other: File,
};

function FileIcon({ type, size = 16 }: { type: string; size?: number }) {
  const Icon = ICON_MAP[type] || File;
  return <Icon size={size} style={{ color: TYPE_COLORS[type] || "#555" }} />;
}

// ─────────────────────────────────────────────────────────
// VAULT DROPZONE
// ─────────────────────────────────────────────────────────

function VaultDropzone({ onUploaded }: { onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: globalThis.File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    let uploaded = 0;

    for (const file of files) {
      setMessage(`Uploading ${uploaded + 1}/${files.length}: ${file.name}`);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`${API}/lab/upload`, { method: "POST", body: form });
        if (res.ok) uploaded++;
      } catch { /* continue */ }
    }

    setMessage(
      uploaded === files.length
        ? `${uploaded} file${uploaded > 1 ? "s" : ""} uploaded`
        : `${uploaded}/${files.length} uploaded`
    );
    setUploading(false);
    if (uploaded > 0) onUploaded();
    setTimeout(() => setMessage(undefined), 4000);
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  }, [uploadFiles]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
        dragging ? "border-teal-500 bg-teal-500/5" : "border-[#2a2a2f] hover:border-[#3a3a3f]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#888]">{message}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-[#555]">
          <Upload size={16} />
          <span className="text-sm">Drop any files here or click to browse</span>
        </div>
      )}
      {!uploading && message && (
        <p className="text-xs mt-1 text-teal-400">{message}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STORAGE STATS
// ─────────────────────────────────────────────────────────

function StorageStats({ stats }: { stats: VaultStats | null }) {
  if (!stats) return null;

  const types = Object.entries(stats.by_type).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
      <span className="text-[#888]">
        {stats.total_files} files <span className="text-[#555]">&middot;</span> {formatSize(stats.total_size)}
      </span>
      <span className="text-[#333]">|</span>
      {types.map(([t, { count }]) => (
        <span key={t} className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] }} />
          <span style={{ color: TYPE_COLORS[t] }}>{count}</span>
          <span className="text-[#555]">{t}</span>
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FILE TOOLBAR
// ─────────────────────────────────────────────────────────

function FileToolbar({
  activeZone, onZoneChange,
  typeFilter, onTypeChange,
  searchQuery, onSearchChange,
  sortValue, onSortChange,
  viewMode, onViewChange,
  selectedCount, onBulkDelete, onClearSelection,
}: {
  activeZone: string;
  onZoneChange: (z: string) => void;
  typeFilter: string;
  onTypeChange: (t: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortValue: string;
  onSortChange: (s: string) => void;
  viewMode: "list" | "grid";
  onViewChange: (v: "list" | "grid") => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Zone tabs + controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Zone pills */}
        {ZONE_CONFIG.map((z) => (
          <button
            key={z.id}
            onClick={() => onZoneChange(z.id)}
            className={`text-[10px] px-2.5 py-1 rounded transition-colors ${
              activeZone === z.id
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                : "text-[#555] hover:text-[#888] border border-transparent"
            }`}
          >
            {z.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#444]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg pl-7 pr-3 py-1 text-xs text-[#ccc] w-36 focus:border-teal-500/50 focus:outline-none"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg px-2 py-1 text-xs text-[#888] appearance-none pr-6 focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden">
          <button
            onClick={() => onViewChange("list")}
            className={`px-2 py-1 transition-colors ${viewMode === "list" ? "text-teal-400 bg-teal-500/10" : "text-[#555] hover:text-[#888]"}`}
          >
            <LayoutList size={14} />
          </button>
          <button
            onClick={() => onViewChange("grid")}
            className={`px-2 py-1 transition-colors ${viewMode === "grid" ? "text-teal-400 bg-teal-500/10" : "text-[#555] hover:text-[#888]"}`}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Type filter + bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors capitalize ${
              typeFilter === t
                ? t === "all"
                  ? "bg-[#333]/30 text-[#ccc] border border-[#444]"
                  : `border`
                : "text-[#555] hover:text-[#888] border border-transparent"
            }`}
            style={
              typeFilter === t && t !== "all"
                ? { backgroundColor: `${TYPE_COLORS[t]}20`, color: TYPE_COLORS[t], borderColor: `${TYPE_COLORS[t]}40` }
                : undefined
            }
          >
            {t}
          </button>
        ))}

        {selectedCount > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#888]">{selectedCount} selected</span>
            <button onClick={onClearSelection} className="text-[10px] text-[#555] hover:text-[#888]">Clear</button>
            <button
              onClick={onBulkDelete}
              className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center gap-1"
            >
              <Trash2 size={10} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FILE BROWSER — LIST VIEW
// ─────────────────────────────────────────────────────────

function FileListView({
  files, selected, onToggleSelect, onSelectFile,
}: {
  files: VaultFile[];
  selected: Set<string>;
  onToggleSelect: (key: string) => void;
  onSelectFile: (f: VaultFile) => void;
}) {
  if (files.length === 0) {
    return <div className="text-center py-12 text-[#444] text-sm">No files match</div>;
  }

  const fileKey = (f: VaultFile) => `${f.zone}/${f.name}`;

  return (
    <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg overflow-hidden">
      {/* Desktop table */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="border-b border-[#1a1a1f]">
            <th className="w-8 p-3" />
            <th className="text-left p-3 text-[10px] text-[#555] tracking-wider font-semibold">NAME</th>
            <th className="text-left p-3 text-[10px] text-[#555] tracking-wider font-semibold">TYPE</th>
            <th className="text-left p-3 text-[10px] text-[#555] tracking-wider font-semibold">SIZE</th>
            <th className="text-left p-3 text-[10px] text-[#555] tracking-wider font-semibold">ZONE</th>
            <th className="text-left p-3 text-[10px] text-[#555] tracking-wider font-semibold">MODIFIED</th>
            <th className="w-10 p-3" />
          </tr>
        </thead>
        <tbody>
          {files.map((f) => {
            const key = fileKey(f);
            const isImage = f.type === "image";
            return (
              <tr
                key={key}
                className="border-b border-[#1a1a1f] last:border-0 hover:bg-[#0d0d0e] transition-colors cursor-pointer"
                onClick={() => onSelectFile(f)}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => onToggleSelect(key)}
                    className="accent-teal-500"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isImage ? (
                      <div className="w-8 h-8 rounded bg-[#0a0a0a] flex-shrink-0 overflow-hidden">
                        <img src={`${API}${f.url}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#0a0a0a] flex-shrink-0 flex items-center justify-center">
                        <FileIcon type={f.type} size={16} />
                      </div>
                    )}
                    <span className="text-sm text-[#ccc] truncate max-w-[280px]">{f.name}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${TYPE_COLORS[f.type]}20`, color: TYPE_COLORS[f.type] }}
                  >
                    {f.ext || f.type}
                  </span>
                </td>
                <td className="p-3 text-xs text-[#888] font-mono">{formatSize(f.size)}</td>
                <td className="p-3 text-xs text-[#555]">{f.zone}</td>
                <td className="p-3 text-xs text-[#555]">{timeAgo(f.modified)}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`${API}${f.url}`}
                    download
                    className="text-[#555] hover:text-teal-400 transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-[#1a1a1f]">
        {files.map((f) => {
          const key = fileKey(f);
          return (
            <div
              key={key}
              className="p-3 flex items-center gap-3 hover:bg-[#0d0d0e] transition-colors cursor-pointer"
              onClick={() => onSelectFile(f)}
            >
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={(e) => { e.stopPropagation(); onToggleSelect(key); }}
                className="accent-teal-500 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="w-8 h-8 rounded bg-[#0a0a0a] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {f.type === "image" ? (
                  <img src={`${API}${f.url}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileIcon type={f.type} size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#ccc] truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[9px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${TYPE_COLORS[f.type]}20`, color: TYPE_COLORS[f.type] }}
                  >
                    {f.ext || f.type}
                  </span>
                  <span className="text-[10px] text-[#555]">{formatSize(f.size)}</span>
                  <span className="text-[10px] text-[#555]">{timeAgo(f.modified)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FILE BROWSER — GRID VIEW
// ─────────────────────────────────────────────────────────

function FileGridView({
  files, selected, onToggleSelect, onSelectFile,
}: {
  files: VaultFile[];
  selected: Set<string>;
  onToggleSelect: (key: string) => void;
  onSelectFile: (f: VaultFile) => void;
}) {
  if (files.length === 0) {
    return <div className="text-center py-12 text-[#444] text-sm">No files match</div>;
  }

  const fileKey = (f: VaultFile) => `${f.zone}/${f.name}`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {files.map((f) => {
        const key = fileKey(f);
        const isImage = f.type === "image";
        const isChecked = selected.has(key);

        return (
          <div
            key={key}
            onClick={() => onSelectFile(f)}
            className={`relative bg-[#0d0d0e] border rounded-lg overflow-hidden cursor-pointer transition-all group ${
              isChecked ? "border-teal-500 ring-1 ring-teal-500/30" : "border-[#1a1a1f] hover:border-[#2a2a2f]"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`absolute top-2 left-2 z-10 ${isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleSelect(key)}
                className="accent-teal-500"
              />
            </div>

            {/* Preview */}
            <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center">
              {isImage ? (
                <img src={`${API}${f.url}`} alt={f.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileIcon type={f.type} size={32} />
                  <span className="text-[10px] text-[#555] uppercase font-mono">{f.ext}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-[10px] text-[#888] truncate">{f.name}</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px] text-[#555]">{formatSize(f.size)}</span>
                <span
                  className="text-[8px] px-1 py-0.5 rounded"
                  style={{ backgroundColor: `${TYPE_COLORS[f.type]}15`, color: TYPE_COLORS[f.type] }}
                >
                  {f.ext}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FILE DETAIL PANEL
// ─────────────────────────────────────────────────────────

function FileDetailPanel({
  file, onClose, onDelete, onStyleThis,
}: {
  file: VaultFile;
  onClose: () => void;
  onDelete: (f: VaultFile) => void;
  onStyleThis: (f: VaultFile) => void;
}) {
  const isImage = file.type === "image";
  const isVideo = file.type === "video";
  const isAudio = file.type === "audio";
  const canStyle = isImage && file.zone === "inbox";
  const canDelete = ["inbox", "outputs", "archive"].includes(file.zone);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0a0a0b] border-l border-[#1a1a1f] shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a1f] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <FileIcon type={file.type} size={18} />
            <div className="min-w-0">
              <h2 className="font-mono text-sm text-[#e8e8e8] truncate">{file.name}</h2>
              <p className="text-[10px] text-[#555]">{file.zone} &middot; {formatSize(file.size)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-[#888] text-lg px-2">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preview */}
          <div className="bg-[#0a0a0a] rounded-lg overflow-hidden">
            {isImage && (
              <img src={`${API}${file.url}`} alt={file.name} className="w-full" />
            )}
            {isVideo && (
              <video src={`${API}${file.url}`} controls className="w-full" />
            )}
            {isAudio && (
              <div className="p-6 flex flex-col items-center gap-3">
                <FileIcon type="audio" size={48} />
                <audio src={`${API}${file.url}`} controls className="w-full" />
              </div>
            )}
            {!isImage && !isVideo && !isAudio && (
              <div className="p-8 flex flex-col items-center gap-3">
                <FileIcon type={file.type} size={48} />
                <span className="text-xs text-[#555] uppercase font-mono">.{file.ext}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#555] tracking-wider">TYPE</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${TYPE_COLORS[file.type]}20`, color: TYPE_COLORS[file.type] }}
              >
                {file.ext || file.type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#555] tracking-wider">SIZE</span>
              <span className="text-xs text-[#888] font-mono">{formatSize(file.size)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#555] tracking-wider">ZONE</span>
              <span className="text-xs text-[#888]">{file.zone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#555] tracking-wider">MODIFIED</span>
              <span className="text-xs text-[#888]">{timeAgo(file.modified)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <a
              href={`${API}${file.url}`}
              download
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg text-xs text-[#888] hover:text-teal-400 hover:border-[#2a2a2f] transition-colors"
            >
              <Download size={14} /> Download
            </a>
            {canStyle && (
              <button
                onClick={() => onStyleThis(file)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600/20 border border-teal-500/30 rounded-lg text-xs text-teal-400 hover:bg-teal-600/30 transition-colors"
              >
                <Paintbrush size={14} /> Style This
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(file)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// TASK GEM PANEL (preserved from original)
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
  file, onClose, onComplete,
}: {
  file: VaultFile;
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
      const res = await fetch(`${API}/lab/prospect/analyze`, {
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

  const submitJob = async (params: { gem?: string; style?: string; strength?: number }) => {
    setStatus("processing");
    setElapsed(0);
    setJob(null);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      const res = await fetch(`${API}/lab/prospect/style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, business_name: businessName || "Your Business", engine, ...params }),
      });
      const data = await res.json();
      if (!data.job_id) throw new Error(data.detail || "Failed to submit");

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 45) {
          clearInterval(pollRef.current!);
          clearInterval(timerRef.current!);
          setStatus("error");
          setJob({ job_id: data.job_id, status: "error", error: "Timed out" });
          return;
        }
        try {
          const r = await fetch(`${API}/lab/prospect/status/${data.job_id}`);
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
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#0a0a0b] border-l border-[#1a1a1f] shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a1f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Paintbrush size={16} className="text-teal-400" />
            <div>
              <h2 className="font-mono text-sm text-[#e8e8e8]">Style: {file.name}</h2>
              <p className="text-[10px] text-[#555]">{formatSize(file.size)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-[#888]"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preview */}
          <div className="bg-[#0a0a0a] rounded-lg overflow-hidden">
            <img src={`${API}${file.url}`} alt={file.name} className="w-full" />
          </div>

          {/* Task Gem */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#555] text-xs font-semibold tracking-wider">TASK GEM</label>
              <button onClick={handleAnalyze} disabled={analyzing} className="text-xs text-teal-400 hover:text-teal-300 disabled:text-[#555]">
                {analyzing ? <span className="flex items-center gap-1"><span className="w-3 h-3 border border-teal-500 border-t-transparent rounded-full animate-spin" />Analyzing...</span> : "Analyze"}
              </button>
            </div>
            <textarea value={gem} onChange={(e) => setGem(e.target.value)} rows={3}
              className="w-full bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-[#ccc] focus:border-teal-500/50 focus:outline-none resize-none"
              placeholder="Click Analyze or write your own creative direction..." />
          </div>

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
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg px-3 py-1.5 text-xs text-[#ccc] focus:border-teal-500/50 focus:outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-[#555] text-[10px] font-semibold tracking-wider block mb-1">CONTEXT</label>
              <input type="text" value={businessContext} onChange={(e) => setBusinessContext(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg px-3 py-1.5 text-xs text-[#ccc] focus:border-teal-500/50 focus:outline-none"
                placeholder="Fashion, jewelry, salon..." />
            </div>
          </div>

          {/* Engine + Intensity + Style */}
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
                {(["light", "balanced", "heavy"] as const).map((v) => (
                  <button key={v} onClick={() => setIntensity(v)} className={`px-3 py-1.5 text-xs capitalize transition-colors ${intensity === v ? "bg-teal-500/10 text-teal-400" : "text-[#555] hover:text-[#888]"}`}>{v}</button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { const s = { light: 0.35, balanced: 0.55, heavy: 0.75 }; submitJob({ gem: gem.trim(), strength: s[intensity] }); }}
              disabled={status === "processing" || !gem.trim()}
              className="px-5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-[#1a1a1f] disabled:text-[#555] text-white text-sm font-medium rounded-lg transition-colors"
            >
              {status === "processing" ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />{elapsed}s</span> : "Style It"}
            </button>
          </div>

          {/* Quick Styles */}
          <div>
            <label className="text-[#555] text-[10px] font-semibold tracking-wider block mb-2">QUICK STYLES</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_STYLES.map((s) => (
                <button key={s} onClick={() => submitJob({ style: s })} disabled={status === "processing"}
                  className="px-3 py-1 bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg text-xs text-[#888] hover:border-[#2a2a2f] hover:text-teal-400 disabled:opacity-50 transition-all capitalize"
                >{s}</button>
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
              <div className="space-y-3">
                {job.styled_url && (
                  <div className="bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden">
                    <img src={`${API}${job.styled_url}`} alt="Styled" className="w-full" />
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs text-[#888]">Styled</span>
                      <a href={`${API}${job.styled_url}`} download className="text-xs text-teal-400 hover:text-teal-300">Download</a>
                    </div>
                  </div>
                )}
                {job.composite_url && (
                  <div className="bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg overflow-hidden">
                    <img src={`${API}${job.composite_url}`} alt="Before/After" className="w-full" />
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs text-[#888]">Before / After</span>
                      <a href={`${API}${job.composite_url}`} download className="text-xs text-teal-400 hover:text-teal-300">Download</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────────────────

function DeleteConfirmModal({
  files, onConfirm, onCancel,
}: {
  files: { zone: string; name: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-[#0d0d0e] border border-[#1a1a1f] rounded-xl p-5 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-sm text-[#e8e8e8] font-medium mb-2">
          Delete {files.length} file{files.length > 1 ? "s" : ""}?
        </h3>
        <div className="max-h-32 overflow-y-auto mb-3">
          {files.slice(0, 10).map((f, i) => (
            <p key={i} className="text-[10px] text-[#555] font-mono truncate">{f.zone}/{f.name}</p>
          ))}
          {files.length > 10 && <p className="text-[10px] text-[#555]">...and {files.length - 10} more</p>}
        </div>
        <p className="text-xs text-red-400/70 mb-4">This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1f] rounded-lg text-xs text-[#888] hover:text-[#ccc] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 hover:bg-red-500/30 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────

export default function LabPage() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState("inbox");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState("modified_desc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [detailFile, setDetailFile] = useState<VaultFile | null>(null);
  const [styleFile, setStyleFile] = useState<VaultFile | null>(null);
  const [deleteQueue, setDeleteQueue] = useState<{ zone: string; name: string }[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    fetch(`${API}/lab/vault?stats_only=true`)
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, [refreshKey]);

  // Fetch files when zone/sort/search changes
  useEffect(() => {
    setLoading(true);
    const [sort, order] = sortValue.split("_");
    const params = new URLSearchParams({
      zone: activeZone,
      sort,
      order,
      limit: "200",
    });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (searchQuery) params.set("search", searchQuery);

    fetch(`${API}/lab/vault?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setFiles(d.files || []);
        if (d.stats) setStats(d.stats);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [activeZone, typeFilter, sortValue, searchQuery, refreshKey]);

  // Debounced search
  const handleSearchChange = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQuery(q), 300);
  }, []);

  // Selection helpers
  const fileKey = (f: VaultFile) => `${f.zone}/${f.name}`;
  const toggleSelect = useCallback((key: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Delete handling
  const handleDeleteSingle = (f: VaultFile) => {
    setDeleteQueue([{ zone: f.zone, name: f.name }]);
    setDetailFile(null);
  };

  const handleBulkDelete = () => {
    const items = Array.from(selectedFiles).map((key) => {
      const [zone, ...rest] = key.split("/");
      return { zone, name: rest.join("/") };
    });
    setDeleteQueue(items);
  };

  const confirmDelete = async () => {
    if (!deleteQueue) return;
    try {
      await fetch(`${API}/lab/vault/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: deleteQueue }),
      });
      setSelectedFiles(new Set());
      setRefreshKey((k) => k + 1);
    } catch { /* silent */ }
    setDeleteQueue(null);
  };

  const refresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Local search state for controlled input
  const [searchInput, setSearchInput] = useState("");

  return (
    <div className="min-h-screen bg-[#171513] text-[#e8e8e8]">
      {/* Header */}
      <header className="border-b border-[#1a1a1f] bg-[#0a0a0b]/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <h1 className="text-teal-400 font-semibold text-sm tracking-wider">THE VAULT</h1>
          </div>
          <div className="flex items-center gap-3">
            <StorageStats stats={stats} />
            <button onClick={refresh} className="text-[#555] hover:text-[#888] transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-5">
        {/* Dropzone */}
        <VaultDropzone onUploaded={refresh} />

        {/* Toolbar */}
        <FileToolbar
          activeZone={activeZone}
          onZoneChange={(z) => { setActiveZone(z); setSelectedFiles(new Set()); }}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          searchQuery={searchInput}
          onSearchChange={(q) => { setSearchInput(q); handleSearchChange(q); }}
          sortValue={sortValue}
          onSortChange={setSortValue}
          viewMode={viewMode}
          onViewChange={setViewMode}
          selectedCount={selectedFiles.size}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedFiles(new Set())}
        />

        {/* File Browser */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : viewMode === "list" ? (
          <FileListView
            files={files}
            selected={selectedFiles}
            onToggleSelect={toggleSelect}
            onSelectFile={setDetailFile}
          />
        ) : (
          <FileGridView
            files={files}
            selected={selectedFiles}
            onToggleSelect={toggleSelect}
            onSelectFile={setDetailFile}
          />
        )}
      </main>

      {/* Detail Panel */}
      {detailFile && !styleFile && (
        <FileDetailPanel
          file={detailFile}
          onClose={() => setDetailFile(null)}
          onDelete={handleDeleteSingle}
          onStyleThis={(f) => { setDetailFile(null); setStyleFile(f); }}
        />
      )}

      {/* Task Gem Panel */}
      {styleFile && (
        <TaskGemPanel
          file={styleFile}
          onClose={() => setStyleFile(null)}
          onComplete={() => { setStyleFile(null); refresh(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteQueue && (
        <DeleteConfirmModal
          files={deleteQueue}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteQueue(null)}
        />
      )}
    </div>
  );
}
