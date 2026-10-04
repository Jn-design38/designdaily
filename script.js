(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  root.classList.add('js');
  if (reduceMotion.matches) root.classList.add('rm');

  const clamp = (val, min = 0, max = 1) => Math.min(max, Math.max(min, val));

  // --- HEADER & MOBILE NAV ---
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  const closeMenu = () => {
    nav?.classList.remove('open');
    document.body.classList.remove('menu-open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open menu');
  };

  menu?.addEventListener('click', () => {
    const open = !nav?.classList.contains('open');
    nav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  let lastScrollY = window.scrollY;
  const updateHeader = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      if (y > 300 && y > lastScrollY && !nav?.classList.contains('open')) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
    }
    lastScrollY = y;
  };

  // --- WORD SPLITTING FOR REVEALS ---
  document.querySelectorAll('[data-words]').forEach(el => {
    const nodes = [...el.childNodes];
    el.textContent = '';
    let wordIndex = 0;
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/\s+/).filter(Boolean);
        words.forEach(w => {
          const wrap = document.createElement('span');
          wrap.className = 'w';
          wrap.style.setProperty('--i', wordIndex++);
          wrap.innerHTML = `<span>${w}</span> `;
          el.appendChild(wrap);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const wrap = document.createElement('span');
        wrap.className = 'w';
        wrap.style.setProperty('--i', wordIndex++);
        const inner = document.createElement('span');
        inner.appendChild(node.cloneNode(true));
        wrap.appendChild(inner);
        el.appendChild(wrap);
        el.appendChild(document.createTextNode(' '));
      }
    });
  });

  // --- INTERSECTION OBSERVER FOR [data-rise] & COUNTERS ---
  const animateCounter = el => {
    if (el.dataset.counted) return;
    el.dataset.counted = 'true';
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;
    const duration = 1400;
    const startTime = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const riseItems = [...document.querySelectorAll('[data-rise], [data-words]')];
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        entry.target.querySelectorAll?.('[data-count]').forEach(animateCounter);
        if (entry.target.hasAttribute('data-count')) animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    riseItems.forEach(item => observer.observe(item));
  } else {
    riseItems.forEach(item => {
      item.classList.add('is-in');
      item.querySelectorAll?.('[data-count]').forEach(animateCounter);
      if (item.hasAttribute('data-count')) animateCounter(item);
    });
  }

  // --- HERO ROTATOR ---
  const rotator = document.querySelector('.rotator');
  const rotatorTrack = document.querySelector('.rotator-track');
  if (rotator && rotatorTrack) {
    const words = [...rotatorTrack.children];
    let wordIdx = 0;
    const syncRotator = () => {
      const active = words[wordIdx];
      if (active) {
        rotator.style.width = `${active.offsetWidth}px`;
        rotatorTrack.style.transform = `translateY(-${wordIdx * 1.05}em)`;
      }
    };
    syncRotator();
    window.addEventListener('resize', syncRotator);
    setInterval(() => {
      wordIdx = (wordIdx + 1) % words.length;
      syncRotator();
    }, 2500);
  }

  // --- HERO 3D SCENE & PARALLAX ---
  const heroSection = document.querySelector('[data-hero]');
  const heroCopy = document.querySelector('.hero-copy');
  const heroStatement = document.querySelector('.hero-statement');
  const heroProgress = document.querySelector('.hero-progress b');
  const pieces = [...document.querySelectorAll('.piece')];

  // Base 3D cluster coordinates on right side of desktop screen
  const pieceConfigs = {
    a: { bx: 220, by: -150, bz: 80, rx: 4, ry: -8, rz: -4, ex: 460, ey: -320, ez: 300, er: -18 },
    b: { bx: 360, by: -50,  bz: -20, rx: -5, ry: -12, rz: 6, ex: 580, ey: -110, ez: -150, er: 20 },
    c: { bx: 180, by: 100,  bz: 150, rx: 6, ry: 10,  rz: -5, ex: 380, ey: 280,  ez: 420, er: -22 },
    d: { bx: 400, by: 150,  bz: 200, rx: 8, ry: -14, rz: 8,  ex: 640, ey: 360,  ez: 480, er: 28 },
    e: { bx: -20, by: -200, bz: -90, rx: -6, ry: 6,  rz: 3,  ex: -120, ey: -400, ez: -220, er: 12 },
    f: { bx: 60,  by: 190,  bz: 100, rx: 5, ry: 8,   rz: -8, ex: -10,  ey: 420,  ez: 240, er: -20 },
    g: { bx: 40,  by: -10,  bz: -10, rx: 3, ry: -4,  rz: -6, ex: -50,  ey: -50,  ez: -90, er: -15 },
    h: { bx: 280, by: -240, bz: 130, rx: 10, ry: -6, rz: 12, ex: 500, ey: -440, ez: 340, er: 32 },
    i: { bx: -70, by: 70,   bz: 170, rx: 4, ry: 12,  rz: -10, ex: -280, ey: 180, ez: 380, er: -26 }
  };

  let mouseX = 0, mouseY = 0, currentTiltX = 0, currentTiltY = 0;
  if (!reduceMotion.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', e => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });
  }

  const updateHero = () => {
    if (!heroSection) return;
    const isDesktop = window.innerWidth > 860 && !reduceMotion.matches;
    if (!isDesktop) {
      pieces.forEach(p => {
        p.style.transform = '';
        p.style.opacity = '';
      });
      return;
    }

    const range = Math.max(1, heroSection.offsetHeight - window.innerHeight);
    const progress = clamp(-heroSection.getBoundingClientRect().top / range);

    // Mouse tilt smoothing
    currentTiltX += (mouseY * -18 - currentTiltX) * 0.1;
    currentTiltY += (mouseX * 22 - currentTiltY) * 0.1;

    // Phase 1: copy exits
    const pCopy = clamp(progress / 0.42);
    heroCopy?.style.setProperty('--hc-y', `${-(pCopy * 130)}px`);
    heroCopy?.style.setProperty('--hc-o', `${Math.max(0, 1 - pCopy * 1.5)}`);

    // Phase 2: pieces explode outwards in 3D
    const pExp = clamp((progress - 0.15) / 0.65);
    const pAlpha = 1 - clamp((progress - 0.65) / 0.25);

    pieces.forEach(piece => {
      const key = piece.dataset.piece;
      const cfg = pieceConfigs[key] || { bx: 0, by: 0, bz: 0, rx: 0, ry: 0, rz: 0, ex: 0, ey: 0, ez: 0, er: 0 };
      const x = cfg.bx + (cfg.ex - cfg.bx) * pExp + currentTiltY * (1 + cfg.bz * 0.003);
      const y = cfg.by + (cfg.ey - cfg.by) * pExp + currentTiltX * (1 + cfg.bz * 0.003);
      const z = cfg.bz + (cfg.ez - cfg.bz) * pExp;
      const rz = cfg.rz + cfg.er * pExp;
      piece.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(1)}px) rotateX(${cfg.rx}deg) rotateY(${cfg.ry}deg) rotateZ(${rz.toFixed(1)}deg)`;
      piece.style.opacity = pAlpha.toFixed(3);
    });

    // Phase 3: hero statement center reveal
    const pStmt = clamp((progress - 0.58) / 0.32);
    heroStatement?.style.setProperty('--st-o', pStmt.toFixed(3));
    heroStatement?.style.setProperty('--st-s', (0.88 + pStmt * 0.12).toFixed(3));

    // Hero foot progress bar
    heroProgress?.style.setProperty('--hp', progress.toFixed(3));
  };

  // --- STATEMENT SCRUB (light up words on scroll) ---
  const statementSection = document.querySelector('[data-statement]');
  const statementText = document.querySelector('[data-scrub]');
  let scrubWords = [];
  if (statementText) {
    const raw = statementText.innerHTML;
    // Split into words while honoring <b> tags
    const temp = document.createElement('div');
    temp.innerHTML = raw;
    const tokens = [];
    temp.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/\s+/).filter(Boolean).forEach(w => tokens.push({ text: w, key: false }));
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'B') {
        node.textContent.split(/\s+/).filter(Boolean).forEach(w => tokens.push({ text: w, key: true }));
      }
    });
    statementText.innerHTML = '';
    scrubWords = tokens.map(tok => {
      const span = document.createElement('span');
      span.className = `sw${tok.key ? ' key' : ''}`;
      span.textContent = tok.text + ' ';
      statementText.appendChild(span);
      return span;
    });
  }

  const updateStatement = () => {
    if (!statementSection || !scrubWords.length) return;
    const isDesktop = window.innerWidth > 860 && !reduceMotion.matches;
    if (!isDesktop) {
      scrubWords.forEach(w => w.classList.add('on'));
      return;
    }
    const range = Math.max(1, statementSection.offsetHeight - window.innerHeight);
    const progress = clamp(-statementSection.getBoundingClientRect().top / range);

    // Light up words proportionally
    const activeCount = Math.floor(progress * (scrubWords.length + 4));
    scrubWords.forEach((word, idx) => {
      word.classList.toggle('on', idx < activeCount);
    });

    // Parallax floating accents
    statementSection.style.setProperty('--f1', `${(progress - 0.5) * -70}px`);
    statementSection.style.setProperty('--f2', `${(progress - 0.5) * 90}px`);
  };

  // --- HORIZONTAL CASE STUDY SCROLL ---
  const workSection = document.querySelector('[data-hscroll]');
  const workTrack = document.querySelector('.work-track');
  const workBar = document.querySelector('.work-bar');
  const workCurrent = document.querySelector('.work-current');
  const caseCuts = [...document.querySelectorAll('.case-cut, .case-cut-logo')];

  const updateWork = () => {
    if (!workSection || !workTrack) return;
    const isDesktop = window.innerWidth > 860 && !reduceMotion.matches;
    if (!isDesktop) {
      workTrack.style.transform = '';
      return;
    }
    const range = Math.max(1, workSection.offsetHeight - window.innerHeight);
    const progress = clamp(-workSection.getBoundingClientRect().top / range);

    const maxScroll = Math.max(0, workTrack.scrollWidth - window.innerWidth + 80);
    workTrack.style.transform = `translate3d(-${(progress * maxScroll).toFixed(1)}px, 0, 0)`;

    // Active case counter (01 to 08)
    const currentIdx = Math.min(8, Math.floor(progress * 8) + 1);
    if (workCurrent) workCurrent.textContent = String(currentIdx).padStart(2, '0');

    // Progress bar
    workBar?.style.setProperty('--wp', progress.toFixed(3));

    // Floating cutout parallax inside cards
    caseCuts.forEach((cut, i) => {
      const cutOffset = (progress * 8 - i) * 20;
      cut.style.setProperty('--cx', `${clamp(cutOffset, -30, 30).toFixed(1)}px`);
    });
  };

  // --- PROCESS 3D CARD STACK ---
  const processSection = document.querySelector('[data-process]');
  const pcards = [...document.querySelectorAll('.pcard')];
  const psteps = [...document.querySelectorAll('.process-steps button')];
  const pline = document.querySelector('.process-line');

  const updateProcess = () => {
    if (!processSection || !pcards.length) return;
    const isDesktop = window.innerWidth > 860 && !reduceMotion.matches;
    if (!isDesktop) {
      pcards.forEach(c => {
        c.style.transform = '';
        c.style.opacity = '';
      });
      return;
    }

    const range = Math.max(1, processSection.offsetHeight - window.innerHeight);
    const progress = clamp(-processSection.getBoundingClientRect().top / range);
    pline?.style.setProperty('--pp', progress.toFixed(3));

    const stepFloat = progress * (pcards.length - 1);
    const active = Math.min(pcards.length - 1, Math.floor(stepFloat));
    const subProgress = stepFloat - active;

    pcards.forEach((card, index) => {
      if (index < active) {
        // Scrolled away: flies up and out
        card.style.transform = 'translate3d(0, -125%, 0) rotateX(18deg) scale(0.92)';
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
      } else if (index === active) {
        // Active card: transitions up slightly as user completes step
        const liftY = -(subProgress * 15);
        card.style.transform = `translate3d(0, ${liftY.toFixed(1)}px, 0) scale(1)`;
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
      } else {
        // Upcoming cards stacked behind
        const d = index - active;
        const stackY = (d * 18 - subProgress * 18).toFixed(1);
        const stackZ = (-d * 70 + subProgress * 70).toFixed(1);
        const stackScale = (1 - d * 0.045 + subProgress * 0.045).toFixed(3);
        const stackOpacity = Math.max(0, 1 - d * 0.28 + subProgress * 0.28).toFixed(3);
        card.style.transform = `translate3d(0, ${stackY}px, ${stackZ}px) scale(${stackScale})`;
        card.style.opacity = stackOpacity;
        card.style.pointerEvents = 'none';
      }
    });

    const activeStepIdx = Math.min(pcards.length - 1, Math.round(stepFloat));
    psteps.forEach((btn, idx) => {
      btn.closest('li')?.classList.toggle('is-active', idx === activeStepIdx);
    });
  };

  psteps.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!processSection) return;
      const idx = Number(btn.dataset.step);
      const target = processSection.offsetTop + (processSection.offsetHeight - window.innerHeight) * (idx / (pcards.length - 1));
      window.scrollTo({ top: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });

  // --- SOCIAL WALL PARALLAX ---
  const socialSection = document.querySelector('[data-social]');
  const wallCols = [...document.querySelectorAll('.wall-col')];
  const updateSocial = () => {
    if (!socialSection || !wallCols.length || reduceMotion.matches) return;
    const rect = socialSection.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    wallCols.forEach(col => {
      const speed = parseFloat(col.dataset.speed || '1');
      col.style.transform = `translate3d(0, ${((progress - 0.5) * speed * 180).toFixed(1)}px, 0)`;
    });
  };

  // --- PACKAGING SHELF PARALLAX ---
  const shelfSection = document.querySelector('[data-shelf]');
  const updateShelf = () => {
    if (!shelfSection) return;
    const rect = shelfSection.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    shelfSection.style.setProperty('--sx', `${((progress - 0.5) * -18).toFixed(1)}%`);

    const pi = clamp((window.innerHeight - rect.top) / (window.innerHeight * 0.7));
    shelfSection.style.setProperty('--pi', pi.toFixed(3));
  };

  // --- SERVICES HOVER PREVIEW FOLLOWER ---
  const servicesList = document.querySelector('.service-list');
  const preview = document.querySelector('.service-preview');
  const previewImg = preview?.querySelector('img');

  if (servicesList && preview && previewImg && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pX = 0, pY = 0, targetX = 0, targetY = 0, previewRaf = 0;
    const movePreview = () => {
      pX += (targetX - pX) * 0.18;
      pY += (targetY - pY) * 0.18;
      preview.style.transform = `translate3d(${pX.toFixed(1)}px, ${pY.toFixed(1)}px, 0)`;
      if (preview.classList.contains('on')) previewRaf = requestAnimationFrame(movePreview);
    };

    servicesList.querySelectorAll('li').forEach(li => {
      li.addEventListener('pointerenter', e => {
        const src = li.dataset.img;
        if (src) {
          previewImg.src = src;
          preview.classList.add('on');
          targetX = e.clientX + 24;
          targetY = e.clientY - 90;
          pX = targetX;
          pY = targetY;
          cancelAnimationFrame(previewRaf);
          previewRaf = requestAnimationFrame(movePreview);
        }
      });
      li.addEventListener('pointermove', e => {
        targetX = e.clientX + 24;
        targetY = e.clientY - 90;
      });
      li.addEventListener('pointerleave', () => {
        preview.classList.remove('on');
        cancelAnimationFrame(previewRaf);
      });
    });
  }

  // --- CONTACT FORM SUBMISSION ---
  const form = document.querySelector('#enquiry-form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const needs = data.getAll('need').join(', ') || 'General branding enquiry';
    const name = data.get('name') || '';
    const business = data.get('business') || '';
    const message = data.get('message') || '';

    const subject = encodeURIComponent(`Design Daily project enquiry — ${business || name}`);
    const body = encodeURIComponent(
      `Name: ${name}\n` +
      `Business / brand: ${business}\n` +
      `Needs: ${needs}\n\n` +
      `Project details:\n${message}\n`
    );
    window.location.href = `mailto:julkarnineXdesigndaily@gmail.com?subject=${subject}&body=${body}`;
  });

  // --- SCROLL TICKER ---
  let isTicking = false;
  const onScroll = () => {
    updateHeader();
    updateHero();
    updateStatement();
    updateWork();
    updateProcess();
    updateSocial();
    updateShelf();
    isTicking = false;
  };

  const scheduleTick = () => {
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(onScroll);
    }
  };

  window.addEventListener('scroll', scheduleTick, { passive: true });
  window.addEventListener('resize', scheduleTick);

  // Initial pass
  onScroll();
  root.classList.add('site-ready');
})();
