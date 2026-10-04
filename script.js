/**
 * Design Daily — Production Portfolio Script
 * Pure vanilla JavaScript with Framer Motion-inspired staggered entrance reveals,
 * spring-like hover states, and smooth crossfading transitions.
 */
(() => {
  'use strict';

  // Mark document as JS-enabled for progressive enhancement
  document.documentElement.classList.add('js');

  // Helper selectors
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --------------------------------------------------------------------------
   * 1. Mobile Menu & Navigation
   * ----------------------------------------------------------------------- */
  const menuToggle = $('.menu-toggle');
  const nav = $('#navigation');

  function openMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation menu');
  }

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on Escape key press
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', event => {
      if (nav.classList.contains('open') && !event.target.closest('.site-header')) {
        closeMenu();
      }
    });

    // Close menu when clicking any nav link
    $$('.nav a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 2. In-Page Smooth Scrolling with Focus Management
   * ----------------------------------------------------------------------- */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      const targetId = hash.slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      const headerOffset = 76;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: prefersReduced.matches ? 'instant' : 'smooth'
      });

      if (history.pushState) {
        history.pushState(null, '', hash);
      }

      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* --------------------------------------------------------------------------
   * 3. Campaign Case Studies Interactive Switcher (Crossfade & Slide)
   * ----------------------------------------------------------------------- */
  const caseData = {
    roam: {
      sector: 'Roam / Outdoor goods',
      title: 'Outside is a good idea.',
      brief: 'Build an outdoor-goods identity for people who prefer a detour to a destination.',
      idea: 'Topographic lines become a flexible system. Useful field markings replace decoration.',
      rollout: 'Define symbol, palette, and visual rules; apply identity to physical gear; launch outdoor billboard and social campaigns.',
      sheetSrc: 'assets/roam/case-study.svg',
      sheetAlt: 'Roam campaign case study presentation sheet with brief, idea, and rollout',
      billboardSrc: 'assets/roam/billboard.svg',
      billboardAlt: 'Roam outdoor billboard: Outside is a good idea',
      socialSrc: 'assets/roam/social-launch.svg',
      socialAlt: 'Roam social launch campaign creative'
    },
    morrow: {
      sector: 'Morrow / Specialty coffee',
      title: 'A good start, wherever the day goes.',
      brief: 'Create a warm, recognisable coffee brand that feels at home in an everyday routine.',
      idea: 'A rising sun becomes the daily ritual: one clear symbol, used from cup to city.',
      rollout: 'Establish mark & 4-colour identity; introduce Daily Ritual packaging family; launch outdoor & 3 social chapters.',
      sheetSrc: 'assets/morrow/case-study.svg',
      sheetAlt: 'Morrow campaign case study presentation sheet with brief, idea, and rollout',
      billboardSrc: 'assets/morrow/billboard.svg',
      billboardAlt: 'Morrow outdoor campaign: Good things take a moment. Make it a Morrow.',
      socialSrc: 'assets/morrow/social-slow.svg',
      socialAlt: 'Morrow social creative: Good days start slow'
    },
    lilt: {
      sector: 'Lilt / Audio & acoustics',
      title: 'Culture in frequency.',
      brief: 'Give a new listening brand an expressive identity beyond the usual sterile tech aesthetic.',
      idea: 'Sound becomes a visible rhythm. Bold loops flex from packaging to screens.',
      rollout: 'Define soundmark, palette, and visual rules; apply to headphones & product packaging; launch digital hero stories.',
      sheetSrc: 'assets/lilt/case-study.svg',
      sheetAlt: 'Lilt campaign case study presentation sheet with brief, idea, and rollout',
      billboardSrc: 'assets/lilt/billboard.svg',
      billboardAlt: 'Lilt outdoor campaign: Culture in frequency',
      socialSrc: 'assets/lilt/social-launch.svg',
      socialAlt: 'Lilt social campaign launch story'
    },
    soli: {
      sector: 'Soli / Everyday care',
      title: 'Small rituals. Softer days.',
      brief: 'Create an approachable body-care identity with a calm, human sense of character.',
      idea: 'Two soft forms make one memorable mark. Warm colour pairs create a gentle rhythm.',
      rollout: 'Define symbol, palette, and packaging rules; craft tactile bottle cartons; launch mindful social stories.',
      sheetSrc: 'assets/soli/case-study.svg',
      sheetAlt: 'Soli campaign case study presentation sheet with brief, idea, and rollout',
      billboardSrc: 'assets/soli/billboard.svg',
      billboardAlt: 'Soli outdoor billboard: Small rituals. Softer days.',
      socialSrc: 'assets/soli/social-launch.svg',
      socialAlt: 'Soli social campaign launch story'
    }
  };

  const caseTabs = $$('[data-case-brand]');
  const caseSector = $('#case-sector');
  const caseTitle = $('#case-title');
  const caseBrief = $('#case-brief');
  const caseIdea = $('#case-idea');
  const caseRollout = $('#case-rollout');
  const caseRead = $('#case-read');
  const caseSheet = $('.case-sheet');
  const caseOutdoor = $('.case-outdoor');
  const caseSocial = $('.case-social');
  const caseCard = $('.case-display-card');

  let isCaseSwitching = false;

  function applyCaseContent(data) {
    if (caseSector) caseSector.textContent = data.sector;
    if (caseTitle) caseTitle.textContent = data.title;
    if (caseBrief) caseBrief.textContent = data.brief;
    if (caseIdea) caseIdea.textContent = data.idea;
    if (caseRollout) caseRollout.textContent = data.rollout;
    if (caseRead) caseRead.href = data.sheetSrc;

    if (caseSheet) {
      caseSheet.src = data.sheetSrc;
      caseSheet.alt = data.sheetAlt;
    }
    if (caseOutdoor) {
      caseOutdoor.src = data.billboardSrc;
      caseOutdoor.alt = data.billboardAlt;
    }
    if (caseSocial) {
      caseSocial.src = data.socialSrc;
      caseSocial.alt = data.socialAlt;
    }
  }

  function updateCaseStudy(brandKey, activeTabButton) {
    const data = caseData[brandKey];
    if (!data || isCaseSwitching) return;

    // Check if the requested brand is already active
    const currentlyActive = caseTabs.find(tab => tab.classList.contains('is-active'));
    if (currentlyActive && currentlyActive.dataset.caseBrand === brandKey) {
      if (activeTabButton) activeTabButton.focus();
      return;
    }

    // Update tab button states and aria attributes
    caseTabs.forEach(tab => {
      const isMatch = tab.dataset.caseBrand === brandKey;
      tab.classList.toggle('is-active', isMatch);
      tab.setAttribute('aria-pressed', String(isMatch));
    });

    if (activeTabButton) {
      activeTabButton.focus();
    }

    // If reduced motion is requested or card is absent, switch instantly
    if (prefersReduced.matches || !caseCard) {
      applyCaseContent(data);
      return;
    }

    // Crossfade and subtle slide transition
    isCaseSwitching = true;
    caseCard.classList.add('is-switching');

    window.setTimeout(() => {
      applyCaseContent(data);
      caseCard.classList.remove('is-switching');
      caseCard.classList.add('is-entering');

      window.setTimeout(() => {
        caseCard.classList.remove('is-entering');
        isCaseSwitching = false;
      }, 260);
    }, 130);
  }

  caseTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const brand = tab.dataset.caseBrand;
      updateCaseStudy(brand, tab);
    });
  });

  /* --------------------------------------------------------------------------
   * 4. Staggered Scroll & Entrance Reveals (IntersectionObserver)
   * ----------------------------------------------------------------------- */
  const revealItems = $$('.reveal-init');

  if (prefersReduced.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('is-revealed'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05
    });

    revealItems.forEach(el => revealObserver.observe(el));
  }

  /* --------------------------------------------------------------------------
   * 5. Enquiry Form Mailto Draft Composer
   * ----------------------------------------------------------------------- */
  const enquiryForm = $('#enquiry-form');
  const formNote = $('#form-note');

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(enquiryForm);
      const name = (formData.get('name') || '').toString().trim();
      const business = (formData.get('business') || '').toString().trim();
      const pkg = (formData.get('package') || '').toString().trim();
      const message = (formData.get('message') || '').toString().trim();

      const subject = encodeURIComponent(`Design Daily Project Brief — ${business || name || 'New Enquiry'}`);
      const bodyContent = [
        `Name: ${name}`,
        `Business / Role: ${business}`,
        pkg ? `Interested in: ${pkg}` : '',
        '',
        'Project Brief / Message:',
        message
      ].filter(line => line !== null).join('\n');

      const mailtoUrl = `mailto:julkarnineXdesigndaily@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;

      if (formNote) {
        formNote.textContent = 'Opening your email client to send this brief to julkarnineXdesigndaily@gmail.com...';
        formNote.style.color = 'var(--orange)';
      }

      window.location.href = mailtoUrl;
    });
  }
})();
