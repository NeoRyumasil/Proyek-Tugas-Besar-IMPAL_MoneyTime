document.addEventListener('DOMContentLoaded', function () {

  // =========================================
  // 1. NAVBAR & UI UTILS
  // =========================================
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.header-guest');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open');
    });
  }

  // =========================================
  // 2. DROPDOWN LOGIC (Profile & Notification)
  // =========================================
  const profilePill = document.getElementById('profilePill');
  const profileContainer = document.querySelector('.profile-container');
  
  const notifWrapper = document.getElementById('notificationWrapper');
  const notifDropdown = document.getElementById('notificationDropdown');

  // --- Profile Toggle ---
  if (profilePill && profileContainer) {
    profilePill.addEventListener('click', (e) => {
      // Close notif if open
      if (notifWrapper) notifWrapper.classList.remove('active');
      
      // Toggle Profile
      profileContainer.classList.toggle('active');
      e.stopPropagation();
    });
  }

  // --- Notification Toggle ---
  if (notifWrapper && notifDropdown) {
    notifWrapper.addEventListener('click', (e) => {
      // Close profile if open
      if (profileContainer) profileContainer.classList.remove('active');

      // Toggle Notification
      notifWrapper.classList.toggle('active');
      e.stopPropagation();
    });

    // Prevent closing when clicking inside the dropdown itself
    notifDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // --- Global Click Listener (Close All) ---
  document.addEventListener('click', (e) => {
    if (profileContainer && !profileContainer.contains(e.target)) {
      profileContainer.classList.remove('active');
    }
    if (notifWrapper && !notifWrapper.contains(e.target)) {
      notifWrapper.classList.remove('active');
    }
  });

});