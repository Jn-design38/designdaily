/* Native scrolling, one scheduled frame, four independent spatial scenes. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const ease = amount => amount * amount * (3 - 2 * amount);
  const style = (element, property, value, unit = '') => element?.style.setProperty(`--${property}`, `${value}${unit}`);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 901px) and (min-height: 620px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const motionButton = $('.motion-toggle');
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('design-daily-motion'); } catch {}
  let motion = savedMotion === null ? !reduce.matches : savedMotion === 'on' && !reduce.matches;
  let frame = 0;
  let geometry = new Map();
  const chapters = $$('[data-chapter]');
  const hero = $('.hero');
  const work = $('.work-section');
  const system = $('.system-section');
  const content = $('.content-section');
  const manifesto = $('.manifesto');
  const interlude = $('.type-interlude');
  const contact = $('.contact');
  const heroArt = $('.hero-art');
  const cards = $$('.project-card');
  const projectButtons = $$('[data-go-project]');
  const layers = { logo: $('.layer-logo'), palette: $('.layer-palette'), layout: $('.layer-layout') };
  const systemSteps = $$('.system-steps li');
  const posts = $$('.social-post');
  const reading = $('.reading-text');
  // Keep the heading's accessible name intact while revealing its individual words.
  const accessibleReading = reading.textContent;
  reading.setAttribute('aria-label', accessibleReading);
  const splitWords = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part.trim()) { fragment.append(document.createTextNode(part)); return; }
          const word = document.createElement('span');
          word.className = 'word'; word.textContent = part; word.setAttribute('aria-hidden', 'true');
          fragment.append(word);
        });
        child.replaceWith(fragment);
      } else splitWords(child);
    }
  };
  splitWords(reading);
  const words = $$('.reading-text .word');
  let selectedProject = -1;

  function measure() {
    geometry = new Map([...chapters, ...cards].map(element => {
      const rect = element.getBoundingClientRect();
      return [element, { top: rect.top + scrollY, height: element.offsetHeight }];
    }));
    schedule();
  }
  const progress = (element, pinned = false) => {
    const box = geometry.get(element);
    if (!box) return 0;
    return pinned
      ? clamp((scrollY - box.top) / Math.max(1, box.height - innerHeight))
      : clamp((scrollY + innerHeight - box.top) / (box.height + innerHeight));
  };
  function selectProject(index) {
    if (selectedProject === index) return;
    selectedProject = index;
    projectButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  function resetTransforms() {
    [hero, heroArt, manifesto, interlude, system, content, contact, ...cards, ...posts, ...Object.values(layers)].forEach(element => element?.removeAttribute('style'));
  }
  function setMotion(enabled, preservePlace = true) {
    // If the setting changes mid-page, hold the reader in the same chapter.
    const current = chapters.find(element => { const r = element.getBoundingClientRect(); return r.top <= 120 && r.bottom > 120; });
    const offset = current?.getBoundingClientRect().top ?? 0;
    motion = enabled;
    root.dataset.motion = motion ? 'on' : 'off';
    root.classList.toggle('motion-active', motion);
    motionButton.setAttribute('aria-pressed', String(!motion));
    motionButton.setAttribute('aria-label', motion ? 'Pause scroll animation' : 'Enable scroll animation');
    $('.motion-label').textContent = motion ? 'Motion on' : 'Motion off';
    $('.motion-symbol').textContent = motion ? 'Ⅱ' : '▷';
    resetTransforms();
    requestAnimationFrame(() => {
      if (preservePlace && current) {
        const next = current.getBoundingClientRect();
        const boundedOffset = Math.max(offset, -(current.offsetHeight - 160));
        window.scrollTo({ top: scrollY + next.top - boundedOffset, behavior: 'instant' });
      }
      measure();
    });
  }
  motionButton.addEventListener('click', () => {
    setMotion(!motion);
    try { localStorage.setItem('design-daily-motion', motion ? 'on' : 'off'); } catch {}
  });
  reduce.addEventListener('change', () => setMotion(!reduce.matches));
  wide.addEventListener('change', () => { resetTransforms(); measure(); });

  const menu = $('.menu-toggle');
  const nav = $('.nav');
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open menu');
  }
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !event.target.closest('.site-header')) closeMenu();
  });
  $$('.nav a').forEach(link => link.addEventListener('click', closeMenu));
  // Keep browser history and keyboard focus useful with in-page navigation.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    const targetY = target.getBoundingClientRect().top + scrollY;
    const pinnedTarget = motion && wide.matches && target.classList.contains('scroll-scene');
    window.scrollTo({ top: Math.max(0, targetY - (pinnedTarget ? 0 : 90)), behavior: motion ? 'smooth' : 'instant' });
    history.replaceState(null, '', link.hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }));
  projectButtons.forEach((button, index) => button.addEventListener('click', () => {
    if (motion && wide.matches) {
      const box = geometry.get(work);
      window.scrollTo({ top: box.top + (box.height - innerHeight) * (.1 + index * .4), behavior: 'smooth' });
    } else {
      cards[index].scrollIntoView({ behavior: motion ? 'smooth' : 'instant', block: 'center' });
    }
    selectProject(index);
  }));

  // The enquiry opens an email draft; it never reports that a message was sent.
  $('#enquiry-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const subject = encodeURIComponent('Design Daily project enquiry — ' + data.get('business'));
    const body = encodeURIComponent(`Name: ${data.get('name')}\nBusiness / role: ${data.get('business')}\n\nWhat should we make clearer?\n${data.get('message')}`);
    window.location.href = `mailto:julkarnineXdesigndaily@gmail.com?subject=${subject}&body=${body}`;
  });
  heroArt.addEventListener('pointermove', event => {
    if (!motion || !fine.matches || !wide.matches) return;
    const rect = heroArt.getBoundingClientRect();
    style(heroArt, 'pointer-x', ((event.clientX - rect.left) / rect.width - .5) * 8, 'deg');
    style(heroArt, 'pointer-y', -((event.clientY - rect.top) / rect.height - .5) * 7, 'deg');
  });
  heroArt.addEventListener('pointerleave', () => {
    style(heroArt, 'pointer-x', 0, 'deg'); style(heroArt, 'pointer-y', 0, 'deg');
  });

  function render() {
    frame = 0;
    const maxScroll = Math.max(1, root.scrollHeight - innerHeight);
    const total = clamp(scrollY / maxScroll);
    $('.scroll-progress-track i').style.transform = `scaleX(${total})`;
    $('.scroll-percent').textContent = `${String(Math.round(total * 100)).padStart(2, '0')}%`;
    let chapter = chapters[0];
    chapters.forEach(element => { if (geometry.get(element)?.top < scrollY + innerHeight * .45) chapter = element; });
    $('.scroll-status-label').textContent = chapter.dataset.chapter;
    if (!motion) return;
    const pinned = wide.matches;
    const hp = progress(hero, pinned);
    if (pinned) {
      style(hero, 'copy-y', -hp * 70, 'px'); style(hero, 'copy-opacity', 1 - hp * .25);
      style(hero, 'photo-x', hp * 115, 'px'); style(hero, 'photo-y', -hp * 100, 'px'); style(hero, 'photo-z', -hp * 150, 'px');
      style(hero, 'photo-ry', mix(-12, -32, hp), 'deg'); style(hero, 'photo-r', mix(8, 20, hp), 'deg');
      style(hero, 'type-x', -hp * 105, 'px'); style(hero, 'type-y', hp * 100, 'px'); style(hero, 'type-z', mix(60, 160, hp), 'px');
      style(hero, 'type-ry', mix(12, 28, hp), 'deg'); style(hero, 'type-r', mix(-10, -20, hp), 'deg');
      style(hero, 'label-y', -hp * 170, 'px'); style(hero, 'swatch-x', hp * 80, 'px'); style(hero, 'swatch-y', hp * 40, 'px');
    }
    const mp = progress(manifesto);
    const wordProgress = clamp((mp - .16) / .42);
    words.forEach((word, index) => word.classList.toggle('read', index / words.length <= wordProgress));
    style(manifesto, 'asterisk-turn', mp * 150, 'deg');
    const wp = progress(work, pinned);
    if (pinned) {
      const position = clamp((wp - .1) / .8) * 2;
      const spacing = Math.min(innerWidth * .41, 610);
      cards.forEach((card, index) => {
        const distance = index - position;
        style(card, 'card-x', distance * spacing, 'px');
        style(card, 'card-y', Math.abs(distance) * 20, 'px');
        style(card, 'card-z', -Math.abs(distance) * 260, 'px');
        style(card, 'card-ry', distance * -32, 'deg');
        style(card, 'card-rz', distance * 4, 'deg');
        style(card, 'card-opacity', clamp(1.35 - Math.abs(distance) * .48, .12, 1));
        style(card, 'card-light', clamp(1 - Math.abs(distance) * .13, .65, 1));
        style(card, 'card-order', 10 - Math.round(Math.abs(distance) * 3));
      });
      selectProject(Math.round(position));
    } else {
      cards.forEach(card => style(card, 'mobile-card-ry', (progress(card) - .5) * -12, 'deg'));
    }
    const tp = progress(interlude);
    style(interlude, 'line-one-x', (tp - .5) * -innerWidth * .11, 'px');
    style(interlude, 'line-two-x', (tp - .5) * innerWidth * .11, 'px');
    const sp = progress(system, pinned);
    const spread = pinned ? ease(clamp((sp - .08) / .75)) : .4;
    const scale = pinned ? 1 : .65;
    style(layers.logo, 'logo-y', mix(-35, -95, spread) * scale, 'px');
    style(layers.logo, 'logo-x', mix(0, -48, spread) * scale, 'px');
    style(layers.logo, 'logo-z', mix(70, 95, spread), 'px');
    style(layers.logo, 'logo-rx', mix(5, 18, spread), 'deg');
    style(layers.logo, 'logo-ry', mix(-16, -28, spread), 'deg');
    style(layers.logo, 'logo-rz', mix(-8, -12, spread), 'deg');
    style(layers.palette, 'palette-y', mix(15, 50, spread) * scale, 'px');
    style(layers.palette, 'palette-x', mix(20, 0, spread) * scale, 'px');
    style(layers.palette, 'palette-ry', mix(-16, -20, spread), 'deg');
    style(layers.palette, 'palette-rz', mix(2, 0, spread), 'deg');
    style(layers.layout, 'layout-y', mix(90, 205, spread) * scale, 'px');
    style(layers.layout, 'layout-x', mix(40, 48, spread) * scale, 'px');
    style(layers.layout, 'layout-z', mix(-80, 0, spread), 'px');
    style(layers.layout, 'layout-ry', mix(-16, -12, spread), 'deg');
    style(layers.layout, 'layout-rz', mix(12, 8, spread), 'deg');
    systemSteps.forEach((step, index) => step.classList.toggle('active', !pinned || index === Math.min(2, Math.floor(sp * 3))));
    const cp = progress(content, pinned);
    if (pinned) {
      style(content, 'grid-rx', mix(34, -5, ease(cp)), 'deg');
      style(content, 'grid-rz', mix(-10, 3, ease(cp)), 'deg');
      style(content, 'grid-z', mix(-180, 0, cp), 'px');
      style(content, 'grid-y', mix(30, -15, cp), 'px');
      posts.forEach((post, i) => {
        style(post, 'post-y', Math.sin(i * 1.5) * (1 - cp) * 50, 'px');
        style(post, 'post-z', (i % 2 ? 1 : -1) * (1 - cp) * 55, 'px');
        style(post, 'post-ry', (i - 2.5) * (1 - cp) * -8, 'deg');
      });
    }
    style(content, 'leaf-x', mix(80, -80, cp), 'px');
    style(content, 'leaf-y', mix(90, -180, cp) * (pinned ? 1 : .3), 'px');
    style(content, 'leaf-z', mix(50, 200, cp), 'px');
    style(content, 'leaf-r', mix(-25, 12, cp), 'deg');
    style(contact, 'contact-turn', (progress(contact) - .5) * 24, 'deg');
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) measure(); });
  $$('details').forEach(details => details.addEventListener('toggle', measure));
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  const initialHash = location.hash;
  document.fonts?.ready.then(() => {
    measure();
    // Font loading and enhanced section heights must not displace a deep link.
    const initialTarget = initialHash && document.getElementById(initialHash.slice(1));
    if (initialTarget && location.hash === initialHash) requestAnimationFrame(() => {
      const pinnedTarget = motion && wide.matches && initialTarget.classList.contains('scroll-scene');
      window.scrollTo({ top: Math.max(0, initialTarget.getBoundingClientRect().top + scrollY - (pinnedTarget ? 0 : 90)), behavior: 'instant' });
    });
  });
  setMotion(motion, false);
  measure();
})();
