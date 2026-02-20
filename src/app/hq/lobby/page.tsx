"use client";

import { useState, useEffect, useRef } from "react";
import { Moon, Shield, Send } from "lucide-react";


const API_BASE = "https://api.guardiacontent.com";
const HQ_CREDENTIALS = { username: "jinjurikii", pin: "1991" };

interface Message {
  id: number;
  role: "user" | "assistant";
  speaker: string | null;
  content: string;
  model: string | null;
  created_at: string;
}

interface ChatResponse {
  speaker: string;
  content: string;
  model: string;
  emoji: string;
  color: string;
  tool_calls?: Array<{ name: string; input: any }>;
  error?: boolean;
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
        <h1 className="text-[#888] font-semibold text-sm tracking-wider mb-6">LUNA</h1>
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
// MAIN CHAT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function LobbyPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [delegating, setDelegating] = useState(false);
  const [awareness, setAwareness] = useState<string>("");
  const [showAwareness, setShowAwareness] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check auth
  useEffect(() => {
    setAuthenticated(localStorage.getItem("hq_auth") === "true");
  }, []);

  // Load messages on mount
  useEffect(() => {
    if (!authenticated) return;
    loadMessages();
    loadAwareness();
  }, [authenticated]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/luna/v2/messages?limit=50`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  const loadAwareness = async () => {
    try {
      const res = await fetch(`${API_BASE}/luna/v2/awareness`);
      const data = await res.json();
      setAwareness(data.awareness || "");
    } catch (e) {
      console.error("Failed to load awareness:", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    
    const message = input.trim();
    setInput("");
    setSending(true);
    
    // Optimistic user message
    const tempMsg: Message = {
      id: Date.now(),
      role: "user",
      speaker: null,
      content: message,
      model: null,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`${API_BASE}/luna/v2/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      
      if (data.responses) {
        // Add each response
        for (const resp of data.responses as ChatResponse[]) {
          // Check if this is a delegation (Serb responding)
          if (resp.speaker === "serberus") {
            setDelegating(false);
          }
          
          const assistantMsg: Message = {
            id: Date.now() + Math.random(),
            role: "assistant",
            speaker: resp.speaker,
            content: resp.content,
            model: resp.model,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "assistant",
        speaker: "system",
        content: "Connection error. Please try again.",
        model: null,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
      setDelegating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = async () => {
    if (!confirm("Clear all messages?")) return;
    try {
      await fetch(`${API_BASE}/luna/v2/messages`, { method: "DELETE" });
      setMessages([]);
    } catch (e) {
      console.error("Failed to clear:", e);
    }
  };

  const getSpeakerStyle = (speaker: string | null) => {
    switch (speaker) {
      case "serberus":
        return { icon: Shield, color: "#f97316", name: "Serberus" };
      case "luna":
      default:
        return { icon: Moon, color: "#a78bfa", name: "Luna" };
    }
  };

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="h-screen bg-[#171513] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1f] bg-[#0a0a0b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Moon size={20} className="text-violet-400" />
            <span className="text-violet-400 font-medium">Luna</span>
            <span className="text-[#444] text-sm">/ Lobby</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAwareness(!showAwareness)}
            className={`px-3 py-1.5 rounded text-xs transition-all ${
              showAwareness 
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" 
                : "bg-[#0d0d0e] text-[#666] border border-[#1a1a1f] hover:border-[#333]"
            }`}
          >
            {showAwareness ? "Hide Awareness" : "Show Awareness"}
          </button>
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 rounded text-xs bg-[#0d0d0e] text-[#666] border border-[#1a1a1f] hover:text-red-400 hover:border-red-500/30"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Awareness Panel (collapsible) */}
      {showAwareness && (
        <div className="border-b border-[#1a1a1f] bg-[#0a0a0b] p-4 max-h-[300px] overflow-y-auto">
          <div className="text-[#555] text-xs uppercase tracking-wider mb-2">System Awareness</div>
          <pre className="text-[#888] text-xs whitespace-pre-wrap font-mono">{awareness}</pre>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#333]">
            <div className="text-center">
              <Moon size={56} className="text-violet-400/30 mx-auto mb-4" />
              <div className="text-[#555] text-sm mb-2">Talk to Luna</div>
              <div className="text-[#444] text-xs">She knows what's happening and can delegate to Serb when needed</div>
            </div>
          </div>
        )}
        
        {messages.map(msg => {
          const isUser = msg.role === "user";
          const style = getSpeakerStyle(msg.speaker);
          
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  isUser
                    ? "bg-violet-600/20 border border-violet-500/30"
                    : "bg-[#0d0d0e] border border-[#1a1a1f]"
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <style.icon size={14} style={{ color: style.color }} />
                    <span className="text-xs font-medium" style={{ color: style.color }}>
                      {style.name}
                    </span>
                    {msg.model && (
                      <span className="text-[#333] text-xs font-mono ml-1">
                        {msg.model.includes("gemini") ? "gemini" : msg.model.includes("sonnet") ? "sonnet" : msg.model}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-[#ccc] text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Sending indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-[#0d0d0e] border border-[#1a1a1f] rounded-lg p-3 flex items-center gap-2">
              {delegating ? <Shield size={16} className="text-orange-400" /> : <Moon size={16} className="text-violet-400" />}
              <span className="text-[#666] text-sm">
                {delegating ? "Serb working..." : "thinking..."}
              </span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1a1a1f] p-3 bg-[#0a0a0b]">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Luna... (she can delegate to Serb for code work)"
            disabled={sending}
            rows={1}
            className="flex-1 bg-[#050506] border border-[#1a1a1f] rounded-lg px-4 py-3 text-[#ccc] text-sm focus:outline-none focus:border-violet-500/50 resize-none disabled:opacity-50 min-h-[48px]"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="p-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors"
          >
            {sending ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[#333] text-xs">Press Enter to send • Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
