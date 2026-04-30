# DESIGN.md — Nolosubito

Design system reference for AI agents and developers. Every page, component, and element must respect these rules.

---

## 1. Visual Theme & Atmosphere

**Brand personality:** Professional, trustworthy, modern Italian mobility.
**Density:** Medium — generous whitespace, clean cards, no visual noise.
**Mood:** Light, airy pages with navy brand accents. Not dark/heavy — the dark navy is reserved for the top navbar only.
**DO NOT** use full-page dark backgrounds on public-facing pages. The dark navy (`#2D2E82`) hero pattern is **abolished** — all pages use `bg-[#F5F6FA]` as the main background.

---

## 2. Color Palette & Roles

| Token | Hex | Role |
|---|---|---|
| `navy` | `#2D2E82` | Primary brand, headings, active states, navbar |
| `azzurro` | `#71BAED` | CTA buttons, highlights, links, active accents |
| `page-bg` | `#F5F6FA` | Page background on ALL public pages |
| `card-bg` | `#FFFFFF` | Card, modal, panel background |
| `card-border` | `#f1f5f9` | Card border (very subtle) |
| `spec-box` | `#f1f3ff` | Spec chip background in cards (light indigo tint) |
| `text-title` | `#15146c` | Card titles, h2/h3 in content |
| `text-body` | `#464651` | Body text, subtitles |
| `text-muted` | `#777682` | Labels, captions, meta info |
| `card-shadow` | `rgba(45,46,130,0.06)` | Default card shadow |
| `card-shadow-hover` | `rgba(45,46,130,0.12)` | Card shadow on hover |
| `badge-red` | `#ba1a1a` / `rgba(186,26,26,0.2)` | "Top seller" badge |
| `page-accent` | `#FF6600` | AutoScout24 dot only |

### Usage rules
- `navy` on white text: navbar, CTA secondary, filter active state, section headings
- `azzurro` on white text: primary CTA button, links, active pagination dot
- Never use `bg-navy` as a full-page background on public pages
- Dark navy hero sections are **removed** — replaced by light page headers

---

## 3. Typography Rules

**Font family:** Inter (all weights)
**Heading font:** `font-heading font-bold` (mapped to Inter in Tailwind config)

| Element | Class | Size |
|---|---|---|
| Page title (h1) | `font-heading font-bold text-[#2D2E82]` | `text-3xl sm:text-4xl` |
| Section title | `font-heading font-bold text-[#2D2E82]` | `text-2xl sm:text-3xl` |
| Card title | `font-bold text-[#15146c]` | `text-[20px]` |
| Segment label | `font-bold text-[#777682] uppercase tracking-[1.2px]` | `text-[12px]` |
| Card subtitle | `text-[#464651]` | `text-[14-15px]` |
| Caption / meta | `text-[#777682]` | `text-[10-12px]` |
| Price large | `font-bold text-[#15146c]` | `text-[28-32px]` |
| Price unit | `font-medium text-[#464651]` | `text-[14px]` |

---

## 4. Component Styling

### Card (VehicleCard / UsatoCard)
```
bg-white border border-[#f1f5f9] rounded-2xl
shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)]
hover:-translate-y-1 hover:shadow-[0px_8px_32px_0px_rgba(45,46,130,0.12)]
transition-all duration-300
```
- Image area: `bg-[#f8fafc] h-[200px]` — no gradient overlay
- Badge: `bg-white/90 backdrop-blur-sm border rounded-[8px] px-3 py-[5px]`
- 3 spec boxes: `bg-[#f1f3ff] rounded-[8px]` with icon + label (10px bold)
- Price: "Da soli" label + large bold price + "/mese" + italic footnote
- CTA button: `w-12 h-12 bg-[#71BAED] rounded-xl` with `ArrowRight` icon

### Skeleton (loading state)
Must match card structure: `h-[200px]` image area, then 3 skeleton spec boxes, then price skeleton.

### Primary CTA Button
```
bg-[#71BAED] hover:bg-[#71BAED]/85 text-white font-bold rounded-xl px-6 py-2.5
```

### Secondary CTA Button
```
bg-[#2D2E82] hover:bg-[#2D2E82]/90 text-white font-bold rounded-xl px-6 py-2.5
```

### Outline Button
```
border border-gray-200 text-gray-700 hover:border-[#2D2E82]/30 rounded-xl
```

### Filter Bar (all listing pages)
White card `bg-white rounded-2xl shadow-sm border border-gray-100 p-5`
Use **native `<select>`** elements (not shadcn Select) with custom ChevronDown overlay:
```
appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium
```
"Find" button: `bg-[#2D2E82] rounded-xl`

