"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Moon, Mic } from "lucide-react";

const API_BASE = "https://api.guardiacontent.com";

type LunaState = "idle" | "listening" | "processing" | "speaking";

// ══════════════════════════════════════════════════════════════════════════════
// LUNA AMBIENT TERMINAL
// Voice-first kiosk interface. Same brain — different surface.
// ══════════════════════════════════════════════════════════════════════════════

export default function LunaPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [state, setState] = useState<LunaState>("idle");
  const [transcript, setTranscript] = useState("");
  const [lunaText, setLunaText] = useState("");
  const [lastText, setLastText] = useState("");
  const [lobbyRoomId, setLobbyRoomId] = useState<number | null>(null);
  const [time, setTime] = useState("");
  const [connected, setConnected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendRef = useRef<(text: string) => Promise<void>>(() => Promise.resolve());
  const audioUnlockedRef = useRef(false);
  const lastNotifIdRef = useRef(0);

  // ── Auth (kiosk bypass via ?dev=serb) ──
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

  // ── Clock ──
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Auto-load lobby room (hidden — context continuity) ──
  useEffect(() => {
    if (!authenticated) return;
    fetch(`${API_BASE}/luna/rooms`)
      .then(r => r.json())
      .then(data => {
        const lobby = data.rooms?.find((r: any) => r.room_type === "base");
        if (lobby) setLobbyRoomId(lobby.id);
      })
      .catch(console.error);
  }, [authenticated]);

  // ── Audio unlock — must happen on first user gesture ──
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    const silent = new AudioContext();
    const buf = silent.createBuffer(1, 1, 22050);
    const src = silent.createBufferSource();
    src.buffer = buf;
    src.connect(silent.destination);
    src.start(0);
    audioUnlockedRef.current = true;
    console.log("[Luna] Audio context unlocked");
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

  const playAudio = useCallback((url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
    const audio = new Audio(fullUrl);
    audioRef.current = audio;
    audio.onended = () => {
      clearFadeTimer();
      fadeTimerRef.current = setTimeout(() => {
        setState(prev => prev === "speaking" ? "idle" : prev);
        setLunaText("");
      }, 3000);
    };
    audio.play().catch(e => console.warn("[Luna] Audio play failed:", e));
  }, []);

  // ── Send message to Luna (via lobby room) ──
  const sendToLuna = useCallback(async (text: string) => {
    if (!lobbyRoomId || !text.trim()) {
      setState("idle");
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

      // Generate voice via ElevenLabs
      try {
        const speakRes = await fetch(`${API_BASE}/luna/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullText })
        });
        const speakData = await speakRes.json();
        if (speakData.audio_url) {
          playAudio(speakData.audio_url);
        }
      } catch (e) {
        console.warn("[Luna] TTS failed:", e);
      }

    } catch (e) {
      console.error("[Luna] Chat error:", e);
      showLunaMessage("I couldn't process that. Try again.");
    }
  }, [lobbyRoomId, showLunaMessage, playAudio]);

  useEffect(() => { sendRef.current = sendToLuna; }, [sendToLuna]);

  // ── Voice recognition ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let t = "";
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        t += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      setTranscript(t);
      if (isFinal && t.trim()) {
        sendRef.current?.(t.trim());
      }
    };

    recognition.onend = () => {
      setState(prev => prev === "listening" ? "idle" : prev);
      setTranscript("");
    };

    recognition.onerror = () => {
      setState("idle");
      setTranscript("");
    };

    recognitionRef.current = recognition;
  }, []);

  // ── Polling for notifications (Cloudflare-safe) ──
  useEffect(() => {
    if (!authenticated) return;

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
        for (const n of notifications.reverse()) {
          if (n.id <= lastNotifIdRef.current) continue;
          lastNotifIdRef.current = n.id;
          const text = n.message || "";
          showLunaMessage(text, n.audio_duration_ms);
          if (n.audio_url) playAudio(n.audio_url);
          fetch(`${API_BASE}/luna/notifications/${n.id}/delivered`, { method: "POST" }).catch(() => {});
        }
      } catch {
        setConnected(false);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [authenticated, showLunaMessage, playAudio]);

  // ── Tap handler ──
  const handleTap = () => {
    unlockAudio();

    if (state === "listening") {
      recognitionRef.current?.stop();
      setState("idle");
      setTranscript("");
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

    if (recognitionRef.current) {
      setState("listening");
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch {
        setState("idle");
      }
    }
  };

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

  // ── Visual state ──
  const glow = {
    idle:       { ring: "rgba(167,139,250,0.12)", bg: "rgba(167,139,250,0.04)", icon: "rgba(167,139,250,0.3)" },
    listening:  { ring: "rgba(239,68,68,0.35)",    bg: "rgba(239,68,68,0.08)",   icon: "rgba(239,68,68,0.8)"   },
    processing: { ring: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.06)", icon: "rgba(167,139,250,0.5)" },
    speaking:   { ring: "rgba(167,139,250,0.4)",  bg: "rgba(167,139,250,0.1)",  icon: "rgba(167,139,250,0.7)" },
  }[state];

  const displayText = state === "listening"
    ? (transcript || "Listening...")
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
      onClick={handleTap}
      style={{
        background: `radial-gradient(ellipse 50% 40% at 50% 42%, ${glow.bg} 0%, transparent 100%), #030304`,
        transition: "background 0.8s ease",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      {/* ── Luna presence ── */}
      <div className="relative mb-10">
        <div
          className="absolute inset-[-16px] rounded-full transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${glow.ring} 0%, transparent 70%)`,
            opacity: state === "idle" ? 0.5 : 1,
          }}
        />
        <div
          className={`relative w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-700 ${
            state === "listening" ? "animate-pulse" : ""
          }`}
          style={{
            borderColor: glow.ring,
            boxShadow: `0 0 60px ${glow.bg}`,
          }}
        >
          {state === "listening" ? (
            <Mic size={32} style={{ color: glow.icon }} className="transition-colors duration-300" />
          ) : state === "processing" ? (
            <div className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-400/70 rounded-full animate-spin" />
          ) : (
            <Moon size={32} style={{ color: glow.icon }} className="transition-colors duration-300" />
          )}
        </div>
      </div>

      {/* ── Text display ── */}
      <div className="px-8 max-w-sm w-full text-center min-h-[80px] flex items-start justify-center">
        {displayText && (
          <p
            className="text-[15px] leading-relaxed transition-opacity duration-500"
            style={{ color: `rgba(204,204,204,${textOpacity})` }}
          >
            {displayText}
          </p>
        )}
        {!displayText && dimText && (
          <p className="text-[13px] leading-relaxed text-[#ccc] opacity-[0.12]">
            {dimText}
          </p>
        )}
      </div>

      {/* ── Tap hint ── */}
      {state === "idle" && !lastText && (
        <p className="absolute bottom-16 text-[11px] text-[#1a1a1f] tracking-wide">
          tap anywhere to speak
        </p>
      )}

      {/* ── Status bar ── */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
            connected ? "bg-green-500/50" : "bg-red-500/20"
          }`} />
          <span className="text-[10px] tracking-wide" style={{ color: connected ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)" }}>
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
        <span className="text-[10px] text-[#1a1a1f] tracking-wide">{time}</span>
      </div>
    </div>
  );
}
