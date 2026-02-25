"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, Terminal, MessageSquare } from "lucide-react";


const API_BASE = "https://api.guardiacontent.com";
const HQ_CREDENTIALS = { username: "jinjurikii", pin: "1991" };

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface Model {
  id: string;
  provider: string;
  supports_tools: boolean;
}

interface Session {
  id: number;
  project: string;
  frame: string | null;
  model: string;
  title: string | null;
  message_count: number;
  tokens_in: number;
  tokens_out: number;
  status: string;
  started_at: string;
  last_message_at: string;
}

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  tool_calls: string | null;
  tokens_est: number;
  created_at: string;
}

interface ChatResponse {
  response: string;
  model: string;
  tool_calls: Array<{ name: string; input: object }>;
  iterations: number;
  context_tokens_est: number;
  context_sources: string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const PROJECTS = [
  { id: "gio", label: "Gio", color: "#a855f7" },
  { id: "paradise", label: "Paradise", color: "#d4af37" },
  { id: "athernyx", label: "Athernyx", color: "#00d4d4" },
];

const FRAMES: Record<string, Array<{ id: string; label: string }>> = {
  gio: [
    { id: "backend", label: "Backend" },
    { id: "frontend", label: "Frontend" },
    { id: "copy", label: "Copy" },
    { id: "client", label: "Client" },
  ],
  paradise: [
    { id: "casino", label: "Casino" },
  ],
  athernyx: [
    { id: "magii", label: "Magii" },
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "now";
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === HQ_CREDENTIALS.username && pin === HQ_CREDENTIALS.pin) {
      localStorage.setItem("hq_auth", "true");
      onLogin();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-6 w-full max-w-[320px]">
        <h1 className="text-[#888] font-semibold text-sm tracking-wider mb-6">SERBERUS CONSOLE</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-[#0a0a0b] border border-[#1a1a1f] rounded px-3 py-2.5 text-[#ccc] text-sm mb-3 focus:outline-none focus:border-[#333]"
        />
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full bg-[#0a0a0b] border border-[#1a1a1f] rounded px-3 py-2.5 text-[#ccc] text-sm mb-4 focus:outline-none focus:border-[#333]"
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button type="submit" className="w-full bg-violet-600 text-white py-2.5 rounded text-sm hover:bg-violet-500">
          Enter
        </button>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SESSION SIDEBAR
// ══════════════════════════════════════════════════════════════════════════════

function SessionSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  loading,
}: {
  sessions: Session[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  loading: boolean;
}) {
  return (
    <div className="w-64 border-r border-[#1a1a1f] flex flex-col h-full bg-[#0a0a0b]">
      {/* Header */}
      <div className="p-3 border-b border-[#1a1a1f] flex items-center justify-center">
        <span className="text-[#555] text-xs">CONSOLE</span>
      </div>

      {/* New Session Button */}
      <div className="p-3 border-b border-[#1a1a1f]">
        <button
          onClick={onNew}
          className="w-full bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 py-2 px-3 rounded text-sm flex items-center justify-center gap-2 border border-violet-500/30"
        >
          <span className="text-lg leading-none">+</span>
          <span>New Session</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-[#555] text-sm">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-[#555] text-sm">No sessions yet</div>
        ) : (
          sessions.map((session) => {
            const project = PROJECTS.find(p => p.id === session.project);
            return (
              <button
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={`w-full text-left p-3 border-b border-[#1a1a1f] hover:bg-[#0d0d0e] transition-colors ${
                  activeId === session.id ? "bg-[#0d0d0e] border-l-2" : ""
                }`}
                style={{ borderLeftColor: activeId === session.id ? project?.color : "transparent" }}
              >
                <div className="text-[#aaa] text-sm truncate">
                  {session.title || `Session #${session.id}`}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                    backgroundColor: `${project?.color}20`, 
                    color: project?.color 
                  }}>
                    {session.project}
                  </span>
                  {session.frame && (
                    <span className="text-[#444] text-xs">/ {session.frame}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#444] text-xs">{session.message_count} msgs</span>
                  <span className="text-[#444] text-xs">{timeAgo(session.last_message_at)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NEW SESSION MODAL
// ══════════════════════════════════════════════════════════════════════════════

function NewSessionModal({
  models,
  onClose,
  onCreate,
}: {
  models: Model[];
  onClose: () => void;
  onCreate: (project: string, frame: string | null, model: string, title: string) => void;
}) {
  const [project, setProject] = useState("gio");
  const [frame, setFrame] = useState<string | null>(null);
  const [model, setModel] = useState("sonnet-4.5");
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(project, frame, model, title);
  };

  const availableFrames = FRAMES[project] || [];
  const projectColor = PROJECTS.find(p => p.id === project)?.color || "#888";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-[#888] font-semibold text-sm tracking-wider mb-4">NEW SESSION</h2>

        {/* Project Tabs */}
        <div className="flex gap-2 mb-4">
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProject(p.id);
                setFrame(null);
              }}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                project === p.id
                  ? "text-white"
                  : "text-[#555] hover:text-[#888]"
              }`}
              style={{
                backgroundColor: project === p.id ? `${p.color}30` : "transparent",
                borderColor: project === p.id ? p.color : "transparent",
                borderWidth: "1px",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Frame */}
        {availableFrames.length > 0 && (
          <label className="block mb-3">
            <span className="text-[#555] text-xs uppercase tracking-wider">Frame</span>
            <select
              value={frame || ""}
              onChange={(e) => setFrame(e.target.value || null)}
              className="w-full mt-1 bg-[#0a0a0b] border border-[#1a1a1f] rounded px-3 py-2 text-[#ccc] text-sm focus:outline-none focus:border-[#333]"
            >
              <option value="">Default</option>
              {availableFrames.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Model */}
        <label className="block mb-3">
          <span className="text-[#555] text-xs uppercase tracking-wider">Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full mt-1 bg-[#0a0a0b] border border-[#1a1a1f] rounded px-3 py-2 text-[#ccc] text-sm focus:outline-none focus:border-[#333]"
          >
            <optgroup label="Anthropic">
              {models.filter(m => m.provider === "anthropic").map((m) => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))}
            </optgroup>
            <optgroup label="Google">
              {models.filter(m => m.provider === "google").map((m) => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))}
            </optgroup>
            <optgroup label="OpenAI">
              {models.filter(m => m.provider === "openai").map((m) => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))}
            </optgroup>
            <optgroup label="Other">
              {models.filter(m => !["anthropic", "google", "openai"].includes(m.provider)).map((m) => (
                <option key={m.id} value={m.id}>{m.id} ({m.provider})</option>
              ))}
            </optgroup>
          </select>
        </label>

        {/* Title */}
        <label className="block mb-4">
          <span className="text-[#555] text-xs uppercase tracking-wider">Title (optional)</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are we working on?"
            className="w-full mt-1 bg-[#0a0a0b] border border-[#1a1a1f] rounded px-3 py-2 text-[#ccc] text-sm focus:outline-none focus:border-[#333]"
          />
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#1a1a1f] text-[#666] py-2 rounded text-sm hover:bg-[#252528]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded text-sm text-white"
            style={{ backgroundColor: projectColor }}
          >
            Start
          </button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ══════════════════════════════════════════════════════════════════════════════

function MessageBubble({ message, projectColor }: { message: Message; projectColor: string }) {
  const isUser = message.role === "user";
  const toolCalls = message.tool_calls ? JSON.parse(message.tool_calls) : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-[#1a1a1f] border border-[#2a2a2f] text-[#ccc]"
            : "bg-[#0d0d0e] border border-[#1a1a1f] text-[#aaa]"
        }`}
        style={!isUser ? { borderLeftColor: projectColor, borderLeftWidth: "2px" } : {}}
      >
        {/* Tool calls indicator */}
        {toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {toolCalls.map((tc: { name: string }, i: number) => (
              <span
                key={i}
                className="text-xs bg-[#1a1a1f] text-[#888] px-2 py-0.5 rounded font-mono"
              >
                <Zap size={10} className="inline mr-0.5" /> {tc.name}
              </span>
            ))}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-2 text-[#444] text-xs">
          {message.model && <span className="font-mono">{message.model}</span>}
          <span>{timeAgo(message.created_at)}</span>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// VOICE SUPPORT
// ══════════════════════════════════════════════════════════════════════════════

function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for Web Speech API support
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const text = result[0].transcript;
          setTranscript(text);
          
          if (result.isFinal) {
            setIsListening(false);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        setVoiceEnabled(true);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Samantha") || 
        v.name.includes("Google") ||
        v.name.includes("Microsoft")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    isListening,
    transcript,
    voiceEnabled,
    autoSpeak,
    setAutoSpeak,
    startListening,
    stopListening,
    speak,
    setTranscript,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT AREA
// ══════════════════════════════════════════════════════════════════════════════

function ChatArea({
  session,
  messages,
  onSend,
  sending,
  models,
}: {
  session: Session | null;
  messages: Message[];
  onSend: (message: string, modelOverride?: string) => void;
  sending: boolean;
  models: Model[];
}) {
  const [input, setInput] = useState("");
  const [modelOverride, setModelOverride] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Voice support
  const {
    isListening,
    transcript,
    voiceEnabled,
    autoSpeak,
    setAutoSpeak,
    startListening,
    stopListening,
    speak: _speak,
    setTranscript,
  } = useVoice();
  
  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      setTranscript("");
    }
  }, [transcript, isListening, setTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const _isPasting = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    onSend(input, modelOverride || undefined);
    setInput("");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const textarea = e.currentTarget as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = input.slice(0, start);
    const after = input.slice(end);
    setInput(before + text + after);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const projectColor = PROJECTS.find(p => p.id === session?.project)?.color || "#888";

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#333]">
        <div className="text-center">
          <Terminal size={56} className="text-[#333] mx-auto mb-4" />
          <div className="text-sm text-[#555]">Select or create a session</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050506]">
      {/* Session Header */}
      <div className="border-b border-[#1a1a1f] p-3 flex items-center justify-between bg-[#0a0a0b]">
        <div>
          <div className="text-[#ccc] text-sm font-medium">
            {session.title || `Session #${session.id}`}
          </div>
          <div className="flex items-center gap-2 text-[#555] text-xs mt-0.5">
            <span style={{ color: projectColor }}>{session.project}</span>
            {session.frame && <span>/ {session.frame}</span>}
            <span>•</span>
            <span className="font-mono">{session.model}</span>
            <span>•</span>
            <span>{formatTokens(session.tokens_in + session.tokens_out)} tokens</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={modelOverride || session.model}
            onChange={(e) =>
              setModelOverride(e.target.value === session.model ? null : e.target.value)
            }
            className="bg-[#0a0a0b] border border-[#1a1a1f] rounded px-2 py-1 text-[#888] text-xs focus:outline-none font-mono"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-[#333] text-sm py-8">
            <MessageSquare size={24} className="text-[#333] mx-auto mb-2" />
            Ready when you are.
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} projectColor={projectColor} />
          ))
        )}
        {sending && (
          <div className="flex justify-start mb-4">
            <div 
              className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg px-4 py-3"
              style={{ borderLeftColor: projectColor, borderLeftWidth: "2px" }}
            >
              <div className="flex items-center gap-2 text-[#555] text-sm">
                <span className="animate-pulse">●</span>
                <span>Working...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-[#1a1a1f] p-3 bg-[#0a0a0b]">
        <div className="flex gap-2 items-end">
          {/* Voice Button */}
          {voiceEnabled && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={sending}
              className={`p-3 rounded-lg transition-all ${
                isListening 
                  ? "bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse" 
                  : "bg-[#050506] border border-[#1a1a1f] text-[#666] hover:text-[#888] hover:border-[#333]"
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isListening ? "Listening..." : "Message Serberus... (Enter to send)"}
            disabled={sending}
            rows={1}
            className="flex-1 bg-[#050506] border border-[#1a1a1f] rounded-lg px-4 py-3 text-[#ccc] text-sm focus:outline-none focus:border-[#333] resize-none disabled:opacity-50"
          />
          
          {/* Auto-speak toggle */}
          {voiceEnabled && (
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-3 rounded-lg transition-all ${
                autoSpeak 
                  ? "bg-violet-500/20 border border-violet-500/50 text-violet-400" 
                  : "bg-[#050506] border border-[#1a1a1f] text-[#666] hover:text-[#888] hover:border-[#333]"
              }`}
              title={autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {autoSpeak && (
                  <>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                )}
              </svg>
            </button>
          )}
          
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-3 rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: projectColor }}
          >
            Send
          </button>
        </div>
        
        {/* Listening indicator */}
        {isListening && transcript && (
          <div className="mt-2 text-[#888] text-sm italic">
            "{transcript}"
          </div>
        )}
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CONSOLE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function ConsoleApp() {
  const [models, setModels] = useState<Model[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch models
  useEffect(() => {
    fetch(`${API_BASE}/console/models`)
      .then((r) => r.json())
      .then((data) => setModels(data.models || []))
      .catch(console.error);
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/console/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch session details when active changes
  useEffect(() => {
    if (!activeSessionId) {
      setActiveSession(null);
      setMessages([]);
      return;
    }

    fetch(`${API_BASE}/console/sessions/${activeSessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setActiveSession(data.session);
        setMessages(data.messages || []);
      })
      .catch(console.error);
  }, [activeSessionId]);

  // Create new session
  const handleCreateSession = async (
    project: string,
    frame: string | null,
    model: string,
    title: string
  ) => {
    try {
      const res = await fetch(`${API_BASE}/console/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, frame, model, title: title || null }),
      });
      const data = await res.json();
      setShowNewModal(false);
      await fetchSessions();
      setActiveSessionId(data.session_id);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  // Send message
  const handleSend = async (message: string, modelOverride?: string) => {
    if (!activeSessionId) return;

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Date.now(),
      role: "user",
      content: message,
      model: null,
      tool_calls: null,
      tokens_est: Math.ceil(message.length * 0.25),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/console/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          message,
          model: modelOverride || undefined,
        }),
      });
      const data: ChatResponse = await res.json();

      // Add assistant message
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response,
        model: data.model,
        tool_calls: data.tool_calls.length > 0 ? JSON.stringify(data.tool_calls) : null,
        tokens_est: Math.ceil(data.response.length * 0.25),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh session to update token counts
      const sessionRes = await fetch(`${API_BASE}/console/sessions/${activeSessionId}`);
      const sessionData = await sessionRes.json();
      setActiveSession(sessionData.session);
      await fetchSessions();
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-[#171513] flex">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={setActiveSessionId}
        onNew={() => setShowNewModal(true)}
        loading={loading}
      />

      {/* Chat Area */}
      <ChatArea
        session={activeSession}
        messages={messages}
        onSend={handleSend}
        sending={sending}
        models={models}
      />

      {/* New Session Modal */}
      {showNewModal && (
        <NewSessionModal
          models={models}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateSession}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH WRAPPER
// ══════════════════════════════════════════════════════════════════════════════

export default function Console() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("hq_auth");
    setAuthed(stored === "true");
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#050506] flex items-center justify-center">
        <div className="animate-pulse text-[#555]">Loading...</div>
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return <ConsoleApp />;
}
