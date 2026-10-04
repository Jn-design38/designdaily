(() => {
  'use strict';

  const root = document.documentElement;
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const heroArt = document.querySelector('.hero-art');
  const form = document.querySelector('#enquiry-form');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  if (heroArt && !reduceMotion.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    heroArt.addEventListener('pointermove', event => {
      const box = heroArt.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      heroArt.style.setProperty('--tilt-x', `${(y * -3).toFixed(2)}deg`);
      heroArt.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
    });
    heroArt.addEventListener('pointerleave', () => {
      heroArt.style.setProperty('--tilt-x', '0deg');
      heroArt.style.setProperty('--tilt-y', '0deg');
    });
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent(`Design Daily project enquiry — ${data.get('business')}`);
    const body = encodeURIComponent(`Name: ${data.get('name')}\nBusiness / role: ${data.get('business')}\n\nWhat should we make clearer?\n${data.get('message')}`);
    window.location.href = `mailto:julkarnineXdesigndaily@gmail.com?subject=${subject}&body=${body}`;
  });

  const flowSection = document.querySelector('#process');
  const flowSteps = [...document.querySelectorAll('[data-flow-step]')];
  const flowObjects = [...document.querySelectorAll('[data-flow-object]')];
  const flowCounter = document.querySelector('.flow-counter-current');
  let flowFrame = 0;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const updateFlow = () => {
    flowFrame = 0;
    if (!flowSection || !flowObjects.length) return;
    const range = Math.max(1, flowSection.offsetHeight - window.innerHeight);
    const progress = clamp(-flowSection.getBoundingClientRect().top / range);
    const active = Math.min(flowObjects.length - 1, Math.round(progress * (flowObjects.length - 1)));
    flowObjects.forEach((object, index) => {
      const distance = index - active;
      object.style.setProperty('--flow-x', `${distance * 24}px`);
      object.style.setProperty('--flow-y', `${Math.abs(distance) * 16}px`);
      object.style.setProperty('--flow-z', `${-Math.abs(distance) * 120}px`);
      object.style.setProperty('--flow-r', `${distance * -3.5}deg`);
      object.style.setProperty('--flow-scale', `${1 - Math.min(.13, Math.abs(distance) * .035)}`);
      object.style.setProperty('--flow-opacity', `${clamp(1.12 - Math.abs(distance) * .23, .14, 1)}`);
      object.classList.toggle('is-active', index === active);
    });
    flowSteps.forEach((step, index) => step.classList.toggle('is-active', index === active));
    if (flowCounter) flowCounter.textContent = String(active + 1).padStart(2, '0');
  };
  if (flowSection) {
    const scheduleFlow = () => { if (!flowFrame) flowFrame = requestAnimationFrame(updateFlow); };
    window.addEventListener('scroll', scheduleFlow, { passive: true });
    window.addEventListener('resize', scheduleFlow);
    flowSteps.forEach(step => step.querySelector('button')?.addEventListener('click', () => {
      const index = Number(step.dataset.flowStep);
      const target = flowSection.offsetTop + (flowSection.offsetHeight - window.innerHeight) * (index / (flowObjects.length - 1));
      window.scrollTo({ top: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }));
    updateFlow();
  }

  root.classList.add('site-ready');
})();
