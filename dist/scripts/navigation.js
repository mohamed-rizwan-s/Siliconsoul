/**
 * Navigation Module
 * Handles mobile menu, smooth scrolling, and navigation interactions
 */

(function() {
  'use strict';

  // State
  let mobileMenuToggle = null;
  let navbarNav = null;
  let isMenuOpen = false;

  /**
   * Initialize navigation
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupNavigation);
    } else {
      setupNavigation();
    }
  }

  /**
   * Setup navigation elements and event listeners
   */
  function setupNavigation() {
    mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    navbarNav = document.getElementById('navbar-nav');

    if (mobileMenuToggle && navbarNav) {
      mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close menu on window resize (if going to desktop)
    window.addEventListener('resize', handleResize);

    // Close menu when clicking outside
    document.addEventListener('click', handleClickOutside);

    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    // Add loaded class to lazy images
    setupLazyImages();
  }

  /**
   * Toggle mobile menu
   */
  function toggleMobileMenu() {
    isMenuOpen = !isMenuOpen;
    
    if (isMenuOpen) {
      navbarNav.classList.add('mobile-open');
      mobileMenuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      navbarNav.classList.remove('mobile-open');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  /**
   * Close mobile menu
   */
  function closeMobileMenu() {
    if (isMenuOpen) {
      isMenuOpen = false;
      navbarNav.classList.remove('mobile-open');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  /**
   * Handle window resize
   */
  function handleResize() {
    // Close mobile menu when resizing to desktop
    if (window.innerWidth >= 768 && isMenuOpen) {
      closeMobileMenu();
    }
  }

  /**
   * Handle clicks outside the mobile menu
   * @param {MouseEvent} e - Click event
   */
  function handleClickOutside(e) {
    if (isMenuOpen && !navbarNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      closeMobileMenu();
    }
  }

  /**
   * Handle anchor link clicks (smooth scroll)
   * @param {MouseEvent} e - Click event
   */
  function handleAnchorClick(e) {
    const href = this.getAttribute('href');
    
    // Skip if it's just "#"
    if (href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Update URL without jumping
      history.pushState(null, '', href);
    }
  }

  /**
   * Setup lazy image loading
   */
  function setupLazyImages() {
    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });

      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // Fallback: load all images immediately
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.classList.add('loaded');
      });
    }

    // Also handle images that are already loaded
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'));
      }
    });
  }

  // Initialize
  init();
})();
