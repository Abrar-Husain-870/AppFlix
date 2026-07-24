# AGENT HANDOFF — APPGRAM PROJECT SPECIFICATION

This document serves as the absolute source of truth and complete context for the next AI agent or developer taking over the AppGram project. It reconstructs all design decisions, architectural agreements, database schemas, and product features discussed to date. **Assume no other context or conversation history is accessible.**

---

## 1. Project Overview
- **What this project is:** AppGram is a curated directory and showcase platform for student-built applications, tools, and digital projects within a university ecosystem. It is modeled as a "Product Hunt for university projects."
- **Why it exists:** Universities house thousands of student developers, designers, and creators building amazing projects for classes, hackathons, and personal portfolios. However, these projects are usually forgotten, buried in GitHub repositories, or lost after grading. AppGram provides a single, central hub to display, search, and discover this work.
- **The problem it solves:** The "App Hunt" problem—lack of visibility, feedback, and collaboration for student-run applications. It bridges the gap between builders (students seeking users or contributors) and consumers (faculty, recruiters, and fellow students seeking tools or collaborators).
- **Target audience:**
  - **Student Developers:** Want to publish their creations, gain real-world users, and get upvotes/feedback.
  - **Student Consumers:** Looking for utility tools, campus-specific hacks, or projects to try.
  - **Faculty & Admins:** Evaluating student output or looking for showcase pieces.
  - **Recruiters:** Scouting technical talent via a visual gallery of actual built products.
- **Overall vision:** A low-friction, high-impact community gallery that operates continuously with zero operational costs, celebrating student innovation.

---

## 2. Core Product Philosophy
- **UX Philosophy:** Extreme simplicity. Reduce barriers to entry.
  - Signing up should take seconds (using university email prefix or Google OAuth).
  - Submitting a project must be a single, streamlined form.
  - Finding a project should require zero tutorials—just scroll, search, and filter.
- **UI Philosophy & Design Language:** High-contrast, premium, dark-mode styling.
  - We have adopted a **Netflix-inspired theme (Red-Black / Red-White)**.
  - Cards should look like cinematic tiles, giving student projects an immediate sense of high production value.
  - Clean borders, deep black backgrounds (`#141414`), container backgrounds (`#1F1F1F`), and striking red accents (`#E50914`) for primary elements.
- **Inspiration (DeenList):** We analyzed DeenList (a community directory for Islamic apps) and adapted its structural backbone:
  - Simple categorization system.
  - Upvote-driven ranking to bubble active, quality projects to the top.
  - Platform classification badges (iOS, Android, Web, etc.).
- **Things We Intentionally Decided NOT to Copy from DeenList/Product Hunt:**
  - **No Comments / Reviews:** Skip discussions and star ratings. These attract spam and require active moderation, which is a massive burden for a solo student developer.
  - **No Complex Notification Integrations:** Avoid services like Novu. Use simple in-app notification rows in the DB and basic Resend transactional emails.
  - **No Complex User Profiles:** Restrict profiles to basic info (links, bio, avatar) and their projects list. No follower networks or user activity feeds.
  - **No Multi-tier Moderation:** Restrict roles to `user` (default) and `admin` (you). No intermediate "moderator" tier.

---

## 3. Screenshots Analysis (Reconstructed Findings)
During the reverse-engineering phase of the DeenList reference application, several core page layouts were analyzed:

1. **The Hero Header & Browse Grid:**
   - *What it showed:* A centered headline, a category filter sidebar on the left, and a paginated list of project cards on the right.
   - *What we liked:* The two-column sidebar approach is highly standard, intuitive, and works perfectly on desktop.
   - *What we disliked:* Too much blank space on widescreen.
   - *Implementation Plan:* Implement a sticky left category sidebar on desktop that collapses into a horizontal scrollable tab-bar on mobile. Use responsive grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) for the main project list to fill screen space efficiently.

2. **Project Detail Page:**
   - *What it showed:* A main description column on the left with a horizontal screenshots carousel, and a metadata sidebar on the right containing links, version history, and tags.
   - *What we liked:* Separation of rich text (Markdown) from quick metadata. The horizontal screenshot gallery makes immediate visual sense.
   - *What we disliked:* Having screenshots and "how it works" workflow diagrams in separate, non-adjacent widgets caused page bloat.
   - *Implementation Plan:* Merge both screenshot and workflow uploads into a single database table (`project_images`) and display them in a unified carousel tabbed by type, avoiding multiple disjointed UI rows.

