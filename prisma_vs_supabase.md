# Prisma vs Supabase Client — Architectural Decision

## The Critical Problem With Option A Nobody Mentions

When you use Prisma with Supabase, **Prisma connects directly to PostgreSQL**, bypassing the Supabase API layer entirely. This means:

- **Row Level Security (RLS) is bypassed** — Prisma uses a service-role DB connection that ignores RLS policies
- Auth and DB become **two separate systems** you have to manually keep in sync
- You lose Supabase's biggest security feature

For an app where developers should ONLY see their own apps/analytics, RLS is not optional. Bypassing it means you must write manual ownership checks in every API route — and one forgotten check = a data leak.

---

## Full Comparison

### 1. Simplicity
**Option A (Prisma):** Two systems to configure. `schema.prisma` + Supabase dashboard. Two migration tools. Two connection strings. Serverless connection pooling issues on Vercel require `@prisma/adapter-neon` or similar workarounds.

**Option B (Supabase):** One SDK. One dashboard. `supabase-js` handles auth, DB queries, and storage.

**Winner: Option B**

---

### 2. Developer Experience
**Option A:** Prisma Studio is excellent. `prisma generate` gives instant autocomplete. Migration workflow is explicit and version-controlled.

**Option B:** Supabase dashboard is visual and beginner-friendly. `supabase gen types typescript --local > types.ts` generates full TypeScript types from your actual schema. Table editor is point-and-click.

**Winner: Tie** (Prisma DX is better for complex schemas; Supabase DX is better for beginners)

---

### 3. AI-Assisted Development
**Option A:** Prisma is extremely well-known to AI models. High-quality code generation.

**Option B:** Supabase JS client is equally well-known. Simple method chaining (`supabase.from('projects').select('*').eq('status', 'approved')`) is easier for AI to generate correctly than Prisma's `findMany` with `where`/`include` nesting.

**Winner: Option B** (simpler syntax = fewer AI errors)

---

### 4. Type Safety
**Option A:** Prisma generates fully typed client automatically. Excellent.

**Option B:** You run `supabase gen types typescript` once and get a `Database` type that covers every table. Then: `supabase.from<Database['public']['Tables']['projects']['Row']>('projects')`. Less ergonomic but equally safe.

**Winner: Option A** (marginally, Prisma types are more ergonomic)

---

### 5. Authentication Integration
**Option A:** Supabase handles auth, Prisma handles DB. You must pass the user's ID from the auth session into every Prisma query manually. No automatic enforcement.

**Option B:** Supabase client is auth-aware. When you call `supabase.from('projects').select()`, it automatically uses the logged-in user's JWT. RLS policies enforce ownership at the DB level automatically.

**Winner: Option B** (massive advantage — auth and data access are unified)

---

### 6. Performance
**Option A:** Prisma adds ~50-100ms cold start overhead on serverless (Vercel). Connection pooling in serverless requires extra setup (`pgBouncer`, `prisma.$disconnect()`).

**Option B:** Supabase client talks to PostgREST (a REST API over PostgreSQL). Slightly more network overhead per query, but no cold start issues. Connection pooling handled by Supabase automatically.

**Winner: Option B** (for Vercel serverless deployment)

---

### 7. Database Migrations
**Option A:** `prisma migrate dev` → generates SQL migration files → version controlled in `/prisma/migrations/`. Explicit and auditable.

**Option B:** Supabase dashboard "Table Editor" for simple changes, or SQL editor / `supabase migration new` CLI for code-based migrations. Also version-controllable.

**Winner: Option A** (Prisma migrations are more structured and developer-friendly)

---

### 8. Row Level Security Compatibility
**Option A:** ❌ Prisma uses service role key → **bypasses RLS entirely**. You must write manual auth checks in every route.

**Option B:** ✅ Full RLS support. Example policy: `USING (auth.uid() = user_id)` — enforced automatically for every query.

**Winner: Option B** (Option A is a security liability)

---

### 9. Learning Curve
**Option A:** Learn Prisma schema syntax + Prisma Client API + how to wire Supabase Auth to Prisma manually.

**Option B:** Learn one SDK. `supabase.auth.*` for auth. `supabase.from().*` for data. `supabase.storage.*` for files.

**Winner: Option B**

---

### 10. Maintainability
**Option A:** Two separate abstractions to maintain. If Prisma or Supabase has a breaking update, you have two libraries to fix.

**Option B:** One library. Supabase updates are backwards-compatible and well-documented.

**Winner: Option B**

---

### 11. Scalability
**Option A:** At scale, Prisma + direct PostgreSQL can be faster with connection pooling properly configured.

**Option B:** PostgREST has a performance ceiling. At very high traffic (100k+ req/min), direct SQL via Prisma wins. But you won't hit this as a solo dev MVP.

**Winner: Option A** (only relevant at large scale)

---

## Scorecard

| Criterion | Option A | Option B |
|-----------|----------|----------|
| Simplicity | ❌ | ✅ |
| Developer Experience | ✅ | ✅ |
| AI-Assisted Dev | ✅ | ✅ |
| Type Safety | ✅ | ⚠️ |
| Auth Integration | ❌ | ✅ |
| Performance (Serverless) | ❌ | ✅ |
| Migrations | ✅ | ⚠️ |
| RLS Compatibility | ❌ | ✅ |
| Learning Curve | ❌ | ✅ |
| Maintainability | ❌ | ✅ |
| Scalability (future) | ✅ | ⚠️ |
| **Score** | **4/11** | **8/11** |

---

## ✅ Final Recommendation: Option B — Supabase Client

**For a solo developer building this with AI assistance, use:**

```
Next.js → Supabase Client (@supabase/supabase-js) → Supabase PostgreSQL
```

**The decisive reason:** RLS. Your app has exactly the use case RLS was designed for — developers should only access their own apps and analytics. With Option B, you write a policy once:

```sql
-- In Supabase dashboard → Auth → Policies
CREATE POLICY "Developers see own apps"
ON projects FOR ALL
USING (auth.uid() = user_id);
```

And every query is automatically scoped to the logged-in user. No manual checks. No accidental data leaks. With Prisma, you'd need to manually add `.where({ userId: session.user.id })` to every single query — and one missed check is a bug.

**Drop Prisma from the stack.** The updated stack is:

```
Next.js 15 + TypeScript
Tailwind CSS + shadcn/ui
Supabase (Auth + PostgreSQL + Storage)    ← one service, not two
React Hook Form + Zod
TanStack Query
Recharts
Resend
Vercel
```
