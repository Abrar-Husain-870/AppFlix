/**
 * lib/visitor.ts
 *
 * Generates a privacy-friendly anonymous visitor ID on first visit.
 * Stored in localStorage — no fingerprinting, no IP tracking, no third-party SDK.
 *
 * Stable across page refreshes in the same browser.
 * Resets if user clears localStorage (intentional — respects user privacy).
 */
export function getVisitorId(): string {
  // Guard: localStorage is not available in SSR / server components.
  // Call this only from client components or event handlers.
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("visitor_id");

  if (!id) {
    // crypto.randomUUID() is supported in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+).
    // Fallback covers rare edge cases (old WebViews, some older mobile browsers).
    id =
      crypto.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem("visitor_id", id);
  }

  return id;
}
