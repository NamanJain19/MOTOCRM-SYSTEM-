// ========================================
// GLOBAL FUNCTIONS FOR MOTOCRM PRO
// ========================================

// Initialize Lucide Icons
function initLucideIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ========================================
// AUTHENTICATION
// ========================================

// Show Premium Custom Confirm Modal
function showConfirmModal(message, onConfirm) {
  // Remove existing modal if any
  const existing = document.getElementById('custom-confirm-modal');
  if (existing) existing.remove();

  const modalHTML = `
    <div id="custom-confirm-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-200">
      <div class="bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-200 scale-100">
        <div class="flex items-center gap-3 mb-4 text-brand-orange">
          <div class="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-5 h-5"></i>
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white font-sans">Confirm Action</h3>
        </div>
        <p class="text-sm text-slate-500 dark:text-zinc-400 mb-6 font-medium leading-relaxed font-sans">${message}</p>
        <div class="flex items-center justify-end gap-3">
          <button id="confirm-cancel-btn" class="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white border border-slate-200 dark:border-brand-darkBorder bg-transparent hover:bg-slate-50 dark:hover:bg-brand-darkBg transition-all cursor-pointer font-sans">
            Cancel
          </button>
          <button id="confirm-ok-btn" class="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-brand-orange hover:bg-orange-600 transition-all cursor-pointer font-sans shadow-sm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const modal = document.getElementById('custom-confirm-modal');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  const okBtn = document.getElementById('confirm-ok-btn');

  const closeModal = () => {
    modal.classList.add('opacity-0');
    setTimeout(() => modal.remove(), 200);
  };

  cancelBtn.addEventListener('click', closeModal);
  okBtn.addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

// Handle Logout
async function handleLogout() {
  showConfirmModal('Are you sure you want to logout of MotoCRM Pro?', async () => {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.redirect || '/auth/login';
      } else {
        showToast('Error logging out. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error logging out. Please try again.', 'error');
    }
  });
}

// ========================================
// NAVBAR BUTTONS
// ========================================

// // Fetch notifications from server
async function fetchNotifications() {
  try {
    const res = await fetch('/settings/notifications/list');
    if (!res.ok) return [];
    const data = await res.json();
    if (data.success) {
      return data.notifications;
    }
  } catch (err) {
    console.warn('Error fetching notifications:', err);
  }
  return [];
}

// Show Notifications Popup
async function showNotifications(event) {
  event.stopPropagation();
  const popup = document.getElementById('notifications-popup');
  
  if (popup) {
    popup.remove();
    return;
  }
  
  // Fetch latest notifications
  const list = await fetchNotifications();
  
  let itemsHTML = '';
  if (list.length === 0) {
    itemsHTML = `
      <div class="p-4 text-center text-xs text-slate-400 dark:text-zinc-500 font-sans">
        No new notifications.
      </div>
    `;
  } else {
    list.forEach(item => {
      let bgClass = 'bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-200';
      if (item.type === 'test_ride') {
        bgClass = 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200';
      } else if (item.type === 'bike_sold') {
        bgClass = 'bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200';
      } else if (item.type === 'system') {
        bgClass = 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200';
      }
      
      const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      itemsHTML += `
        <div class="p-3.5 rounded-2xl border ${bgClass} flex flex-col gap-1.5 leading-relaxed font-sans text-left transition-colors whitespace-normal break-words">
          <div class="flex justify-between items-start gap-2">
            <p class="text-xs font-extrabold leading-tight whitespace-normal break-words text-slate-900 dark:text-zinc-100">${item.title}</p>
            <span class="text-[9px] opacity-75 font-bold shrink-0 text-slate-500 dark:text-zinc-400">${timeStr}</span>
          </div>
          <p class="text-[11px] font-medium leading-normal whitespace-normal break-words text-slate-600 dark:text-zinc-350">${item.description}</p>
        </div>
      `;
    });
  }
  
  const notificationsHTML = `
    <div id="notifications-popup" class="fixed top-20 right-4 sm:right-8 w-96 max-h-[32rem] bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-3xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
      <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-brand-darkBorder">
        <div class="flex items-center gap-2">
          <i data-lucide="bell" class="w-4 h-4 text-brand-orange"></i>
          <h3 class="font-extrabold text-xs text-slate-900 dark:text-zinc-200 uppercase tracking-wider font-sans">Notifications</h3>
        </div>
        <button onclick="closeNotifications()" class="text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-brand-darkBg transition-colors">
          <i data-lucide="x" class="w-4.5 h-4.5"></i>
        </button>
      </div>
      
      <div class="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[22rem] scrollbar-thin">
        ${itemsHTML}
      </div>
      
      <button onclick="closeNotifications(); window.location.href='/settings?tab=notifications';" class="w-full mt-4 py-3 bg-brand-orange hover:bg-orange-600 text-white dark:text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md shadow-orange-500/10 font-sans">
        Configure Preferences
      </button>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', notificationsHTML);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  // Hide red dot when notifications popup is opened
  const dot = document.getElementById('notification-bell-dot');
  if (dot) dot.classList.add('hidden');
}

