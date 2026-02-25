"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Moon, Mic, Eye, Terminal } from "lucide-react";
import LunaChatPanel from "./LunaChatPanel";
import ShadowActivityPanel from "./ShadowActivityPanel";
import LibraBar from "./LibraBar";

const API_BASE = "https://api.guardiacontent.com";

type ViewMode = "command" | "ambient";
type LunaState = "idle" | "listening" | "processing" | "speaking";

interface CrawlItem {
  id: string;
  text: string;
  color: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// LUNA COMMAND CENTER
// Split-pane command center with mode toggle to ambient terminal
// ══════════════════════════════════════════════════════════════════════════════

export default function LunaCommandCenter() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<ViewMode>("command");

  // ── Auth ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dev") === "serb") {
        localStorage.setItem("hq_auth", "true");
        setAuthenticated(true);
        return;
      }
    }
    setAuthenticated(localStorage.getItem("hq_auth") === "true");
  }, []);

  // ── Login ──
  if (!authenticated) {
    return (
      <div className="h-screen bg-[#030304] flex items-center justify-center p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const u = (form.elements.namedItem("u") as HTMLInputElement).value;
            const p = (form.elements.namedItem("p") as HTMLInputElement).value;
            if (u.toLowerCase() === "jinjurikii" && p === "1991") {
              localStorage.setItem("hq_auth", "true");
              setAuthenticated(true);
            }
          }}
          className="bg-[#0a0a0b] border border-[#141418] rounded-lg p-6 w-full max-w-[300px]"
        >
          <div className="flex items-center gap-2 mb-6">
            <Moon size={18} className="text-violet-400" />
            <span className="text-violet-400 font-semibold text-sm tracking-wider">LUNA</span>
          </div>
          <input name="u" type="text" placeholder="Username" autoCapitalize="none" autoCorrect="off"
            className="w-full bg-[#060607] border border-[#141418] rounded px-3 py-2.5 text-[#999] text-sm mb-3 focus:outline-none focus:border-[#252530]" />
          <input name="p" type="password" placeholder="PIN"
            className="w-full bg-[#060607] border border-[#141418] rounded px-3 py-2.5 text-[#999] text-sm mb-4 focus:outline-none focus:border-[#252530]" />
          <button type="submit" className="w-full bg-violet-600 text-white py-2.5 rounded text-sm active:bg-violet-700">
            Enter
          </button>
        </form>
      </div>
    );
  }

  if (mode === "ambient") {
    return <AmbientTerminal onSwitchMode={() => setMode("command")} />;
  }

  // ── Command Center Mode ──
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0b]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1f] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-sm font-medium text-[#ccc]">Luna HQ</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs bg-[#1a1a1f] text-[#ccc]"
            disabled
          >
            <Terminal className="w-3.5 h-3.5" />
            CC
          </button>
          <button
            onClick={() => setMode("ambient")}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1f] transition"
          >
            <Eye className="w-3.5 h-3.5" />
            Ambient
          </button>
        </div>
      </div>

      {/* Main split pane */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Chat panel — 60% on desktop, full on mobile */}
        <div className="lg:w-[60%] w-full lg:border-r border-b lg:border-b-0 border-[#1a1a1f] flex flex-col min-h-0 h-[50vh] lg:h-auto">
          <LunaChatPanel />
        </div>

        {/* Shadow activity — 40% on desktop */}
        <div className="lg:w-[40%] w-full flex flex-col min-h-0 flex-1 lg:flex-initial">
          <ShadowActivityPanel />
        </div>
      </div>

      {/* Libra bar */}
      <LibraBar />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AMBIENT TERMINAL (preserved from original page.tsx)
// ══════════════════════════════════════════════════════════════════════════════

