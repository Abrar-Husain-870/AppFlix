# 🎬 AppFlix — The Premier Platform for Student & Developer Apps

**AppFlix** is a modern, high-performance web platform designed to discover, showcase, bookmark, and moderate innovative software applications built by students and independent developers. Featuring a sleek Netflix-inspired dark aesthetic, real-time upvoting, and a moderation workflow for administrators and developers.

---

## ✨ Key Features

### 🔍 1. App Discovery & Browsing
- **Netflix Dark Theme**: Premium `#141414` page backgrounds with sleek `linear-gradient` cards and micro-animations.
- **Category Filtering**: Filter apps by *AI & Machine Learning*, *Developer Tools*, *Productivity*, *Social*, *Web & Mobile Apps*, and *Utilities*.
- **Search & Sorting**: Instant client-side search by title/tech stack and sorting by upvotes, newest, or trending.
- **Interactive Upvoting**: One-click upvote system with live counter updates.

### 📱 2. App Details Page
- **Rich Media & Metadata**: View screenshots, live demo links, repository URLs, and tech stack tags.
- **Owner / Developer Badge**: Clear attribution showing the owner (`@username`) with text-truncation support.
- **App Reporting Modal**: Users can flag issues using hardcoded violation categories (e.g., *Misleading Information*, *Copyright / Not the Original Developer*, *Spam / Low Quality*, *Inappropriate Content*, *Broken Links*).

### 🛠️ 3. App Submission & Edit Workflow
- **Simple Submission**: Developers submit app metadata, tags, screenshots, and links.
- **Re-Approval Queue**: When developers edit an existing live app, it is automatically routed to the Admin Queue for review while flagging it as an edited app.

### 👨‍💻 4. Developer Dashboard (`/dashboard/projects`)
- **App Status Management**: Group apps into **Live / Approved**, **Pending Review**, and **Removed by Admin** (displaying admin removal reasons).
- **Active Reports Panel**: Developers can review user reports on their apps and send explanatory response messages directly to administrators.

### 🛡️ 5. Admin Moderation Portal (`/admin/queue` & `/admin/reports`)
- **App Review Queue (`/admin/queue`)**:
  - Differentiates between **`✨ NEW APP SUBMISSION`** and **`✏️ EDITED APP — REQUIRES RE-APPROVAL`**.
  - Filter pills for *All Pending*, *New Apps*, and *Edited Apps*.
  - Approve or reject applications with custom admin feedback.
- **Reports Moderation Queue (`/admin/reports`)**:
  - **Active Queue & History**: View open reports requiring action vs. past resolved/dismissed history.
  - **Developer Context**: Inspect developer responses inline.
  - **Action Controls**: Mark reports as *Resolved*, *Dismiss*, or *Delete App (Soft-delete)* with reason logs.

### 🦶 6. Responsive Dynamic Footers
- **Authentication Awareness**: Automatically hides email signup CTAs for signed-in users while providing clean navigation links and branding footer across browse and landing pages.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Library**: React 19 & TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Service Role API)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS, Glassmorphism, Modern HSL Gradients

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── actions/          # Server actions (admin.ts, projects.ts, reports.ts)
│   ├── admin/
│   │   ├── queue/        # Admin App Review Queue
│   │   └── reports/      # Admin Reports Moderation Queue
│   ├── browse/
│   │   ├── page.tsx      # Browse catalog page
│   │   └── [slug]/       # App Details page & Admin actions
│   ├── dashboard/
│   │   └── projects/     # Developer dashboard & report manager
│   ├── submit/           # App submission page
│   └── page.tsx          # Landing page
├── components/
│   ├── admin/            # Admin Delete button & moderation components
│   ├── dashboard/        # Developer report manager components
│   ├── projects/         # Upvote, Bookmark, ReportModal components
│   └── ui/               # NetflixFooterCTA, Navbar, and layout elements
└── lib/
    └── supabase/         # Supabase client, server, and service-role instances
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

---

## 🛡️ Moderation & Data Rules

- **Soft Delete**: When an admin deletes an app, it is hidden from public browse views (`is_deleted = true`). The developer can still view their removed app in their dashboard under **Removed by Admin** along with the admin's stated reason.
- **Owner-Only Edits**: Only the owner of an app (`user.id === project.user_id`) can edit the app. Admins see admin moderation controls instead of the edit button.

---

## 📄 License
Created for AppFlix. All rights reserved.
