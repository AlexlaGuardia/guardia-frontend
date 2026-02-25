"use client";

import { useState } from "react";

/**
 * Gio Icon Test Page — /test/gio-icons
 * Sandbox for testing Giovanni avatars and tab icons at actual UI sizes.
 * Disposable — delete when done.
 */

const BASE = "/images/gio/test";

// Full-body poses (new blue suit)
const POSES = [
  { file: "Giovanni_avatar.png", label: "Standing" },
  { file: "Giovanni_avatar003.png", label: "Wave (open)" },
  { file: "Giovanni_avatar006.png", label: "Thumbs up" },
  { file: "Giovanni_avatar007.png", label: "Pointing" },
  { file: "giovanni_avatar008.png", label: "Tie adjust" },
  { file: "giovanni_avatar010.png", label: "Casual stand" },
  { file: "giovanni_avatar011.png", label: "Celebrating" },
  { file: "giovanni_avatar012.png", label: "Shrug" },
  { file: "giovanni_avatar013.png", label: "Wave (palm)" },
  { file: "Giovanni's_company_photo_clean.png", label: "Company photo" },
];

// Head crops (auto-generated)
const HEADS = POSES.map((p) => ({
  file: `head_${p.file}`,
  label: p.label,
}));

// Tab icons — v1 (old white bg) vs v2 (new green-keyed)
const TAB_ICONS_OLD = [
  { file: "Feed_icon01.png", label: "Feed" },
  { file: "factory_icon01.png", label: "Factory" },
  { file: "calendar_icon01.png", label: "Calendar" },
  { file: "analytics_icon01.png", label: "Stats" },
  { file: "accounts_icon01.png", label: "Account" },
];
const TAB_ICONS = [
  { file: "Feed_icon03.png", label: "Feed" },
  { file: "factory_icon02.png", label: "Factory" },
  { file: "calendar_icon02.png", label: "Calendar" },
  { file: "analytics_icon02.png", label: "Stats" },
  { file: "accounts_icon02.png", label: "Account" },
];

// Special / Widget
const SPECIAL = [
  { file: "Gio_icon01.png", label: "Gio phone (old)" },
  { file: "Client_widget01.png", label: "Widget (old)" },
  { file: "widget_shadow.png", label: "Widget v3 shadow" },
  { file: "widget_no_shadow.png", label: "Widget v3 clean" },
];

// Avatar size contexts as they appear in the real UI
const AVATAR_SIZES = [
  { label: "TopBar button", size: 44, radius: "rounded-lg" },
  { label: "Chat header", size: 40, radius: "rounded-xl" },
  { label: "Bubble (mobile)", size: 32, radius: "rounded-lg" },
  { label: "Bubble (desktop)", size: 28, radius: "rounded-lg" },
  { label: "Empty state (mobile)", size: 80, radius: "rounded-2xl" },
  { label: "Empty state (desktop)", size: 64, radius: "rounded-2xl" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">{title}</h2>
      {children}
    </section>
  );
}