3. **Submissions Form:**
   - *What it showed:* A long multi-section form covering metadata, descriptions, image uploads, and versioning.
   - *What we liked:* Visual image previews immediately after selecting files.
   - *What we disliked:* Lengthy forms discourage submissions.
   - *Implementation Plan:* Keep it as a single form with logical sections. Automatically prepopulate developer info from their profile. Provide a "Save Draft" option.

---

## 4. Complete Feature List

### Finished/Detailed Ideas (Core MVP)
- **Email/OAuth Authentication:** Login and Sign-up via Supabase Auth.
- **Project Submission:** Developers can submit their app with name, tagline, description (Markdown), icon, website/repo URLs, category, platforms (array), and stage.
- **Unified Image Gallery:** Support up to 5 screenshots and 5 workflow diagrams, stored in a single bucket.
- **Real-time Upvoting & Bookmarking:** Interactive buttons on cards and detail pages, backed by DB triggers that sync counts.
- **Instant Search:** debounced search matching project names, taglines, and descriptions using PostgreSQL full-text search.
- **Maturity Signals:** Project stages limited to `beta` and `production` to indicate stability.
- **Admin Approval Queue:** Dashboard panel where admins can approve or reject pending submissions (requires rejection reason).
- **Basic Analytics:** Page views, external links clicks, impressions, upvotes, bookmarks, and reports logged silently into a unified event table.
- **In-App Notifications:** Basic feed informing creators when their project is approved, rejected, or upvoted.
- **Soft Deletion:** Projects are never physically deleted; they are marked `deleted` to keep relationships and analytics intact.

### Rejected / Excluded Ideas (For MVP)
- **No Comments / Threaded Discussions:** Moderation liability.
- **No Ratings/Star Reviews:** Unnecessary complexity.
- **No Social Follower Network:** Keeps profile code simple.
- **No AI-Powered Summaries/Tags:** Avoids API key management, rate limits, and billing issues.
- **No External Upload services (e.g., UploadThing):** Exclusively use Supabase Storage.

---

## 5. UI/UX Decisions & Netflix Theme
- **Color Palette (Netflix Dark Theme):**
  - **Background:** Deep Black (`#141414`) for the body.
  - **Containers/Cards:** Charcoal Gray (`#1F1F1F`) to create visual hierarchy.
  - **Primary Brand Color:** Crimson Red (`#E50914`) for active buttons, badges, upvote hover, and key visual highlights.
  - **Typography:** Pure White (`#FFFFFF`) for titles, Muted Slate (`#AAAAAA`) for metadata, sub-labels, and taglines.
  - **Borders:** Thin, subtle borders (`#2B2B2B`) for cards and inputs.
- **Typography:** Modern, clean sans-serif (e.g., **Inter** or **Outfit** via Google Fonts) rather than browser defaults.
- **Layouts & Spacing:**
  - Tight, structured padding (standard `p-4` or `p-6`) on cards.
  - Grid structures for lists, maximizing visual density (like a movie browse grid).
- **Animations:**
  - Fast, clean transitions (`transition-all duration-200`) on hover states.
  - Hovering over a card should trigger a slight scale-up (`scale-[1.02]`) and border highlight.
- **Micro-interactions:**
  - Upvote button should bounce slightly on click and instantly increment the client-side count before the DB roundtrip resolves.
- **States:**
  - **Loading:** Shimmering skeletons mimicking card layout.
  - **Empty:** Graphic representing "No results" with a clear CTA button (e.g., "Submit your project").

---

## 6. Technical Architecture

```
                       ┌─────────────────────────┐
                       │   Next.js 15 App Router │
                       │    (TypeScript/Vercel)  │
                       └────────────┬────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
        Reads  │ (Client-side)                    Writes │ (Server Actions)
               ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │    Supabase Client    │                 │    Server Actions     │
   │   (Direct with RLS)   │                 │ (Auth & Write Checks) │
   └───────────┬───────────┘                 └───────────┬───────────┘
               │                                         │
               └────────────────────┬────────────────────┘
                                    ▼
                       ┌─────────────────────────┐
                       │     Supabase Service    │
                       │ (PostgreSQL / Storage)  │
                       └─────────────────────────┘
```

- **Frontend:** Next.js 15 (App Router, React 19). Fully typed in TypeScript.
- **Styling:** Tailwind CSS + shadcn/ui.
- **Data Layer Pattern:**
  - **Reads:** Client-side fetches directly via the Supabase Client. Enables fast page loading and responsive filters. Row-Level Security (RLS) automatically filters rows so developers only see their own drafts and analytics.
  - **Writes (CUD Operations):** Managed via Next.js **Server Actions** for secure, server-side execution.
