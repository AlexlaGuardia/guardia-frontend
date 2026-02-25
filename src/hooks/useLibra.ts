"use client";

import { useState, useEffect, useCallback } from "react";

// Matches /liba/focus FocusResponse
interface FocusData {
  should_be_working_on: string;
  project: string;
  focus: string;
  time_remaining_hours: number;
  next_block: {
    project: string;
    focus: string;
    start_hour: number;
    end_hour: number;
    starts_in_hours: number;
  } | null;
  is_work_hours: boolean;
  active_event: Record<string, string> | null;
}

// Matches /liba/scout/findings rows
interface ScoutFinding {
  id: number;
  source_id: number;
  title: string;
  url: string;
  score: number;
  found_at: string;
  surfaced: boolean;
  matched_topics: string | null;
  source_name: string;
}

// Matches /liba/hive/sessions rows
interface HiveSession {
  id: number;
  session_id: string;
  session_type: string;
  project: string | null;
  summary: string | null;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
}

// Matches /liba/today calendar_events entries
interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  location?: string;
}

// Matches /liba/today upcoming_blocks entries
interface ScheduleBlock {
  project: string;
  focus: string;
  start_hour: number;
  end_hour: number;
  starts_in_hours?: number;
  hours_remaining?: number;
}

interface LibraState {
  focus: FocusData | null;
  scoutCount: number;
  scoutFindings: ScoutFinding[];
  hiveSessions: HiveSession[];
  calendarEvents: CalendarEvent[];
  upcomingBlocks: ScheduleBlock[];
  loading: boolean;
  error: string | null;
}

export type { FocusData, ScoutFinding, HiveSession, CalendarEvent, ScheduleBlock };

export function useLibra({ enabled = true, pollInterval = 60000 } = {}) {
  const [state, setState] = useState<LibraState>({
    focus: null,
    scoutCount: 0,
    scoutFindings: [],
    hiveSessions: [],
    calendarEvents: [],
    upcomingBlocks: [],
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    try {
      const [focusRes, todayRes, hiveRes, scoutRes] = await Promise.all([
        fetch("/api/liba/focus").then((r) => r.json()).catch(() => null),
        fetch("/api/liba/today").then((r) => r.json()).catch(() => null),
        fetch("/api/liba/hive/sessions?active_only=true")
          .then((r) => r.json())
          .catch(() => ({ sessions: [] })),
        fetch("/api/liba/scout/findings?surfaced=false&limit=10")
          .then((r) => r.json())
          .catch(() => ({ findings: [] })),
      ]);

      setState({
        loading: false,
        error: null,
        focus: focusRes?.error ? null : focusRes,
        scoutCount: todayRes?.scout_items ?? 0,
        scoutFindings: scoutRes?.findings ?? [],
        hiveSessions: (hiveRes?.sessions ?? []).filter(
          (s: HiveSession) => !s.ended_at
        ),
        calendarEvents: todayRes?.calendar_events ?? [],
        upcomingBlocks: todayRes?.upcoming_blocks ?? [],
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Libra offline",
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchAll();
    const interval = setInterval(fetchAll, pollInterval);
    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchAll]);

  const markScoutRead = useCallback(async () => {
    const res = await fetch("/api/liba/scout/digest").then((r) => r.json());
    setState((prev) => ({
      ...prev,
      scoutFindings: [],
      scoutCount: 0,
    }));
    return res;
  }, []);

  return { ...state, refresh: fetchAll, markScoutRead };
}
