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
    // Add fade-in on page load
    this.fadeIn();
  }

  fadeOut() {
    return new Promise((resolve) => {
      // Create overlay for fade effect - fade to BLACK
      const overlay = document.createElement('div');
      overlay.id = 'page-transition-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        z-index: 99999;
        pointer-events: auto;
        transition: background ${this.transitionDuration}ms ease-out;
      `;
      
      document.body.appendChild(overlay);
      
      // Force black background immediately, then fade
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.style.background = 'rgba(0, 0, 0, 1)';
          setTimeout(() => {
            resolve();
          }, this.transitionDuration);
        });
      });
    });
  }

  fadeIn() {
    // Check if we came from a transition (stored in sessionStorage)
    const fromTransition = sessionStorage.getItem('pageTransition') === 'true';
    
    if (fromTransition) {
      // Clear the flag
      sessionStorage.removeItem('pageTransition');
      
      // Create overlay starting from black
      const overlay = document.createElement('div');
      overlay.id = 'page-transition-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 1);
        z-index: 99999;
        pointer-events: none;
        transition: background ${this.transitionDuration}ms ease-out;
      `;
      
      document.body.appendChild(overlay);
      
      // Fade in from black to transparent
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.style.background = 'rgba(0, 0, 0, 0)';
          setTimeout(() => {
            overlay.remove();
          }, this.transitionDuration);
        });
      });
    }
  }

  navigateWithTransition(url) {
    // Store flag in sessionStorage for fade-in on next page
    sessionStorage.setItem('pageTransition', 'true');
    
    // Fade out current page to black
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
