/**
 * Reusable Supabase query helper for public project visibility across AppFlix.
 * Ensures unpaid or expired projects are NEVER exposed to the public.
 */

export function buildPublicListingFilter(): string {
  const nowIso = new Date().toISOString()
  return `listing_type.eq.free,and(listing_paid.eq.true,listing_expires_at.gt.${nowIso})`
}

/**
 * Applies full public project visibility criteria to a Supabase query builder:
 * 1. status = 'approved'
 * 2. deleted_at IS NULL
 * 3. listing_type = 'free' OR (listing_paid = true AND listing_expires_at > NOW)
 */
export function applyPublicVisibilityFilter<T>(query: T): T {
  const filter = buildPublicListingFilter()
  return (query as any)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .or(filter)
}