### Quick Filter Chips
```
px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer
Active:   bg-[#2D2E82] text-white border-[#2D2E82]
Inactive: bg-white text-gray-600 border-gray-200 hover:border-[#2D2E82]/40
```

### Pagination
```
Active page:  bg-[#2D2E82] text-white rounded-lg w-9 h-9
Inactive:     border border-gray-200 text-gray-700 hover:bg-white rounded-lg w-9 h-9
Prev/Next:    border border-gray-200 text-gray-600 w-9 h-9 flex items-center justify-center
```

### Page Header (replaces dark hero)
```jsx
<div className="bg-white border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
    <p className="text-xs font-bold text-[#71BAED] uppercase tracking-widest mb-2">
      {eyebrow label}
    </p>
    <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#2D2E82]">
      {page title}
    </h1>
    <p className="text-gray-500 mt-2 max-w-xl">{description}</p>
  </div>
</div>
```

### Navbar
- Always visible fixed top, `z-50`
- Home unscrolled: `bg-[#2D2E82]`
- Home scrolled: `bg-[#2D2E82]/95 backdrop-blur-md`
- Other pages scrolled: `bg-white/95 backdrop-blur-md shadow-sm` with logo filter to navy

---

## 5. Layout Principles

**Max width:** `max-w-7xl mx-auto`
**Horizontal padding:** `px-4 sm:px-6 lg:px-8`
**Page top padding:** `pt-28` (accounts for fixed 80px navbar)
**Section spacing:** `py-8` between sections, `py-16` for major sections
**Card grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5` (always 3 columns on desktop — never 4)
**Filter bar → grid gap:** `mb-6` between filter and results heading, `mb-6` between heading and grid

---

## 6. Depth & Elevation

| Level | Usage | Class |
|---|---|---|
| 0 | Page background | `bg-[#F5F6FA]` |
| 1 | Cards at rest | `shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)]` |
| 2 | Filter bar / white panels | `shadow-sm` |
| 3 | Cards on hover | `shadow-[0px_8px_32px_0px_rgba(45,46,130,0.12)]` |
| 4 | Modals / dropdowns | `shadow-2xl` |

---

## 7. Do's and Don'ts

### DO
- Use `bg-[#F5F6FA]` for all page backgrounds
- Use the white page header block (with `pt-28`) for all listing and detail pages
- Use 3-column grids (`lg:grid-cols-3`) for vehicle/card listings
- Use `#2D2E82` for active pagination, filter buttons, secondary actions
- Use `#71BAED` for primary CTA buttons and arrow buttons on cards
- Use native `<select>` elements in filter bars (not shadcn Select)
- Show result count `Trovati X risultati` aligned right next to section title
- Use `text-[#2D2E82]` for all section/page h1/h2 headings on white backgrounds

### DON'T
- Never use `bg-navy` or `className="bg-navy"` as a full-page wrapper on public pages
- Never use `bg-gradient-to-br from-[#2D2E82]` as a hero for listing pages
- Never use `bg-background rounded-t-3xl` pattern (dark hero + white sheet)
- Never use `bg-accent` for buttons (maps to grey in shadcn)
- Never use 4-column grids (`lg:grid-cols-4`) for vehicle cards
- Never use `aspect-video` or `aspect-[4/3]` for card images — always `h-[200px]`
- Never show the brand logo in navy on a navy background (use CSS filter on white PNG)

---

## 8. Responsive Behavior

| Breakpoint | Grid | Filter bar |
|---|---|---|
| Mobile `< 640px` | 1 col | Stacked vertically |
| Tablet `640–1024px` | 2 col | 2-col grid |
| Desktop `>= 1024px` | 3 col | 4-col grid inline |

**Touch targets:** minimum `44px` height for all interactive elements
**Navbar:** always 64px mobile, 80px desktop
**Card CTA button:** always `w-12 h-12` (48×48px) regardless of breakpoint

---

## 9. Agent Prompt Guide

When generating or modifying any page:

```
Brand colors: navy #2D2E82, azzurro #71BAED, page-bg #F5F6FA
Card: white bg, border #f1f5f9, shadow rgba(45,46,130,0.06), rounded-2xl
Card title: #15146c bold 20px | Segment label: #777682 12px uppercase tracking
Spec boxes: bg #f1f3ff rounded-lg | Price: #15146c bold 32px
CTA button: #71BAED rounded-xl 48x48px with ArrowRight icon
Filter bar: white rounded-2xl shadow-sm, native selects, #2D2E82 submit button
Page header: bg-white border-b, pt-28, h1 in #2D2E82
Grid: always lg:grid-cols-3, gap-5
Pagination: active #2D2E82, inactive border-gray-200, w-9 h-9 rounded-lg
```
