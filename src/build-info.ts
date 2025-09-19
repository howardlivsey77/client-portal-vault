// Build fingerprinting for cache debugging
export const BUILD_INFO = Object.freeze({
  commit: import.meta.env.VITE_GIT_SHA ?? "__unknown__",
  builtAt: import.meta.env.VITE_BUILD_TIME ?? "__unknown__",
  version: "v2.1.0-admin-invite-only",
});

// Make build info globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).__BUILD_INFO__ = {
    ...BUILD_INFO,
    loadedAt: new Date().toISOString(),
  };
}