- **Authentication:** Supabase Auth (Cookie-based session sync handled by `@supabase/ssr`).
- **State Management:** Keep it vanilla. Utilize Server Components for initial page state, React's `useState` for simple toggles, and TanStack Query (React Query) only if complex client-side caching is needed.
- **File Uploads (Next.js action bypass):** Next.js Server Actions have a default body size limit (1MB). We upload files directly from the browser to Supabase Storage using the client, then pass the resulting public URLs into the Server Action to save the project metadata.
- **Hosting & Deployment:** GitHub repo integrated with Vercel for instant deployments.
- **Database:** Supabase PostgreSQL instance.

### Folder Structure
```
/app
  /layout.tsx          → Root layout (providers, navigation wrapper)
  /page.tsx            → Landing page
  /browse              → Project catalog (browse list)
    /[slug]/page.tsx   → Project detail page
  /submit              → Submission form (Auth guarded)
  /login               → Login page
  /signup              → Signup page
  /dashboard            → Developer hub (Auth guarded)
    /projects          → User project lists (Drafts, Pending, Approved)
    /analytics         → Dashboard charts (Views, Upvotes, CTR)
    /settings          → Profile config
  /admin               → Admin portal (Admin check)
    /queue             → Submissions review queue
    /reports           → User reports log
  /api                 → Minimum route handlers (e.g. Resend webhooks if needed)
/components
  /ui                  → shadcn primitives
  /layout              → Nav, footer
  /projects            → ProjectCard, ProjectGrid, DetailGallery
  /forms               → SubmitForm, ProfileForm
/lib
  /supabase            → client.ts (browser client), server.ts (server actions client)
  /utils               → helper functions
```

---

## 7. Existing Files
The following files are located in the local storage and must be ported to the workspace:

