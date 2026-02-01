/**
 * Search Module
 * Client-side search using prebuilt JSON index
 */

(function() {
  'use strict';

  // Search configuration - use relative path for GitHub Pages compatibility
  const SEARCH_INDEX_URL = 'search-index.json';
  const DEBOUNCE_DELAY = 150;
  const MAX_RESULTS = 10;
  const HIGHLIGHT_LENGTH = 120;

  // State
  let searchIndex = [];
  let searchModal = null;
  let searchInput = null;
  let searchResults = null;
  let searchToggle = null;
  let debounceTimer = null;
  let isIndexLoaded = false;

  /**
   * Initialize search functionality
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupSearch);
    } else {
      setupSearch();
    }
  }

  /**
   * Setup search UI and event listeners
   */
  function setupSearch() {
    searchModal = document.getElementById('search-modal');
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');
    searchToggle = document.getElementById('search-toggle');

    if (!searchModal || !searchInput || !searchResults) {
      console.warn('Search elements not found');
      return;
    }

    // Toggle button
    if (searchToggle) {
      searchToggle.addEventListener('click', openSearch);
    }

    // Close on backdrop click
    const backdrop = searchModal.querySelector('.search-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeSearch);
    }

    // Input handling
    searchInput.addEventListener('input', handleInput);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);

    // Preload search index
    loadSearchIndex();
  }

  /**
   * Load the search index JSON
   */
  async function loadSearchIndex() {
    try {
      const response = await fetch(SEARCH_INDEX_URL);
      if (!response.ok) {
        throw new Error('Failed to load search index');
      }
      searchIndex = await response.json();
      isIndexLoaded = true;
    } catch (error) {
      console.error('Search index load error:', error);
      searchIndex = [];
    }
  }

  /**
   * Open the search modal
   */
  function openSearch() {
    if (!searchModal) return;
    
    searchModal.classList.add('active');
    searchModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus input after animation
    setTimeout(() => {
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }, 50);
  }

  /**
   * Close the search modal
   */
  function closeSearch() {
    if (!searchModal) return;
    
    searchModal.classList.remove('active');
    searchModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    if (searchInput) {
      searchInput.value = '';
    }
    if (searchResults) {
      searchResults.innerHTML = '';
    }
  }

  /**
   * Handle search input with debouncing
   */
  function handleInput() {
    clearTimeout(debounceTimer);
    
    const query = searchInput.value.trim();
    
    if (!query) {
      searchResults.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_DELAY);
  }

  /**
   * Perform the search
   * @param {string} query - Search query
   */
  function performSearch(query) {
    if (!isIndexLoaded || !searchIndex.length) {
      searchResults.innerHTML = '<div class="search-empty">Search index loading...</div>';
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const results = searchIndex
      .map(item => {
        const score = calculateScore(item, normalizedQuery);
        return { item, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(result => result.item);

    renderResults(results, query);
  }

  /**
   * Calculate search score for an item
   * @param {Object} item - Search index item
   * @param {string} query - Normalized query
   * @returns {number} Score (higher is better)
   */
  function calculateScore(item, query) {
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    const tags = (item.tags || []).join(' ').toLowerCase();

    // Title match (highest weight)
    if (title === query) {
      score += 100;
    } else if (title.startsWith(query)) {
      score += 80;
    } else if (title.includes(query)) {
      score += 60;
    }

    // Tag match
    if (tags.includes(query)) {
      score += 40;
    }

    // Description match
    if (description.includes(query)) {
      score += 30;
    }

    // Content match
    if (content.includes(query)) {
      score += 20;
    }

    return score;
  }

  /**
   * Render search results
   * @param {Array} results - Search results
   * @param {string} query - Original query for highlighting
   */
  function renderResults(results, query) {
    if (!results.length) {
      searchResults.innerHTML = '<div class="search-empty">No results found</div>';
      return;
    }

    const html = results.map(item => {
      const excerpt = createExcerpt(item.content || item.description || '', query);
      const date = item.date ? formatDate(item.date) : '';
      
      return `
        <a href="${item.url}" class="search-result-item">
          <span class="search-result-title">${escapeHtml(item.title)}</span>
          <span class="search-result-excerpt">${escapeHtml(excerpt)}</span>
          <span class="search-result-meta">
            ${date ? `<time>${escapeHtml(date)}</time>` : ''}
            ${item.readingTime ? `• ${item.readingTime} min read` : ''}
          </span>
        </a>
      `;
    }).join('');

    searchResults.innerHTML = html;
  }

  /**
   * Create excerpt with query context
   * @param {string} content - Full content
   * @param {string} query - Search query
   * @returns {string} Excerpt
   */
  function createExcerpt(content, query) {
    const normalizedContent = content.toLowerCase();
    const queryIndex = normalizedContent.indexOf(query.toLowerCase());
    
    let start = 0;
    if (queryIndex !== -1) {
      start = Math.max(0, queryIndex - HIGHLIGHT_LENGTH / 2);
    }
    
    let excerpt = content.slice(start, start + HIGHLIGHT_LENGTH);
    
    if (start > 0) {
      excerpt = '...' + excerpt;
    }
    if (start + HIGHLIGHT_LENGTH < content.length) {
      excerpt = excerpt + '...';
    }
    
    return excerpt;
  }

  /**
   * Format date string
   * @param {string} dateStr - ISO date string
   * @returns {string} Formatted date
   */
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Raw text
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeydown(e) {
    // Close on Escape
    if (e.key === 'Escape' && searchModal?.classList.contains('active')) {
      closeSearch();
      return;
    }

    // Open on Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModal?.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
      return;
    }

    // Navigate results with arrow keys
    if (searchModal?.classList.contains('active')) {
      const items = searchResults?.querySelectorAll('.search-result-item');
      if (!items?.length) return;

      const activeElement = document.activeElement;
      const currentIndex = Array.from(items).indexOf(activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].focus();
      } else if (e.key === 'Enter' && currentIndex !== -1) {
        e.preventDefault();
        items[currentIndex].click();
      }
    }
  }

  // Initialize
  init();
})();
