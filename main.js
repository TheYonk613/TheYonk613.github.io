(function () {
  // ── THEME TOGGLE ───────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ys-theme', next);
    });
  }

  // ── NAV: scroll state ──────────────────────────────────
  // Inner pages (no #home section) start in the scrolled state.
  const nav = document.getElementById('nav');
  if (nav && !document.getElementById('home')) {
    nav.classList.add('scrolled');
  }
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── HAMBURGER ──────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileNav  = document.getElementById('mobile-nav');
  const mobileNavCta = document.getElementById('mobile-nav-cta');
  let menuOpen = false;

  function toggleMenu(open) {
    menuOpen = open;
    hamburger.setAttribute('aria-expanded', open);
    mobileNav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    const [top, mid, bot] = hamburger.querySelectorAll('span');
    top.style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
    mid.style.opacity   = open ? '0' : '1';
    bot.style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu(!menuOpen));
  if (mobileNavCta) mobileNavCta.addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuOpen) toggleMenu(false);
  });

  // ── SCROLL REVEAL ──────────────────────────────────────
  // Per-page threshold can be set via <html data-reveal-threshold="0.08">
  const threshold = parseFloat(document.documentElement.dataset.revealThreshold) || 0.12;

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .drawn-rule').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal, .drawn-rule').forEach(el => el.classList.add('revealed'));
  }
})();