1. **[schema.sql](file:///C:/Users/husai/.gemini/antigravity/brain/0c9294c5-5102-425f-8cce-06eefb699052/artifacts/schema.sql):**
   - The definitive PostgreSQL schema. Defines enums (`project_status`, `project_stage`, `user_role`, `notification_type`, `report_reason`, `report_status`, `platform_type`, `event_type`, `image_type`, `device_type`), tables, indexes, triggers (for timestamp updates, counter syncing, and profile auto-generation), Row-Level Security (RLS) policies, and storage bucket configuration.
2. **[visitor.ts](file:///C:/Users/husai/.gemini/antigravity/brain/0c9294c5-5102-425f-8cce-06eefb699052/artifacts/visitor.ts):**
   - Client-side helper that generates or retrieves a privacy-friendly UUID stored in `localStorage`. Includes a fallback logic for older browsers. Used as `visitor_id` for tracking unique guest views in the `analytics_events` table.

---

## 8. Development Decisions & Rationale
- **Why we dropped Prisma ORM in favor of Supabase Client:** Prisma connects directly to PostgreSQL using a service role, completely bypassing Supabase's Row-Level Security (RLS). This requires manually writing security/ownership checks in every API route. Direct Supabase Client usage allows us to write RLS policies once in SQL, protecting data automatically across both reads and writes.
- **Why we use a Single Event Log (`analytics_events`) table:** Instead of creating separate tables for views, upvotes, impressions, and clicks, we write to a single append-only log. This makes adding new event types simple, simplifies query construction, and reduces DB table clutter.
- **Why we generate visitor UUIDs client-side:** Rather than collecting IP addresses or creating browser fingerprints (which present security/GDPR compliance issues and require complex tracking libraries), we use a client-side generated UUID stored in `localStorage`. It is clean, private, and sufficiently stable.
- **Why we dropped the `developer` role:** A role should govern authorization boundaries. Any authenticated user can submit a project. Once they own a project (`user_id = auth.uid()`), RLS automatically grants them access to edit that project and read its analytics. Inferred developer permissions are cleaner than managing role transitions.

---

## 9. Things the Next Agent MUST NOT Change
1. **The Database Schema Structure:** Do not modify the column configurations, enums, triggers, or RLS policies in `schema.sql` unless fixing a functional bug.
2. **Bypass of ORMs:** Do not add Prisma, Drizzle, or any other ORM. The data fetching architecture is strictly bound to the direct `@supabase/supabase-js` SDK to leverage RLS.
3. **No Guest Tracking IPs:** Do not capture visitor IPs or use fingerprinting scripts in the analytics logic. Stick to the `visitor.ts` UUID approach.
4. **Writes via Server Actions:** Do not create REST API routes (`/api/projects/create`) for write commands. Maintain the server action patterns for standard CRUD.

---

## 10. Pending Tasks (Prioritized Checklist)

### Priority 1: Environment & Project Scaffolding
- [ ] Initialize Next.js 15 app in current directory (`npx -y create-next-app@latest ./` using TypeScript, Tailwind, ESLint, App Router).
- [ ] Configure Tailwind with the Netflix-inspired dark mode configuration.
- [ ] Run `npx shadcn@latest init` to install the UI library.
- [ ] Connect your Supabase project using environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- [ ] Execute `schema.sql` inside the Supabase SQL editor to create all tables, indexes, triggers, and storage buckets.

### Priority 2: Authentication & Core Views
- [ ] Implement Sign-up/Login pages using Supabase Auth (supporting Email/Password and Google OAuth).
- [ ] Build the main **Browse Page** (`/browse`) fetching approved projects directly from the DB. Add category chips and sorting tabs.
- [ ] Build the **Project Detail Page** (`/browse/[slug]`) with full layout, screenshot gallery, and details.
- [ ] Integrate upvote and bookmark buttons with real-time UI counters and Supabase DB synchronizations.

### Priority 3: Forms & Dashboard
- [ ] Implement the **Project Submission Form** (`/submit`) using React Hook Form + Zod validation. File uploads must route to Supabase Storage first.
- [ ] Build the **Developer Dashboard** (`/dashboard/projects`) to display the user's projects with draft/pending/approved status badges.
- [ ] Build the **Analytics Dashboard** (`/dashboard/analytics`) showing views, upvotes, and CTR using Recharts.
- [ ] Set up the **Admin Review Panel** (`/admin/queue`) allowing approved administrators to review and approve/reject pending apps.

---

## 11. Known Problems & Limitations
- **Supabase Auto-Pause:** The free tier of Supabase automatically pauses databases after 1 week of developer inactivity. This can cause the app to display database errors to visitors.
  - *Fix:* Set up a free pinging service (e.g., [cron-job.org](https://cron-job.org)) that pings the application's health endpoint every few days.
- **Server Action File Upload Limits:** If a user attempts to upload screenshots directly inside a Server Action payload, it will fail due to the default payload size limit (1MB).
  - *Mitigation:* Ensure files are uploaded directly to Supabase Storage *prior* to submitting the metadata form.

---

## 12. Future Roadmap
Once the MVP is launched and evaluated within the university, the next logical features to build are:
1. **University Domain Restriction:** Limit registrations to emails ending with the university domain (e.g. `@university.edu`).
2. **Contributors Section:** Display a filtered tab showing open-source projects actively looking for student collaborators.
3. **Weekly Newsletter:** Integrate Resend to send a weekly summary of top-voted student apps to the campus subscriber list.

---

## 13. Conversation Insights
During the architectural design iterations, we originally planned separate tables for `screenshots` and `workflow_images`. We realized this would lead to duplicate queries, multiple components, and redundant code on the frontend. Merging them into `project_images` with a single type discriminator (`image_type`) collapsed two endpoints and UI components into one. 

Similarly, we stripped the `moderator` role because student-led university MVPs do not scale to the level of requiring tier-divided admin work. Keeping it simple as `user | admin` drastically decreases authorization state complexity.

---

## 14. Context the Next Agent Should Assume
- **Workspace path:** All code changes must happen in the user's active workspace: `c:\Users\husai\Desktop\AppGram`.
- **Server Actions context:** When configuring Server Actions that mutate database entries, configure them to run with the User's Supabase JWT whenever possible (to keep RLS active), and only use the service-role client for system overrides (like admin approvals).
- **SSR Client Setup:** Ensure that `@supabase/ssr` is correctly initialized in `/lib/supabase` with separate clients for Server Components, Client Components, and Server Actions.

---

## 15. Executive Summary
AppGram is a Next.js 15, Supabase-powered Product Hunt clone built specifically for university student projects. It is designed to run completely on the free tiers of Vercel, Supabase, and Resend. It features a premium, Netflix-inspired dark-mode layout with red accents. Writes (e.g., project submission, administration) are handled by Server Actions, and Reads (e.g., browse, filters) fetch directly via the Supabase client. Security is enforced globally via PostgreSQL Row-Level Security (RLS) policies. To maintain a simple, zero-maintenance profile, features like comments and complex moderation queues have been completely omitted from the MVP.
