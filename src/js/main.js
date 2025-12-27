/**
 * Main JavaScript Module - Hero Section Interactions
 * 
 * Implements:
 * - Smooth scrolling for CTA buttons
 * - Lazy loading for background images
 * - Analytics event tracking for button clicks
 * - Intersection Observer for performance optimization
 * 
 * @generated-from: task-id:TASK-002
 * @modifies: hero-section interactions
 * @dependencies: []
 */

(function initializeHeroSection() {
  'use strict';

  // ============================================
  // Configuration & Constants
  // ============================================

  const CONFIG = Object.freeze({
    SCROLL_BEHAVIOR: 'smooth',
    SCROLL_OFFSET: 80,
    LAZY_LOAD_THRESHOLD: '50px',
    ANALYTICS_DEBOUNCE_MS: 300,
    INTERSECTION_THRESHOLD: 0.1,
    ERROR_LOG_PREFIX: '[Hero Section]',
  });

  const SELECTORS = Object.freeze({
    HERO_SECTION: '.hero-section',
    HERO_BACKGROUND: '.hero-background',
    CTA_BUTTONS: '.hero-cta-button',
    PRIMARY_CTA: '.hero-cta-button--primary',
    SECONDARY_CTA: '.hero-cta-button--secondary',
  });

  const ANALYTICS_EVENTS = Object.freeze({
    CTA_CLICK: 'hero_cta_click',
    HERO_VIEW: 'hero_section_view',
    BACKGROUND_LOADED: 'hero_background_loaded',
  });

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Logs structured messages with context
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  function log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: `${CONFIG.ERROR_LOG_PREFIX} ${message}`,
      ...context,
    };

    if (level === 'error') {
      console.error(logEntry);
    } else if (level === 'warn') {
      console.warn(logEntry);
    } else {
      console.log(logEntry);
    }
  }

  /**
   * Creates a debounced version of a function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Debounce delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeoutId = null;

    return function debounced(...args) {
      const context = this;

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        timeoutId = null;
        func.apply(context, args);
      }, wait);
    };
  }

  /**
   * Safely queries a single DOM element
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} Found element or null
   */
  function querySelector(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      log('error', `Invalid selector: ${selector}`, { error: error.message });
      return null;
    }
  }

  /**
   * Safely queries multiple DOM elements
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element[]} Array of found elements
   */
  function querySelectorAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      log('error', `Invalid selector: ${selector}`, { error: error.message });
      return [];
    }
  }

  // ============================================
  // Analytics Module
  // ============================================

  const Analytics = (function createAnalyticsModule() {
    /**
     * Tracks an analytics event
     * @param {string} eventName - Event name
     * @param {Object} eventData - Event data
     */
    function trackEvent(eventName, eventData = {}) {
      try {
        const payload = {
          event: eventName,
          timestamp: Date.now(),
          url: window.location.href,
          ...eventData,
        };

        log('info', `Analytics event tracked: ${eventName}`, payload);

        // Integration point for analytics services (Google Analytics, Mixpanel, etc.)
        if (typeof window.gtag === 'function') {
          window.gtag('event', eventName, eventData);
        }

        if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
          window.dataLayer.push(payload);
        }
      } catch (error) {
        log('error', 'Failed to track analytics event', {
          eventName,
          error: error.message,
        });
      }
    }

    const debouncedTrackEvent = debounce(trackEvent, CONFIG.ANALYTICS_DEBOUNCE_MS);

    return Object.freeze({
      trackEvent,
      trackEventDebounced: debouncedTrackEvent,
    });
  })();

  // ============================================
  // Smooth Scroll Module
  // ============================================

  const SmoothScroll = (function createSmoothScrollModule() {
    /**
     * Calculates the target scroll position with offset
     * @param {Element} targetElement - Target element to scroll to
     * @returns {number} Calculated scroll position
     */
    function calculateScrollPosition(targetElement) {
      const elementRect = targetElement.getBoundingClientRect();
      const absoluteTop = elementRect.top + window.pageYOffset;
      return absoluteTop - CONFIG.SCROLL_OFFSET;
    }

    /**
     * Scrolls to a target element smoothly
     * @param {string} targetSelector - CSS selector or hash
     * @returns {boolean} Success status
     */
    function scrollToTarget(targetSelector) {
      try {
        const cleanSelector = targetSelector.startsWith('#')
          ? targetSelector
          : `#${targetSelector}`;

        const targetElement = querySelector(cleanSelector);

        if (!targetElement) {
          log('warn', `Scroll target not found: ${cleanSelector}`);
          return false;
        }

        const scrollPosition = calculateScrollPosition(targetElement);

        window.scrollTo({
          top: scrollPosition,
          behavior: CONFIG.SCROLL_BEHAVIOR,
        });

        log('info', 'Smooth scroll executed', {
          target: cleanSelector,
          position: scrollPosition,
        });

        return true;
      } catch (error) {
        log('error', 'Smooth scroll failed', {
          target: targetSelector,
          error: error.message,
        });
        return false;
      }
    }

    /**
     * Handles click events for smooth scrolling
     * @param {Event} event - Click event
     */
    function handleSmoothScrollClick(event) {
      const anchor = event.currentTarget;
      const href = anchor.getAttribute('href');

      if (!href || !href.startsWith('#')) {
        return;
      }

      event.preventDefault();

      const targetId = href.substring(1);
      const scrollSuccess = scrollToTarget(targetId);

      if (scrollSuccess) {
        // Update URL hash without jumping
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', href);
        }
      }
    }

    /**
     * Initializes smooth scrolling for CTA buttons
     */
    function initialize() {
      const ctaButtons = querySelectorAll(SELECTORS.CTA_BUTTONS);

      if (ctaButtons.length === 0) {
        log('warn', 'No CTA buttons found for smooth scroll initialization');
        return;
      }

      ctaButtons.forEach((button) => {
        const href = button.getAttribute('href');

        if (href && href.startsWith('#')) {
          button.addEventListener('click', handleSmoothScrollClick);
          log('info', 'Smooth scroll attached to button', { href });
        }
      });

      log('info', `Smooth scroll initialized for ${ctaButtons.length} buttons`);
    }

    return Object.freeze({
      initialize,
      scrollToTarget,
    });
  })();

  // ============================================
  // Lazy Loading Module
  // ============================================

  const LazyLoader = (function createLazyLoaderModule() {
    let observer = null;

    /**
     * Loads the actual image source
     * @param {HTMLImageElement} imageElement - Image element to load
     */
    function loadImage(imageElement) {
      const dataSrc = imageElement.getAttribute('data-src');

      if (!dataSrc) {
        log('warn', 'Image missing data-src attribute', {
          element: imageElement.className,
        });
        return;
      }

      const img = new Image();

      img.onload = function handleImageLoad() {
        imageElement.src = dataSrc;
        imageElement.classList.add('loaded');
        imageElement.removeAttribute('data-src');

        Analytics.trackEvent(ANALYTICS_EVENTS.BACKGROUND_LOADED, {
          src: dataSrc,
          loadTime: performance.now(),
        });

        log('info', 'Background image loaded successfully', { src: dataSrc });
      };

      img.onerror = function handleImageError() {
        log('error', 'Failed to load background image', { src: dataSrc });
        imageElement.classList.add('load-error');
      };

      img.src = dataSrc;
    }

    /**
     * Intersection Observer callback
     * @param {IntersectionObserverEntry[]} entries - Observed entries
     */
    function handleIntersection(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const imageElement = entry.target;
          loadImage(imageElement);

          if (observer) {
            observer.unobserve(imageElement);
          }
        }
      });
    }

    /**
     * Initializes lazy loading for background images
     */
    function initialize() {
      const backgroundImage = querySelector(SELECTORS.HERO_BACKGROUND);

      if (!backgroundImage) {
        log('warn', 'Hero background image not found');
        return;
      }

      // Check if Intersection Observer is supported
      if (!('IntersectionObserver' in window)) {
        log('warn', 'IntersectionObserver not supported, loading image immediately');
        loadImage(backgroundImage);
        return;
      }

      try {
        observer = new IntersectionObserver(handleIntersection, {
          rootMargin: CONFIG.LAZY_LOAD_THRESHOLD,
          threshold: CONFIG.INTERSECTION_THRESHOLD,
        });

        observer.observe(backgroundImage);
        log('info', 'Lazy loading initialized for hero background');
      } catch (error) {
        log('error', 'Failed to initialize lazy loading', {
          error: error.message,
        });
        loadImage(backgroundImage);
      }
    }

    /**
     * Cleanup function
     */
    function destroy() {
      if (observer) {
        observer.disconnect();
        observer = null;
        log('info', 'Lazy loader destroyed');
      }
    }

    return Object.freeze({
      initialize,
      destroy,
    });
  })();

  // ============================================
  // CTA Button Tracking Module
  // ============================================

  const CTATracking = (function createCTATrackingModule() {
    /**
     * Handles CTA button click events
     * @param {Event} event - Click event
     */
    function handleCTAClick(event) {
      const button = event.currentTarget;
      const buttonText = button.textContent.trim();
      const buttonHref = button.getAttribute('href');
      const buttonType = button.classList.contains('hero-cta-button--primary')
        ? 'primary'
        : 'secondary';

      Analytics.trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
        buttonText,
        buttonHref,
        buttonType,
        timestamp: Date.now(),
      });

      log('info', 'CTA button clicked', {
        buttonText,
        buttonHref,
        buttonType,
      });
    }

    /**
     * Initializes CTA button tracking
     */
    function initialize() {
      const ctaButtons = querySelectorAll(SELECTORS.CTA_BUTTONS);

      if (ctaButtons.length === 0) {
        log('warn', 'No CTA buttons found for tracking initialization');
        return;
      }

      ctaButtons.forEach((button) => {
        button.addEventListener('click', handleCTAClick);
      });

      log('info', `CTA tracking initialized for ${ctaButtons.length} buttons`);
    }

    return Object.freeze({
      initialize,
    });
  })();

  // ============================================
  // Hero Section Visibility Tracking
  // ============================================

  const VisibilityTracking = (function createVisibilityTrackingModule() {
    let hasTrackedView = false;
    let observer = null;

    /**
     * Handles hero section visibility
     * @param {IntersectionObserverEntry[]} entries - Observed entries
     */
    function handleVisibility(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasTrackedView) {
          hasTrackedView = true;

          Analytics.trackEvent(ANALYTICS_EVENTS.HERO_VIEW, {
            timestamp: Date.now(),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          });

          log('info', 'Hero section viewed');

          if (observer) {
            observer.disconnect();
          }
        }
      });
    }

    /**
     * Initializes visibility tracking
     */
    function initialize() {
      const heroSection = querySelector(SELECTORS.HERO_SECTION);

      if (!heroSection) {
        log('warn', 'Hero section not found for visibility tracking');
        return;
      }

      if (!('IntersectionObserver' in window)) {
        log('warn', 'IntersectionObserver not supported for visibility tracking');
        Analytics.trackEvent(ANALYTICS_EVENTS.HERO_VIEW, {
          timestamp: Date.now(),
          fallback: true,
        });
        return;
      }

      try {
        observer = new IntersectionObserver(handleVisibility, {
          threshold: CONFIG.INTERSECTION_THRESHOLD,
        });

        observer.observe(heroSection);
        log('info', 'Visibility tracking initialized');
      } catch (error) {
        log('error', 'Failed to initialize visibility tracking', {
          error: error.message,
        });
      }
    }

    return Object.freeze({
      initialize,
    });
  })();

  // ============================================
  // Main Initialization
  // ============================================

  /**
   * Initializes all hero section modules
   */
  function initializeAll() {
    try {
      log('info', 'Initializing hero section modules');

      SmoothScroll.initialize();
      LazyLoader.initialize();
      CTATracking.initialize();
      VisibilityTracking.initialize();

      log('info', 'Hero section initialization complete');
    } catch (error) {
      log('error', 'Critical error during initialization', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // ============================================
  // DOM Ready Handler
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll);
  } else {
    initializeAll();
  }

  // ============================================
  // Cleanup on Page Unload
  // ============================================

  window.addEventListener('beforeunload', () => {
    LazyLoader.destroy();
    log('info', 'Hero section cleanup complete');
  });
})();