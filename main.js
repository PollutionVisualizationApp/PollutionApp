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
