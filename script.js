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
      words.forEach((w, i) => w.classList.toggle('is-active', i === wordIdx));
      const active = words[wordIdx];
      if (active) {
        const rect = active.getBoundingClientRect();
        const wordW = Math.ceil(rect.width || active.offsetWidth || 120);
        if (wordW > 10) {
          rotator.style.width = `${wordW}px`;
        }
        const itemH = rotator.offsetHeight || active.offsetHeight || 50;
        rotatorTrack.style.transform = `translateY(-${wordIdx * itemH}px)`;
      }
    };
    syncRotator();
    if (document.fonts?.ready) {
      document.fonts.ready.then(syncRotator);
    }
    window.addEventListener('resize', syncRotator);
    setInterval(() => {
      wordIdx = (wordIdx + 1) % words.length;
      syncRotator();
    }, 2800);
  }

  // --- 3D PARTICLE LOGO ENGINE (SCATTERED TO DESIGN DAILY MARK) ---
  const heroSection = document.querySelector('[data-hero]');
  const heroCopy = document.querySelector('.hero-copy');
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
    offCtx.translate(200 - 255, 200 - 185);
    const path2d = new Path2D(LOGO_SVG_PATH);
    offCtx.fillStyle = '#000';
    offCtx.fill(path2d);

    const imgData = offCtx.getImageData(0, 0, 400, 400).data;
    const sampledPoints = [];
    const step = 3;

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

    // 2. Build particle instances with progressive scroll activation, true 3D volumetric depth & logo colors
    const totalSampled = sampledPoints.length;
    particles = sampledPoints.map((pt, i) => {
      // Uniform random distribution across entire screen at scroll 0
      const normStartX = 0.02 + Math.random() * 0.96;
      const normStartY = 0.03 + Math.random() * 0.94;
      const startZ = (Math.random() - 0.5) * 650;

      // Authentic Design Daily vector mark with subtle organic scatter
      const scatterRadius = (Math.random() - 0.5) * 3.2;
      const scatterAngle = Math.random() * Math.PI * 2;
      const tx = pt.x + Math.cos(scatterAngle) * scatterRadius;
      const ty = pt.y + Math.sin(scatterAngle) * scatterRadius;
      const tz = (Math.random() - 0.5) * 44; // Subtle 3D spatial depth for mouse parallax

      // Progressive emergence:
      // At scroll 0, only ~10% of dots are awake at very soft opacity (~0.06 - 0.09) for a calm, clean background.
      // As user scrolls down, remaining 90% of dots progressively appear between progress 0.03 and 0.50!
      const spawnProgress = i < Math.floor(totalSampled * 0.10)
        ? 0
        : 0.03 + Math.random() * 0.47;

      // Brand Logo Accent Colors: Red (#E52E20), Orange (#FF6B00), Black (#161412)
      // Map based on target logo topology for vibrant mark assembly:
      let colorType;
      if (pt.y < -30) {
        colorType = Math.random() < 0.85 ? 'red' : 'orange';
      } else if (pt.x > 15 && pt.y < 40) {
        colorType = Math.random() < 0.65 ? 'orange' : 'red';
      } else if (pt.y > 65) {
        colorType = Math.random() < 0.45 ? 'orange' : (Math.random() < 0.70 ? 'black' : 'red');
      } else {
        const rand = Math.random();
        if (rand < 0.45) colorType = 'red';
        else if (rand < 0.80) colorType = 'orange';
        else colorType = 'black';
      }

      return {
        tx: tx,
        ty: ty,
        tz: tz,
        normStartX,
        normStartY,
        startZ,
        spawnProgress,
        colorType,
        swirlPhase: Math.random() * Math.PI * 2,
        swirlSpeed: 0.7 + Math.random() * 0.7,
        driftPhaseX: Math.random() * Math.PI * 2,
        driftPhaseY: Math.random() * Math.PI * 2,
        driftSpeed: 0.4 + Math.random() * 0.6,
        delay: Math.random() * 0.22,
        radius: 1.05 + Math.random() * 1.35,
        baseAlpha: 0.72 + Math.random() * 0.25
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
    // Stage center & scale matching exact authentic vector mark with generous padding from nav bar and viewport edges
    const navOffset = isDesktop ? Math.max(34, canvasH * 0.042) : 14;
    const stageCenterX = isDesktop ? canvasW * 0.70 : canvasW * 0.50;
    const stageCenterY = isDesktop ? (canvasH * 0.50 + navOffset) : (canvasH * 0.72 + 10);
    const logoScale = isDesktop 
      ? Math.min(canvasW, canvasH) * 0.00128
      : Math.min(canvasW, canvasH) * 0.00092;

    // 1. Text animation: Starts dead center, smoothly glides left on desktop as 3D mark forms
    if (heroCopy && isDesktop) {
      const copyW = heroCopy.offsetWidth || 640;
      const pad = Math.max(80, canvasW * 0.055);
      const maxShiftX = Math.max(0, (canvasW * 0.50) - (pad + copyW * 0.50));
      const pText = clamp(smoothProgress / 0.38);
      const easeText = pText < 0.5 ? 4 * pText * pText * pText : 1 - Math.pow(-2 * pText + 2, 3) / 2;
      const shiftX = maxShiftX * easeText;
      heroCopy.style.setProperty('--hc-shift-x', `${shiftX.toFixed(1)}px`);
    } else if (heroCopy) {
      heroCopy.style.removeProperty('--hc-shift-x');
    }

    // Map scroll progress so the mark finishes taking shape SLIGHTLY EARLIER (by ~0.60 scroll travel)
    const animProgress = clamp(smoothProgress / 0.60);

    // Frontal orientation ensures the 2D logo silhouette is 100% authentic, while mouse tilt provides interactive 3D responsiveness
    const rotX = camTiltX;
    const rotY = camTiltY;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);


    // Volumetric Glow Aura Backdrop behind the Assembling Mark (Subtle & Broadly Spreaded)
    const glowStrength = clamp((animProgress - 0.20) / 0.55);
    if (glowStrength > 0.01) {
      // Widely spread across the canvas stage (subtle ambient warmth)
      const glowRadius = Math.max(canvasW, canvasH) * (isDesktop ? 0.85 : 0.70);
      const pulse = 1 + Math.sin(time * 1.6) * 0.03;
      const aura = pCtx.createRadialGradient(
        stageCenterX, stageCenterY, glowRadius * 0.04,
        stageCenterX, stageCenterY, glowRadius * pulse
      );
      // Soft, subtle, feathered warm ember aura without concentrated harsh edges
      aura.addColorStop(0, `rgba(255, 120, 20, ${(0.058 * glowStrength).toFixed(3)})`);
      aura.addColorStop(0.30, `rgba(255, 90, 15, ${(0.032 * glowStrength).toFixed(3)})`);
      aura.addColorStop(0.60, `rgba(255, 110, 0, ${(0.014 * glowStrength).toFixed(3)})`);
      aura.addColorStop(0.85, `rgba(255, 130, 20, ${(0.004 * glowStrength).toFixed(3)})`);
      aura.addColorStop(1, 'rgba(255, 130, 20, 0)');

      pCtx.save();
      pCtx.fillStyle = aura;
      pCtx.beginPath();
      pCtx.arc(stageCenterX, stageCenterY, glowRadius * pulse, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    }

    // Global opacity ramp: at scroll 0, opacity is very low (~0.08) so background isn't intense.
    // Progressively strengthens as user scrolls down!
    const scrollOpacityRamp = 0.08 + 0.92 * clamp(animProgress / 0.46);

    const activeList = [];
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];

      // Progressive particle emergence: only draw if particle has awakened
      if (animProgress < p.spawnProgress) {
        continue;
      }

      // Smooth fade-in for newly emerged dots
      const spawnFade = p.spawnProgress === 0
        ? 1
        : clamp((animProgress - p.spawnProgress) / 0.10);

      // Normalized local accumulation factor with staggered delay
      const pLocal = clamp((animProgress - p.delay * 0.22) / (1 - p.delay * 0.22));
      const ease = pLocal < 0.5 
        ? 4 * pLocal * pLocal * pLocal 
        : 1 - Math.pow(-2 * pLocal + 2, 3) / 2;

      // Spiral vortex turbulence (Phases 2 & 3)
      const swirlFactor = Math.sin(ease * Math.PI) * (1 - ease * 0.88);
      const swirlAngle = swirlFactor * 3.2 + p.swirlPhase + time * p.swirlSpeed;
      const swirlX = Math.cos(swirlAngle) * swirlFactor * 105;
      const swirlY = Math.sin(swirlAngle) * swirlFactor * 105;

      // LIVING CONTINUOUS MOTION & SUBTLE SCATTER:
      // Even in the final assembled state (ease = 1), dots slightly keep moving with organic breathing micro-drift!
      const aliveDriftRadius = 1.6 + p.radius * 0.45;
      const aliveX = Math.sin(time * p.driftSpeed * 1.6 + p.driftPhaseX) * aliveDriftRadius;
      const aliveY = Math.cos(time * p.driftSpeed * 1.4 + p.driftPhaseY) * aliveDriftRadius;
      const aliveWave = Math.sin(time * 2.2 + (p.tx + p.ty) * 0.015) * 1.1;

      const driftX = (1 - ease) * Math.sin(time * p.driftSpeed + p.driftPhaseX) * 11 
                   + ease * (aliveX + aliveWave * 0.4);
      const driftY = (1 - ease) * Math.cos(time * p.driftSpeed + p.driftPhaseY) * 11 
                   + ease * (aliveY + aliveWave * 0.4);

      // Initial coordinates distributed across screen at scroll 0
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

      // Calculate final alpha incorporating global ramp and spawn fade
      let alpha = clamp(p.baseAlpha * scrollOpacityRamp * spawnFade * (0.32 + proj * 0.68), 0.03, 0.98);

      // Clear out particles in the left text zone as text glides left
      const leftVignetteActive = clamp((smoothProgress - 0.12) / 0.30);
      if (isDesktop && leftVignetteActive > 0 && screenX < canvasW * 0.48) {
        const mask = Math.max(0, (screenX - canvasW * 0.30) / (canvasW * 0.18));
        alpha *= (1 - leftVignetteActive) + leftVignetteActive * mask;
      } else if (!isDesktop) {
        const textLimit = canvasH * 0.52;
        if (screenY < textLimit) {
          alpha *= Math.max(0, (screenY - (textLimit - 50)) / 50);
        }
      }

      if (alpha <= 0.02) continue;

      // Subtle tactile cursor ripple
      let pushX = 0, pushY = 0;
      if (rawMouseX > 0 && rawMouseY > 0) {
        const dx = screenX - rawMouseX;
        const dy = screenY - rawMouseY;
        const dSq = dx * dx + dy * dy;
        if (dSq < 6400 && dSq > 1) {
          const d = Math.sqrt(dSq);
          const force = (1 - d / 80) * 14 * ease;
          pushX = (dx / d) * force;
          pushY = (dy / d) * force;
        }
      }

      // Perspective radius scaling for palpable 3D depth
      const radius = Math.max(0.65, p.radius * Math.pow(proj, 1.25));

      activeList.push({
        p,
        screenX: screenX + pushX,
        screenY: screenY + pushY,
        z2,
        proj,
        radius,
        alpha,
        ease
      });
    }

    // Sort back-to-front (depth-buffer / Painter's algorithm for genuine 3D occlusion)
    activeList.sort((a, b) => a.z2 - b.z2);

    const activeCount = activeList.length;
    for (let i = 0; i < activeCount; i++) {
      const item = activeList[i];
      const { p, screenX, screenY, z2, proj, radius, alpha, ease } = item;

      // Volumetric Depth Shading:
      // Front particles are bright & saturated; back particles recede in deep shadow
      const depthFactor = clamp((z2 + 130) / 260); // 0 (deep shadow) to 1 (bright foreground)
      const isFront = z2 > 0;

      let fillColor;
      if (p.colorType === 'red') {
        const r = Math.round(200 + 55 * depthFactor);
        const g = Math.round(20 + 38 * depthFactor);
        const b = Math.round(14 + 26 * depthFactor);
        fillColor = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      } else if (p.colorType === 'orange') {
        const r = 255;
        const g = Math.round(80 + 60 * depthFactor);
        const b = Math.round(0 + 32 * depthFactor);
        fillColor = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      } else {
        const k = Math.round(10 + 16 * depthFactor);
        fillColor = `rgba(${k}, ${k}, ${k}, ${alpha.toFixed(3)})`;
      }

      // Particle Glow on assembled warm particles (subtle & refined)
      if (glowStrength > 0.05 && (p.colorType === 'red' || p.colorType === 'orange') && isFront) {
        pCtx.shadowColor = p.colorType === 'orange' ? 'rgba(255, 140, 20, 0.40)' : 'rgba(229, 46, 32, 0.35)';
        pCtx.shadowBlur = Math.round((1.0 + proj * 1.5) * glowStrength);
      } else {
        pCtx.shadowBlur = 0;
      }

      pCtx.fillStyle = fillColor;
      pCtx.beginPath();
      pCtx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      pCtx.fill();

      // Specular incandescent spark on the front-most warm particles
      if (ease > 0.65 && z2 > 10 && (p.colorType === 'red' || p.colorType === 'orange')) {
        pCtx.shadowBlur = 0;
        const sparkAlpha = alpha * 0.75 * glowStrength;
        pCtx.fillStyle = `rgba(255, 246, 224, ${sparkAlpha.toFixed(3)})`;
        pCtx.beginPath();
        pCtx.arc(screenX, screenY, radius * 0.40, 0, Math.PI * 2);
        pCtx.fill();
      }
    }
    pCtx.shadowBlur = 0;

    requestAnimationFrame(renderParticleFrame);
  }

  // Hook scroll updates
  const updateHero = () => {
    if (!heroSection) return;
    const range = Math.max(1, heroSection.offsetHeight - window.innerHeight);
    const progress = clamp(-heroSection.getBoundingClientRect().top / range);
    targetProgress = progress;
  };

  initParticleSystem();
