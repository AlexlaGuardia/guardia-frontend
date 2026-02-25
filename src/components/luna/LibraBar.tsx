"use client";

import { useState } from "react";
import { Clock, Newspaper, Users, Calendar, ChevronUp } from "lucide-react";
import { useLibra } from "@/hooks/useLibra";
import LibraPanel from "./LibraPanel";

export default function LibraBar() {
  const {
    focus,
    scoutCount,
    hiveSessions,
    calendarEvents,
    loading,
    error,
  } = useLibra({ enabled: true, pollInterval: 60000 });
  const [panelOpen, setPanelOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1a1a1f]">
        <div className="h-4 w-48 bg-[#1a1a1f] rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-t border-[#1a1a1f]">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-[#555]">Libra offline</span>
      </div>
    );
  }

  // Format remaining time from hours
  const remaining = focus
    ? focus.time_remaining_hours >= 1
      ? `${Math.floor(focus.time_remaining_hours)}h ${Math.round((focus.time_remaining_hours % 1) * 60)}m`
      : `${Math.round(focus.time_remaining_hours * 60)}m`
    : null;

  // Next calendar event
  const nextEvent = calendarEvents.find(
    (e) => new Date(e.start) > new Date()
  );

  return (
    <>
      {panelOpen && <LibraPanel onClose={() => setPanelOpen(false)} />}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="w-full flex items-center gap-6 px-4 py-2 border-t border-[#1a1a1f] hover:bg-[#111] transition cursor-pointer"
      >
        {/* Current block */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              focus?.project === "personal" ? "bg-gray-500" : "bg-green-500"
            }`}
          />
          <Clock className="w-3.5 h-3.5 text-[#888]" />
          <span className="text-xs text-[#ccc]">
            {focus
              ? focus.time_remaining_hours > 0
                ? `${focus.focus} (${remaining} left)`
                : focus.focus
              : "Free time"}
          </span>
        </div>

        {/* Scout */}
        <div className="flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5 text-[#888]" />
          <span
            className={`text-xs ${scoutCount > 0 ? "text-cyan-400" : "text-[#555]"}`}
          >
            {scoutCount > 0 ? `${scoutCount} new` : "caught up"}
          </span>
        </div>

        {/* Hive */}
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#888]" />
          <span
            className={`text-xs ${hiveSessions.length > 0 ? "text-amber-400" : "text-[#555]"}`}
          >
            {hiveSessions.length > 0
              ? `${hiveSessions.length} active`
              : "quiet"}
          </span>
        </div>

        {/* Calendar */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#888]" />
          <span className="text-xs text-[#555]">
            {nextEvent
              ? `${nextEvent.summary} at ${new Date(nextEvent.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "Clear"}
          </span>
        </div>

        <div className="ml-auto">
          <ChevronUp
            className={`w-3.5 h-3.5 text-[#555] transition ${panelOpen ? "" : "rotate-180"}`}
          />
        </div>
      </button>
    </>
  );
}
