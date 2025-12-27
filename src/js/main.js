/**
 * Main JavaScript Module - Hero Section Interactions
 * 
 * Implements:
 * - Smooth scrolling for CTA buttons
 * - Lazy loading for background images
 * - Analytics event tracking for button clicks
 * - Intersection Observer for performance optimization
 * - Program card interactions and keyboard navigation
 * - Contact form validation and submission handling
 * 
 * @generated-from: task-id:TASK-002, task-id:735be9ca-de2a-4d3e-8d57-44ce50f6d27b, task-id:1bc3bb18-5c9a-4a4b-b31a-06119fdfedfe
 * @modifies: hero-section interactions, programs-section interactions, contact-form interactions
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
    PROGRAM_CARD_FOCUS_CLASS: 'program-card--focused',
    PROGRAM_CARD_ACTIVE_CLASS: 'program-card--active',
    FORM_SUBMIT_TIMEOUT_MS: 10000,
  });

  const SELECTORS = Object.freeze({
    HERO_SECTION: '.hero-section',
    HERO_BACKGROUND: '.hero-background',
    CTA_BUTTONS: '.hero-cta-button',
    PRIMARY_CTA: '.hero-cta-button--primary',
    SECONDARY_CTA: '.hero-cta-button--secondary',
    PROGRAM_CARDS: '.program-card',
    PROGRAMS_SECTION: '.programs-section',
    CONTACT_FORM: '.contact-form',
    FORM_GROUPS: '.form-group',
    FORM_SUBMIT_BUTTON: '.form-submit-button',
    FORM_ERROR: '.form-error',
  });

  const ANALYTICS_EVENTS = Object.freeze({
    CTA_CLICK: 'hero_cta_click',
    HERO_VIEW: 'hero_section_view',
    BACKGROUND_LOADED: 'hero_background_loaded',
    PROGRAM_CARD_CLICK: 'program_card_click',
    PROGRAM_CARD_HOVER: 'program_card_hover',
    PROGRAM_CARD_FOCUS: 'program_card_focus',
    PROGRAMS_SECTION_VIEW: 'programs_section_view',
    FORM_SUBMIT_START: 'contact_form_submit_start',
    FORM_SUBMIT_SUCCESS: 'contact_form_submit_success',
    FORM_SUBMIT_ERROR: 'contact_form_submit_error',
    FORM_VALIDATION_ERROR: 'contact_form_validation_error',
  });

  const VALIDATION_PATTERNS = Object.freeze({
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\d\s\-+()]+$/,
    NAME: /^[a-zA-Z\s'-]{2,}$/,
  });

  const ERROR_MESSAGES = Object.freeze({
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_NAME: 'Please enter a valid name (at least 2 characters)',
    MESSAGE_TOO_SHORT: 'Message must be at least 10 characters',
    SUBMISSION_FAILED: 'Failed to send message. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
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
  // Program Cards Interaction Module
  // ============================================

  const ProgramCards = (function createProgramCardsModule() {
    /**
     * Extracts program card metadata
     * @param {Element} card - Program card element
     * @returns {Object} Card metadata
     */
    function getCardMetadata(card) {
      const titleElement = card.querySelector('h3');
      const descriptionElement = card.querySelector('.program-description');
      
      return {
        title: titleElement ? titleElement.textContent.trim() : 'Unknown',
        description: descriptionElement ? descriptionElement.textContent.trim().substring(0, 100) : '',
        index: Array.from(card.parentElement.children).indexOf(card),
      };
    }

    /**
     * Handles program card click events
     * @param {Event} event - Click event
     */
    function handleCardClick(event) {
      const card = event.currentTarget;
      const metadata = getCardMetadata(card);

      card.classList.add(CONFIG.PROGRAM_CARD_ACTIVE_CLASS);
      setTimeout(() => {
        card.classList.remove(CONFIG.PROGRAM_CARD_ACTIVE_CLASS);
      }, 200);

      Analytics.trackEvent(ANALYTICS_EVENTS.PROGRAM_CARD_CLICK, {
        ...metadata,
        timestamp: Date.now(),
      });

      log('info', 'Program card clicked', metadata);
    }

    /**
     * Handles program card hover events
     * @param {Event} event - Mouse enter event
     */
    function handleCardHover(event) {
      const card = event.currentTarget;
      const metadata = getCardMetadata(card);

      Analytics.trackEventDebounced(ANALYTICS_EVENTS.PROGRAM_CARD_HOVER, {
        ...metadata,
        timestamp: Date.now(),
      });

      log('info', 'Program card hovered', metadata);
    }

    /**
     * Handles program card focus events
     * @param {Event} event - Focus event
     */
    function handleCardFocus(event) {
      const card = event.currentTarget;
      const metadata = getCardMetadata(card);

      card.classList.add(CONFIG.PROGRAM_CARD_FOCUS_CLASS);

      Analytics.trackEvent(ANALYTICS_EVENTS.PROGRAM_CARD_FOCUS, {
        ...metadata,
        timestamp: Date.now(),
      });

      log('info', 'Program card focused', metadata);
    }

    /**
     * Handles program card blur events
     * @param {Event} event - Blur event
     */
    function handleCardBlur(event) {
      const card = event.currentTarget;
      card.classList.remove(CONFIG.PROGRAM_CARD_FOCUS_CLASS);
    }

    /**
     * Handles keyboard navigation for program cards
     * @param {Event} event - Keydown event
     */
    function handleCardKeydown(event) {
      const card = event.currentTarget;
      const cards = querySelectorAll(SELECTORS.PROGRAM_CARDS);
      const currentIndex = cards.indexOf(card);

      let targetIndex = -1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          targetIndex = (currentIndex + 1) % cards.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          targetIndex = (currentIndex - 1 + cards.length) % cards.length;
          break;
        case 'Home':
          event.preventDefault();
          targetIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          targetIndex = cards.length - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleCardClick(event);
          return;
        default:
          return;
      }

      if (targetIndex !== -1 && cards[targetIndex]) {
        cards[targetIndex].focus();
      }
    }

    /**
     * Makes program cards keyboard accessible
     * @param {Element} card - Program card element
     */
    function makeCardAccessible(card) {
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }

      if (!card.hasAttribute('role')) {
        card.setAttribute('role', 'button');
      }

      const titleElement = card.querySelector('h3');
      if (titleElement && !card.hasAttribute('aria-label')) {
        card.setAttribute('aria-label', `View details for ${titleElement.textContent.trim()}`);
      }
    }

    /**
     * Initializes program card interactions
     */
    function initialize() {
      const programCards = querySelectorAll(SELECTORS.PROGRAM_CARDS);

      if (programCards.length === 0) {
        log('warn', 'No program cards found for interaction initialization');
        return;
      }

      programCards.forEach((card) => {
        makeCardAccessible(card);

        card.addEventListener('click', handleCardClick);
        card.addEventListener('mouseenter', handleCardHover);
        card.addEventListener('focus', handleCardFocus);
        card.addEventListener('blur', handleCardBlur);
        card.addEventListener('keydown', handleCardKeydown);
      });

      log('info', `Program card interactions initialized for ${programCards.length} cards`);
    }

    return Object.freeze({
      initialize,
    });
  })();

  // ============================================
  // Programs Section Visibility Tracking
  // ============================================

  const ProgramsVisibilityTracking = (function createProgramsVisibilityTrackingModule() {
    let hasTrackedView = false;
    let observer = null;

    /**
     * Handles programs section visibility
     * @param {IntersectionObserverEntry[]} entries - Observed entries
     */
    function handleVisibility(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasTrackedView) {
          hasTrackedView = true;

          Analytics.trackEvent(ANALYTICS_EVENTS.PROGRAMS_SECTION_VIEW, {
            timestamp: Date.now(),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          });

          log('info', 'Programs section viewed');

          if (observer) {
            observer.disconnect();
          }
        }
      });
    }

    /**
     * Initializes programs section visibility tracking
     */
    function initialize() {
      const programsSection = querySelector(SELECTORS.PROGRAMS_SECTION);

      if (!programsSection) {
        log('warn', 'Programs section not found for visibility tracking');
        return;
      }

      if (!('IntersectionObserver' in window)) {
        log('warn', 'IntersectionObserver not supported for programs visibility tracking');
        Analytics.trackEvent(ANALYTICS_EVENTS.PROGRAMS_SECTION_VIEW, {
          timestamp: Date.now(),
          fallback: true,
        });
        return;
      }

      try {
        observer = new IntersectionObserver(handleVisibility, {
          threshold: CONFIG.INTERSECTION_THRESHOLD,
        });

        observer.observe(programsSection);
        log('info', 'Programs section visibility tracking initialized');
      } catch (error) {
        log('error', 'Failed to initialize programs visibility tracking', {
          error: error.message,
        });
      }
    }

    return Object.freeze({
      initialize,
    });
  })();

  // ============================================
  // Contact Form Validation Module
  // ============================================

  const ContactFormValidation = (function createContactFormValidationModule() {
    /**
     * Validates a single form field
     * @param {HTMLInputElement|HTMLTextAreaElement} field - Form field to validate
     * @returns {Object} Validation result with isValid and errorMessage
     */
    function validateField(field) {
      const value = field.value.trim();
      const fieldName = field.name;
      const isRequired = field.hasAttribute('required');

      // Check required fields
      if (isRequired && !value) {
        return {
          isValid: false,
          errorMessage: ERROR_MESSAGES.REQUIRED,
        };
      }

      // Skip validation for optional empty fields
      if (!isRequired && !value) {
        return { isValid: true, errorMessage: '' };
      }

      // Field-specific validation
      switch (fieldName) {
        case 'name':
          if (!VALIDATION_PATTERNS.NAME.test(value)) {
            return {
              isValid: false,
              errorMessage: ERROR_MESSAGES.INVALID_NAME,
            };
          }
          break;

        case 'email':
          if (!VALIDATION_PATTERNS.EMAIL.test(value)) {
            return {
              isValid: false,
              errorMessage: ERROR_MESSAGES.INVALID_EMAIL,
            };
          }
          break;

        case 'phone':
          if (value && !VALIDATION_PATTERNS.PHONE.test(value)) {
            return {
              isValid: false,
              errorMessage: ERROR_MESSAGES.INVALID_PHONE,
            };
          }
          break;

        case 'message':
          if (value.length < 10) {
            return {
              isValid: false,
              errorMessage: ERROR_MESSAGES.MESSAGE_TOO_SHORT,
            };
          }
          break;

        default:
          break;
      }

      return { isValid: true, errorMessage: '' };
    }

    /**
     * Displays validation error for a field
     * @param {HTMLInputElement|HTMLTextAreaElement} field - Form field
     * @param {string} errorMessage - Error message to display
     */
    function showFieldError(field, errorMessage) {
      const formGroup = field.closest(SELECTORS.FORM_GROUPS);
      if (!formGroup) return;

      const errorElement = formGroup.querySelector(SELECTORS.FORM_ERROR);
      if (!errorElement) return;

      field.setAttribute('aria-invalid', 'true');
      errorElement.textContent = errorMessage;
      errorElement.style.display = 'block';
    }

    /**
     * Clears validation error for a field
     * @param {HTMLInputElement|HTMLTextAreaElement} field - Form field
     */
    function clearFieldError(field) {
      const formGroup = field.closest(SELECTORS.FORM_GROUPS);
      if (!formGroup) return;

      const errorElement = formGroup.querySelector(SELECTORS.FORM_ERROR);
      if (!errorElement) return;

      field.setAttribute('aria-invalid', 'false');
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    /**
     * Validates all form fields
     * @param {HTMLFormElement} form - Form element
     * @returns {boolean} True if all fields are valid
     */
    function validateForm(form) {
      const fields = Array.from(form.elements).filter(
        (element) => element.tagName === 'INPUT' || element.tagName === 'TEXTAREA'
      );

      let isFormValid = true;
      const errors = [];

      fields.forEach((field) => {
        const { isValid, errorMessage } = validateField(field);

        if (!isValid) {
          isFormValid = false;
          showFieldError(field, errorMessage);
          errors.push({
            field: field.name,
            error: errorMessage,
          });
        } else {
          clearFieldError(field);
        }
      });

      if (!isFormValid) {
        Analytics.trackEvent(ANALYTICS_EVENTS.FORM_VALIDATION_ERROR, {
          errors,
          timestamp: Date.now(),
        });

        log('warn', 'Form validation failed', { errors });
      }

      return isFormValid;
    }

    /**
     * Handles real-time field validation
     * @param {Event} event - Input or blur event
     */
    function handleFieldValidation(event) {
      const field = event.target;
      const { isValid, errorMessage } = validateField(field);

      if (!isValid) {
        showFieldError(field, errorMessage);
      } else {
        clearFieldError(field);
      }
    }

    return Object.freeze({
      validateForm,
      handleFieldValidation,
      clearFieldError,
    });
  })();

  // ============================================
  // Contact Form Submission Module
  // ============================================

  const ContactFormSubmission = (function createContactFormSubmissionModule() {
    /**
     * Sets form loading state
     * @param {HTMLFormElement} form - Form element
     * @param {boolean} isLoading - Loading state
     */
    function setFormLoadingState(form, isLoading) {
      const submitButton = form.querySelector(SELECTORS.FORM_SUBMIT_BUTTON);
      if (!submitButton) return;

      submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
      submitButton.disabled = isLoading;

      const formInputs = form.querySelectorAll('input, textarea');
      formInputs.forEach((input) => {
        input.disabled = isLoading;
      });
    }

    /**
     * Shows success message
     * @param {HTMLFormElement} form - Form element
     */
    function showSuccessMessage(form) {
      const successMessage = document.createElement('div');
      successMessage.className = 'form-success-message';
      successMessage.setAttribute('role', 'alert');
      successMessage.setAttribute('aria-live', 'polite');
      successMessage.textContent = 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.';
      successMessage.style.cssText = `
        padding: var(--space-md);
        margin-top: var(--space-lg);
        background-color: var(--color-success-50);
        color: var(--color-success-700);
        border: 2px solid var(--color-success-500);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
      `;

      form.appendChild(successMessage);

      setTimeout(() => {
        successMessage.remove();
      }, 10000);
    }

    /**
     * Shows error message
     * @param {HTMLFormElement} form - Form element
     * @param {string} message - Error message
     */
    function showErrorMessage(form, message) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'form-error-message';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.setAttribute('aria-live', 'assertive');
      errorMessage.textContent = message;
      errorMessage.style.cssText = `
        padding: var(--space-md);
        margin-top: var(--space-lg);
        background-color: var(--color-error-50);
        color: var(--color-error-700);
        border: 2px solid var(--color-error-500);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
      `;

      form.appendChild(errorMessage);

      setTimeout(() => {
        errorMessage.remove();
      }, 10000);
    }

    /**
     * Submits form data
     * @param {HTMLFormElement} form - Form element
     * @returns {Promise<boolean>} Success status
     */
    async function submitForm(form) {
      const formData = new FormData(form);
      const action = form.getAttribute('action');

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.FORM_SUBMIT_TIMEOUT_MS);

        const response = await fetch(action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }

    /**
     * Handles form submission
     * @param {Event} event - Submit event
     */
    async function handleFormSubmit(event) {
      event.preventDefault();

      const form = event.target;

      // Remove any existing messages
      const existingMessages = form.querySelectorAll('.form-success-message, .form-error-message');
      existingMessages.forEach((msg) => msg.remove());

      // Validate form
      if (!ContactFormValidation.validateForm(form)) {
        const firstInvalidField = form.querySelector('[aria-invalid="true"]');
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
        return;
      }

      // Track submission start
      Analytics.trackEvent(ANALYTICS_EVENTS.FORM_SUBMIT_START, {
        timestamp: Date.now(),
      });

      log('info', 'Form submission started');

      // Set loading state
      setFormLoadingState(form, true);

      try {
        // Submit form
        await submitForm(form);

        // Track success
        Analytics.trackEvent(ANALYTICS_EVENTS.FORM_SUBMIT_SUCCESS, {
          timestamp: Date.now(),
        });

        log('info', 'Form submitted successfully');

        // Show success message
        showSuccessMessage(form);

        // Reset form
        form.reset();

        // Clear any validation errors
        const fields = form.querySelectorAll('input, textarea');
        fields.forEach((field) => {
          ContactFormValidation.clearFieldError(field);
        });
      } catch (error) {
        // Track error
        Analytics.trackEvent(ANALYTICS_EVENTS.FORM_SUBMIT_ERROR, {
          error: error.message,
          timestamp: Date.now(),
        });

        log('error', 'Form submission failed', {
          error: error.message,
        });

        // Show error message
        const errorMessage = error.message.includes('timeout')
          ? ERROR_MESSAGES.NETWORK_ERROR
          : ERROR_MESSAGES.SUBMISSION_FAILED;

        showErrorMessage(form, errorMessage);
      } finally {
        // Reset loading state
        setFormLoadingState(form, false);
      }
    }

    return Object.freeze({
      handleFormSubmit,
    });
  })();

  // ============================================
  // Contact Form Module
  // ============================================

  const ContactForm = (function createContactFormModule() {
    /**
     * Initializes contact form validation and submission
     */
    function initialize() {
      const form = querySelector(SELECTORS.CONTACT_FORM);

      if (!form) {
        log('warn', 'Contact form not found');
        return;
      }

      // Attach submit handler
      form.addEventListener('submit', ContactFormSubmission.handleFormSubmit);

      // Attach real-time validation handlers
      const fields = form.querySelectorAll('input, textarea');
      fields.forEach((field) => {
        field.addEventListener('blur', ContactFormValidation.handleFieldValidation);
        field.addEventListener('input', debounce(ContactFormValidation.handleFieldValidation, 500));
      });

      log('info', 'Contact form initialized');
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
      ProgramCards.initialize();
      ProgramsVisibilityTracking.initialize();
      ContactForm.initialize();

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