const glow = document.getElementById('glow');
window.addEventListener('mousemove', (e) => {
    glow.style.background = `radial-gradient(600px at ${e.clientX}px ${e.clientY}px, rgba(247, 201, 72, 0.1), transparent 80%)`;
});

// Mobile menu toggle
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});