// Close Notifications
function closeNotifications() {
  const popup = document.getElementById('notifications-popup');
  if (popup) {
    popup.remove();
  }
}

// Start polling for real-time notifications
function startNotificationPolling() {
  let lastTime = localStorage.getItem('motocrm-last-notification-time');
  let isFirstRun = !lastTime;
  
  async function poll() {
    // Check if we are on a page where user is authenticated
    const list = await fetchNotifications();
    if (!list || list.length === 0) return;
    
    const latestItem = list[0];
    const latestTime = new Date(latestItem.createdAt).getTime();
    
    if (isFirstRun) {
      localStorage.setItem('motocrm-last-notification-time', latestTime);
      isFirstRun = false;
      return;
    }
    
    const savedTime = parseInt(lastTime) || 0;
    if (latestTime > savedTime) {
      // Find all new notifications since savedTime
      const newItems = list.filter(item => new Date(item.createdAt).getTime() > savedTime).reverse();
      
      newItems.forEach(item => {
        showToast(`${item.title}: ${item.description}`, 'info');
      });
      
      localStorage.setItem('motocrm-last-notification-time', latestTime);
      lastTime = latestTime.toString();
      
      // Show dot
      const dot = document.getElementById('notification-bell-dot');
      if (dot) dot.classList.remove('hidden');
    }
  }
  
  // Initial check
  poll();
  // Poll every 15 seconds
  setInterval(poll, 15000);
}


