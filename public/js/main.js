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

// Intersection Observer for scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.opacity-0.translate-y-8').forEach(el => observer.observe(el));