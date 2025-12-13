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

  // 1. Logic Klik Per-Item (MODIFIED: Toggle Read/Unread)
  allNotifItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Ambil ID
      const activityId = this.getAttribute('data-id');
      if (!activityId) return;

      // Kirim request Toggle ke server
      // Pastikan route '/toggle-notif-status' sudah dibuat di main.py sesuai langkah sebelumnya
      fetch('/toggle-notif-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activityId })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Cek status terbaru dari database:
          // Jika is_read = true (1), tambahkan class .read (tampilan abu-abu)
          // Jika is_read = false (0), hapus class .read (tampilan biru/highlight)
          if (data.is_read) {
            this.classList.add('read');
          } else {
            this.classList.remove('read');
          }
        } else {
          console.error("Gagal toggle status di database");
        }
      })
      .catch(err => console.error("Error:", err));
    });
  });

  // 2. Logic Klik Mark All (Read semua sekaligus)
  markAllBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); 
      
      // Panggil Server untuk update database
      fetch('/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Jika sukses di database, baru update tampilan visual (Fade Out)
          allNotifItems.forEach(item => {
            item.classList.add('read');
          });
          
          // Opsional: Hilangkan titik merah notifikasi jika ada
          const redDot = document.querySelector('.notification-dot');
          if (redDot) redDot.style.display = 'none';
          
        } else {
          console.error("Gagal melakukan Mark All Read");
        }
      })
      .catch(err => console.error("Error:", err));
    });
  });

});