// Show System Info
function showSystemInfo(event) {
  event.stopPropagation();
  
  const infoHTML = `
    <div id="system-info-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeSystemInfo()">
      <div class="bg-white dark:bg-brand-darkCard rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">System Information</h2>
          <button onclick="closeSystemInfo()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        
        <div class="space-y-3 text-sm">
          <div class="flex justify-between border-b border-slate-200 dark:border-brand-darkBorder pb-2">
            <span class="text-slate-600 dark:text-zinc-400">Platform</span>
            <span class="font-semibold text-slate-900 dark:text-white">MotoCRM Pro</span>
          </div>
          
          <div class="flex justify-between border-b border-slate-200 dark:border-brand-darkBorder pb-2">
            <span class="text-slate-600 dark:text-zinc-400">Version</span>
            <span class="font-semibold text-slate-900 dark:text-white">1.0.0</span>
          </div>
          
          <div class="flex justify-between border-b border-slate-200 dark:border-brand-darkBorder pb-2">
            <span class="text-slate-600 dark:text-zinc-400">Status</span>
            <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Operational</span>
          </div>
          
          <div class="flex justify-between border-b border-slate-200 dark:border-brand-darkBorder pb-2">
            <span class="text-slate-600 dark:text-zinc-400">Database</span>
            <span class="font-semibold text-slate-900 dark:text-white">Connected</span>
          </div>
          
          <div class="flex justify-between pb-2">
            <span class="text-slate-600 dark:text-zinc-400">Last Updated</span>
            <span class="font-semibold text-slate-900 dark:text-white" id="system-time"></span>
          </div>
        </div>
        
        <button onclick="closeSystemInfo()" class="w-full mt-6 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all">
          Close
        </button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', infoHTML);
  document.getElementById('system-time').textContent = new Date().toLocaleString();
  lucide.createIcons();
}

// Close System Info
function closeSystemInfo() {
  const modal = document.getElementById('system-info-modal');
  if (modal) {
    modal.remove();
  }
}

// ========================================
// THEME MANAGEMENT
// ========================================

// // Initialize theme on page load (prevent flash)
function initializeTheme() {
  // Get stored theme or default to dark
  const storedTheme = localStorage.getItem('motocrm-theme') || 'dark';
  
  // Apply theme immediately before render
  const root = document.documentElement;
  if (storedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Update button states
  updateThemeButtons(storedTheme);
}

// Collapsible Sidebar Toggle
function toggleSidebar() {
  const root = document.documentElement;
  const isCollapsed = root.classList.toggle('sidebar-collapsed');
  localStorage.setItem('motocrm-sidebar-collapsed', isCollapsed);
  
  // Dispatch resize event to let charts resize smoothly
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('theme-change'));
  }, 310);
}

// Update theme and persist with smooth transitions
function updateTheme(theme) {
  const root = document.documentElement;
  
  // Add transitioning class for smooth mode toggle
  root.classList.add('theme-transitioning');
  
  if (theme === 'dark') {
    root.classList.add('dark');
    localStorage.setItem('motocrm-theme', 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem('motocrm-theme', 'light');
  }
  
  updateThemeButtons(theme);
  
  // Trigger window custom event for chart color re-rendering
  window.dispatchEvent(new Event('theme-change'));
  
  // Persist to server (non-blocking)
  persistThemeToServer(theme);
  
  // Clean up transitioning class after transition completes
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 400);
}

// Update theme button states
function updateThemeButtons(theme) {
  // Header theme buttons
  const headerLightBtn = document.querySelector('header #theme-btn-light') || document.getElementById('theme-btn-light');
  const headerDarkBtn = document.querySelector('header #theme-btn-dark') || document.getElementById('theme-btn-dark');
  
  // Settings theme buttons
  const settingsLightBtn = document.getElementById('settings-theme-btn-light');
  const settingsDarkBtn = document.getElementById('settings-theme-btn-dark');
  
  // Header styling
  if (headerLightBtn && headerDarkBtn) {
    if (theme === 'light') {
      headerLightBtn.classList.add('bg-brand-orange', 'text-white', 'shadow-sm');
      headerLightBtn.classList.remove('bg-transparent', 'text-slate-400', 'dark:text-zinc-550');
      headerDarkBtn.classList.remove('bg-brand-orange', 'text-white', 'shadow-sm');
      headerDarkBtn.classList.add('bg-transparent', 'text-slate-400', 'dark:text-zinc-550');
    } else {
      headerDarkBtn.classList.add('bg-brand-orange', 'text-white', 'shadow-sm');
      headerDarkBtn.classList.remove('bg-transparent', 'text-slate-400');
      headerLightBtn.classList.remove('bg-brand-orange', 'text-white', 'shadow-sm');
      headerLightBtn.classList.add('bg-transparent', 'text-slate-400');
    }
  }
  
  // Settings panel styling
  if (settingsLightBtn && settingsDarkBtn) {
    if (theme === 'light') {
      settingsLightBtn.classList.add('border-brand-orange', 'bg-orange-50', 'dark:bg-orange-950/20');
      settingsLightBtn.classList.remove('border-slate-200', 'dark:border-brand-darkBorder');
      settingsDarkBtn.classList.remove('border-brand-orange', 'bg-orange-50', 'dark:bg-orange-950/20');
      settingsDarkBtn.classList.add('border-slate-200', 'dark:border-brand-darkBorder');
    } else {
      settingsDarkBtn.classList.add('border-brand-orange', 'bg-orange-50', 'dark:bg-orange-950/20');
      settingsDarkBtn.classList.remove('border-slate-200', 'dark:border-brand-darkBorder');
      settingsLightBtn.classList.remove('border-brand-orange', 'bg-orange-50', 'dark:bg-orange-950/20');
      settingsLightBtn.classList.add('border-slate-200', 'dark:border-brand-darkBorder');
    }
  }
}

// Persist theme to server
async function persistThemeToServer(theme) {
  try {
    await fetch('/settings/theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ theme })
    });
  } catch (error) {
    console.warn('Could not persist theme:', error);
  }
}

// ========================================
// THEME & SIDEBAR BUTTON LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  initializeTheme();
  
  // Theme buttons
  const lightBtn = document.getElementById('theme-btn-light');
  const darkBtn = document.getElementById('theme-btn-dark');
  
  if (lightBtn) {
    lightBtn.addEventListener('click', () => updateTheme('light'));
  }
  
  if (darkBtn) {
    darkBtn.addEventListener('click', () => updateTheme('dark'));
  }

  // Sidebar toggle buttons
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', toggleSidebar);
  }
  const sidebarToggleBtn2 = document.getElementById('sidebar-toggle-btn-nav');
  if (sidebarToggleBtn2) {
    sidebarToggleBtn2.addEventListener('click', toggleSidebar);
  }

  // Profile dropdown toggler
  const profileBtn = document.getElementById('profile-dropdown-btn');
  const profileMenu = document.getElementById('profile-dropdown-menu');
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add('hidden');
      }
    });
  }
  
  // Close popups when clicking outside
  document.addEventListener('click', (e) => {
    const notificationsPopup = document.getElementById('notifications-popup');
    if (notificationsPopup && !e.target.closest('button[title="Notifications"]') && !notificationsPopup.contains(e.target)) {
      closeNotifications();
    }
  });

  // Start notification polling
  startNotificationPolling();
  
  // Initialize PJAX router
  initSPA();
});

// ========================================
// PIPELINE DRAG & DROP
// ========================================

let draggedElement = null;

function initDragAndDrop() {
  const cards = document.querySelectorAll('[draggable="true"]');
  const columns = document.querySelectorAll('[data-status]');
  
  // Card drag events
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });
  
  // Column drop events
  columns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('opacity-50');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('opacity-50');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('border-2', 'border-brand-orange');
}

function handleDragLeave(e) {
  this.classList.remove('border-2', 'border-brand-orange');
}

async function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('border-2', 'border-brand-orange');
  
  if (draggedElement && draggedElement !== this) {
    const leadId = draggedElement.getAttribute('data-lead-id');
    const newStatus = this.getAttribute('data-status');
    
    // Move card to new column
    this.appendChild(draggedElement);
    
    // Update on server
    try {
      await fetch('/pipeline/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadId, status: newStatus })
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Error updating lead status. Please try again.');
    }
  }
}

// Initialize drag and drop on page load
document.addEventListener('DOMContentLoaded', () => {
  initDragAndDrop();
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Show toast notification
function showToast(message, type = 'info') {
  let bgClass = 'bg-blue-500';
  if (type === 'error') bgClass = 'bg-rose-500';
  if (type === 'success') bgClass = 'bg-emerald-500';

  const toastHTML = `
    <div class="fixed top-4 right-4 px-6 py-3 ${bgClass} text-white rounded-2xl shadow-lg z-50 animate-bounce font-sans text-xs font-bold">
      ${message}
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', toastHTML);

  setTimeout(() => {
    const toast = document.querySelector('.animate-bounce');
    if (toast) toast.remove();
  }, 3000);
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ========================================
// LIGHTWEIGHT PJAX / SPA ROUTER
// ========================================
let spaInitialized = false;

function initSPA() {
  if (spaInitialized) return;
  spaInitialized = true;

  // Add styles for progress bar and transition fade
  const pStyle = document.createElement('style');
  pStyle.textContent = `
    #nprogress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: #ff5c35;
      z-index: 9999;
      width: 0;
      transition: width 0.3s ease-out, opacity 0.3s ease;
      box-shadow: 0 0 10px #ff5c35, 0 0 5px #ff5c35;
    }
    .spa-fade {
      opacity: 0;
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    main {
      transition: opacity 0.2s ease-in-out;
    }
  `;
  document.head.appendChild(pStyle);

  // Link click hijacking
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    // Check if internal, not auth, not a javascript action, target blank, download, etc.
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    try {
      const url = new URL(link.href, window.location.href);
      const isInternal = url.origin === window.location.origin;
      const isAuth = url.pathname.startsWith('/auth') && !url.pathname.includes('/settings');
      
      if (isInternal && !isAuth && !link.hasAttribute('download') && link.getAttribute('target') !== '_blank') {
        e.preventDefault();
        navigateTo(url.href);
      }
    } catch (err) {
      console.warn('URL parsing skipped for link:', link, err);
    }
  });

  // Popstate navigation for browser back/forward buttons
  window.addEventListener('popstate', () => {
    navigateTo(window.location.href, false);
  });
}

