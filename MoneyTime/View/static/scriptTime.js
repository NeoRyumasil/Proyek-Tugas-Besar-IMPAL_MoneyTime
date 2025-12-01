document.addEventListener('DOMContentLoaded', () => {
  // --- HELPER: FORMAT TANGGAL ---
  function formatFullDate(dateInput) {
    if (!dateInput) return '';

    // Pisahkan teks suffix seperti "(Overdue)"
    let isOverdue = false;
    let cleanDate = dateInput;

    if (dateInput.toLowerCase().includes('overdue')) {
      isOverdue = true;
      // Hapus (Overdue) dari string untuk parsing tanggal
      cleanDate = dateInput.replace(/\(?overdue\)?/gi, '').replace(/[()]/g, '').trim();
    }

    let dateObj = new Date(cleanDate);

    // Fallback: Jika invalid atau tahun 2001, paksa ke 2025
    if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 2001) {
      dateObj = new Date(`${cleanDate}, 2025`);
    }

    if (isNaN(dateObj.getTime())) return dateInput;

    // Pastikan 2025
    if (dateObj.getFullYear() !== 2025 && !cleanDate.match(/\d{4}/)) {
      dateObj.setFullYear(2025);
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const formatted = `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    // Return HTML jika Overdue, agar bisa ganti baris
    if (isOverdue) {
      return `${formatted}<span class="overdue-text">(Overdue)</span>`;
    }
    return formatted;
  }

  // --- 1. FORMAT TANGGAL DI LIST SAAT LOAD ---
  const dateElements = document.querySelectorAll('.sch-date');
  dateElements.forEach(el => {
    const originalText = el.textContent.trim();
    // Gunakan innerHTML karena kita mungkin menyisipkan <span> dan <br> (via CSS block)
    el.innerHTML = formatFullDate(originalText);
  });

  // --- 2. NAVBAR LOGIC ---
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.header-guest');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open');
    });
  }

  // --- 3. PROFILE DROPDOWN ---
  const profilePill = document.getElementById('profilePill');
  const profileContainer = document.querySelector('.profile-container');

  if (profilePill && profileContainer) {
    profilePill.addEventListener('click', (e) => {
      profileContainer.classList.toggle('active');
      e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
      if (!profileContainer.contains(e.target)) {
        profileContainer.classList.remove('active');
      }
    });
  }

  // --- 4. CHECKBOX INTERACTIVE ---
  const checkboxes = document.querySelectorAll('.sch-checkbox');
  checkboxes.forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle logic sederhana untuk visual
      if (box.classList.contains('wontdo')) return; // Won't do biasanya statis di list
      box.classList.toggle('checked');
    });
  });

  // --- 5. SCHEDULE ITEM CLICK (PASS DATA) ---
  const scheduleItems = document.querySelectorAll('.schedule-row');
  scheduleItems.forEach(item => {
    item.addEventListener('click', () => {
      const titleEl = item.querySelector('.sch-title');
      const timeEl = item.querySelector('.sch-time');
      const badgeEl = item.querySelector('.t-badge');
      const dateEl = item.querySelector('.sch-date');
      const dotEl = item.querySelector('.priority-dot');

      let priority = 'None';
      if (dotEl) {
        if (dotEl.classList.contains('low')) priority = 'Low';
        else if (dotEl.classList.contains('medium')) priority = 'Medium';
        else if (dotEl.classList.contains('high')) priority = 'High';
        else if (dotEl.classList.contains('critical')) priority = 'Critical';
      }

      // Ambil teks tanggal (tanpa tag HTML overdue)
      let rawDateText = dateEl ? dateEl.textContent.trim() : '';
      // Bersihkan teks (Overdue) jika terbawa oleh textContent
      rawDateText = rawDateText.replace('(Overdue)', '').trim();

      const itemData = {
        description: titleEl ? titleEl.textContent.trim() : '',
        time: timeEl ? timeEl.textContent.trim() : '',
        category: badgeEl ? badgeEl.textContent.trim() : '',
        date: rawDateText,
        priority: priority
      };

      if (typeof openScheduleDetail === 'function') {
        openScheduleDetail(itemData);
      }
    });
  });

  // --- 6. VIEW MORE (Max 4 Items, Today Show All) ---
  const MAX_ITEMS = 4; // Update sesuai permintaan

  function initViewMore(group) {
    // Jika grup adalah "Today", jangan di-collapse
    if (group.id === 'group-today') {
      const btn = group.querySelector('.view-more');
      if (btn) btn.style.display = 'none';
      return;
    }

    const items = group.querySelectorAll('.schedule-row');
    const btn = group.querySelector('.view-more');

    if (items.length > MAX_ITEMS) {
      items.forEach((item, index) => {
        if (index >= MAX_ITEMS) item.classList.add('hidden-task');
        else item.classList.remove('hidden-task');
      });

      if (btn) {
        btn.style.display = 'block';
        btn.textContent = 'View more';
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = newBtn.textContent === 'View less';
          if (isExpanded) {
            items.forEach((item, idx) => {
              if (idx >= MAX_ITEMS) item.classList.add('hidden-task');
            });
            newBtn.textContent = 'View more';
          } else {
            items.forEach(item => item.classList.remove('hidden-task'));
            newBtn.textContent = 'View less';
          }
        });
      }
    } else {
      items.forEach(item => item.classList.remove('hidden-task'));
      if (btn) btn.style.display = 'none';
    }
  }

  const groups = document.querySelectorAll('.day-card');
  groups.forEach(g => initViewMore(g));

  // --- 7. MINIMIZE BOX ---
  const toggleHeaders = document.querySelectorAll('.toggle-group-btn');
  toggleHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.day-card');
      const content = card.querySelector('.trans-items');
      const icon = header.querySelector('.toggle-icon');
      const viewMore = card.querySelector('.view-more');

      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
        initViewMore(card); // Re-init view more state
      } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
        if (viewMore) viewMore.style.display = 'none';
      }
    });
  });

  // --- 8. FILTER TABS ---
  const tabs = document.querySelectorAll('.time-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;

      groups.forEach(group => {
        const content = group.querySelector('.trans-items');
        const icon = group.querySelector('.toggle-icon');
        if (content) content.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(0deg)';

        if (target === 'all') {
          group.style.display = 'block';
        } else {
          if (group.id === target) group.style.display = 'block';
          else group.style.display = 'none';
        }
        if (group.style.display !== 'none') initViewMore(group);
      });
    });
  });
});