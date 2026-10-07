# 🎬 AppFlix — The Premier Platform for Student & Developer Apps

**AppFlix** is a modern, high-performance web application marketplace designed to discover, showcase, bookmark, review, and moderate software applications built by student developers. Featuring a sleek Netflix-inspired dark cinema aesthetic, a pure 2D HTML5 Canvas intro animation engine, real-time developer analytics, in-app notification center, confidential user-to-developer feedback, interactive image cropping studios, and robust moderation workflows.

---

## ✨ Key Features

### 🎬 1. Interactive Audio-Synced Canvas Intro Engine
- **Pure JavaScript & HTML5 2D Canvas**: Custom vector graphics engine rendering the AppFlix "A" logo zoom, mathematical clip masks, and multi-colored spectrum ribbon burst at 30 FPS.
- **Millisecond Audio Synchronization**: Locks frame rendering directly to `intro_audio.mp3` playback time for 100% sound-to-visual sync.
- **Smooth Dissolve Transition**: Cross-fades the canvas DOM element directly into the landing page UI with zero black screen pause.
- **Smart Trigger Logic**: Direct cold loads skip the intro for instant page display, while navbar logo clicks, page revisits, and logins trigger the full audio-synced intro experience.

### 🔍 2. App Discovery & Catalog Browsing
- **Netflix Dark Cinema Aesthetic**: Built with dark mode tokens (`#141414`, `#1F1F1F`), sleek glassmorphism cards, micro-animations, and dynamic gradient glows.
- **Multi-Attribute Search & Tag Filtering**: Real-time client-side search across app names, descriptions, and 31 technology tags (`notes`, `ai`, `web`, `mobile`, `react`, `python`, etc.).
- **Category & Sorting Controls**: Filter by categories (*AI & Machine Learning*, *Developer Tools*, *Productivity*, *Social*, *Web & Mobile*, *Utilities*) and sort by *Upvotes*, *Newest*, or *Most Viewed*.
- **Interactive Upvoting & Bookmarking**: One-click upvote & bookmark toggles with instant optimistic UI updates and backend synchronization.

### 🔔 3. In-App Notification Center (`Navbar Bell`)
- **Real-Time Notification Bell**: Unread badge count, audio/visual alerts, and dropdown panel matching the Netflix dark theme.
- **Unread-First Organization**: Defaults to the "Unread" tab on the left for immediate actionability, with an "All" tab for full history.
- **Multi-Event Dispatch Pipeline**: Automatically notifies users and developers on:
  - New customer reviews & comments on apps.
  - Developer replies to user reviews.
  - App submissions, review approvals, and rejection feedback.
  - Report dismissals and admin resolutions.
  - Urgency-based listing expiry reminders (15, 7, 3, 1 day countdown alerts).
- **Free-Tier Database Storage Protections**:
  - **Permanent Dismissal (`✕`)**: Instantly deletes individual notification rows (`DELETE FROM notifications`) to immediately reclaim database storage.
  - **Auto-Pruning TTL**: Background auto-cleanup purging notifications older than 60 days to prevent row bloat on Supabase free tier.

### 🔒 4. Confidential User-to-Developer Private Feedback
- **Direct Private Channel**: Allows users to send confidential bug reports, suggestions, questions, and general feedback directly to the app developer without posting public reviews.
- **App Details Trigger**: "🔒 Private Feedback" button accessible right from the app page (`/browse/[slug]`).
- **Developer Feedback Manager**: Integrated into the Developer Dashboard (`/dashboard/projects`) with category badges (`💡 Suggestion`, `🐛 Bug Report`, `❓ Question`, `💬 General`), inline confidential reply composer, and real-time notifications.
- **Strict Free-Tier Database Limits**:
  - Enforced single thread per user per project (`UNIQUE(project_id, user_id)` constraint) to prevent spam.
  - Strict 500-character caps on both messages and developer replies.
  - **One-Click Permanent Deletion (`✕`)**: Allows either party to permanently purge resolved threads to immediately free database quota.
  - 45-day auto-pruning TTL.

### 🖼️ 5. Interactive Crop & Zoom Studios (Avatars & App Icons)
- **Canvas-Based Interactive Studio**: Smooth drag-to-pan (mouse and touch support), zoom slider (`60%` to `300%`), and quick presets (*Fit Inside*, *Fill Circle*, *Reset*).
- **Circular Avatar Viewport**: Real-time circular mask overlay with dimmed outer ring and dashed red guide.
- **Simultaneous Multi-Scale Live Previews**: Real-time preview mirrors rendering the avatar at Profile size (72px) and Navbar size (36px).
- **Exact 1:1 Pixel Parity**: Export canvas precisely aligns the circular bounding box to a high-resolution 512×512 output, ensuring what you see in the cropper matches the saved avatar down to the exact sub-pixel.
- **Server-Side Sharp Pipeline (`/api/upload/avatar` & `/api/upload/icon`)**:
  - Server-authenticated uploads using Supabase Service Role client to bypass client-side RLS quirks.
  - High-performance `sharp` processing converting images into lightweight 512×512 WebP files (~35 KB).
  - Real-time global event dispatch (`profile_updated`) updating the Navbar avatar immediately without cache lag or page reloads.

### 📊 6. Real-Time Developer Analytics Dashboard (`/dashboard/analytics`)
- **Hero Views & Clicks Area Chart**: Dual-trend visualization tracking daily page views vs outbound external clicks over 7d, 30d, and 90d periods.
- **Tag Reach Donut Chart**: Modern Recharts visualization featuring custom solid HSL color palettes and interactive `hoverEffect="grow"` animation.
- **Device Breakdown**: Automatic HTTP User-Agent parsing categorizing traffic into Desktop, Mobile, and Tablet view percentages.
- **Rule-Based AI Insights**: Contextual growth suggestions and CTR optimization tips based on project traffic patterns.
- **Plain-Language Info Popovers (`i`)**: Interactive explanations of all metrics for non-technical users.

