# 🎬 AppFlix — 3D App Poster Wall Background

A pure **HTML5, CSS3, and JavaScript** replication of Netflix's iconic 3D tilted movie poster wall background. Built to replace original movie posters with **46 custom app posters** (23 Landscape, 23 Portrait) while preserving **100% pixel integrity**, pitch-black aesthetics, and seamless edge-to-edge layout coverage.

---

## ✨ Features

- **46 Custom Posters** — 23 Landscape + 23 Portrait, rendered at exact original aspect ratios (zero cropping or distortion).
- **Pitch-Black Aesthetics** — Pure `#000000` background stage with authentic dark radial vignette & cinematic top/bottom gradients.
- **Tight 6px Grid Spacing** — Recreates the official Netflix poster wall layout with no artificial borders.
- **Smart Spatial Separation** — Same-app posters (e.g. Swiggy, Amazon, Spotify) are separated across vertical rows and opposite horizontal ends of the screen.
- **Full Edge-to-Edge Coverage** — Posters tile beyond screen edges, cropping gracefully on both sides regardless of screen resolution.
- **Interactive Customizer (`index.html`)** — Real-time sliders for **Tilt X**, **Rotate Y**, **Angle Z**, **Zoom**, flat view toggle, and a **"Copy CSS Transform"** button.
- **Clean Standalone Component (`bg-standalone.html`)** — A production-ready background with **zero text, buttons, counters, or sliders**, ready to embed in any web app.

---

## 📁 Project Structure

```
app posters/
├── 📁 posters/               # All 46 PNG poster image files
├── 📄 index.html             # Interactive Customizer with 3D controls
├── 📄 bg-standalone.html     # Clean Production Background (no UI)
├── 📄 styles.css             # Main stylesheet for 3D stage and cards
├── 📄 app.js                 # Grid rendering engine & tilt controls
└── 📄 README.md              # This file
```

---

## 🚀 How to Run

> ⚠️ **IMPORTANT — You MUST use a local server.**
> Opening `bg-standalone.html` or `index.html` directly by double-clicking the file (i.e. using a `file://` URL) will cause a **blank black page**. This is a browser security restriction that blocks JavaScript from loading local images. Always serve the folder via a local HTTP server.

### Option 1: Python (Built-in, Recommended)

Open a terminal **inside the project folder** and run:

```bash
python -m http.server 8085
```

Then open in your browser:

| Page | URL |
|------|-----|
| Interactive Customizer | `http://localhost:8085/` or `http://localhost:8085/index.html` |
| Clean Background | `http://localhost:8085/bg-standalone.html` |

### Option 2: Node.js / npx

```bash
npx http-server . -p 8085
```

### Option 3: VS Code Live Server

Right-click `index.html` or `bg-standalone.html` → **Open with Live Server**.

---

## 🎛️ Two-File Workflow — Customizer → Standalone

These two files work **together as a pair**:

| File | Role |
|------|------|
| `index.html` | **Tweak** — Adjust the 3D angles live using sliders |
| `bg-standalone.html` | **Ship** — Clean production file used as the actual background |

### Step-by-step: Bake your angles into the standalone file

1. Open `http://localhost:8085/` (the customizer).
2. Drag the **Tilt X**, **Rotate Y**, **Angle Z**, and **Zoom** sliders until the wall looks exactly how you want.
3. Click **"Copy CSS Transform"** — it copies a line like:
   ```css
   transform: rotateX(22deg) rotateY(-10deg) rotateZ(8deg) scale(1.15);
   ```
4. Open `bg-standalone.html` and find the `.wall-grid` CSS block (around line 47). You'll see this comment:
   ```css
   /* replace the "transform" property here with the code you just copied
      from the customizable background page — this will reflect the changes
      to the final output. */
   transform: rotateX(22deg) rotateY(-10deg) rotateZ(8deg) scale(1.15);
   ```
5. Replace the `transform:` line with your copied value and save.

`bg-standalone.html` now permanently reflects your custom angle — with no sliders or UI visible.

---

## 💻 Embedding the Background in Your Own App

### Method 1 — iFrame (Easiest, zero setup)

Copy `bg-standalone.html` and the `posters/` folder into your project, then paste this into your app's HTML `<body>`:

```html
<iframe
  src="bg-standalone.html"
  style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; border: none; z-index: -1; pointer-events: none;">
</iframe>
```

Your own page content sits on top; the background sits behind.

### Method 2 — Direct HTML/CSS Copy

1. Copy the `<div class="netflix-bg-stage">...</div>` block from `bg-standalone.html` into your page.
2. Copy all CSS from the `<style>` block into your main stylesheet.
3. Copy the inline `<script>` block (the poster data + grid builder) into your page.
4. Place the `posters/` folder in your project's public/assets directory and update the `img.src` path if needed.

### Method 3 — React / Next.js Component

Create a `NetflixBackground.jsx` component:

```jsx
import { useEffect } from 'react';

export default function NetflixBackground() {
  useEffect(() => {
    // paste the poster grid JS logic here
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <div className="netflix-bg-stage">
        <div className="perspective-viewport">
          <div id="standalone-grid" className="wall-grid" />
        </div>
      </div>
    </div>
  );
}
```

Add the CSS classes from `bg-standalone.html` into your global stylesheet or CSS module. Place `posters/` in the `public/` folder and reference images as `/posters/<filename>`.

---

## 🖼️ Poster Details

- **Total**: 46 posters (23 Landscape × 23 Portrait)
- **Landscape dimensions**: 248 × 160 px display size
- **Portrait dimensions**: 113 × 160 px display size
- **Format**: PNG, pixel-perfect, zero compression artifacts
- **Grid gap**: 6px (horizontal & vertical)
- **Rows**: 6 rows, each tiled ×2 for full edge-to-edge coverage

---

## 📜 License & Credits

Replicated for design demonstration and app poster showcase. All poster assets preserved at 100% untouched resolution.
