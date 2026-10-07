/**
 * Design Daily — Case Study Scripts
 * Lightweight controller for pill nav, scroll states, and mobile menu
 */

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('[data-nav]');
  const menuToggle = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');

  // Sticky nav hide-on-scroll / compact state
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 30);
      if (y > 180 && y > lastY && !document.body.classList.contains('menu-open')) {
        nav.classList.add('is-hidden');
      } else {
        nav.classList.remove('is-hidden');
      }
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  // Mobile drawer toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Close drawer on link click
  drawer?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  // --- CASE STUDY LIGHTBOX VIEWER ---
  const lightbox = document.createElement('div');
  lightbox.className = 'case-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.innerHTML = `
    <div class="case-lightbox-bar">
      <span class="case-lightbox-title">Artwork Viewer</span>
      <button type="button" class="case-lightbox-close" aria-label="Close image">Close ✕</button>
    </div>
    <div class="case-lightbox-stage">
      <img class="case-lightbox-img" src="" alt="Full view">
    </div>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('.case-lightbox-img');
  const lbTitle = lightbox.querySelector('.case-lightbox-title');
  const lbClose = lightbox.querySelector('.case-lightbox-close');
  let prevActiveElement = null;

  const openCaseImage = (src, alt) => {
    prevActiveElement = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || 'Artwork view';
    lbTitle.textContent = alt || 'Full artwork view';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  };

  const closeCaseImage = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    lbImg.src = '';
    if (prevActiveElement) prevActiveElement.focus();
  };

  lbClose.addEventListener('click', closeCaseImage);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox || e.target.classList.contains('case-lightbox-stage')) {
      closeCaseImage();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeCaseImage();
    }
  });

  document.querySelectorAll('.case-hero-media img, .gallery-card img, .bleed-artwork img').forEach(img => {
    img.addEventListener('click', () => {
      openCaseImage(img.currentSrc || img.src, img.alt);
    });
  });

});
