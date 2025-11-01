/**
 * Page Transition Manager
 * Provides smooth fade animations when navigating between pages
 */

class PageTransitionManager {
  constructor() {
    this.transitionDuration = 400; // 400ms for fade out
    this.init();
  }

  init() {
    // Intercept all navigation
    this.interceptNavigation();
    
    // Add fade-in on page load
    this.fadeIn();
  }

  interceptNavigation() {
    // Override window.location.href setter
    let originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      get: function() {
        return originalLocation;
      },
      set: function(url) {
        if (typeof url === 'string' && url !== window.location.href) {
          // Check if it's an internal navigation
          if (!url.startsWith('http') && !url.startsWith('#') && !url.startsWith('javascript:')) {
            window.pageTransitionManager?.navigateWithTransition(url);
            return;
          }
        }
        originalLocation.href = url;
      }
    });

    // Intercept direct location.href assignments
    const originalHrefSetter = Object.getOwnPropertyDescriptor(window.location, 'href').set;
    Object.defineProperty(window.location, 'href', {
      set: function(url) {
        if (typeof url === 'string' && url !== window.location.href) {
          // Check if it's an internal navigation
          if (!url.startsWith('http') && !url.startsWith('#') && !url.startsWith('javascript:')) {
            window.pageTransitionManager?.navigateWithTransition(url);
            return;
          }
        }
        originalHrefSetter.call(window.location, url);
      },
      get: function() {
        return originalLocation.href;
      }
    });
  }

  fadeOut() {
    return new Promise((resolve) => {
      // Create overlay for fade effect
      const overlay = document.createElement('div');
      overlay.id = 'page-transition-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        z-index: 10000;
        pointer-events: none;
        transition: background ${this.transitionDuration}ms ease-out;
      `;
      
      document.body.appendChild(overlay);
      
      // Trigger fade
      requestAnimationFrame(() => {
        overlay.style.background = 'rgba(0, 0, 0, 1)';
      });
      
      setTimeout(() => {
        resolve();
      }, this.transitionDuration);
    });
  }

  fadeIn() {
    // Check if we came from a transition
    const overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
      // Fade in from black
      overlay.style.transition = `background ${this.transitionDuration}ms ease-out`;
      overlay.style.background = 'rgba(0, 0, 0, 1)';
      
      requestAnimationFrame(() => {
        overlay.style.background = 'rgba(0, 0, 0, 0)';
        setTimeout(() => {
          overlay.remove();
        }, this.transitionDuration);
      });
    } else {
      // Create initial fade-in overlay
      const initialOverlay = document.createElement('div');
      initialOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 1);
        z-index: 10000;
        pointer-events: none;
        transition: opacity ${this.transitionDuration}ms ease-out;
      `;
      
      document.body.appendChild(initialOverlay);
      
      requestAnimationFrame(() => {
        initialOverlay.style.opacity = '0';
        setTimeout(() => {
          initialOverlay.remove();
        }, this.transitionDuration);
      });
    }
  }

  navigateWithTransition(url) {
    // Store URL in sessionStorage for fade-in on next page
    sessionStorage.setItem('pageTransition', 'true');
    
    // Fade out current page
    this.fadeOut().then(() => {
      // Navigate after fade completes
      window.location.href = url;
    });
  }
}

// Helper function for programmatic navigation
window.navigateWithTransition = function(url) {
  if (window.pageTransitionManager) {
    window.pageTransitionManager.navigateWithTransition(url);
  } else {
    window.location.href = url;
  }
};

// Initialize transition manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pageTransitionManager = new PageTransitionManager();
  });
} else {
  window.pageTransitionManager = new PageTransitionManager();
}

export { PageTransitionManager };
