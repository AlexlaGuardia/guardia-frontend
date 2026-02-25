"use client";

import Image from "next/image";

interface GioAvatarProps {
  onClick: () => void;
  unreadCount: number;
  size?: number;
  variant?: "widget" | "head";
}

export default function GioAvatar({ onClick, unreadCount, size = 130, variant = "widget" }: GioAvatarProps) {
  const isWidget = variant === "widget";
  const src = isWidget ? "/images/gio/widget.png" : "/images/gio/avatar.png";

  return (
    <button
      onClick={onClick}
      className={`relative transition-all active:scale-95 flex-shrink-0 ${
        isWidget ? "rounded-2xl hover:scale-105" : "rounded-lg"
      }`}
      style={isWidget ? { filter: "drop-shadow(0 6px 28px rgba(124, 58, 237, 0.3))" } : undefined}
      aria-label="Chat with Giovanni"
    >
      <div
        className={`${isWidget ? "rounded-2xl" : "rounded-lg"} overflow-hidden`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt="Giovanni"
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
      {unreadCount > 0 && (
        <span
          className={`absolute min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-base)] ${
            isWidget ? "-bottom-1 -left-1" : "-top-1 -right-1"
          }`}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
