"use client";

import DaemonRoomsIndicator from "@/components/DaemonRoomsIndicator";
import Link from "next/link";
import { Zap, Check, AlertTriangle, Clock, ArrowLeft } from "lucide-react";

export default function DaemonRoomsDemoPage() {
  return (
    <div className="min-h-screen bg-[#171513] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/hq/luna" className="text-[#888] text-sm hover:text-[#aaa] flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Luna
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Daemon Rooms Indicator Demo</h1>
          <p className="text-[#888] text-sm">
            This component connects to the SSE stream at <code className="bg-[#1a1a1f] px-2 py-1 rounded text-violet-400">/luna/daemon-rooms/stream</code>
            {' '}and displays real-time daemon room activity.
          </p>
        </div>

        <div className="mb-6">
          <DaemonRoomsIndicator />
        </div>

        <div className="bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-4">
          <h2 className="text-sm font-semibold text-[#ccc] mb-3">Event Types</h2>
          <div className="space-y-2 text-xs text-[#888]">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-blue-400" />
              <span className="text-blue-400 font-medium">daemon_room_activated</span>
              <span>- New daemon room started</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-green-400" />
              <span className="text-green-400 font-medium">daemon_room_completed</span>
              <span>- Room successfully completed</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-400" />
              <span className="text-yellow-400 font-medium">daemon_room_escalated</span>
              <span>- Room escalated to human</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-red-400" />
              <span className="text-red-400 font-medium">daemon_room_timeout</span>
              <span>- Room timed out</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#0a0a0b] border border-[#1a1a1f] rounded-lg p-4">
          <h2 className="text-sm font-semibold text-[#ccc] mb-3">Features</h2>
          <ul className="space-y-2 text-xs text-[#888]">
            <li className="flex items-start gap-2">
              <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
              <span>Real-time SSE connection with auto-reconnect</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
              <span>Connection status indicator (green = connected, red = disconnected)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
              <span>Active rooms displayed with pulsing status indicator</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
              <span>Recent events (completed/escalated/timeout) shown for 10 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
              <span>Timestamps displayed in relative format (e.g., "2m ago")</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
              <span>Color-coded status indicators for each event type</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
