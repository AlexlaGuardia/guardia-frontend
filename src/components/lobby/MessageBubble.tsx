import { Message } from "./LobbyShell";

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0 mt-1"
          style={{ background: 'linear-gradient(135deg, #4338CA, #7c3aed)', boxShadow: '0 1px 4px rgba(99,102,241,0.25)' }}>
          G
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-[#4338CA] text-white rounded-br-md"
            : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
