// Runs while the page is still being parsed, before anything paints, so a pinned theme never
// flashes the other one. The key matches the one in src/lib/theme.svelte.ts.
try {
  const theme = localStorage.getItem('freal.theme');
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.dataset.theme = theme;
  }
} catch {
  // Storage can be unavailable; the OS preference applies.
}
