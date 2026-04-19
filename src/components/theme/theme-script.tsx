/**
 * Inline script that applies the user's theme preference BEFORE the page paints.
 * Must run synchronously in <head> (injected by layout.tsx as a dangerouslySetInnerHTML
 * <script>) to prevent a flash of wrong theme.
 */
export const THEME_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem("lawris-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored === "dark" || (stored !== "light" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) { /* no-op */ }
})();
`.trim();