function AvatarPreview({ src, size, radius, bg }: { src: string; size: number; radius: string; bg?: string }) {
  return (
    <div
      className={`${radius} overflow-hidden flex-shrink-0 border border-white/10`}
      style={{ width: size, height: size, background: bg || "transparent" }}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover object-top"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export default function GioIconTestPage() {
  const [selectedHead, setSelectedHead] = useState(0);
  const [bgColor, setBgColor] = useState("#0d0d0e");

  const currentHead = `${BASE}/${HEADS[selectedHead].file}`;

  return (
    <div className="min-h-screen bg-[#050506] text-white p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gio Icon Lab</h1>
          <p className="text-sm text-gray-400 mt-1">Pick avatars, test sizes, trash when done.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400">BG:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <span className="text-xs text-gray-500 font-mono">{bgColor}</span>
        </div>
      </div>

      {/* ─── Head Crops at Real Sizes ─── */}
      <Section title="Head Crops — Avatar Sizes (pick a pose below)">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {HEADS.map((h, i) => (
            <button
              key={h.file}
              onClick={() => setSelectedHead(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                i === selectedHead
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-6 flex-wrap p-6 rounded-2xl" style={{ background: bgColor }}>
          {AVATAR_SIZES.map((ctx) => (
            <div key={ctx.label} className="flex flex-col items-center gap-2">
              <AvatarPreview src={currentHead} size={ctx.size} radius={ctx.radius} />
              <span className="text-[10px] text-gray-500 text-center leading-tight">
                {ctx.label}
                <br />
                {ctx.size}px
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Head Crop Gallery (all at 80px for comparison) ─── */}
      <Section title="All Head Crops (80px)">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
          {HEADS.map((h, i) => (
            <button
              key={h.file}
              onClick={() => setSelectedHead(i)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                i === selectedHead ? "bg-indigo-600/20 ring-2 ring-indigo-500" : "hover:bg-white/5"
              }`}
            >
              <div className="w-[80px] h-[80px] rounded-xl overflow-hidden">
                <img src={`${BASE}/${h.file}`} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-gray-400 text-center">{h.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ─── TopBar Mockup ─── */}
      <Section title="TopBar Mockup (how it looks in the nav)">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#F5E6C8" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">Guardia</span>
              <span className="text-[10px] text-violet-600 ml-1.5 font-medium">Unleashed</span>
            </div>
          </div>
          <div className="flex-1" />
          <nav className="flex items-center gap-5 text-sm text-gray-500">
            <span>Feed</span>
            <span className="text-violet-600 font-medium">Factory</span>
            <span>Calendar</span>
            <span>Stats</span>
            <span>Account</span>
          </nav>
          <div className="flex-1" />
          {/* The avatar button */}
          <div className="rounded-lg overflow-hidden" style={{ width: 44, height: 44 }}>
            <img src={currentHead} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </Section>

      {/* ─── Chat Header Mockup ─── */}
      <Section title="Chat Header Mockup">
        <div className="w-[320px] rounded-xl border border-white/10 overflow-hidden" style={{ background: bgColor }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={currentHead} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Giovanni</div>
              <div className="text-xs text-gray-400">Your content assistant</div>
            </div>
          </div>
          <div className="p-3 space-y-3">
            {/* Assistant bubble */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
                <img src={currentHead} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-2xl rounded-bl-md text-sm text-gray-200">
                Good morning! How can I help?
              </div>
            </div>
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="bg-indigo-600 px-3 py-2 rounded-2xl rounded-br-md text-sm text-white">
                Show me my stats
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Gio Widgets as Chat Button ─── */}
      <Section title="Gio Widgets / Chat Button">
        <div className="flex items-end gap-8 flex-wrap">
          {SPECIAL.map((s) => (
            <div key={s.file} className="flex flex-col items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="flex items-end gap-3">
                {[44, 56, 80].map((sz) => (
                  <div key={sz} className="flex flex-col items-center gap-1">
                    <div className="rounded-xl overflow-hidden" style={{ width: sz, height: sz }}>
                      <img src={`${BASE}/${s.file}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-gray-500">{sz}px</span>
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
        {/* Widget in TopBar mockup */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">New widgets in TopBar:</p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#F5E6C8" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">Guardia</span>
            </div>
            <div className="flex-1" />
            <nav className="flex items-center gap-5 text-sm text-gray-500">
              <span>Feed</span><span className="text-violet-600 font-medium">Factory</span><span>Calendar</span>
            </nav>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="rounded-xl overflow-hidden" style={{ width: 44, height: 44 }}>
                  <img src={`${BASE}/widget_shadow.png`} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] text-gray-400">shadow</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-xl overflow-hidden" style={{ width: 44, height: 44 }}>
                  <img src={`${BASE}/widget_no_shadow.png`} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] text-gray-400">clean</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-lg overflow-hidden" style={{ width: 44, height: 44 }}>
                  <img src={currentHead} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] text-gray-400">head crop</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Tab Icons ─── */}
      <Section title="Tab Icons — New Set (green-keyed)">
        <div className="space-y-4">
          {[24, 32, 48, 64].map((sz) => (
            <div key={sz} className="flex items-center gap-6">
              <span className="text-xs text-gray-500 w-12">{sz}px</span>
              {TAB_ICONS.map((icon) => (
                <div key={icon.file} className="flex flex-col items-center gap-1">
                  <img src={`${BASE}/${icon.file}`} alt="" style={{ width: sz, height: sz }} className="object-contain" />
                  <span className="text-[10px] text-gray-500">{icon.label}</span>
                </div>
              ))}
            </div>
          ))}
          {/* Bottom tab bar mockups */}
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-500">In bottom tab bar (dark):</p>
            <div className="flex items-center justify-around py-3 px-4 rounded-xl bg-[#0d0d0e] border border-white/10 max-w-md">
              {TAB_ICONS.map((icon) => (
                <div key={icon.file} className="flex flex-col items-center gap-0.5">
                  <img src={`${BASE}/${icon.file}`} alt="" className="w-6 h-6 object-contain" />
                  <span className="text-[10px] text-gray-400">{icon.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">In bottom tab bar (light — Guardia theme):</p>
            <div className="flex items-center justify-around py-3 px-4 rounded-xl max-w-md" style={{ background: "#F5E6C8" }}>
              {TAB_ICONS.map((icon) => (
                <div key={icon.file} className="flex flex-col items-center gap-0.5">
                  <img src={`${BASE}/${icon.file}`} alt="" className="w-6 h-6 object-contain" />
                  <span className="text-[10px] text-gray-700">{icon.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Old vs New comparison ─── */}
      <Section title="Old (white bg) vs New (transparent)">
        <div className="space-y-3">
          {[32, 48].map((sz) => (
            <div key={sz} className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-16">Old {sz}px</span>
                {TAB_ICONS_OLD.map((icon) => (
                  <img key={icon.file} src={`${BASE}/${icon.file}`} alt="" style={{ width: sz, height: sz }} className="object-contain" />
                ))}
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-16">New {sz}px</span>
                {TAB_ICONS.map((icon) => (
                  <img key={icon.file} src={`${BASE}/${icon.file}`} alt="" style={{ width: sz, height: sz }} className="object-contain" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Full Body Gallery ─── */}
      <Section title="Full Body Poses (source images)">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {POSES.map((p) => (
            <div key={p.file} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5">
              <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                <img src={`${BASE}/${p.file}`} alt="" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-gray-400">{p.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Factory Empty State ─── */}
      <Section title="Factory Empty State (full body)">
        <div className="flex items-end gap-6 flex-wrap">
          {POSES.slice(0, 6).map((p) => (
            <div key={p.file} className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: "#F5E6C8" }}>
              <div className="w-32">
                <img src={`${BASE}/${p.file}`} alt="" className="w-full h-auto" />
              </div>
              <p className="text-sm font-medium text-gray-900">All caught up!</p>
              <p className="text-xs text-gray-500">Upload photos to start creating.</p>
              <span className="text-[10px] text-gray-400 mt-1">{p.label}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
