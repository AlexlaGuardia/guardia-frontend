"use client";

import { Wrench, FileText, Terminal, Database, RefreshCw, Eye } from "lucide-react";

interface ToolCall {
  tool: string;
  duration?: number;
  status?: "running" | "complete";
}

const TOOL_ICONS: Record<string, React.ComponentType<any>> = {
  shell: Terminal,
  read_file: FileText,
  write_file: FileText,
  query: Database,
  restart_service: RefreshCw,
  health: Eye,
};

export default function ToolCallLog({ calls }: { calls: ToolCall[] }) {
  if (calls.length === 0) return null;

  return (
    <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
      {calls.slice(-10).map((call, i) => {
        const Icon = TOOL_ICONS[call.tool] || Wrench;
        return (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#666] py-0.5">
            <Icon size={10} className={call.status === "running" ? "text-blue-400 animate-pulse" : "text-[#555]"} />
            <span className="truncate flex-1">{call.tool}</span>
            {call.duration != null && (
              <span className="text-[#555] tabular-nums">{call.duration < 1 ? `${Math.round(call.duration * 1000)}ms` : `${call.duration.toFixed(1)}s`}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