async function navigateTo(href, pushState = true) {
  let pBar = document.getElementById('nprogress-bar');
  if (!pBar) {
    pBar = document.createElement('div');
    pBar.id = 'nprogress-bar';
    document.body.appendChild(pBar);
  }
  
  // Smooth progress bar animation
  pBar.style.transition = 'width 0.3s ease-out, opacity 0.3s ease';
  pBar.style.width = '15%';
  pBar.style.opacity = '1';

  let width = 15;
  const pInterval = setInterval(() => {
    if (width < 85) {
      width += Math.random() * 5;
      pBar.style.width = width + '%';
    }
  }, 50);

  try {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.style.transition = 'opacity 0.2s ease-in-out';
      mainEl.style.opacity = '0';
    }

    const response = await fetch(href);
    if (!response.ok) {
      window.location.href = href;
      return;
    }

    const htmlText = await response.text();
    clearInterval(pInterval);
    pBar.style.width = '100%';

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const newMain = doc.querySelector('main');
    const currentMain = document.querySelector('main');

    if (newMain && currentMain) {
      document.title = doc.title;
      currentMain.innerHTML = newMain.innerHTML;

      // Highlight active menu in sidebar
      const sidebarLinks = document.querySelectorAll('aside a, .sidebar-container a');
      const newPath = new URL(href).pathname;
      sidebarLinks.forEach(lnk => {
        const lnkPath = new URL(lnk.href, window.location.href).pathname;
        const activeClasses = ['bg-orange-50', 'text-brand-orange', 'dark:bg-orange-950/20', 'dark:text-orange-400'];
        const inactiveClasses = ['text-slate-600', 'hover:bg-slate-50', 'dark:text-zinc-400', 'dark:hover:bg-brand-darkBg', 'dark:hover:text-zinc-250'];
        
        const isMatched = (lnkPath === '/' && newPath === '/') || (lnkPath !== '/' && newPath.startsWith(lnkPath));
        if (isMatched) {
          lnk.classList.add(...activeClasses);
          lnk.classList.remove(...inactiveClasses);
        } else {
          lnk.classList.remove(...activeClasses);
          lnk.classList.add(...inactiveClasses);
        }
      });

      // Update Path Label caption in topnav header if it exists
      const pathIndicator = document.querySelector('header span.capitalize');
      if (pathIndicator) {
        const newTitle = doc.querySelector('header span.capitalize');
        if (newTitle) pathIndicator.innerHTML = newTitle.innerHTML;
      }

      // Re-run script tags inside the new main content
      const scripts = currentMain.querySelectorAll('script');
      scripts.forEach(scr => {
        const newScript = document.createElement('script');
        Array.from(scr.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = scr.textContent;
        scr.parentNode.replaceChild(newScript, scr);
      });

      // Re-trigger global plugins
      if (typeof initLucideIcons === 'function') initLucideIcons();
      if (typeof initDragAndDrop === 'function') initDragAndDrop();

      // Dispatch global events for other page scripts (e.g. charts, date pickers)
      window.dispatchEvent(new Event('content-loaded'));

      if (pushState) {
        history.pushState(null, '', href);
      }

      // Restore scroll position to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Animate fade-in smoothly
      requestAnimationFrame(() => {
        currentMain.style.opacity = '1';
      });
    } else {
      window.location.href = href;
    }
  } catch (err) {
    console.error('SPA navigation error:', err);
    window.location.href = href;
  } finally {
    setTimeout(() => {
      pBar.style.opacity = '0';
      setTimeout(() => pBar.remove(), 300);
    }, 150);
  }
}
