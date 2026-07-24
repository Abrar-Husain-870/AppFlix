# Application Architecture Decision

## The Three Options Explained Simply

- **Option A (Server Actions):** Form submits → Next.js runs code on the server → touches Supabase. No API URL needed.
- **Option B (API Routes):** Form submits → fetch('/api/projects') → Next.js route handler → touches Supabase.
- **Option C (Client-side):** Form submits → browser JS calls Supabase directly → Supabase.

---

## Full Comparison

### Security
**Option A:** ✅ Code runs on server. Service role key never exposed to browser. Can enforce auth server-side before any DB call.

**Option B:** ✅ Same as A — code runs on server. Slightly more boilerplate to validate auth on each route.

**Option C:** ❌ Supabase anon key is exposed in the browser. RLS is your only protection. One misconfigured policy = data breach. Admin operations are impossible safely.

**Winner: A or B**

---

### Authentication
**Option A:** `createServerClient()` from `@supabase/ssr` reads the cookie automatically. `const { data: { user } } = await supabase.auth.getUser()` — one line, always correct.

**Option B:** Same pattern but you must do it in every route handler manually.

**Option C:** `supabase.auth.getUser()` works client-side but is vulnerable to token manipulation for admin checks.

**Winner: Option A** (auth is automatic, not manual)

---

### Authorization (Admin checks)
**Option A:** ✅ Check `user.role === 'admin'` on server before DB call. Impossible to bypass.

**Option B:** ✅ Same — but you write the check in every route handler.

**Option C:** ❌ Admin role check happens in browser — can be bypassed with DevTools.

**Winner: A or B**

---

### AI-Assisted Development
**Option A:** Server Actions are newer. AI models know them well but sometimes mix old and new patterns. Simpler code overall (no `fetch`, no JSON, no response objects).

**Option B:** API routes are the oldest, most documented pattern. Every Stack Overflow answer, every tutorial uses them. AI generates correct code almost always.

**Option C:** Very simple to generate but insecure for writes.

**Winner: Option B** (most training data, most reliable AI output)
**Close second: Option A**

---

### Simplicity
**Option A:**
```tsx
// No API URL, no fetch, no JSON.stringify
async function createProject(formData: FormData) {
  'use server'
  const supabase = createServerClient()
  await supabase.from('projects').insert({ name: formData.get('name') })
  revalidatePath('/browse')
}
<form action={createProject}><button>Submit</button></form>
```

**Option B:**
```tsx
// Need a fetch call + a separate file for the route
const res = await fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify({ name }),
})
// Plus: /app/api/projects/route.ts with request parsing, response building
```

**Option C:**
```tsx
// Simple but unsafe for writes
await supabase.from('projects').insert({ name })
```

**Winner: Option A** (least code for forms)

---

### Performance
**Option A:** Zero network roundtrip for the API call — server action runs in the same Next.js process. Automatic `revalidatePath` refreshes cached pages.

**Option B:** Extra HTTP roundtrip to `/api/*` even though it's the same server.

**Option C:** Direct to Supabase — fastest reads, but adds client-side JS bundle.

**Winner: Option A**

---

### Form Handling
**Option A:** Native `<form action={serverAction}>` works without JavaScript. Progressive enhancement built in. Works with React Hook Form too.

**Option B:** Requires JavaScript. Must `preventDefault` and manually call fetch.

**Option C:** Requires JavaScript.

**Winner: Option A**

---

### File Uploads
**Option A:** ⚠️ Server Actions have a 1MB body limit by default in Next.js. Workaround: upload file directly to Supabase Storage from client, then pass the URL to the server action.

**Option B:** ✅ No body limit issue. Can stream directly. Route handlers handle multipart/form-data well.

**Option C:** ✅ Browser uploads directly to Supabase Storage using signed URLs. Fastest approach.

**Winner: Option B or C** for file uploads specifically.

---

### Error Handling
**Option A:** Return `{ error: 'message' }` from server action. Use `useFormState` hook to display errors.

**Option B:** Return `Response.json({ error }, { status: 400 })`. Handle in fetch catch block.

**Option C:** Try/catch around Supabase call. Most straightforward.

**Winner: Option C** (simplest), **Option B** (most explicit)

---

### Admin Actions
**Option A:** ✅ Server action checks `user.role === 'admin'` → proceeds. Clean.