function AmbientTerminal({ onSwitchMode }: { onSwitchMode: () => void }) {
  const [state, setState] = useState<LunaState>("idle");
  const [transcript, setTranscript] = useState("");
  const [lunaText, setLunaText] = useState("");
  const [lastText, setLastText] = useState("");
  const [lobbyRoomId, setLobbyRoomId] = useState<number | null>(null);
  const [time, setTime] = useState("");
  const [connected, setConnected] = useState(false);
  const [convMode, setConvMode] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendRef = useRef<(text: string) => Promise<void>>(() => Promise.resolve());
  const audioUnlockedRef = useRef(false);
  const lastNotifIdRef = useRef(0);
  const [crawlItems, setCrawlItems] = useState<CrawlItem[]>([]);
  const crawlIdRef = useRef(0);

  // Conversation mode refs
  const convStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number>(0);
  const speechStartRef = useRef<number>(0);
  const isSpeechRef = useRef(false);
  const convRecorderRef = useRef<MediaRecorder | null>(null);
  const convActiveRef = useRef(false); // true when conv mode should be listening
  const suppressVadRef = useRef(false); // true during Luna playback
  const stateRef = useRef<LunaState>("idle");
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPressRef = useRef(false);

  // Keep stateRef in sync
  useEffect(() => { stateRef.current = state; }, [state]);

  // VAD config
  const VAD_THRESHOLD = 15; // RMS volume threshold (0-128 scale)
  const SPEECH_CONFIRM_MS = 250; // volume must stay above threshold this long to confirm speech
  const SILENCE_TIMEOUT_MS = 1500; // silence duration before we stop recording
  const _MIN_RECORDING_MS = 500; // minimum recording length to send

  // ── Clock ──
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Auto-load lobby room ──
  useEffect(() => {
    fetch(`${API_BASE}/luna/rooms`)
      .then(r => r.json())
      .then(data => {
        const lobby = data.rooms?.find((r: any) => r.room_type === "base");
        if (lobby) setLobbyRoomId(lobby.id);
      })
      .catch(console.error);
  }, []);

  // ── Audio unlock ──
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    const silent = new AudioContext();
    const buf = silent.createBuffer(1, 1, 22050);
    const src = silent.createBufferSource();
    src.buffer = buf;
    src.connect(silent.destination);
    src.start(0);
    audioUnlockedRef.current = true;
  }, []);

  // ── Helpers ──
  const clearFadeTimer = () => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const showLunaMessage = useCallback((text: string, durationMs?: number) => {
    setLunaText(text);
    setLastText(text);
    setState("speaking");
    clearFadeTimer();

    const lingerTime = durationMs
      ? durationMs + 3000
      : Math.max(5000, text.length * 50);

    fadeTimerRef.current = setTimeout(() => {
      setState("idle");
      setLunaText("");
    }, lingerTime);
  }, []);

  const addCrawl = useCallback((text: string, color = "rgba(167,139,250,0.45)") => {
    const id = `c-${Date.now()}-${++crawlIdRef.current}`;
    setCrawlItems(prev => [...prev.slice(-30), { id, text, color }]);
  }, []);

  const removeCrawl = useCallback((id: string) => {
    setCrawlItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const playAudio = useCallback((url: string) => {
    if (audioRef.current) audioRef.current.pause();
    suppressVadRef.current = true; // Suppress VAD during playback
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
    const audio = new Audio(fullUrl);
    audioRef.current = audio;
    audio.onended = () => {
      clearFadeTimer();
      fadeTimerRef.current = setTimeout(() => {
        setState(prev => prev === "speaking" ? "idle" : prev);
        setLunaText("");
        // Resume conversation mode listening after clip ends
        suppressVadRef.current = false;
        if (convActiveRef.current) {
          setTimeout(() => resumeConvListening(), 500);
        }
      }, 2000);
    };
    audio.onerror = () => {
      suppressVadRef.current = false;
      if (convActiveRef.current) {
        setTimeout(() => resumeConvListening(), 500);
      }
    };
    audio.play().catch(e => {
      console.warn("[Luna] Audio play failed:", e);
      suppressVadRef.current = false;
    });
  }, []);

  // ── Send message to Luna ──
  const sendToLuna = useCallback(async (text: string) => {
    if (!lobbyRoomId || !text.trim()) {
      setState("idle");
      if (convActiveRef.current) setTimeout(() => resumeConvListening(), 1000);
      return;
    }
    setState("processing");
    setTranscript("");
    setLunaText("");

    try {
      const res = await fetch(`${API_BASE}/luna/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: lobbyRoomId, message: text.trim() })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                fullText += data.text;
                setLunaText(fullText);
              } else if (data.type === "done") {
                fullText = data.full_text || fullText;
              } else if (data.type === "error") {
                fullText = `Error: ${data.message}`;
              }
            } catch {}
          }
        }
      }

      showLunaMessage(fullText);

      // Resume conversation mode listening after response displays
      if (convActiveRef.current) {
        suppressVadRef.current = false;
      }
    } catch {
      showLunaMessage("I couldn't process that. Try again.");
      if (convActiveRef.current) {
        suppressVadRef.current = false;
        setTimeout(() => resumeConvListening(), 3000);
      }
    }
  }, [lobbyRoomId, showLunaMessage, playAudio]);

  useEffect(() => { sendRef.current = sendToLuna; }, [sendToLuna]);

  // ══════════════════════════════════════════════════════════════════════════
  // CONVERSATION MODE — VAD (Voice Activity Detection)
  // ══════════════════════════════════════════════════════════════════════════

  const startConvMode = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      convStreamRef.current = stream;

      // Set up audio analysis
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      convActiveRef.current = true;
      suppressVadRef.current = false;
      isSpeechRef.current = false;
      silenceStartRef.current = 0;
      speechStartRef.current = 0;
      setConvMode(true);
      setState("listening");
      setTranscript("");

      // Start VAD polling
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      vadIntervalRef.current = setInterval(() => {
        if (suppressVadRef.current) return;
        if (stateRef.current === "processing") return;

        analyser.getByteTimeDomainData(dataArray);
        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length) * 128;
        const now = Date.now();

        if (rms > VAD_THRESHOLD) {
          // Sound detected
          silenceStartRef.current = 0;
          if (!isSpeechRef.current) {
            if (!speechStartRef.current) {
              speechStartRef.current = now;
            } else if (now - speechStartRef.current > SPEECH_CONFIRM_MS) {
              // Confirmed speech — start recording
              isSpeechRef.current = true;
              startConvRecording(stream);
              setState("listening");
              setTranscript("");
            }
          }
        } else {
          // Silence
          speechStartRef.current = 0;
          if (isSpeechRef.current) {
            if (!silenceStartRef.current) {
              silenceStartRef.current = now;
            } else if (now - silenceStartRef.current > SILENCE_TIMEOUT_MS) {
              // Silence confirmed — stop recording and send
              isSpeechRef.current = false;
              silenceStartRef.current = 0;
              stopConvRecording();
            }
          }
        }
      }, 80);

    } catch (e) {
      console.warn("[Conv] Failed to start:", e);
      setConvMode(false);
      convActiveRef.current = false;
      setState("idle");
    }
  }, []);

  const stopConvMode = useCallback(() => {
    convActiveRef.current = false;
    setConvMode(false);
    isSpeechRef.current = false;
    suppressVadRef.current = false;

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (convRecorderRef.current && convRecorderRef.current.state === "recording") {
      convRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (convStreamRef.current) {
      convStreamRef.current.getTracks().forEach(t => t.stop());
      convStreamRef.current = null;
    }
    analyserRef.current = null;
    setState("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (convActiveRef.current) {
        convActiveRef.current = false;
        if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        if (convStreamRef.current) convStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startConvRecording = useCallback((stream: MediaStream) => {
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      if (blob.size < 1000) {
        // Too short, resume listening
        if (convActiveRef.current) setState("listening");
        return;
      }

      setState("processing");
      setTranscript("Transcribing...");
      suppressVadRef.current = true; // Suppress VAD while processing

      try {
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        form.append("language", "en");
        const res = await fetch(`${API_BASE}/luna/listen`, { method: "POST", body: form });
        const data = await res.json();
        const text = data.text?.trim();
        if (text) {
          setTranscript(text);
          sendRef.current?.(text);
        } else {
          // No speech detected, resume
          suppressVadRef.current = false;
          if (convActiveRef.current) {
            setState("listening");
            setTranscript("");
          } else {
            setState("idle");
            setTranscript("");
          }
        }
      } catch {
        suppressVadRef.current = false;
        if (convActiveRef.current) {
          setState("listening");
        } else {
          setState("idle");
        }
        setTranscript("");
      }
    };

    recorder.start(250); // Collect in 250ms chunks for smoother data
    convRecorderRef.current = recorder;
  }, []);

  const stopConvRecording = useCallback(() => {
    if (convRecorderRef.current && convRecorderRef.current.state === "recording") {
      convRecorderRef.current.stop();
      convRecorderRef.current = null;
    }
  }, []);

  const resumeConvListening = useCallback(() => {
    if (!convActiveRef.current) return;
    if (stateRef.current === "processing") return;
    suppressVadRef.current = false;
    isSpeechRef.current = false;
    silenceStartRef.current = 0;
    speechStartRef.current = 0;
    setState("listening");
    setTranscript("");
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // MANUAL RECORDING (tap-to-talk, original behavior)
  // ══════════════════════════════════════════════════════════════════════════

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          setState("idle");
          setTranscript("");
          return;
        }
        setState("processing");
        setTranscript("Transcribing...");
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          form.append("language", "en");
          const res = await fetch(`${API_BASE}/luna/listen`, { method: "POST", body: form });
          const data = await res.json();
          const text = data.text?.trim();
          if (text) {
            setTranscript(text);
            sendRef.current?.(text);
          } else {
            setState("idle");
            setTranscript("");
          }
        } catch {
          setState("idle");
          setTranscript("");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      setState("idle");
      setTranscript("");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Notification polling ──
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/luna/notifications?undelivered_only=true&limit=5`);
        if (!res.ok) {
          setConnected(false);
          return;
        }
        setConnected(true);

        const data = await res.json();
        const notifications = data.notifications || [];
        for (const [idx, n] of notifications.reverse().entries()) {
          if (n.id <= lastNotifIdRef.current) continue;
          lastNotifIdRef.current = n.id;
          const text = n.message || "";
          const truncated = text.length > 100 ? text.slice(0, 97) + "..." : text;
          setTimeout(() => addCrawl(truncated), idx * 2500);
          if (n.audio_url) {
            showLunaMessage(text, n.audio_duration_ms);
            playAudio(n.audio_url);
          }
          fetch(`${API_BASE}/luna/notifications/${n.id}/delivered`, { method: "POST" }).catch(() => {});
        }
      } catch {
        setConnected(false);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [showLunaMessage, playAudio, addCrawl]);

  // ── Crawl startup sequence ──
  useEffect(() => {
    const seeds = [
      { text: "shadow rooms online", delay: 2000 },
      { text: "forge // glass // kage // pulse // paradise // magii", delay: 5500 },
      { text: "monitoring active", delay: 9000 },
    ];
    const timers = seeds.map(s =>
      setTimeout(() => addCrawl(s.text, "rgba(100,116,139,0.3)"), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [addCrawl]);

  // ── Tap / Long-press handler ──
  const handlePointerDown = () => {
    wasLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      wasLongPressRef.current = true;
      unlockAudio();
      // Toggle conversation mode
      if (convMode) {
        stopConvMode();
      } else {
        startConvMode();
      }
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTap = () => {
    if (wasLongPressRef.current) {
      wasLongPressRef.current = false;
      return; // Was a long-press, don't handle as tap
    }

    unlockAudio();

    // In conversation mode, tap to interrupt/cancel
    if (convMode) {
      if (state === "speaking") {
        audioRef.current?.pause();
        clearFadeTimer();
        suppressVadRef.current = false;
        setTimeout(() => resumeConvListening(), 500);
      }
      return;
    }

    // Manual tap-to-talk mode
    if (state === "listening") {
      stopRecording();
      return;
    }
    if (state === "speaking") {
      audioRef.current?.pause();
      clearFadeTimer();
      setState("idle");
      setLunaText("");
      return;
    }
    if (state === "processing") return;

    setState("listening");
    setTranscript("");
    startRecording();
  };

  // ── Visual state ──
  const glow = convMode
    ? {
        idle:       { ring: "rgba(34,197,94,0.15)",  bg: "rgba(34,197,94,0.04)",  icon: "rgba(34,197,94,0.4)" },
        listening:  { ring: "rgba(34,197,94,0.35)",   bg: "rgba(34,197,94,0.08)",  icon: "rgba(34,197,94,0.8)" },
        processing: { ring: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.06)", icon: "rgba(167,139,250,0.5)" },
        speaking:   { ring: "rgba(167,139,250,0.4)",  bg: "rgba(167,139,250,0.1)",  icon: "rgba(167,139,250,0.7)" },
      }[state]
    : {
        idle:       { ring: "rgba(167,139,250,0.12)", bg: "rgba(167,139,250,0.04)", icon: "rgba(167,139,250,0.3)" },
        listening:  { ring: "rgba(239,68,68,0.35)",    bg: "rgba(239,68,68,0.08)",   icon: "rgba(239,68,68,0.8)"   },
        processing: { ring: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.06)", icon: "rgba(167,139,250,0.5)" },
        speaking:   { ring: "rgba(167,139,250,0.4)",  bg: "rgba(167,139,250,0.1)",  icon: "rgba(167,139,250,0.7)" },
      }[state];

  const displayText = state === "listening"
    ? (transcript || (convMode ? "Listening..." : "Listening..."))
    : (state === "processing" || state === "speaking")
      ? lunaText
      : "";

  const dimText = state === "idle" ? lastText : "";

  const textOpacity = state === "listening" ? 0.85
    : state === "processing" ? 0.5
    : state === "speaking" ? 0.95
    : 0;

  return (
    <div
      className="h-screen w-screen fixed inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleTap}
      style={{
        background: `radial-gradient(ellipse 50% 40% at 50% 42%, ${glow?.bg} 0%, transparent 100%), #030304`,
        transition: "background 0.8s ease",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      {/* Mode switch button */}
      <button
        onClick={(e) => { e.stopPropagation(); onSwitchMode(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="fixed top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-[#555] hover:text-[#888] hover:bg-[#1a1a1f]/50 transition"
      >
        <Terminal className="w-3.5 h-3.5" />
        CC
      </button>

      {/* Star Wars crawl feed */}
      <style>{`
        @keyframes starCrawl {
          0% { transform: translateY(0); opacity: 0; }
          3% { opacity: 0.7; }
          75% { opacity: 0.5; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: "350px",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
            transformOrigin: "50% 100%",
            transform: "rotateX(25deg)",
          }}
        >
          {crawlItems.map(item => (
            <div
              key={item.id}
              onAnimationEnd={() => removeCrawl(item.id)}
              style={{
                position: "absolute",
                bottom: 0,
                left: "12%",
                right: "12%",
                textAlign: "center",
                color: item.color,
                fontSize: "14px",
                lineHeight: "1.6",
                letterSpacing: "0.1em",
                textShadow: `0 0 10px ${item.color}`,
                animation: "starCrawl 55s linear forwards",
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Luna presence */}
      <div className="relative mb-10" style={{ zIndex: 1 }}>
        <div
          className="absolute inset-[-16px] rounded-full transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${glow?.ring} 0%, transparent 70%)`,
            opacity: state === "idle" && !convMode ? 0.5 : 1,
          }}
        />
        <div
          className={`relative w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-700 ${
            state === "listening" ? "animate-pulse" : ""
          }`}
          style={{
            borderColor: glow?.ring,
            boxShadow: `0 0 60px ${glow?.bg}`,
          }}
        >
          {state === "listening" ? (
            <Mic size={32} style={{ color: glow?.icon }} className="transition-colors duration-300" />
          ) : state === "processing" ? (
            <div className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-400/70 rounded-full animate-spin" />
          ) : (
            <Moon size={32} style={{ color: glow?.icon }} className="transition-colors duration-300" />
          )}
        </div>
      </div>

      {/* Text display */}
      <div className="px-8 max-w-md w-full text-center min-h-[80px] flex items-start justify-center" style={{ position: "relative", zIndex: 1 }}>
        {displayText && (
          <p
            className="text-[15px] leading-relaxed transition-opacity duration-500 whitespace-pre-wrap break-words"
            style={{ color: `rgba(204,204,204,${textOpacity})` }}
          >
            {displayText}
          </p>
        )}
        {!displayText && dimText && (
          <p className="text-[13px] leading-relaxed text-[#ccc] opacity-[0.12] whitespace-pre-wrap break-words">
            {dimText}
          </p>
        )}
      </div>

      {/* Tap hint */}
      {state === "idle" && !lastText && !convMode && (
        <p className="absolute bottom-16 text-[11px] text-[#1a1a1f] tracking-wide">
          tap anywhere to speak
        </p>
      )}

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              connected ? "bg-green-500/50" : "bg-red-500/20"
            }`} />
            <span className="text-[10px] tracking-wide" style={{ color: connected ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)" }}>
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          {convMode && (
            <span className="text-[10px] tracking-wide" style={{ color: "rgba(34,197,94,0.4)" }}>
              CONV
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#1a1a1f] tracking-wide">{time}</span>
      </div>
    </div>
  );
}

