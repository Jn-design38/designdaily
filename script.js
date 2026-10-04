/* Native scrolling, one scheduled frame, eight independent spatial scenes. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const ease = amount => amount * amount * (3 - 2 * amount);
  const style = (element, property, value, unit = '') => element?.style.setProperty(`--${property}`, `${value}${unit}`);
  const root = document.documentElement;
  root.classList.add('butter-clean');
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
  const caseSection = $('.case-section');
  const caseSteps = $('.case-steps li');
  const brandDesk = $('.morrow-desk');
  const brandObjects = $('.morrow-objects');
  const brandCampaign = $('.morrow-campaign');
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
  let posts = $$('.social-post');
  let serviceCards = [];
  let serviceSteps = [];
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

  function configureJourney() {
    const heading = $('.content-heading h2');
    const intro = $('.content-heading p');
    if (heading) heading.innerHTML = 'From sketch.<br><span class="light-type">To seen.</span>';
    if (intro) intro.innerHTML = 'A designer turns a rough thought into a brand people notice.<br>One clear idea, carried all the way through.';
    if (interlude) {
      interlude.setAttribute('aria-label', 'Services from one brand idea');
      interlude.innerHTML = `<div class="service-head"><div><span class="kicker">One idea. Every angle.</span><h2>Make the idea<br><span class="light-type">travel further.</span></h2></div><p>One clear point of view, carried into every place<br>your audience meets the brand.</p></div><div class="service-layout"><ol class="service-list" aria-label="Services"><li class="is-active" data-service="identity"><span>01</span><div><strong>Brand identity</strong><small>Find the voice and the visual rules.</small></div></li><li data-service="packaging"><span>02</span><div><strong>Packaging</strong><small>Make the shelf feel unmistakably yours.</small></div></li><li data-service="posters"><span>03</span><div><strong>Posters &amp; campaigns</strong><small>Give the idea a room to speak.</small></div></li><li data-service="billboard"><span>04</span><div><strong>Billboard &amp; space</strong><small>Turn attention into a place people remember.</small></div></li><li data-service="social"><span>05</span><div><strong>Social content</strong><small>Keep the system moving every day.</small></div></li></ol><div class="service-stage" aria-live="polite"><div class="service-stage-top"><span>Sandbox Lounge / applications</span><span class="service-stage-count">01 / 05</span></div><div class="service-cards"><figure class="service-card service-identity is-active"><img src="assets/service-identity.png" alt="Sandbox Lounge brand identity board with navy, charcoal, slate blue, and golden yellow materials" loading="lazy"><figcaption><span>01 / IDENTITY</span><strong>The system starts<br>with a point of view.</strong></figcaption></figure><figure class="service-card service-packaging"><img src="assets/service-packaging.png" alt="Sandbox Lounge packaging mockup with navy coffee bag and golden yellow symbol" loading="lazy"><figcaption><span>02 / PACKAGING</span><strong>Put the idea<br>in their hands.</strong></figcaption></figure><figure class="service-card service-posters"><img src="assets/service-posters.png" alt="Sandbox Lounge poster mockup on a deep navy wall with golden yellow graphic" loading="lazy"><figcaption><span>03 / CAMPAIGNS</span><strong>Let the idea<br>take up space.</strong></figcaption></figure><figure class="service-card service-billboard"><img src="assets/service-billboard.png" alt="Sandbox Lounge billboard and facade mockup at dusk" loading="lazy"><figcaption><span>04 / PLACE</span><strong>Make the world<br>recognise it.</strong></figcaption></figure><figure class="service-card service-social"><img src="assets/service-social.png" alt="Sandbox Lounge social media campaign mockup on a phone and square cards" loading="lazy"><figcaption><span>05 / SOCIAL</span><strong>Keep it familiar<br>in the everyday.</strong></figcaption></figure></div></div></div><div class="interlude-foot"><span>A logo is the beginning.</span><span>The system is what makes it yours.</span></div>`;
      serviceSteps = $$('.service-list li');
      serviceCards = $$('.service-card');
    }
    const systemHeading = $('.system-copy h2');
    const systemIntro = $('.system-intro');
    if (systemHeading) systemHeading.innerHTML = 'A clear route.<br><span class="light-type">More than a mark.</span>';
    if (systemIntro) systemIntro.textContent = 'Start with evidence, shape a direction, then make it useful in the places your clients meet people.';
    const systemCopy = [['01', 'Find the direction.', 'Search the category, gather signals, define the opportunity.'], ['02', 'Build the system.', 'Turn the direction into a clear visual language people can recognise.'], ['03', 'Make it useful.', 'Give clients assets they can use, repeat, and grow with.']];
    systemSteps.forEach((step, index) => {
      const [number, title, copy] = systemCopy[index];
      step.querySelector('span').textContent = number;
      step.querySelector('h3').textContent = title;
      step.querySelector('p').textContent = copy;
    });
    const systemCards = [
      ['layer-logo', '01 / DISCOVER', 'Find the direction.', 'Search the category. Gather the signals. Define the opportunity.', 'web search  ·  positioning  ·  direction'],
      ['layer-palette', '02 / DESIGN', 'Build the system.', 'Shape the mark, palette, type, and templates into one language.', 'concept  ·  critique  ·  identity system'],
      ['layer-layout', '03 / BENEFIT', 'Make it useful.', 'Give clients a toolkit they can use, repeat, and grow with.', 'clarity  ·  consistency  ·  momentum']
    ];
    systemCards.forEach(([className, kicker, title, copy, tags]) => {
      const card = $(`.${className}`);
      if (!card) return;
      card.innerHTML = `<div class="system-card-content"><span class="system-card-kicker">${kicker}</span><strong>${title}</strong><p>${copy}</p><small>${tags}</small></div>`;
      card.setAttribute('aria-label', `${kicker}. ${title} ${copy}`);
    });
    const journey = [
      { className: 'journey-sketch', html: '<img src="assets/journey-sketch-v2.png" alt="Graph-paper sketchbook with pencil studies for an architectural identity" width="1024" height="1536" loading="lazy"><span>01 / THE SKETCH</span><div class="journey-caption"><strong>It starts<br>on paper.</strong><small>One shape worth following.</small></div>' },
      { className: 'journey-direction', html: '<img src="assets/journey-identity-v2.png" alt="Orange, black and cream identity specimens developed from the sketches" width="1024" height="1536" loading="lazy"><span>02 / THE IDENTITY</span><div class="journey-caption"><strong>Then it<br>finds a voice.</strong><small>The idea becomes a system.</small></div>' },
      { className: 'journey-scene', html: '<img src="assets/journey-seen-v2.png" alt="A visitor viewing the finished architectural identity in a lobby" width="1024" height="1536" loading="lazy"><span>03 / THE WORLD</span><div class="journey-caption"><strong>Now people<br>see it.</strong><small>From the studio to real spaces.</small></div>' },
      { className: 'journey-growth', html: '<span>04 / THE MOMENTUM</span><div class="growth-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="growth-stat"><small>ILLUSTRATIVE VIEWERS</small><strong class="viewer-count">1,200</strong><span>↗</span></div><div class="journey-caption"><strong>Attention<br>grows.</strong><small>A consistent brand earns another look.</small></div>' }
    ];
    posts.forEach((post, index) => {
      const item = journey[index];
      if (!item) { post.remove(); return; }
      post.className = `social-post ${item.className}`;
      post.innerHTML = item.html;
    });
    posts = $$('.social-post');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      }), { threshold: .18 });
      posts.forEach(post => revealObserver.observe(post));
    } else posts.forEach(post => post.classList.add('is-visible'));
    $('.content-grid').setAttribute('aria-label', 'Four stages of a brand identity design journey');
    $('.content-section .section-meta span:last-child').textContent = 'The designer journey';
    $('.content-foot span').textContent = 'A designer journey / Studio concept';
    $('.content-foot .text-link').innerHTML = 'See how the system scales <span class="link-line" aria-hidden="true"></span>';
    $('.process-heading p').textContent = 'A short, clear path from question to useful files.';
    const processCopy = [['01', 'Brief it.', 'One clear problem.'], ['02', 'Make it.', 'A direction with a reason.'], ['03', 'Shape it.', 'Focused feedback, fewer loops.'], ['04', 'Use it.', 'Files ready for the next move.']];
    $$('.process-list article').forEach((article, index) => {
      const [number, title, copy] = processCopy[index];
      article.querySelector('span').textContent = number;
      article.querySelector('h3').textContent = title;
      article.querySelector('p').textContent = copy;
    });
    $('.offers-section .section-meta span:first-child').textContent = '06 / Pick your path';
    $('.offers-heading h2').innerHTML = 'Pick a<br><span class="light-type">good start.</span>';
    $('.offers-heading p').innerHTML = 'Choose your next move.<br>We will make the scope clear.';
    $$('.offer-card').forEach((card, index, all) => {
      card.setAttribute('tabindex', '0');
      card.dataset.package = String(index + 1).padStart(2, '0');
      const activate = () => all.forEach(item => item.classList.toggle('is-active', item === card));
      card.addEventListener('pointerenter', activate);
      card.addEventListener('focus', activate);
      card.addEventListener('click', activate);
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } });
    });
  }
  configureJourney();

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
    [caseSection, brandDesk, brandObjects, brandCampaign, hero, heroArt, manifesto, interlude, system, content, contact, ...cards, ...posts, ...Object.values(layers)].forEach(element => element?.removeAttribute('style'));
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
    const caseProgress = pinned ? ease(progress(caseSection, true)) : .6;
    style(caseSection, 'case-progress', caseProgress);
    const caseStep = Math.min(2, Math.floor(caseProgress * 3));
    caseSteps.forEach((step,index) => step.classList.toggle('active', !pinned || index === caseStep));
    $('.case-phase').textContent = ['01 / Start with the brief','02 / Make the idea visible','03 / Take it into the world'][caseStep];
    const deskProgress = pinned ? ease(progress(brandDesk, true)) : .65;
    style(brandDesk, 'spread', deskProgress);
    style(brandDesk, 'desk-turn', mix(-14, 9, deskProgress), 'deg');
    $('.desk-cue').textContent = deskProgress < .35 ? '01 / The first impression' : deskProgress < .72 ? '02 / Every detail connects' : '03 / Ready for the everyday';
    const objectProgress = pinned ? ease(progress(brandObjects, true)) : .5;
    style(brandObjects, 'object-progress', objectProgress);
    const campaignProgress = pinned ? ease(progress(brandCampaign, true)) : .75;
    style(brandCampaign, 'campaign-progress', campaignProgress);
    $('.campaign-cue').textContent = campaignProgress < .5 ? '01 / A street-level hello' : '02 / A daily conversation';
    const hp = progress(hero, pinned);
    if (pinned) {
      style(hero, 'copy-y', -hp * 70, 'px'); style(hero, 'copy-opacity', 1 - hp * .25);
      style(hero, 'photo-x', hp * 42, 'px'); style(hero, 'photo-y', -hp * 34, 'px'); style(hero, 'photo-z', -hp * 28, 'px');
      style(hero, 'photo-ry', mix(-7, -14, hp), 'deg'); style(hero, 'photo-r', mix(5, 9, hp), 'deg');
      style(hero, 'type-x', -hp * 38, 'px'); style(hero, 'type-y', hp * 34, 'px'); style(hero, 'type-z', mix(25, 45, hp), 'px');
      style(hero, 'type-ry', mix(6, 12, hp), 'deg'); style(hero, 'type-r', mix(-5, -9, hp), 'deg');
      style(hero, 'label-y', -hp * 60, 'px'); style(hero, 'swatch-x', hp * 34, 'px'); style(hero, 'swatch-y', hp * 20, 'px');
      style(heroArt, 'hero-orb-y', (hp - .5) * -34, 'px');
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
    const serviceProgress = ease(clamp((tp - .08) / .84));
    style(interlude, 'service-progress', serviceProgress);
    const servicePosition = serviceProgress * Math.max(0, serviceCards.length - 1);
    const activeService = Math.min(serviceCards.length - 1, Math.floor(servicePosition + .5));
    serviceSteps.forEach((step, index) => step.classList.toggle('is-active', index === activeService));
    const serviceCount = $('.service-stage-count');
    if (serviceCount) serviceCount.textContent = `${String(activeService + 1).padStart(2, '0')} / ${String(serviceCards.length).padStart(2, '0')}`;
    serviceCards.forEach((card, index) => {
      const distance = index - servicePosition;
      style(card, 'service-x', distance * 20, 'px');
      style(card, 'service-y', Math.abs(distance) * 26, 'px');
      style(card, 'service-z', -Math.abs(distance) * 90, 'px');
      style(card, 'service-scale', 1 - Math.min(.16, Math.abs(distance) * .055));
      style(card, 'service-opacity', clamp(1 - Math.abs(distance) * .52, .08, 1));
      card.classList.toggle('is-active', index === activeService);
    });
    const sp = progress(system, pinned);
    const scale = pinned ? 1 : .65;
    // Let the active stage rise to the front as the reader advances through the three steps.
    const layerPosition = pinned ? ease(clamp((sp - .04) / .92)) * 2 : 0;
    const layerNames = ['logo', 'palette', 'layout'];
    layerNames.forEach((name, index) => {
      const distance = index - layerPosition;
      const layer = layers[name];
      style(layer, `${name}-y`, distance * 24 * scale, 'px');
      style(layer, `${name}-x`, distance * 16 * scale, 'px');
      style(layer, `${name}-z`, -Math.abs(distance) * 72, 'px');
      style(layer, `${name}-rx`, 0, 'deg');
      style(layer, `${name}-ry`, 0, 'deg');
      style(layer, `${name}-rz`, distance * 2.2, 'deg');
    });
    const activeSystem = Math.min(2, Math.floor(sp * 3));
    systemSteps.forEach((step, index) => step.classList.toggle('active', !pinned || index === activeSystem));
    Object.values(layers).forEach((layer, index) => {
      layer?.classList.toggle('is-active', index === activeSystem);
      if (layer) layer.style.zIndex = String(index === activeSystem ? 12 : 5 - index);
    });
    const cp = progress(content, pinned);
    if (pinned) {
      style(content, 'grid-rx', 0, 'deg');
      style(content, 'grid-rz', 0, 'deg');
      style(content, 'grid-z', 0, 'px');
      style(content, 'grid-y', 0, 'px');
      posts.forEach((post, i) => {
        const entry = ease(clamp((cp + .22 - i * .15) / .28));
        style(post, 'post-y', mix(220, 0, entry), 'px');
        style(post, 'post-z', mix(-90, 0, entry), 'px');
        style(post, 'post-ry', 0, 'deg');
        style(post, 'post-opacity', entry, '');
      });
      const viewers = Math.round(mix(1200, 2800, ease(clamp((cp - .58) / .34))));
      $('.viewer-count').textContent = viewers.toLocaleString('en-US');
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
