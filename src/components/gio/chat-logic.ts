"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "https://api.guardiacontent.com";

export interface GioMessage {
  role: "user" | "assistant";
  content: string;
  tool?: string | null;
}

export interface UseGioChatReturn {
  messages: GioMessage[];
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  unreadCount: number;
  clearUnread: () => void;
  sendMessage: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setMessages: React.Dispatch<React.SetStateAction<GioMessage[]>>;
}

export function useGioChat(jwt: string | null, chatVisible: boolean): UseGioChatReturn {
  const [messages, setMessages] = useState<GioMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCount = useRef(messages.length);

  // Track unread when chat not visible
  useEffect(() => {
    if (!chatVisible && messages.length > prevMessageCount.current) {
      const newMsgs = messages.slice(prevMessageCount.current);
      const assistantMsgs = newMsgs.filter((m) => m.role === "assistant");
      setUnreadCount((prev) => prev + assistantMsgs.length);
    }
    prevMessageCount.current = messages.length;
  }, [messages, chatVisible]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  // Clear unread when chat becomes visible
  useEffect(() => {
    if (chatVisible) clearUnread();
  }, [chatVisible, clearUnread]);

  // Auto-scroll
  useEffect(() => {
    if (chatVisible) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatVisible]);

  const sendMessage = useCallback(async () => {
    const userMsg = input.trim();
    if (!userMsg || loading || !jwt) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE}/client/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ message: userMsg, history }),
      });

      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.text || "I'm having trouble processing that. Could you try again?",
          tool: data.tool,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    }

    setLoading(false);
  }, [input, loading, jwt, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return {
    messages,
    input,
    setInput,
    loading,
    unreadCount,
    clearUnread,
    sendMessage,
    handleKeyDown,
    messagesEndRef,
    setMessages,
  };
}
