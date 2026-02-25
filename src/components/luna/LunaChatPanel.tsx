"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Send, Moon, Loader2 } from "lucide-react";
import { useLunaNotifications, type LunaNotification } from "@/hooks/useLunaNotifications";

const API_BASE = "https://api.guardiacontent.com";

interface ChatMessage {
  id: string;
  role: "user" | "luna" | "system";
  text: string;
  timestamp: Date;
  decomposition?: DecompositionInfo;
}

interface DecompositionInfo {
  steps: Array<{ shadow: string; name: string; status?: string }>;
  feature_name?: string;
}

// Shadow colors for decomposition display
const SHADOW_DOT_COLORS: Record<string, string> = {
  forge: "bg-orange-500",
  glass: "bg-violet-500",
  kage: "bg-slate-400",
  pulse: "bg-cyan-500",
  paradise: "bg-amber-500",
  magii: "bg-purple-500",
};

export default function LunaChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lobbyRoomId, setLobbyRoomId] = useState<number | null>(null);
  const [streamingText, setStreamingText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  // Auto-load lobby room
  useEffect(() => {
    fetch(`${API_BASE}/luna/rooms`)
      .then(r => r.json())
      .then(data => {
        const lobby = data.rooms?.find((r: any) => r.room_type === "base");
        if (lobby) setLobbyRoomId(lobby.id);
      })
      .catch(console.error);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Voice recognition setup
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
      if (isFinal && t.trim()) {
        setIsListening(false);
        handleSend(t.trim());
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  // Notification handler — show proactive Luna messages in chat
  useLunaNotifications({
    onMessage: useCallback((notif: LunaNotification) => {
      if (!notif.text) return;
      setMessages(prev => [
        ...prev,
        {
          id: `notif-${Date.now()}`,
          role: "luna",
          text: notif.text,
          timestamp: new Date(),
        },
      ]);
      // Play audio if available
      if (notif.audio_url) {
        const url = notif.audio_url.startsWith("http") ? notif.audio_url : `${API_BASE}${notif.audio_url}`;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
    }, []),
  });

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const ctx = new AudioContext();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlockedRef.current = true;
  };

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || !lobbyRoomId || isProcessing) return;

    unlockAudio();
    setInput("");
    setIsProcessing(true);
    setStreamingText("");

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/luna/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: lobbyRoomId, message }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let decomposition: DecompositionInfo | undefined;

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
                setStreamingText(fullText);
              } else if (data.type === "done") {
                fullText = data.full_text || fullText;
              } else if (data.type === "decomposition") {
                decomposition = {
                  steps: data.steps || [],
                  feature_name: data.feature_name,
                };
              } else if (data.type === "error") {
                fullText = `Error: ${data.message}`;
              }
            } catch {}
          }
        }
      }

      setStreamingText("");

      // Add Luna response
      const lunaMsg: ChatMessage = {
        id: `luna-${Date.now()}`,
        role: "luna",
        text: fullText,
        timestamp: new Date(),
        decomposition,
      };
      setMessages(prev => [...prev, lunaMsg]);

      // TTS
      try {
        const speakRes = await fetch(`${API_BASE}/luna/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullText }),
        });
        const speakData = await speakRes.json();
        if (speakData.audio_url) {
          const url = speakData.audio_url.startsWith("http") ? speakData.audio_url : `${API_BASE}${speakData.audio_url}`;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.play().catch(() => {});
        }
      } catch {}
    } catch (_e) {
      setStreamingText("");
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "system",
          text: "Connection error. Try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    unlockAudio();
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1f] flex-shrink-0">
        <Moon size={14} className="text-violet-400" />
        <span className="text-xs font-medium text-[#ccc]">Luna</span>
        {lobbyRoomId && (
          <span className="text-[10px] text-[#555]">Room {lobbyRoomId}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Moon size={32} className="text-violet-500/20 mb-3" />
            <p className="text-xs text-[#555]">Start a conversation with Luna</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming indicator */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 bg-[#1a1a1f] text-xs text-[#ccc] leading-relaxed whitespace-pre-wrap break-words">
              {streamingText}
              <span className="inline-block w-1.5 h-3 bg-violet-400/50 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Processing spinner */}
        {isProcessing && !streamingText && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[#1a1a1f]">
              <Loader2 size={12} className="text-violet-400 animate-spin" />
              <span className="text-xs text-[#888]">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1a1a1f] px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? "bg-red-500/20 text-red-400"
                : "hover:bg-[#1a1a1f] text-[#555] hover:text-[#888]"
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              (inputRef.current as any).__lastChange = Date.now();
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                const last = (inputRef.current as any).__lastChange || 0;
                if (Date.now() - last < 200) return;
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "Listening..." : "Message Luna... (v3)"}
            disabled={isProcessing || isListening}
            className="flex-1 bg-[#0f0f10] border border-[#1a1a1f] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#555] focus:outline-none focus:border-[#2a2a2f] disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="p-2 rounded-lg hover:bg-violet-500/20 text-violet-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ──

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-[#555] italic">{message.text}</span>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? "bg-violet-500/10 border border-violet-500/20 text-[#ccc]"
            : "bg-[#1a1a1f] text-[#ccc]"
        }`}
      >
        <div className="text-xs leading-relaxed whitespace-pre-wrap">{message.text}</div>

        {/* Decomposition preview */}
        {message.decomposition && (
          <div className="mt-2 pt-2 border-t border-[#2a2a2f]">
            <div className="text-[10px] text-[#888] mb-1.5">
              Dispatched {message.decomposition.steps.length} tasks
              {message.decomposition.feature_name && (
                <span className="text-[#555]"> — {message.decomposition.feature_name}</span>
              )}
            </div>
            <div className="space-y-1">
              {message.decomposition.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <div className={`w-1.5 h-1.5 rounded-full ${SHADOW_DOT_COLORS[step.shadow] || "bg-gray-500"}`} />
                  <span className="text-[#666]">{step.shadow}</span>
                  <span className="text-[#888] truncate">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[9px] text-[#444] mt-1">
          {message.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
