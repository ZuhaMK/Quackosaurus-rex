/**
 * Reusable Menu Component
 * Provides a dropdown menu with consistent styling and behavior
 */

export function mountMenu(container, options = {}) {
  const {
    menuItems = [
      { action: 'go-back', label: 'Go Back to Options' },
      { action: 'history', label: 'Chat History' },
      { action: 'mute', label: 'Mute Music' }
    ],
    onItemClick = () => {},
    assetsPath = './assets'
  } = options;

  // Create menu HTML
  const menuHTML = `
    <div class="dropdown-menu">
      <button class="dropdown-toggle">☰ Menu</button>
      <div class="dropdown-content">
        ${menuItems.map(item => 
          `<div class="dropdown-item" data-action="${item.action}">${item.label}</div>`
        ).join('')}
      </div>
    </div>
  `;

  // Insert menu into container
  if (typeof container === 'string') {
    const containerEl = document.querySelector(container);
    if (containerEl) {
      containerEl.insertAdjacentHTML('beforeend', menuHTML);
    } else {
      console.error('Menu container not found:', container);
      return null;
    }
  } else if (container) {
    container.insertAdjacentHTML('beforeend', menuHTML);
  } else {
    console.error('Invalid menu container');
    return null;
  }

  // Get menu elements
  const menuButton = container.querySelector?.('.dropdown-toggle') || document.querySelector(`${container} .dropdown-toggle`);
  const dropdownContent = container.querySelector?.('.dropdown-content') || document.querySelector(`${container} .dropdown-content`);
  
  if (!menuButton || !dropdownContent) {
    console.error('Menu elements not found after creation');
    return null;
  }

  // Apply button background
  menuButton.style.background = 'transparent';
  menuButton.style.backgroundImage = `url('${assetsPath}/buttons/buttonMedium.PNG')`;
  menuButton.style.backgroundSize = '100% 100%';
  menuButton.style.backgroundRepeat = 'no-repeat';
  menuButton.style.backgroundPosition = 'center';
  menuButton.style.color = '#000';

  // Toggle dropdown
  menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownContent.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuButton.contains(e.target) && !dropdownContent.contains(e.target)) {
      dropdownContent.classList.remove('show');
    }
  });

  // Handle menu item clicks
  dropdownContent.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = item.getAttribute('data-action');
      dropdownContent.classList.remove('show');
      
      // Call the provided callback
      onItemClick(action, item);
    });
  });

  return {
    menuButton,
    dropdownContent,
    updateMuteState: (isMuted) => {
      const muteItem = dropdownContent.querySelector('[data-action="mute"]');
      if (muteItem) {
        muteItem.textContent = isMuted ? 'Unmute Music' : 'Mute Music';
        muteItem.style.opacity = isMuted ? '0.7' : '1';
        muteItem.style.fontWeight = isMuted ? '700' : '600';
      }
    }
  };
}