### 📱 7. App Details, Media Showcase & Reviews
- **Rich Media & Metadata**: Multi-image screenshot carousels with lightbox zoom, live demo links, GitHub repository URLs, App Store / Play Store links, and stage badges (*Beta* vs. *Production*).
- **Customer Reviews & Developer Reply Threads**: Public reviews section with developer badge replies, comment editing, moderation, and in-app alerts.
- **Owner & Developer Portfolios**: Public developer profiles (`/developer/[username]`) showcasing published apps, social handles, and bio.
- **Abuse Reporting Modal**: User-facing report modal with pre-configured violation categories (*Misleading Information*, *Copyright Violation*, *Spam / Low Quality*, *Inappropriate Content*, *Broken Links*).

### 🛠️ 8. App Submission & Lifecycle Management
- **Multi-Step Submission Form**: Upload app icon with cropping studio, screenshots, platform availability, open-source status, website links, and select up to 5 technology tags out of 31 choices.
- **State & Metrics Preservation**: When an app listing expires or gets renewed, all cumulative page views, external clicks, upvotes, and bookmarks are preserved with zero performance data loss.
- **Full Parity Edit Form (`/dashboard/projects/edit/[id]`)**: Full editing suite allowing developers to update app metadata, media, and tag selections.
- **Automatic Re-Approval Queue**: Edits to live apps automatically route to the Admin Queue for review as `✏️ EDITED APP — REQUIRES RE-APPROVAL`.

### 🛡️ 9. Admin Moderation Portal (`/admin/queue` & `/admin/reports`)
- **App Approval Queue (`/admin/queue`)**: Differentiates between new submissions and edited apps requiring re-approval. Admins can approve or reject with custom feedback.
- **Reports Moderation Manager (`/admin/reports`)**: Inspect active user reports, review developer explanatory responses, mark as resolved/dismissed, or soft-delete policy-violating apps.

### 🔑 10. Authentication & Account Management
- **Instant Account Creation**: Instant signup and login via Supabase SSR Auth without email confirmation delays.
- **Password Reset Flow**: Complete password recovery flow (`/forgot-password`, `/auth/callback?next=/reset-password`, `/reset-password`).
- **Unified My Account (`/account`)**: Manage profile bio, display name, email, avatar uploads with interactive cropping studio, password updates, and view public developer URL (`appflix.app/developer/<username>`).

### 📲 11. Progressive Web App (PWA) Support
- **Installable PWA**: Configured with Web App Manifest (`manifest.webmanifest`), high-res app icons, service worker registration (`PwaRegister`), and install-to-device prompts (`InstallPwaButton`).

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Library**: React 19 & TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, SSR Auth, Storage Buckets)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) (Server-side WebP compression & avatar resizing)
- **Data Visualization**: [Recharts](https://recharts.org/) (Area Charts, Line Charts, Donut Charts)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS, Glassmorphism, HSL Design Tokens

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── actions/                  # Server Actions (auth, account, comments, feedback, notifications, reports, admin)
│   ├── admin/
│   │   ├── queue/                # Admin App Review Queue page
│   │   └── reports/              # Admin Reports Moderation page
│   ├── account/                  # Unified Profile & Account Settings page
│   ├── api/
│   │   └── upload/
│   │       ├── avatar/           # Sharp avatar upload API route
│   │       └── icon/             # Sharp app icon upload API route
│   ├── auth/
│   │   └── callback/             # Auth Callback Route handler for PKCE / session exchange
│   ├── bookmarks/                # Bookmarked apps page
│   ├── browse/
│   │   ├── page.tsx              # Main App Store catalog page
│   │   └── [slug]/               # App Details page, comments, and private feedback
│   ├── dashboard/
│   │   ├── analytics/            # Real-time developer analytics dashboard
│   │   └── projects/             # Developer project manager, reports & private feedback
│   ├── developer/
│   │   └── [username]/           # Public developer portfolio page
│   ├── forgot-password/          # Forgot password request page
│   ├── reset-password/           # Password update page
│   ├── login/                    # Netflix-style login page
│   ├── signup/                   # Account creation page
│   ├── submit/                   # App submission page
│   └── page.tsx                  # Landing page with intro engine
├── components/
│   ├── account/                  # AvatarUploadCropper interactive studio
│   ├── analytics/                # Area, Line, Donut charts & ChartInfoButton
│   ├── dashboard/                # Developer report manager & DeveloperFeedbackManager
│   ├── layout/                   # Navbar, navigation links & NotificationBell
│   ├── projects/                 # Upvote, Bookmark, ReportModal, PrivateFeedbackModal, IconUploadCropper
│   ├── pwa/                      # PWA register & install button components
│   └── ui/                       # AppFlixLandingIntro canvas wrapper
└── lib/
    └── supabase/                 # Supabase client, server, and service-role instances
```

---

## 🗄️ Database Migrations

AppFlix includes modular SQL scripts to run in your Supabase SQL Editor:
- **`schema.sql`**: Core tables (`profiles`, `projects`, `project_metrics`, `project_tags`, `categories`, `upvotes`, `bookmarks`, `project_reports`, `comments`).
- **`supabase/migrations/schema-project-feedback.sql`**: Confidential user-to-developer feedback table (`project_feedback`), uniqueness constraints, and privacy RLS policies.
- **`supabase/migrations/schema-storage-avatar-fix.sql`**: Supabase storage bucket configurations and RLS `UPDATE` policies for avatar and icon uploads.
- **`supabase/migrations/schema-fix-edit-reapproval.sql`**: Stored procedure logic preserving active listings during project re-approval.

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
