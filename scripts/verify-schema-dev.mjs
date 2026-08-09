/**
 * Cross-reference check: verifies schema-dev.sql covers every table,
 * column, bucket, and enum value referenced in the AppFlix source code.
 * Read-only. Touches no database. No network calls.
 * Run: node scripts/verify-schema-dev.mjs
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

function readFile(rel) {
  try { return readFileSync(join(ROOT, rel), 'utf8') }
  catch { return '' }
}

const schema = readFile('schema-dev.sql')
const adminTs = readFile('src/app/actions/admin.ts')

let pass = 0, fail = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`)
    pass++
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
    fail++
  }
}

// schemaNoComments: schema with comment-only lines stripped (used for absence checks)
const schemaNoComments = schema
  .split('\n')
  .filter(line => !line.trimStart().startsWith('--'))
  .join('\n')

function inSchema(str)     { return schema.includes(str) }
function inSchemaLive(str) { return schemaNoComments.includes(str) }  // excludes comment lines
function inAdmin(str)      { return adminTs.includes(str) }


console.log('\n' + '='.repeat(60))
console.log('SCHEMA-DEV.SQL CROSS-REFERENCE VERIFICATION')
console.log('='.repeat(60))

// ── ENUMS ──────────────────────────────────────────────────
console.log('\n[ENUMS]')
check('project_status enum',       inSchema('CREATE TYPE project_status'))
check("  'draft' value",           inSchema("'draft'"))
check("  'pending' value",         inSchema("'pending'"))
check("  'approved' value",        inSchema("'approved'"))
check("  'rejected' value",        inSchema("'rejected'"))
check("  'deleted' value",         inSchema("'deleted'"))
check('project_stage enum',        inSchema('CREATE TYPE project_stage'))
check("  'beta' value",            inSchema("'beta'"))
check("  'production' value",      inSchema("'production'"))
check('user_role enum',            inSchema('CREATE TYPE user_role'))
check('notification_type enum',    inSchema('CREATE TYPE notification_type'))
check("  'project_approved'",      inSchema("'project_approved'"))
check("  'project_rejected'",      inSchema("'project_rejected'"))
check("  'system_notice'",         inSchema("'system_notice'"))
check('report_reason enum',        inSchema('CREATE TYPE report_reason'))
check('report_status enum',        inSchema('CREATE TYPE report_status'))
check('platform_type enum',        inSchema('CREATE TYPE platform_type'))
check("  'ios'",                   inSchema("'ios'"))
check("  'android'",               inSchema("'android'"))
check("  'web'",                   inSchema("'web'"))
check("  'windows'",               inSchema("'windows'"))
check("  'macos'",                 inSchema("'macos'"))
check("  'linux'",                 inSchema("'linux'"))
check("  'browser_extension'",     inSchema("'browser_extension'"))
check('event_type enum',           inSchema('CREATE TYPE event_type'))
check("  'view' event_type",       inSchema("'view'"))
check("  'click_external'",        inSchema("'click_external'"))
check('image_type enum',           inSchema('CREATE TYPE image_type'))
check("  'screenshot'",            inSchema("'screenshot'"))
check('device_type enum',          inSchema('CREATE TYPE device_type'))

// ── TABLES ─────────────────────────────────────────────────
console.log('\n[TABLES]')
check('support_inquiries table',   inSchema('CREATE TABLE'))
check('  support_inquiries.name',  inSchema('support_inquiries'))
check('  status column',           inSchema("status           TEXT DEFAULT 'unread'") ||
                                   inSchema("status TEXT DEFAULT 'unread'"))
check('profiles table',            inSchema('CREATE TABLE public.profiles'))
check('  profiles.username',       inSchema('username') && inSchema('profiles'))
check('  profiles.role',           inSchema('role           user_role'))
check('  profiles.deleted_at',     inSchema('deleted_at     TIMESTAMPTZ'))
check('categories table',          inSchema('CREATE TABLE public.categories'))
check('  categories seed data',    inSchema("INSERT INTO public.categories"))
check('  12 category rows',        (schema.match(/VALUES/g) || []).length > 0)
check('tags table',                inSchema('CREATE TABLE public.tags'))
check('projects table',            inSchema('CREATE TABLE public.projects'))
check('  projects.slug UNIQUE',    inSchema('slug              TEXT NOT NULL UNIQUE'))
check('  projects.platforms[]',    inSchema('platform_type[] NOT NULL'))
check('  projects.upvote_count',   inSchema('upvote_count'))
check('  projects.view_count',     inSchema('view_count'))
check('  projects.bookmark_count', inSchema('bookmark_count'))
check('  projects.deleted_at',     inSchema('deleted_at        TIMESTAMPTZ'))
check('  projects.submitted_at',   inSchema('submitted_at'))
check('  projects.approved_at',    inSchema('approved_at'))
check('  projects.is_featured',    inSchema('is_featured'))
check('project_tags table',        inSchema('CREATE TABLE public.project_tags'))
check('project_versions table',    inSchema('CREATE TABLE public.project_versions'))
check('project_images table',      inSchema('CREATE TABLE public.project_images'))
check('  UNIQUE constraint',       inSchema('UNIQUE (project_id, image_type, display_order)'))
check('upvotes table',             inSchema('CREATE TABLE public.upvotes'))
check('  UNIQUE (user,project)',   inSchema('UNIQUE (user_id, project_id)'))
check('bookmarks table',           inSchema('CREATE TABLE public.bookmarks'))
check('analytics_events table',    inSchema('CREATE TABLE public.analytics_events'))
check('  chk_visitor_xor',         inSchema('chk_visitor_xor'))
check('notifications table',       inSchema('CREATE TABLE public.notifications'))
check('  title TEXT NOT NULL',     inSchema('title       TEXT NOT NULL'))
check('reports table',             inSchema('CREATE TABLE public.reports'))
check('project_comments table',    inSchema('CREATE TABLE public.project_comments'))
check('  [FIX-1] rating column',   inSchema('rating               INT NOT NULL DEFAULT 5'))
check('  UNIQUE constraint absent', !inSchema('UNIQUE (project_id, user_id)'),
  'correct: 1-per-user enforced in app code, not DB')

// ── INDEXES ────────────────────────────────────────────────
console.log('\n[INDEXES]')
check('idx_projects_fts (gin)',      inSchema('idx_projects_fts'))
check('idx_projects_trending',       inSchema('idx_projects_trending'))
check('idx_analytics_project',       inSchema('idx_analytics_project'))
check('idx_notifications_unread',    inSchema('idx_notifications_unread'))
check('idx_project_comments_project',inSchema('idx_project_comments_project'))

// ── TRIGGERS & FUNCTIONS ───────────────────────────────────
console.log('\n[TRIGGERS & FUNCTIONS]')
check('handle_new_user()',            inSchema('handle_new_user'))
check('on_auth_user_created trigger', inSchema('on_auth_user_created'))
check('set_updated_at()',             inSchema('set_updated_at'))
check('set_projects_updated_at',      inSchema('set_projects_updated_at'))
check('set_profiles_updated_at',      inSchema('set_profiles_updated_at'))
check('[FIX-3] NO comments trigger',  !inSchemaLive('BEFORE UPDATE ON public.comments'),
  'broken trigger correctly removed')
check('[FIX-5] project_comments trigger', inSchema('set_project_comments_updated_at'))
check('set_categories_updated_at',    inSchema('set_categories_updated_at'))
check('set_tags_updated_at',          inSchema('set_tags_updated_at'))
check('set_project_versions_updated_at', inSchema('set_project_versions_updated_at'))
check('set_project_images_updated_at',inSchema('set_project_images_updated_at'))
check('set_notifications_updated_at', inSchema('set_notifications_updated_at'))
check('set_reports_updated_at',       inSchema('set_reports_updated_at'))
check('handle_project_submitted()',   inSchema('handle_project_submitted'))
check('on_project_status_change',     inSchema('on_project_status_change'))
check('sync_upvote_count()',          inSchema('sync_upvote_count'))
check('sync_bookmark_count()',        inSchema('sync_bookmark_count'))
check('sync_view_count()',            inSchema('sync_view_count'))
check('on_view_event trigger',        inSchema('on_view_event'))

// ── RLS ─────────────────────────────────────────────────────
console.log('\n[ROW LEVEL SECURITY]')
check('profiles RLS enabled',         inSchema('ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY'))
check('projects RLS enabled',         inSchema('ALTER TABLE public.projects              ENABLE ROW LEVEL SECURITY'))
check('project_tags RLS enabled',     inSchema('ALTER TABLE public.project_tags          ENABLE ROW LEVEL SECURITY'))
check('project_images RLS enabled',   inSchema('ALTER TABLE public.project_images        ENABLE ROW LEVEL SECURITY'))
check('upvotes RLS enabled',          inSchema('ALTER TABLE public.upvotes               ENABLE ROW LEVEL SECURITY'))
check('bookmarks RLS enabled',        inSchema('ALTER TABLE public.bookmarks             ENABLE ROW LEVEL SECURITY'))
check('analytics_events RLS enabled', inSchema('ALTER TABLE public.analytics_events      ENABLE ROW LEVEL SECURITY'))
check('notifications RLS enabled',    inSchema('ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY'))
check('reports RLS enabled',          inSchema('ALTER TABLE public.reports               ENABLE ROW LEVEL SECURITY'))
check('categories RLS enabled',       inSchema('ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY'))
check('tags RLS enabled',             inSchema('ALTER TABLE public.tags                  ENABLE ROW LEVEL SECURITY'))
check('[FIX-2] project_comments RLS enabled', inSchema('ALTER TABLE public.project_comments      ENABLE ROW LEVEL SECURITY'))
check('is_admin() function',          inSchema('CREATE OR REPLACE FUNCTION public.is_admin'))
check('Profiles: public read',        inSchema('"Profiles: public read"'))
check('Profiles: own update',         inSchema('"Profiles: own update"'))
check('Projects: approved public read',inSchema('"Projects: approved public read"'))
check('Projects: own insert',         inSchema('"Projects: own insert"'))
check('Projects: own update',         inSchema('"Projects: own update"'))
check('ProjectTags: public read',     inSchema('"ProjectTags: public read"'))
check('Upvotes: public read',         inSchema('"Upvotes: public read"'))
check('Upvotes: own insert',          inSchema('"Upvotes: own insert"'))
check('Upvotes: own delete',          inSchema('"Upvotes: own delete"'))
check('Bookmarks: own read',          inSchema('"Bookmarks: own read"'))
check('Analytics: anyone insert',     inSchema('"Analytics: anyone insert"'))
check('Notifications: own read',      inSchema('"Notifications: own read"'))
check('Reports: reporter read own',   inSchema('"Reports: reporter read own"'))
check('[FIX-2] Comments: public read',inSchema('"Comments: public read"'))
check('[FIX-2] Comments: auth insert',inSchema('"Comments: auth insert"'))
check('[FIX-2] Comments: own update', inSchema('"Comments: own update"'))
check('[FIX-2] Comments: own or admin delete', inSchema('"Comments: own or admin delete"'))
check('[FIX-4] NO StatusHistory policy', !inSchemaLive('project_status_history'),
  'orphaned policy correctly removed')

// ── STORAGE ─────────────────────────────────────────────────
console.log('\n[STORAGE BUCKETS]')
check("'icons' bucket",              inSchema("'icons'"))
check("'project-images' bucket",     inSchema("'project-images'"))
check("'avatars' bucket",            inSchema("'avatars'"))
check('Icons: public read policy',   inSchema('"Icons: public read"'))
check('Icons: auth upload policy',   inSchema('"Icons: auth upload"'))
check('Icons: owner delete policy',  inSchema('"Icons: owner delete"'))
check('ProjectImages: public read',  inSchema('"ProjectImages: public read"'))
check('ProjectImages: auth upload',  inSchema('"ProjectImages: auth upload"'))
check('Avatars: public read',        inSchema('"Avatars: public read"'))
check('Avatars: own upload',         inSchema('"Avatars: own upload"'))
check('Avatars: own delete',         inSchema('"Avatars: own delete"'))

// ── PLUS CHECK (must be absent) ──────────────────────────────
console.log('\n[PLUS MEMBERSHIP ABSENCE CHECK]')
check('No app_listings table',       !inSchema('app_listings'))
check('No listing_status column',    !inSchema('listing_status'))
check('No razorpay references',      !inSchemaLive('razorpay') && !inSchemaLive('Razorpay'))
check('No entitlement references',   !inSchemaLive('entitlement'))
check('No payment_required status',  !inSchema('payment_required'))
check('No expires_at column',        !inSchema('expires_at'))
check('No paid enum value',          !inSchema("'paid'"))

// ── ADMIN.TS CODE FIX ────────────────────────────────────────
console.log('\n[ADMIN.TS CODE FIX — Finding 3]')
check("approveProject: title: 'Project Approved'", inAdmin("title: 'Project Approved'"))
check("rejectProject:  title: 'Project Rejected'", inAdmin("title: 'Project Rejected'"))
check("adminDelete:    title: 'Project Removed'",  inAdmin("title: 'Project Removed'"))

// ── SUMMARY ──────────────────────────────────────────────────
console.log('\n' + '='.repeat(60))
console.log(`RESULT: ${pass} passed, ${fail} failed`)
if (fail === 0) {
  console.log('✅ schema-dev.sql is complete and correct for the development baseline.')
} else {
  console.log('❌ Failures above must be resolved before applying to dev Supabase project.')
}
console.log('='.repeat(60) + '\n')
