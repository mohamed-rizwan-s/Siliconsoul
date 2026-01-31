/**
 * Theme Toggle Module
 * Handles dark/light mode switching with localStorage persistence
 */

(function() {
  'use strict';

  // Theme configuration
  const THEME_KEY = 'blog-theme';
  const THEME_LIGHT = 'light';
  const THEME_DARK = 'dark';

  /**
   * Get the current theme from localStorage or system preference
   * @returns {string} 'light' or 'dark'
   */
  function getTheme() {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === THEME_LIGHT || stored === THEME_DARK) {
      return stored;
    }
    
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEME_DARK;
    }
    
    return THEME_LIGHT;
  }

  /**
   * Apply the theme to the document
   * @param {string} theme - 'light' or 'dark'
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Save theme to localStorage
   * @param {string} theme - 'light' or 'dark'
   */
  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
    
    applyTheme(newTheme);
    saveTheme(newTheme);
  }

  /**
   * Initialize theme toggle functionality
   */
  function init() {
    // Apply initial theme (before page renders to prevent flash)
    applyTheme(getTheme());

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupToggle);
    } else {
      setupToggle();
    }
  }

  /**
   * Setup the toggle button event listener
   */
  function setupToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only apply if user hasn't manually set a preference
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
        }
      });
    }
  }

  // Initialize immediately
  init();
})();
