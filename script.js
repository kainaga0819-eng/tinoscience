// Tino Science — small helpers. Plain JavaScript, no build step.

// 1. Mobile navigation toggle (the hamburger button on phones)
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}

// 2. Highlight the current page in the navigation
const currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach((link) => {
  if (link.getAttribute('href') === currentFile) link.setAttribute('aria-current', 'page');
});

// 3. Footer year
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// 4. 3D atom in the homepage hero.
//    Only loads on larger screens, and not for people who prefer reduced motion.
//    If anything fails (old browser, no WebGL, offline) a flat SVG atom shows instead.
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual) {
  const bigScreen = window.matchMedia('(min-width: 721px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (bigScreen && !reduceMotion) {
    import('./atom.js')
      .then((mod) => mod.mountAtom(heroVisual))
      .catch((err) => {
        console.warn('3D atom unavailable, showing fallback:', err);
        heroVisual.classList.add('is-fallback');
      });
  } else {
    heroVisual.classList.add('is-fallback');
  }
}

// 5. Scroll animations: add "is-visible" to .reveal elements as they come into view.
//    The styles are in style.css under "Scroll animations".
document.documentElement.classList.add('js');
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
