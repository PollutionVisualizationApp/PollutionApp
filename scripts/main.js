/* MOBILE MENU */
const toggle = document.getElementById("nav-toggle");
const navMenu = document.getElementById("nav-menu");

toggle.addEventListener("click", () => {
    navMenu.classList.toggle("show-menu");
    toggle.classList.toggle("show-icon");
});

/* MAIN DROPDOWNS */
document.querySelectorAll(".dropdown__item > .nav__link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        link.parentElement.classList.toggle("open");
    });
});

/* SUB DROPDOWNS */
document.querySelectorAll(".dropdown__subitem > .dropdown__link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        link.parentElement.classList.toggle("open");
    });
});

// Scroll anchor links with fixed header offset
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;

        // земи ја висината на header динамично
        const headerOffset = document.querySelector('.header').offsetHeight;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    });
});
