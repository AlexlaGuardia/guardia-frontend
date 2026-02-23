"use client";

/**
 * PipelineCard — Content being processed in the factory
 * Shows thumbnail, filename, current status, and a progress indicator.
 * Used in FactoryScreen "In Pipeline" section.
 */

export interface PipelineItem {
  id: number;
  original_filename: string;
  status: string;
  styled_url?: string;
  original_url?: string;
  thumbnail_url?: string;
  url?: string;
  uploaded_at: string;
}

interface PipelineCardProps {
  item: PipelineItem;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  raw: { label: "Queued", color: "#9CA3AF" },
  queued: { label: "Queued", color: "#9CA3AF" },
  styling: { label: "Styling", color: "#C9A227" },
  processing: { label: "Processing", color: "#C9A227" },
  styled: { label: "Captioning", color: "#8B5CF6" },
  ready: { label: "Captioning", color: "#8B5CF6" },
};

export default function PipelineCard({ item }: PipelineCardProps) {
  const imageUrl = item.url || item.thumbnail_url || item.original_url;
  const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: "#9CA3AF" };
  const isActive = item.status === "styling" || item.status === "processing";

  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl">
      {/* Thumbnail */}
      <div
        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative"
        style={{
          border: isActive ? "2px solid #C9A227" : "1px solid var(--border)",
          boxShadow: isActive ? "0 0 10px rgba(201,162,39,0.3)" : "none",
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[var(--bg-surface)] flex items-center justify-center">
            <div className="w-3 h-3 border border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        )}
        {isActive && (
          <div className="absolute inset-0 rounded-lg animate-pulse pointer-events-none" style={{ background: "rgba(201,162,39,0.1)" }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.original_filename || "Image"}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isActive ? "animate-pulse" : ""}`}
            style={{ background: statusInfo.color }}
          />
          <span className="text-xs" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Progress indicator */}
      {isActive && (
        <div className="flex-shrink-0">
          <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[#C9A227] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