// =========================================================================
  // STAGE B: INTERACTIVE CONTROLLERS (FILTERS, LIGHTBOX, CLEAN NAVIGATION)
  // =========================================================================

  // --- WORK BRAND FILTERING ---
  const workFilters = [...document.querySelectorAll('.gallery-filter-btn')];
  const flagshipCard = document.querySelector('.project-flagship');
  const projectCards = [...document.querySelectorAll('.project-card')];

  workFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      workFilters.forEach(b => b.classList.toggle('is-active', b === btn));

      if (flagshipCard) {
        const matchFlagship = filter === 'all' || flagshipCard.dataset.brand === filter;
        flagshipCard.classList.toggle('is-hidden', !matchFlagship);
      }

      projectCards.forEach(card => {
        const match = filter === 'all' || card.dataset.brand === filter;
        card.classList.toggle('is-hidden', !match);
      });
    });
  });

  // --- CAMPAIGNS & SOCIAL FILTERING ---
  const socialFilters = [...document.querySelectorAll('.social-filter-btn')];
  const campaignTiles = [...document.querySelectorAll('.campaign-tile')];

  socialFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.socialFilter;
      socialFilters.forEach(b => b.classList.toggle('is-active', b === btn));

      campaignTiles.forEach(tile => {
        const match = filter === 'all' || tile.dataset.campaign === filter;
        tile.classList.toggle('is-hidden', !match);
      });
    });
  });

  // --- UNIVERSAL ARTWORK LIGHTBOX MODAL ---
  const dialog = document.getElementById('artwork-dialog');
  const dialogImg = document.getElementById('dialog-stage-img');
  const dialogTitle = document.getElementById('dialog-title');
  const dialogDesc = document.getElementById('dialog-desc');
  const dialogOpenExt = document.getElementById('dialog-open-original');
  const dialogCloseBtn = document.getElementById('dialog-close-btn');

  let lastFocusedElement = null;

  const openLightbox = (src, title, desc) => {
    if (!dialog || !dialogImg) return;
    lastFocusedElement = document.activeElement;

    dialogImg.src = src;
    dialogImg.alt = title || 'Artwork preview';
    if (dialogTitle) dialogTitle.textContent = title || 'Master Artwork';
    if (dialogDesc) dialogDesc.textContent = desc || '';
    if (dialogOpenExt) dialogOpenExt.href = src;

    dialog.showModal();
    dialogCloseBtn?.focus();
  };

  const closeLightbox = () => {
    if (!dialog || !dialog.open) return;
    dialog.close();
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  };

  dialogCloseBtn?.addEventListener('click', closeLightbox);

  // Close on backdrop click
  dialog?.addEventListener('click', e => {
    if (e.target === dialog) closeLightbox();
  });

  // Close on escape key
  dialog?.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Wire up zoom trigger on all elements with data-zoom-src
  document.querySelectorAll('[data-zoom-src]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('a')) return; // Allow natural links
      const src = el.dataset.zoomSrc;
      const title = el.dataset.zoomTitle;
      const desc = el.dataset.zoomDesc;
      if (src) openLightbox(src, title, desc);
    });
  });

  // --- CONTACT FORM SUBMISSION VIA MAILTO ---
  const enquiryForm = document.getElementById('enquiry-form');
  enquiryForm?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(enquiryForm);
    const needs = data.getAll('need').join(', ') || 'General branding inquiry';
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

  // --- SMOOTH INTERNAL ANCHOR NAVIGATION ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href === '#' || href === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        history.pushState(null, '', '#top');
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 76;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, targetPos), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        history.pushState(null, '', href);
      }
    });
  });


  // --- SELECTED BRAND IDENTITIES: 3D PERSPECTIVE SCROLL STACK & BOTTOM PILL DOCK ---
  const flowSection = document.querySelector('#work.process-flow');
  const flowTags = [...document.querySelectorAll('.flow-tag[data-flow-step]')];
  const flowObjects = [...document.querySelectorAll('[data-flow-object]')];
  const dockCta = document.getElementById('flow-dock-cta');
  const dockBtnText = dockCta ? dockCta.querySelector('.dock-btn-text') : null;

  const brandData = [
    { name: 'Tripty Foods', href: 'case-tripty.html' },
    { name: 'Noréa', href: 'case-norea.html' },
    { name: 'Atuendo', href: 'case-atuendo.html' },
    { name: 'All Organics', href: 'case-allorganics.html' },
    { name: 'Sandbox Lounge', href: 'case-sandbox.html' }
  ];

  const updateFlow = () => {
    if (!flowSection || !flowObjects.length) return;
    const isDesktop = window.innerWidth > 980 && !reduceMotion.matches;
    if (!isDesktop) {
      flowObjects.forEach(obj => {
        obj.style.removeProperty('--flow-x');
        obj.style.removeProperty('--flow-y');
        obj.style.removeProperty('--flow-z');
        obj.style.removeProperty('--flow-r');
        obj.style.removeProperty('--flow-scale');
        obj.style.removeProperty('--flow-opacity');
        obj.style.removeProperty('pointer-events');
        obj.style.removeProperty('z-index');
      });
      return;
    }

    const headerOffset = flowSection.querySelector('.flow-header')?.offsetHeight || 120;
    const totalTravel = Math.max(1, flowSection.offsetHeight - window.innerHeight);
    const effectiveTravel = Math.max(1, totalTravel - headerOffset);
    const scrolled = -flowSection.getBoundingClientRect().top - headerOffset;
    const progress = clamp(scrolled / effectiveTravel);
    const active = clamp(Math.floor(progress * flowObjects.length), 0, flowObjects.length - 1);

    flowObjects.forEach((object, index) => {
      const distance = index - active;
      const absDist = Math.abs(distance);

      if (absDist > 2) {
        object.style.setProperty('--flow-opacity', '0');
        object.style.setProperty('pointer-events', 'none');
        object.style.zIndex = '0';
        object.classList.remove('is-active');
        return;
      }

      object.style.setProperty('--flow-x', `${distance * 34}px`);
      object.style.setProperty('--flow-y', `${absDist * 16}px`);
      object.style.setProperty('--flow-z', `${-absDist * 135}px`);
      object.style.setProperty('--flow-r', `${distance * -2.8}deg`);
      object.style.setProperty('--flow-scale', `${1 - Math.min(0.14, absDist * 0.045)}`);
      object.style.setProperty('--flow-opacity', `${clamp(1.1 - absDist * 0.32, 0.15, 1)}`);
      object.style.setProperty('pointer-events', index === active ? 'auto' : 'none');
      object.style.zIndex = index === active ? '20' : `${10 - absDist}`;
      object.classList.toggle('is-active', index === active);
    });

    flowTags.forEach((tag, index) => {
      const isActive = index === active;
      tag.classList.toggle('is-active', isActive);
      tag.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (brandData[active]) {
      if (dockCta) {
        dockCta.href = brandData[active].href;
        dockCta.setAttribute('aria-label', `Explore ${brandData[active].name} full case study`);
      }
      if (dockBtnText && dockBtnText.textContent !== `Explore ${brandData[active].name}`) {
        dockBtnText.textContent = `Explore ${brandData[active].name}`;
      }
    }
  };

  flowTags.forEach(tag => {
    tag.addEventListener('click', () => {
      if (!flowSection) return;
      const index = Number(tag.dataset.flowStep);
      const isDesktop = window.innerWidth > 980 && !reduceMotion.matches;
      if (isDesktop) {
        const headerOffset = flowSection.querySelector('.flow-header')?.offsetHeight || 120;
        const totalTravel = Math.max(1, flowSection.offsetHeight - window.innerHeight);
        const effectiveTravel = Math.max(1, totalTravel - headerOffset);
        const target = flowSection.offsetTop + headerOffset + effectiveTravel * ((index + 0.5) / flowObjects.length);
        window.scrollTo({ top: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      } else {
        const obj = flowObjects[index];
        if (obj) {
          const headerNavOffset = 80;
          const target = obj.getBoundingClientRect().top + window.scrollY - headerNavOffset;
          window.scrollTo({ top: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        }
      }
    });
  });
  // --- CLEAN TICKER & SMOOTH INITIALIZATION ---
  let isTicking = false;
  const onScroll = () => {
    updateHeader();
    updateHero();
    updateFlow();
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
