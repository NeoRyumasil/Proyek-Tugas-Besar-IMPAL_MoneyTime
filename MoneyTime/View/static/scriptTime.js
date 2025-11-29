const HEADER_OFFSET = 130;

const sections = document.querySelectorAll("#home, #features, #about, #contact");
const links = document.querySelectorAll(".page-link");

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute("id");
      const link = document.querySelector(`.page-link[href="#${id}"]`);
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove("active"));
        if (link) link.classList.add("active");
      }
    });
  },
  {
    root: null,
    rootMargin: `-${HEADER_OFFSET}px 0px -60% 0px`,
    threshold: 0.25,
  }
);

sections.forEach((sec) => io.observe(sec));

document.addEventListener('DOMContentLoaded', () => {
  // --- Navbar Logic ---
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.header-guest');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open');
    });
  }

  document.querySelectorAll('.page-switch .page-link').forEach(a => {
    a.addEventListener('click', () => {
      if (header.classList.contains('menu-open')) {
        header.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // --- Search Bar Logic ---
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  if (searchBtn && searchInput) {
    const performSearch = () => {
      const query = searchInput.value.trim();
      if (query) {
        alert(`Searching for: "${query}"`);
      } else {
        searchInput.focus();
      }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  // --- Profile Dropdown Logic (NEW) ---
  const profilePill = document.getElementById('profilePill');
  const profileContainer = document.querySelector('.profile-container');

  if (profilePill && profileContainer) {
    profilePill.addEventListener('click', (e) => {
      // Toggle class 'active' pada container
      // CSS akan menangani visibility (.profile-dropdown) dan rotasi chevron
      profileContainer.classList.toggle('active');
      e.stopPropagation(); // Mencegah event bubbling ke document
    });

    // Close dropdown ketika klik di luar
    document.addEventListener('click', (e) => {
      if (!profileContainer.contains(e.target)) {
        profileContainer.classList.remove('active');
      }
    });
  }
});