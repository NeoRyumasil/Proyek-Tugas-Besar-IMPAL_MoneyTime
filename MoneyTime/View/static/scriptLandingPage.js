const HEADER_OFFSET = 130;

// Target sections yg dipantau
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
