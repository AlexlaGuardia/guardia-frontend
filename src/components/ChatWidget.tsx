"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Shield, X } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    {role: "assistant", content: "Hey! I'm Yami, Guardia's AI assistant. Ask me anything about our services, or just say hi."}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, {role: "user", content: userMsg}]);
    setLoading(true);
    
    try {
      const res = await fetch("https://api.guardiacontent.com/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message: userMsg,
          conversation_id: "landing-" + Date.now(),
          system_context: "You are Yami, Guardia's friendly AI assistant on the public website. Keep responses SHORT (2-3 sentences max). You help answer questions about Guardia's social media services. We style photos, write captions, schedule posts, and manage engagement for 24 hours. Tiers: Spark ($15/mo, 12 posts), Pro ($25/mo, 20 posts + 24hr engagement management). Be warm, casual, helpful. If they seem interested, suggest checking out the pricing. Never be pushy."
        })
      });
      const data = await res.json();
      setMessages(m => [...m, {role: "assistant", content: data.response || "Hmm, let me think on that..."}]);
    } catch {
      setMessages(m => [...m, {role: "assistant", content: "Oops, something went wrong. Try again?"}]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-[9999]">
        <MessageCircle size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-slate-900 rounded-2xl shadow-2xl flex flex-col z-[9999] border border-purple-500/30">
      <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl flex justify-between items-center">
        <span className="text-white font-semibold flex items-center gap-1.5">Yami <Shield size={14} /></span>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`${m.role === "user" ? "text-right" : ""}`}>
            <span className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[85%] ${m.role === "user" ? "bg-purple-600 text-white" : "bg-white/10 text-purple-100"}`}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-purple-300 text-sm">Yami is typing...</div>}
        <div ref={messagesEnd} />
      </div>
      <div className="p-3 border-t border-purple-500/30">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white text-sm placeholder-purple-300/50 focus:outline-none"
          />
          <button onClick={send} disabled={loading} className="px-3 py-2 bg-purple-600 rounded-lg text-white text-sm hover:bg-purple-500 disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
