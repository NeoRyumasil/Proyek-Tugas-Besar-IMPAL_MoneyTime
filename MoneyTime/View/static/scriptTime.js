document.addEventListener('DOMContentLoaded', () => {
  // --- 1. NAVBAR LOGIC ---
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.header-guest');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open');
    });
  }

  // --- 2. PROFILE DROPDOWN ---
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

  // --- 3. MODAL LOGIC (ADD SCHEDULE) ---
  // Note: Detail logika form ada di scriptScheduleAdd.js, ini hanya trigger dasar jika diperlukan
  // tapi scriptScheduleAdd.js sudah menangani semuanya (Open, Close, Discard).

  // --- 4. CHECKBOX INTERACTIVE ---
  const checkboxes = document.querySelectorAll('.sch-checkbox');
  checkboxes.forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      box.classList.toggle('checked');
    });
  });

  // --- 5. VIEW MORE & EXPAND ---
  const MAX_ITEMS = 3;

  function initViewMore(group) {
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

  // --- 6. MINIMIZE BOX (TOGGLE HEADER) ---
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
        initViewMore(card);
      } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
        if (viewMore) viewMore.style.display = 'none';
      }
    });
  });

  // --- 7. FILTER TABS ---
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
          if (group.id === target) {
            group.style.display = 'block';
          } else {
            group.style.display = 'none';
          }
        }

        if (group.style.display !== 'none') {
          initViewMore(group);
        }
      });
    });
  });
});