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

  // =========================================
  // 3. READ / MARK AS READ LOGIC
  // =========================================
  
  // Mengambil semua card (baik di halaman full maupun di dropdown)
  // .notif-card = Dropdown item
  // .notif-card-item = Full page item
  const allNotifItems = document.querySelectorAll('.notif-card, .notif-card-item');

  // Mengambil semua tombol Mark All Read (baik di halaman full maupun dropdown)
  // .notif-mark-read = Tombol di dropdown
  // .notif-mark-btn = Tombol di halaman full
  const markAllBtns = document.querySelectorAll('.notif-mark-read, .notif-mark-btn');

  // 1. Logic Klik Per-Item (Read satu per satu)
  allNotifItems.forEach(item => {
    item.addEventListener('click', function() {
      // Tambahkan class 'read' saat diklik
      this.classList.add('read');
      
      // Opsional: Jika ingin bisa toggle (klik lagi jadi unread), gunakan .toggle('read')
      // Tapi biasanya notifikasi sekali baca tetap baca.
    });
  });

  // 2. Logic Klik Mark All (Read semua sekaligus)
  markAllBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); // Mencegah dropdown tertutup jika tombol ada di dalam dropdown
      
      // Loop semua item dan tambahkan class read
      allNotifItems.forEach(item => {
        item.classList.add('read');
      });
    });
  });

});