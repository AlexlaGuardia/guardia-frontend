# Extension: 3D Depth Effects

> CSS-only and lightweight JS techniques for creating depth, dimension, and modern visual polish.
> No Three.js, no Framer Motion. Tailwind + CSS variables + GSAP (already in stack).

## Reference Sites

| Site | Technique | Takeaway |
|------|-----------|----------|
| linear.app | Dark palette, pulsing dot grids, typographic hierarchy | Depth from animation timing, not 3D |
| vercel.com | Dual-theme, SVG illustrations, container queries | Performance-first gradients |
| raycast.com | Deep dark bg (#070921), neon accents, embossed cards | Per-card radial gradients + inset borders + multi-layer shadows |
| supabase.com | Dark/light toggle, branded SVG per feature | Card-based grid with visual identity |
| arc.net | Electric blue + coral, noise texture, wavy SVG masks | Organic warmth via noise overlays |
| resend.com | Pure black bg, dramatic white type, extreme negative space | Less is more |

---

## Technique 1: Layered Multi-Shadow Elevation

Creates convincing physical depth without any 3D library. Stack 4-5 shadows with increasing offset/blur using warm-tinted shadow colors.

```css
/* Warm shadow elevation levels */
:root {
  --shadow-color: 30deg 50% 20%;
}

.card-elevated {
  box-shadow:
    0 1px 1px hsl(var(--shadow-color) / 0.06),
    0 2px 2px hsl(var(--shadow-color) / 0.06),
    0 4px 4px hsl(var(--shadow-color) / 0.06),
    0 8px 8px hsl(var(--shadow-color) / 0.06),
    0 16px 16px hsl(var(--shadow-color) / 0.06);
}

.card-floating {
  box-shadow:
    0 1px 2px hsl(var(--shadow-color) / 0.08),
    0 4px 8px hsl(var(--shadow-color) / 0.08),
    0 8px 16px hsl(var(--shadow-color) / 0.08),
    0 16px 32px hsl(var(--shadow-color) / 0.06),
    0 32px 64px hsl(var(--shadow-color) / 0.04);
}
```

**Tailwind:** Use `shadow-[...]` arbitrary values or define in `boxShadow` theme extensions.

---

## Technique 2: CSS 3D Card Tilt on Mouse Move

Perspective + rotateX/Y on mousemove. Child elements with `translateZ` create parallax depth within the card.

```css
.tilt-container {
  perspective: 1000px;
}

.tilt-card {
  transform-style: preserve-3d;
  transition: transform 0.15s ease-out;
  will-change: transform;
}

.tilt-card .float-element {
  transform: translateZ(40px);
}

.tilt-card .float-element-high {
  transform: translateZ(80px);
}
```

```javascript
// ~20 lines vanilla JS
function initTilt(card) {
  const container = card.parentElement;
  container.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  container.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}
```

---

## Technique 3: Gradient Orb Backgrounds (Light Leaks)

Radial gradient "orbs" as ambient light sources + frosted glass cards in front.

```css
.hero-bg {
  position: relative;
  overflow: hidden;
}

.orb-gold {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 198, 100, 0.4) 0%, transparent 70%);
  filter: blur(80px);
  top: -10%;
  right: -5%;
}

.orb-peach {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(252, 182, 159, 0.35) 0%, transparent 70%);
  filter: blur(80px);
  bottom: -15%;
  left: -10%;
}
```

**Tailwind:**
```html
<div class="absolute w-[600px] h-[600px] rounded-full bg-amber-300/30 blur-[80px] -top-[10%] -right-[5%]"></div>
```

### Glass Card Over Orbs

```css
.glass-card {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
}
```

**Tailwind:** `bg-white/45 backdrop-blur-xl border border-white/60 rounded-2xl`

---

## Technique 4: Bento Grid with Gradient Borders

CSS Grid with varying span sizes. Gradient border via pseudo-element mask trick.

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
}

