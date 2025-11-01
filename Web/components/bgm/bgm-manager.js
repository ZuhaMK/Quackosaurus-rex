/**
 * Background Music Manager
 * Handles BGM playback with fade in/out effects and mute support
 */

class BGMManager {
  constructor() {
    this.currentBGM = null;
    this.fadeDuration = 2000; // 2 seconds for fade in/out
    this.targetVolume = 0.7; // Default volume (70%)
    this.isFading = false;
    
    // Initialize mute state if not already set
    if (typeof window.animaleseMuted === 'undefined') {
      window.animaleseMuted = false;
    }
  }

  /**
   * Play BGM with fade in effect
   * @param {string} audioPath - Path to the audio file
   * @param {number} volume - Target volume (0-1), default 0.7
   */
  play(audioPath, volume = 0.7) {
    // If same audio is already playing, don't restart
    if (this.currentBGM && this.currentBGM.src.endsWith(audioPath.split('/').pop())) {
      return;
    }

    // Fade out current BGM if playing
    if (this.currentBGM && !this.currentBGM.paused) {
      this.fadeOut(() => {
        this.startNewBGM(audioPath, volume);
      });
    } else {
      this.startNewBGM(audioPath, volume);
    }
  }

  /**
   * Start playing new BGM with fade in
   */
  startNewBGM(audioPath, volume) {
    // Stop and remove old BGM
    if (this.currentBGM) {
      this.currentBGM.pause();
      this.currentBGM = null;
    }

    // Create new audio element
    this.currentBGM = new Audio(audioPath);
    this.currentBGM.loop = true;
    this.currentBGM.volume = 0; // Start at 0 for fade in
    this.targetVolume = volume;

    // Handle audio errors
    this.currentBGM.addEventListener('error', (e) => {
      console.warn('BGM audio error:', e);
      this.currentBGM = null;
    });

    // Play with fade in (only if not muted)
    // Note: Audio may require user interaction - handled by page-level unlock
    if (!window.animaleseMuted) {
      const playPromise = this.currentBGM.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio started successfully, now fade in
            this.fadeIn();
          })
          .catch(err => {
            console.debug('BGM autoplay prevented (will retry on user interaction):', err);
            // If autoplay is prevented, try to unlock on user interaction
            const unlockHandler = () => {
              if (this.currentBGM && !this.currentBGM.paused) {
                this.fadeIn();
              } else {
                const retryPlay = this.currentBGM.play();
                if (retryPlay !== undefined) {
                  retryPlay
                    .then(() => this.fadeIn())
                    .catch(() => {});
                }
              }
              document.removeEventListener('click', unlockHandler);
              document.removeEventListener('keypress', unlockHandler);
            };
            document.addEventListener('click', unlockHandler, { once: true });
            document.addEventListener('keypress', unlockHandler, { once: true });
          });
      } else {
        // Already playing, just fade in
        this.fadeIn();
      }
    }
  }

  /**
   * Fade in effect (0 to target volume)
   */
  fadeIn() {
    if (!this.currentBGM || this.isFading) return;
    
    this.isFading = true;
    const startTime = Date.now();
    const startVolume = 0;

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.fadeDuration, 1);
      
      // Exponential fade for smoother effect
      const currentVolume = startVolume + (this.targetVolume - startVolume) * progress;
      if (this.currentBGM) {
        this.currentBGM.volume = currentVolume;
      }

      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.isFading = false;
        if (this.currentBGM) {
          this.currentBGM.volume = this.targetVolume;
        }
      }
    }, 16); // ~60fps update rate
  }

  /**
   * Fade out effect (current volume to 0)
   * @param {Function} callback - Called when fade out completes
   */
  fadeOut(callback) {
    if (!this.currentBGM || this.isFading) {
      if (callback) callback();
      return;
    }

    this.isFading = true;
    const startTime = Date.now();
    const startVolume = this.currentBGM.volume;

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.fadeDuration, 1);
      
      // Exponential fade for smoother effect
      const currentVolume = startVolume * (1 - progress);
      if (this.currentBGM) {
        this.currentBGM.volume = currentVolume;
      }

      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.isFading = false;
        if (this.currentBGM) {
          this.currentBGM.pause();
          this.currentBGM.currentTime = 0;
          this.currentBGM.volume = this.targetVolume; // Reset volume for next play
        }
        if (callback) callback();
      }
    }, 16); // ~60fps update rate
  }

  /**
   * Stop BGM immediately (no fade)
   */
  stop() {
    if (this.currentBGM) {
      this.currentBGM.pause();
      this.currentBGM.currentTime = 0;
      this.currentBGM = null;
    }
    this.isFading = false;
  }

  /**
   * Pause BGM (respects mute state)
   */
  pause() {
    if (this.currentBGM && !this.currentBGM.paused) {
      this.currentBGM.pause();
    }
  }

  /**
   * Resume BGM (respects mute state)
   */
  resume() {
    if (this.currentBGM && this.currentBGM.paused && !window.animaleseMuted) {
      const playPromise = this.currentBGM.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Fade in when resuming
            this.fadeIn();
          })
          .catch(err => {
            console.debug('BGM resume prevented:', err);
          });
      }
    }
  }

  /**
   * Handle mute state changes
   * @param {boolean} muted - Whether audio should be muted
   */
  setMuted(muted) {
    if (muted) {
      // Muted: pause BGM
      this.pause();
    } else {
      // Unmuted: resume BGM with fade in
      if (this.currentBGM) {
        this.currentBGM.volume = 0;
        this.resume();
        this.fadeIn();
      }
    }
  }

  /**
   * Cleanup on page unload (fade out before leaving)
   */
  cleanup() {
    if (this.currentBGM && !this.currentBGM.paused) {
      this.fadeOut(() => {
        if (this.currentBGM) {
          this.currentBGM.pause();
          this.currentBGM = null;
        }
      });
    } else {
      this.stop();
    }
  }
}

// Create global instance
window.bgmManager = new BGMManager();

// Handle page unload - fade out BGM
window.addEventListener('beforeunload', () => {
  if (window.bgmManager) {
    window.bgmManager.cleanup();
  }
});

// Listen for mute state changes
let lastMuteState = window.animaleseMuted || false;
setInterval(() => {
  if (typeof window.animaleseMuted !== 'undefined' && window.animaleseMuted !== lastMuteState) {
    lastMuteState = window.animaleseMuted;
    if (window.bgmManager) {
      window.bgmManager.setMuted(window.animaleseMuted);
    }
  }
}, 100); // Check every 100ms

export { BGMManager };