**Option B:** ✅ Route handler checks role → proceeds.

**Option C:** ❌ Never use client-side Supabase for admin operations.

**Winner: A or B**

---

### Scalability / Future Extensibility
**Option B:** API routes can be extracted into a standalone Express/Fastify service later if needed. External services (mobile app, webhooks) can call them.

**Option A:** Server actions are tied to Next.js. Cannot be called from a mobile app or external service.

**Option C:** Tightly coupled to Supabase.

**Winner: Option B** (most portable)

---

## Scorecard

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Security | ✅ | ✅ | ❌ |
| Authentication | ✅✅ | ✅ | ⚠️ |
| Authorization | ✅ | ✅ | ❌ |
| AI Dev | ✅ | ✅✅ | ✅ |
| Simplicity | ✅✅ | ✅ | ✅✅ |
| Performance | ✅✅ | ✅ | ✅ |
| Form Handling | ✅✅ | ✅ | ✅ |
| File Uploads | ⚠️ | ✅ | ✅ |
| Error Handling | ✅ | ✅ | ✅✅ |
| Admin Actions | ✅ | ✅ | ❌ |
| Scalability | ⚠️ | ✅✅ | ❌ |
| **Score** | **9/11** | **10/11** | **5/11** |

---

## ✅ Final Recommendation: Hybrid (A + C)

> **Server Actions for all write operations. Client-side Supabase for reads only.**

This is the sweet spot for a solo developer:

### The Rule
```
Write (create, update, delete, admin)  →  Server Actions
Read (browse, search, filter, live)    →  Client-side Supabase (with RLS)
```

### Why Not Pure Option B (API Routes)?
API routes are the "safe enterprise choice" but they add boilerplate for no gain at this scale. For every feature you'd need:
- `/app/api/projects/route.ts` (the handler file)
- A `fetch('/api/projects', { method: 'POST', headers, body })` call
- JSON serialization/deserialization
- Manual error response building

Server Actions eliminate all of that while being equally secure.

### Why Not Pure Option A (Server Actions only)?
File uploads: Next.js Server Actions have a body size limit. Don't fight it. Upload files directly from the browser to Supabase Storage (Option C pattern, but only for storage — not DB writes).

---

## Feature-by-Feature Mapping

| Feature | Pattern | Reason |
|---------|---------|--------|
| Submit new project (form) | ✅ Server Action | Form with text fields, safe |
| Edit project (form) | ✅ Server Action | Same as above |
| Delete project | ✅ Server Action | Admin action, must be server-side |
| Approve/Reject app (admin) | ✅ Server Action | Role check required |
| Upload icon / screenshots | Client → Supabase Storage → Server Action | File size limit workaround |
| Upvote | Client-side Supabase | Real-time feel, RLS prevents duplicates |
| Bookmark | Client-side Supabase | Same as upvote |
| Browse / filter apps | Client-side Supabase | Instant filtering, no server roundtrip |
| Search | Client-side Supabase | Debounced, real-time |
| View tracking (analytics) | Client-side Supabase | Fire-and-forget, no UX impact |
| Login / Signup | Supabase Auth methods | Supabase handles this |
| Send approval email | Server Action → Resend | Server-only, needs API key |
| Admin: manage categories | ✅ Server Action | Admin-only, secure |

---

## Code Pattern Reference

### Server Action (standard form)
```typescript
// app/submit/actions.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitProject(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    tagline: formData.get('tagline') as string,
    status: 'pending',
  })

  if (error) return { error: error.message }
  redirect('/dashboard/projects')
}
```

### File Upload (client → storage → server action)
```typescript
// Client component
async function handleSubmit(e: FormEvent) {
  // 1. Upload file client-side
  const { data } = await supabase.storage
    .from('icons')
    .upload(`${userId}/${file.name}`, file)
  const iconUrl = supabase.storage.from('icons').getPublicUrl(data.path).data.publicUrl

  // 2. Pass URL to server action
  await submitProject(formData, iconUrl)
}
```

### Client-side read (upvote, bookmark, browse)
```typescript
// Works with RLS — user can only upvote once, enforced by DB unique constraint
const { error } = await supabase
  .from('upvotes')
  .insert({ project_id: projectId, user_id: user.id })
```
