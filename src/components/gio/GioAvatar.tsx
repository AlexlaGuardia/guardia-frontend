"use client";

import Image from "next/image";

interface GioAvatarProps {
  onClick: () => void;
  unreadCount: number;
  size?: number;
}

export default function GioAvatar({ onClick, unreadCount, size = 44 }: GioAvatarProps) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-lg transition-all active:scale-95 flex-shrink-0"
      aria-label="Chat with Giovanni"
    >
      <div className="rounded-lg overflow-hidden">
        <Image
          src="/images/gio/casual.png"
          alt="Giovanni"
          width={size}
          height={size}
          className="object-contain"
        />
      </div>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-elevated)]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