/* Gradient border */
.bento-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(212, 175, 100, 0.5), rgba(255, 255, 255, 0.1));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

**Tailwind spans:** `col-span-2`, `row-span-2`, `col-span-2 row-span-2` (hero card)

---

## Technique 5: GSAP ScrollTrigger Reveals

Replace IntersectionObserver with proper staggered scroll animations. GSAP is ~23KB, already in the stack.

```javascript
gsap.registerPlugin(ScrollTrigger);

// Section fade-up
gsap.utils.toArray('.reveal-section').forEach(section => {
  gsap.from(section, {
    scrollTrigger: {
      trigger: section,
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    y: 60,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });
});

// Staggered children
gsap.from('.bento-card', {
  scrollTrigger: {
    trigger: '.bento-grid',
    start: 'top 80%'
  },
  y: 40,
  opacity: 0,
  stagger: 0.1,
  duration: 0.6,
  ease: 'power2.out'
});

// Parallax orbs (scrub = tied to scroll)
gsap.to('.orb-gold', {
  scrollTrigger: {
    trigger: '.hero-bg',
    start: 'top top',
    end: 'bottom top',
    scrub: 1
  },
  y: -120
});
```

### CSS-only alternative (Chrome/Edge progressive enhancement):
```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.reveal-on-scroll {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}
```

---

## Warm Color System for Depth

```css
:root {
  /* Extended warm palette for 3D sections */
  --warm-black:    #1C1915;
  --warm-charcoal: #2A2318;
  --cream:         #FAF5EF;
  --linen:         #F5EDE3;
  --warm-white:    #FFFBF5;
  --gold-100:      #F5E6C8;
  --gold-300:      #E8C87A;
  --gold-500:      #D4A853;
  --gold-700:      #B8892E;
  --amber-glow:    rgba(212, 168, 83, 0.3);

  /* Gradient presets */
  --gradient-hero: linear-gradient(135deg, #1C1915 0%, #2A2318 50%, #1C1915 100%);
  --gradient-gold: linear-gradient(135deg, #D4A853, #F5E6C8);
  --gradient-warm-mesh:
    radial-gradient(at 20% 30%, rgba(245,198,100,0.15) 0%, transparent 50%),
    radial-gradient(at 80% 70%, rgba(252,182,159,0.1) 0%, transparent 50%),
    radial-gradient(at 50% 50%, rgba(232,200,122,0.08) 0%, transparent 60%);
}

/* Gradient text */
.text-gradient-gold {
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Section Rhythm Pattern

Best visual flow for warm SaaS landing pages:

1. **Hero** — Dark warm (`--warm-black`) with gold orbs. Maximum contrast.
2. **Features** — Light cream (`--cream`) with glass cards over subtle orbs.
3. **How It Works** — Warm linen (`--linen`). Gentle contrast shift.
4. **Showcase** — Light cream. Visual demo area.
5. **Pricing/Add-ons** — Warm linen or light.
6. **CTA** — Dark warm again. Bookend the page.

Dark → Light → Warm → Light → Dark creates a natural visual "breathing" rhythm.

---

## Noise Texture Overlay

Adds organic warmth, breaks digital flatness (inspired by Arc).

```css
.noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}
```

---

## Quick Reference

| Technique | Complexity | Impact | Dependencies |
|-----------|-----------|--------|-------------|
| Layered multi-shadow | Low (CSS) | High | None |
| 3D card tilt | Medium (~20 lines JS) | High | None |
| Gradient orbs | Low (CSS) | High | None |
| Glassmorphism cards | Low (Tailwind native) | Medium | None |
| Bento grid + gradient borders | Medium (CSS Grid) | High | None |
| GSAP ScrollTrigger | Medium | High | gsap (already installed) |
| Noise overlay | Low (inline SVG) | Medium | None |
| Gradient text | Low (CSS) | Medium | None |
| Wavy section dividers | Low (SVG/clip-path) | Medium | None |
