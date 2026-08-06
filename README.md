# 🎬 AppFlix — The Premier Platform for Student & Developer Apps

**AppFlix** is a modern, high-performance web application marketplace designed to discover, showcase, bookmark, and moderate software applications built by student developers. Featuring a sleek Netflix-inspired dark aesthetic, a pure 2D HTML5 Canvas intro animation engine, real-time developer analytics, community upvoting, and a moderation workflow.

---

## ✨ Key Features

### 🎬 1. Interactive Audio-Synced Canvas Intro Engine
- **Pure JavaScript & HTML5 2D Canvas**: Custom vector graphics engine rendering the AppFlix "A" logo zoom, mathematical clip masks, and multi-colored spectrum ribbon burst at 30 FPS.
- **Millisecond Audio Synchronization**: Locks frame rendering directly to `intro_audio.mp3` playback time for 100% sound-to-visual sync.
- **Smooth Dissolve Transition**: Cross-fades the canvas DOM element directly into the landing page UI with zero black screen pause.
- **Smart Trigger Logic**: Direct cold loads skip the intro for instant page display, while navbar logo clicks, page revisits, and logins trigger the full audio-synced intro experience.

### 🔍 2. App Discovery & Catalog Browsing
- **Netflix Dark Aesthetic**: Built with dark mode tokens (`#141414`), sleek glassmorphism cards, micro-animations, and dynamic gradient glows.
- **Multi-Attribute Search & Tag Filtering**: Real-time client-side search across app names, descriptions, and 31 technology tags (`notes`, `ai`, `web`, `mobile`, `react`, `python`, etc.).
- **Category & Sorting Controls**: Filter by categories (*AI & Machine Learning*, *Developer Tools*, *Productivity*, *Social*, *Web & Mobile*, *Utilities*) and sort by *Upvotes*, *Newest*, or *Most Viewed*.
- **Interactive Upvoting & Bookmarking**: One-click upvote & bookmark toggles with instant optimistic UI updates and backend synchronization.

### 📊 3. Real-Time Developer Analytics Dashboard (`/dashboard/analytics`)
- **Hero Views & Clicks Area Chart**: Dual-trend visualization tracking daily page views vs outbound external clicks over 7d, 30d, and 90d periods.
- **Tag Reach Donut Chart**: Modern Recharts visualization featuring custom solid HSL color palettes and interactive `hoverEffect="grow"` animation.
- **Device Breakdown**: Automatic HTTP User-Agent parsing categorizing traffic into Desktop, Mobile, and Tablet view percentages.
- **Rule-Based AI Insights**: Contextual growth suggestions and CTR optimization tips based on project traffic patterns.
- **Plain-Language Info Buttons (`i`)**: Interactive popovers on every chart providing easy-to-understand explanations of metrics for non-technical users.

### 📱 4. App Details & Media Showcase
- **Rich Media & Metadata**: Multi-image screenshot carousels, live demo links, GitHub repository URLs, App Store / Play Store links, and stage badges (*Beta* vs. *Production*).
- **Owner & Developer Portfolios**: Public developer profiles (`/developer/[username]`) showcasing published apps, social handles, and bio.
- **Abuse Reporting Modal**: User-facing report modal with pre-configured violation categories (*Misleading Information*, *Copyright Violation*, *Spam / Low Quality*, *Inappropriate Content*, *Broken Links*).

### 🛠️ 5. App Submission & Edit Workflow
- **Multi-Step Submission Form**: Upload app icon, screenshots, platform availability, open-source status, website links, and select up to 5 technology tags out of 31 choices.
- **Full Parity Edit Form (`/dashboard/projects/edit/[id]`)**: Full editing suite allowing developers to update app metadata, media, and tag selections.
- **Automatic Re-Approval Queue**: Edits to live apps automatically route to the Admin Queue for review as `✏️ EDITED APP — REQUIRES RE-APPROVAL`.

### 🛡️ 6. Admin Moderation Portal (`/admin/queue` & `/admin/reports`)
- **App Approval Queue (`/admin/queue`)**: Differentiates between new submissions and edited apps requiring re-approval. Admins can approve or reject with custom feedback.
- **Reports Moderation Manager (`/admin/reports`)**: Inspect active user reports, review developer explanatory responses, mark as resolved/dismissed, or soft-delete policy-violating apps.

### 🔑 7. Authentication & Account Management
- **Instant Account Creation**: Instant signup and login via Supabase SSR Auth without email confirmation delays.
- **Password Reset Flow**: Complete password recovery flow (`/forgot-password`, `/auth/callback?next=/reset-password`, `/reset-password`).
- **Unified My Account (`/account`)**: Manage profile bio, avatar uploads, password updates, and view public developer URL (`appflix.app/developer/<username>`).

### 📲 8. Progressive Web App (PWA) Support
- **Installable PWA**: Configured with Web App Manifest (`manifest.webmanifest`), high-res app icons, service worker registration (`PwaRegister`), and install-to-device prompts (`InstallPwaButton`).

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Library**: React 19 & TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, SSR Auth, Storage Buckets)
- **Data Visualization**: [Recharts](https://recharts.org/) (Area Charts, Line Charts, Donut Charts)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS, Glassmorphism, HSL Design Tokens

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── actions/                  # Server Actions (auth.ts, account.ts, project-management.ts, reports.ts, admin.ts)
│   ├── admin/
│   │   ├── queue/                # Admin App Review Queue page
│   │   └── reports/              # Admin Reports Moderation page
│   ├── account/                  # Unified Profile & Account Settings page
│   ├── auth/
│   │   └── callback/             # Auth Callback Route handler for PKCE / session exchange
│   ├── bookmarks/                # Bookmarked apps page
│   ├── browse/
│   │   ├── page.tsx              # Main App Store catalog page
│   │   └── [slug]/               # App Details page & ViewTracker
│   ├── dashboard/
│   │   ├── analytics/            # Real-time developer analytics dashboard
│   │   └── projects/             # Developer project manager & edit forms
│   ├── developer/
│   │   └── [username]/           # Public developer portfolio page
│   ├── forgot-password/          # Forgot password request page
│   ├── reset-password/           # Password update page
│   ├── login/                    # Netflix-style login page
│   ├── signup/                   # Account creation page
│   ├── submit/                   # App submission page
│   └── page.tsx                  # Landing page with intro engine
├── components/
│   ├── analytics/                # Area, Line, Donut charts & ChartInfoButton
│   ├── dashboard/                # Developer report manager components
│   ├── layout/                   # Navbar & navigation links
│   ├── projects/                 # Upvote, Bookmark, ReportModal, ViewTracker, ExternalLinkButton
│   ├── pwa/                      # PWA register & install button components
│   └── ui/                       # AppFlixLandingIntro canvas wrapper
└── lib/
    └── supabase/                 # Supabase client, server, and service-role instances
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn / pnpm

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 📄 License
Created for AppFlix. All rights reserved.
