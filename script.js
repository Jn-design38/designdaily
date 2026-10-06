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

  // --- 3D PARTICLE LOGO ENGINE (SCATTERED TO DESIGN DAILY MARK) ---
  const heroSection = document.querySelector('[data-hero]');
  const heroCopy = document.querySelector('.hero-copy');
  const heroProgress = document.querySelector('.hero-progress b');
  const phaseLabel = document.querySelector('[data-particle-phase]');
  const particleCanvas = document.getElementById('hero-particle-canvas');

  let pCtx = null;
  let particles = [];
  let isParticleReady = false;
  let canvasW = 0, canvasH = 0;
  let smoothProgress = 0;
  let targetProgress = 0;
  let mouseX = 0, mouseY = 0;
  let rawMouseX = -9999, rawMouseY = -9999;
  let camTiltX = 0, camTiltY = 0;

  // Exact Design Daily SVG mark path definition
  const LOGO_SVG_PATH = "M397.15,122.79c-0.11-1.82-3.17-42.36-33.55-70.91c-31.49-29.6-81.81-36.42-127.81-17.67c-0.14,54.05-0.14,108.23-0.27,162.28c-2.02,0-4.83,0-8.19,0c-4.64,0-8.17,0-8.35,0c-33.95,0.07-56.47,12.89-56.47,12.89c-28.6,16.28-38.72,45.25-40.56,50.83c-3.01,9.15-9.19,32.7,0.44,59.65c2.51,7.03,11.63,31.07,36.18,45.45c18.56,10.88,36.17,11.02,41.06,10.93c5.17-0.1,32.97-0.42,50.93-21c7.45-8.53,10.84-17.07,13.14-23.16c4.47-11.78,5.42-22.49,5.55-29.94v-55.27c3.61-0.16,8.81-0.54,14.98-1.52c40.79-6.48,87.03-33.33,105.33-77.04C398.44,147.08,397.5,128.49,397.15,122.79z M235.51,302.14c0,0.1,0,0.21-0.01,0.33c-0.42,15.15-16.9,36.79-38.86,35.76c-18.09-0.85-29.97-16.62-34-29.3c-5.21-16.39,1.79-30.51,3.58-33.86c6.43-12.01,16.6-17.46,21.29-19.97c10.14-5.44,19.76-6.5,30.17-7.65c7.41-0.82,13.6-0.84,17.82-0.7C235.51,265.21,235.51,283.67,235.51,302.14z M306.21,191c-13.26,4.88-29.36,5.49-29.36,5.49c-3.17,0.12-5.81,0.07-7.61,0c-0.03-45.32-0.05-90.64-0.08-135.95c7.27-2.37,19.29-5.02,32.65-1.6c29.75,7.62,51.96,41.73,48.16,75.28C346.36,166.15,319.9,185.96,306.21,191z";

  function initParticleSystem() {
    if (!particleCanvas) return;
    pCtx = particleCanvas.getContext('2d');
    resizeParticleCanvas();

    // 1. High-Fidelity Sampling from Vector Path on 400x400 Offscreen Canvas
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 400;
    offCanvas.height = 400;
    const offCtx = offCanvas.getContext('2d');
    // Vector path center is (255, 185) -> translate to (200, 200)
    offCtx.translate(200 - 255, 200 - 185);
    const path2d = new Path2D(LOGO_SVG_PATH);
    offCtx.fillStyle = '#000';
    offCtx.fill(path2d);

    const imgData = offCtx.getImageData(0, 0, 400, 400).data;
    const sampledPoints = [];
    const step = 3; // Clean integer sampling step

    for (let y = 15; y < 385; y += step) {
      for (let x = 15; x < 385; x += step) {
        const idx = (y * 400 + x) * 4;
        if (imgData[idx + 3] > 120) {
          sampledPoints.push({
            x: (x - 200) * 1.55,
            y: (y - 200) * 1.55
          });
        }
      }
    }

    // 2. Build particle instances distributed across the ENTIRE SCREEN at scroll 0
    particles = sampledPoints.map((pt, i) => {
      // Uniform random distribution across entire screen at scroll 0 (Phase 1)
      const normStartX = 0.02 + Math.random() * 0.96;
      const normStartY = 0.03 + Math.random() * 0.94;
      const startZ = (Math.random() - 0.5) * 650;

      // Volumetric 3D extrusion on target mark (Phase 5)
      const tz = (Math.random() - 0.5) * 46;

      return {
        tx: pt.x,
        ty: pt.y,
        tz: tz,
        normStartX: normStartX,
        normStartY: normStartY,
        startZ: startZ,
        // Individual vortex phases
        swirlPhase: Math.random() * Math.PI * 2,
        swirlSpeed: 0.7 + Math.random() * 0.7,
        // Subtle Brownian floating drift
        driftPhaseX: Math.random() * Math.PI * 2,
        driftPhaseY: Math.random() * Math.PI * 2,
        driftSpeed: 0.5 + Math.random() * 0.7,
        // Staggered threshold arrival delay
        delay: Math.random() * 0.28,
        // Visual traits matching screenshots
        radius: 1.1 + Math.random() * 1.4,
        alpha: 0.55 + Math.random() * 0.42,
        isAccent: Math.random() < 0.14 // 14% warm amber accents
      };
    });

    isParticleReady = true;
    requestAnimationFrame(renderParticleFrame);
  }

  function resizeParticleCanvas() {
    if (!particleCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasW = particleCanvas.clientWidth;
    canvasH = particleCanvas.clientHeight;
    particleCanvas.width = Math.round(canvasW * dpr);
    particleCanvas.height = Math.round(canvasH * dpr);
    if (pCtx) pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeParticleCanvas);

  if (!reduceMotion.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', e => {
      rawMouseX = e.clientX;
      rawMouseY = e.clientY;
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });
  }

  function renderParticleFrame(timestamp) {
    if (!isParticleReady || !pCtx) return;
    const time = timestamp * 0.001;

    // Smooth scroll interpolation
    smoothProgress += (targetProgress - smoothProgress) * 0.09;

    // Smooth mouse tilt
    camTiltX += (mouseY * -0.28 - camTiltX) * 0.08;
    camTiltY += (mouseX * 0.36 - camTiltY) * 0.08;

    pCtx.clearRect(0, 0, canvasW, canvasH);

    const isDesktop = canvasW > 860;
    // Stage center: positioned on right side on desktop, centered in lower stage on mobile
    const stageCenterX = isDesktop ? canvasW * 0.72 : canvasW * 0.50;
    const stageCenterY = isDesktop ? canvasH * 0.50 : canvasH * 0.73;
    const logoScale = isDesktop 
      ? Math.min(canvasW, canvasH) * 0.00155
      : Math.min(canvasW, canvasH) * 0.00108;

    // 1. Text animation: Starts in the middle, animates and moves smoothly to the left on scroll
    if (heroCopy && isDesktop) {
      const copyW = heroCopy.offsetWidth || 600;
      const pad = 60;
      const maxShiftX = Math.max(0, (canvasW * 0.50) - (pad + copyW * 0.50));
      const pText = clamp(smoothProgress / 0.44);
      const easeText = pText < 0.5 ? 4 * pText * pText * pText : 1 - Math.pow(-2 * pText + 2, 3) / 2;
      const shiftX = maxShiftX * easeText;
      heroCopy.style.setProperty('--hc-shift-x', `${shiftX.toFixed(1)}px`);
    } else if (heroCopy) {
      heroCopy.style.removeProperty('--hc-shift-x');
    }

    // 3D Camera Rotation Matrix
    const rotX = camTiltX;
    const rotY = camTiltY + (smoothProgress * 0.28);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    // Map scroll progress so the 3D mark finishes assembling by progress ~0.88
    const animProgress = clamp(smoothProgress / 0.88);

    // Update phase label in HUD
    if (phaseLabel) {
      if (animProgress < 0.16) phaseLabel.textContent = 'Phase 1 · Scattered dots';
      else if (animProgress < 0.44) phaseLabel.textContent = 'Phase 2 · Vortex attraction';
      else if (animProgress < 0.72) phaseLabel.textContent = 'Phase 3 · Contour emergence';
      else if (animProgress < 0.94) phaseLabel.textContent = 'Phase 4 · Density cohesion';
      else phaseLabel.textContent = 'Phase 5 · 3D Design Daily Mark';
    }

    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];

      // Normalized local accumulation factor with staggered delay
      const pLocal = clamp((animProgress - p.delay * 0.22) / (1 - p.delay * 0.22));
      // Cubic easing
      const ease = pLocal < 0.5 
        ? 4 * pLocal * pLocal * pLocal 
        : 1 - Math.pow(-2 * pLocal + 2, 3) / 2;

      // Spiral vortex turbulence (Phases 2 & 3)
      const swirlFactor = Math.sin(ease * Math.PI) * (1 - ease * 0.88);
      const swirlAngle = swirlFactor * 3.2 + p.swirlPhase + time * p.swirlSpeed;
      const swirlX = Math.cos(swirlAngle) * swirlFactor * 105;
      const swirlY = Math.sin(swirlAngle) * swirlFactor * 105;

      // Ambient Brownian floating drift (Phase 1)
      const drift = (1 - ease) * 11;
      const driftX = Math.sin(time * p.driftSpeed + p.driftPhaseX) * drift;
      const driftY = Math.cos(time * p.driftSpeed + p.driftPhaseY) * drift;

      // Initial coordinates distributed across the entire screen at scroll 0
      const sx = (p.normStartX * canvasW - stageCenterX) / logoScale;
      const sy = (p.normStartY * canvasH - stageCenterY) / logoScale;
      const sz = p.startZ;

      // Interpolated 3D position
      const x = sx + (p.tx - sx) * ease + swirlX + driftX;
      const y = sy + (p.ty - sy) * ease + swirlY + driftY;
      const z = sz + (p.tz - sz) * ease;

      // 3D Matrix Rotation
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // 3D Perspective Projection
      const fov = 720;
      const proj = fov / (fov + z2);

      const screenX = stageCenterX + x1 * proj * logoScale;
      const screenY = stageCenterY + y1 * proj * logoScale;

      // At start (scroll 0), particles are scattered across whole screen with full visibility.
      // As text moves to the left and particles swirl to the right,
      // smoothly clear out any lingering particles in the left text zone.
      let alpha = clamp(p.alpha * (0.36 + proj * 0.64), 0.12, 0.98);
      const leftVignetteActive = clamp((smoothProgress - 0.15) / 0.28);
      if (isDesktop && leftVignetteActive > 0 && screenX < canvasW * 0.45) {
        const mask = Math.max(0, (screenX - canvasW * 0.32) / (canvasW * 0.13));
        alpha *= (1 - leftVignetteActive) + leftVignetteActive * mask;
      } else if (!isDesktop) {
        // Protect mobile headline & CTA buttons
        const textLimit = canvasH * 0.52;
        if (screenY < textLimit) {
          alpha *= Math.max(0, (screenY - (textLimit - 50)) / 50);
        }
      }
      if (alpha <= 0.02) continue;

      // Subtle tactile cursor ripple when user hovers nearby
      let pushX = 0, pushY = 0;
      if (rawMouseX > 0 && rawMouseY > 0) {
        const dx = screenX - rawMouseX;
        const dy = screenY - rawMouseY;
        const dSq = dx * dx + dy * dy;
        if (dSq < 6400 && dSq > 1) { // within 80px
          const d = Math.sqrt(dSq);
          const force = (1 - d / 80) * 14 * ease;
          pushX = (dx / d) * force;
          pushY = (dy / d) * force;
        }
      }

      const radius = Math.max(0.65, p.radius * proj);

      pCtx.fillStyle = p.isAccent 
        ? `rgba(242, 197, 61, ${alpha})` 
        : `rgba(22, 20, 18, ${alpha})`;

      pCtx.beginPath();
      pCtx.arc(screenX + pushX, screenY + pushY, radius, 0, Math.PI * 2);
      pCtx.fill();
    }

    requestAnimationFrame(renderParticleFrame);
  }

  // Hook scroll updates: ONLY the particle animation reacts to scroll, text stays fixed
  const updateHero = () => {
    if (!heroSection) return;
    const range = Math.max(1, heroSection.offsetHeight - window.innerHeight);
    const progress = clamp(-heroSection.getBoundingClientRect().top / range);
    targetProgress = progress;

    // Progress bar in hero foot
    heroProgress?.style.setProperty('--hp', progress.toFixed(3));
  };

  initParticleSystem();
  // --- 3D PROCESS COMPARISON: TYPICAL AGENCY VS DESIGN DAILY STUDIO ---
  const vsSection = document.querySelector('[data-vs-section]');
  const vsTabs = [...document.querySelectorAll('.vs-tab')];
  const vsAgencyViews = [...document.querySelectorAll('.vs-agency [data-step-view]')];
  const vsStudioViews = [...document.querySelectorAll('.vs-studio [data-step-view]')];
  const vsFill = document.querySelector('.vs-progress-fill');
  const currPhaseLabel = document.querySelector('.curr-phase');
  let currentVsStep = 0;

  // Tab click jump
  vsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const step = parseInt(tab.dataset.step, 10);
      if (isNaN(step) || !vsSection) return;
      const range = Math.max(1, vsSection.offsetHeight - window.innerHeight);
      const targetY = vsSection.offsetTop + (step / 3.2) * range;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });

  // Spatial mouse tilt over arena
  const vsArena = document.querySelector('.vs-arena');
  if (vsArena && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let arenaTiltX = 0, arenaTargetTiltX = 0;
    vsArena.addEventListener('pointermove', e => {
      const rect = vsArena.getBoundingClientRect();
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      arenaTargetTiltX = normY * -8;
      vsSection?.style.setProperty('--arena-tilt-x', `${arenaTargetTiltX.toFixed(1)}deg`);
    }, { passive: true });

    vsArena.addEventListener('pointerleave', () => {
      vsSection?.style.setProperty('--arena-tilt-x', '0deg');
    });
  }

  const updateComparison = () => {
    if (!vsSection) return;
    const isDesktop = window.innerWidth > 960 && !reduceMotion.matches;
    const range = Math.max(1, vsSection.offsetHeight - window.innerHeight);
    const progress = clamp(-vsSection.getBoundingClientRect().top / range);

    // Calculate step: 0 to 3 across the scroll range
    const stepIdx = Math.min(3, Math.floor(progress * 4));

    if (stepIdx !== currentVsStep) {
      currentVsStep = stepIdx;
      // Update views
      vsAgencyViews.forEach((view, idx) => {
        view.classList.toggle('is-active', idx === stepIdx);
      });
      vsStudioViews.forEach((view, idx) => {
        view.classList.toggle('is-active', idx === stepIdx);
      });
      // Update tabs
      vsTabs.forEach((tab, idx) => {
        const isActive = idx === stepIdx;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      // Update phase counter
      if (currPhaseLabel) currPhaseLabel.textContent = `0${stepIdx + 1}`;
    }

    // Update progress bars & orb dial
    vsSection.style.setProperty('--vs-progress', progress.toFixed(3));
    if (vsFill) {
      const fillPercent = Math.max(25, (progress * 100));
      vsFill.style.width = `${fillPercent.toFixed(1)}%`;
    }

    // Dynamic 3D depth shifting
    if (isDesktop) {
      const tzAgency = ((1 - progress) * 20 - 10).toFixed(1);
      const tzStudio = (progress * 25 + 10).toFixed(1);
      vsSection.style.setProperty('--arena-tz-a', `${tzAgency}px`);
      vsSection.style.setProperty('--arena-tz-s', `${tzStudio}px`);
    } else {
      vsSection.style.removeProperty('--arena-tz-a');
      vsSection.style.removeProperty('--arena-tz-s');
    }
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
    const currentIdx = Math.min(7, Math.floor(progress * 7) + 1);
    if (workCurrent) workCurrent.textContent = String(currentIdx).padStart(2, '0');

    // Progress bar
    workBar?.style.setProperty('--wp', progress.toFixed(3));

    // Floating cutout parallax inside cards
    caseCuts.forEach((cut, i) => {
      const cutOffset = (progress * 7 - i) * 20;
      cut.style.setProperty('--cx', `${clamp(cutOffset, -30, 30).toFixed(1)}px`);
    });
  };

  // --- PROCESS FLOW (from Web reference 3) ---
  const flowSection = document.querySelector('#process');
  const flowSteps = [...document.querySelectorAll('[data-flow-step]')];
  const flowObjects = [...document.querySelectorAll('[data-flow-object]')];
  const flowCounter = document.querySelector('.flow-counter-current');
  const flowCounterBar = document.querySelector('.flow-counter i');

  const updateFlow = () => {
    if (!flowSection || !flowObjects.length) return;
    const isDesktop = window.innerWidth > 860 && !reduceMotion.matches;
    if (!isDesktop) {
      flowObjects.forEach(obj => {
        obj.style.removeProperty('--flow-x');
        obj.style.removeProperty('--flow-y');
        obj.style.removeProperty('--flow-z');
        obj.style.removeProperty('--flow-r');
        obj.style.removeProperty('--flow-scale');
        obj.style.removeProperty('--flow-opacity');
      });
      return;
    }
    const range = Math.max(1, flowSection.offsetHeight - window.innerHeight);
    const progress = clamp(-flowSection.getBoundingClientRect().top / range);
    const active = Math.min(flowObjects.length - 1, Math.round(progress * (flowObjects.length - 1)));

    flowObjects.forEach((object, index) => {
      const distance = index - active;
      object.style.setProperty('--flow-x', `${distance * 24}px`);
      object.style.setProperty('--flow-y', `${Math.abs(distance) * 16}px`);
      object.style.setProperty('--flow-z', `${-Math.abs(distance) * 120}px`);
      object.style.setProperty('--flow-r', `${distance * -3.5}deg`);
      object.style.setProperty('--flow-scale', `${1 - Math.min(0.13, Math.abs(distance) * 0.035)}`);
      object.style.setProperty('--flow-opacity', `${clamp(1.12 - Math.abs(distance) * 0.23, 0.14, 1)}`);
      object.classList.toggle('is-active', index === active);
    });

    flowSteps.forEach((step, index) => step.classList.toggle('is-active', index === active));
    if (flowCounter) flowCounter.textContent = String(active + 1).padStart(2, '0');
    if (flowCounterBar) {
      const pct = Math.round(((active + 1) / flowObjects.length) * 100);
      flowCounterBar.style.background = `linear-gradient(90deg, var(--yellow) 0 ${pct}%, rgba(255, 255, 255, 0.25) ${pct}% 100%)`;
    }
  };

  flowSteps.forEach(step => {
    step.querySelector('button')?.addEventListener('click', () => {
      if (!flowSection) return;
      const index = Number(step.dataset.flowStep);
      const target = flowSection.offsetTop + (flowSection.offsetHeight - window.innerHeight) * (index / (flowObjects.length - 1));
      window.scrollTo({ top: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });

  // --- SOCIAL MEDIA CONTENT DESIGN (SIDE-BY-SIDE CONTROLLER) ---
  const impactItems = [...document.querySelectorAll('.social-impact-item')];
  const deckCards = [...document.querySelectorAll('.social-deck-card')];
  const deckCounter = document.querySelector('[data-active-num]');
  const deckPrev = document.querySelector('.deck-prev');
  const deckNext = document.querySelector('.deck-next');
  const deckStage = document.querySelector('[data-social-deck]');

  let activeSocialIndex = 0;

  const setActiveSocialCard = (index) => {
    if (!deckCards.length) return;
    const total = deckCards.length;
    activeSocialIndex = ((index % total) + total) % total;

    // Update accordion items
    impactItems.forEach((item, idx) => {
      const isActive = idx === activeSocialIndex;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update 3D stacked deck cards
    deckCards.forEach((card, idx) => {
      const layer = ((idx - activeSocialIndex) % total + total) % total;
      card.dataset.layer = layer;
      card.classList.toggle('is-active', layer === 0);
      card.setAttribute('aria-hidden', layer === 0 ? 'false' : 'true');
    });

    // Update counter display
    if (deckCounter) {
      deckCounter.textContent = String(activeSocialIndex + 1).padStart(2, '0');
    }
  };

  // Wire up accordion items click & keyboard
  impactItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      setActiveSocialCard(idx);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveSocialCard(idx);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveSocialCard(activeSocialIndex + 1);
        impactItems[(activeSocialIndex) % impactItems.length]?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveSocialCard(activeSocialIndex - 1);
        impactItems[(activeSocialIndex) % impactItems.length]?.focus();
      }
    });
  });

  // Wire up deck cards click (clicking any stacked card brings it to front)
  deckCards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.deck-bar-link')) return; // Allow clicking full art link
      setActiveSocialCard(idx);
    });
  });

  // Wire up Prev / Next buttons
  deckPrev?.addEventListener('click', () => {
    setActiveSocialCard(activeSocialIndex - 1);
  });
  deckNext?.addEventListener('click', () => {
    setActiveSocialCard(activeSocialIndex + 1);
  });

  // 3D stage cursor tilt
  if (deckStage && !reduceMotion.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let stageTiltRaf = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let currRotX = 0;
    let currRotY = 0;

    const animateTilt = () => {
      currRotX += (targetRotX - currRotX) * 0.12;
      currRotY += (targetRotY - currRotY) * 0.12;
      deckStage.style.transform = `perspective(1200px) rotateX(${currRotX.toFixed(2)}deg) rotateY(${currRotY.toFixed(2)}deg)`;
      if (Math.abs(targetRotX - currRotX) > 0.05 || Math.abs(targetRotY - currRotY) > 0.05) {
        stageTiltRaf = requestAnimationFrame(animateTilt);
      }
    };

    deckStage.addEventListener('pointermove', (e) => {
      const rect = deckStage.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotX = normY * -10;
      targetRotY = normX * 12;
      cancelAnimationFrame(stageTiltRaf);
      stageTiltRaf = requestAnimationFrame(animateTilt);
    });

    deckStage.addEventListener('pointerleave', () => {
      targetRotX = 0;
      targetRotY = 0;
      cancelAnimationFrame(stageTiltRaf);
      stageTiltRaf = requestAnimationFrame(animateTilt);
    });
  }

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
    updateComparison();
    updateWork();
    updateFlow();
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
