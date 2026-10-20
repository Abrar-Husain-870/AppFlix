/**
 * lib/device.ts
 *
 * Manages the persistent, anonymous device identifier for AppFlix.
 * Stored in localStorage — survives tab closures, browser restarts, and session ends.
 *
 * Architecture & Privacy:
 *   - Stored strictly in first-party localStorage.
 *   - Completely decoupled from user account credentials.
 *   - Represents a recognized persistent browser identity, not physical hardware attestation.
 *   - If site data/cookies are cleared or private browsing is used, a fresh identity is initialized.
 */

const DEVICE_ID_KEY = 'appflix_device_id'
const VIEWED_PREFIX = 'appflix_viewed_'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Generates an RFC4122 compliant UUID v4 string.
 */
function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Standard RFC4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Returns the persistent device UUID stored in localStorage.
 * If none exists or if existing value is malformed, generates a standard UUID v4,
 * persists it to localStorage, and returns it.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return ''

  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id || !UUID_REGEX.test(id.trim())) {
      id = generateUUIDv4()
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id.trim()
  } catch (err) {
    console.warn('[lib/device] localStorage access error:', err)
    return ''
  }
}

/**
 * Fast client-side check: has this browser already recorded a view for this project?
 * Avoids redundant network requests on page reloads or return visits.
 */
export function hasViewedProjectLocally(projectId: string): boolean {
  if (typeof window === 'undefined' || !projectId) return false
  try {
    return localStorage.getItem(VIEWED_PREFIX + projectId) === '1'
  } catch {
    return false
  }
}

/**
 * Marks a project as viewed in this browser's local storage.
 * MUST only be invoked after a successful server confirmation.
 */
export function markProjectViewedLocally(projectId: string): void {
  if (typeof window === 'undefined' || !projectId) return
  try {
    localStorage.setItem(VIEWED_PREFIX + projectId, '1')
  } catch {}
}
