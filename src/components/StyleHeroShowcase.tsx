"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";

/* ─── Config ─────────────────────────────────────────────── */

const BASE = "https://api.guardiacontent.com/storage/showcase";
const BEFORE = `${BASE}/barbershop_before.jpg`;
const AFTER = `${BASE}/barbershop_after.jpg`;
const RATIO = 682 / 1024; // barbershop is portrait

/* ─── Main Component ─────────────────────────────────────── */

export default function StyleHeroShowcase() {
  const [pos, setPos] = useState(50);
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [dims, setDims] = useState<{ w: number; h: number } | undefined>(undefined);

  const updatePos = (clientX: number) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(2, Math.min(98, pct)));
  };

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const containerW = el.offsetWidth;
      const maxH = window.innerHeight * 0.55;
      let w = containerW;
      let h = containerW / RATIO;
      if (h > maxH) {
        h = maxH;
        w = maxH * RATIO;
      }
      setDims({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      updatePos(e.clientX);
    };
    const onUp = () => { dragging.current = false; };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div ref={wrapRef} className="w-full flex justify-center">
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(42,42,42,0.15)] cursor-col-resize select-none touch-none"
        style={{
          background: "#1a1a1a",
          width: dims ? dims.w : "100%",
          height: dims?.h ?? "auto",
          transition: "width 0.4s ease, height 0.4s ease",
        }}
        onPointerDown={(e) => {
          dragging.current = true;
          updatePos(e.clientX);
        }}
      >
        <img
          src={AFTER}
          alt="After styling"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <img
          src={BEFORE}
          alt="Before styling"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          draggable={false}
        />

        {/* Slider line + handle */}
        <div
          className="absolute top-0 bottom-0 -translate-x-1/2 pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          <div className="w-0.5 h-full bg-white/80 shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-[#C9A227] shadow-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M4.5 3L1.5 7L4.5 11" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 3L12.5 7L9.5 11" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-[#C9A227]/90 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none">
          After
        </div>
      </div>
    </div>
  );
}
