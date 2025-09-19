// Build fingerprinting for cache debugging
export const BUILD_INFO = {
  commit: import.meta.env.VITE_GIT_SHA ?? "__unknown__",
  builtAt: new Date(import.meta.env.VITE_BUILD_TIME ?? Date.now()).toISOString(),
  version: "v2.1.0-admin-invite-only",
  timestamp: Date.now()
};

// Make build info globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).__BUILD_INFO__ = BUILD_INFO;
}