(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const nav = $('.nav');
  const menu = $('.menu-toggle');
  const motionButton = $('.motion-toggle');
  const root = document.documentElement;
  const caseSection = $('.case-section');
  const caseSteps = $$('.case-steps li');
  let motion = false;

  function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open menu'); }
  menu?.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
  $$('.nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (nav.classList.contains('open') && !event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const campaigns = {
    morrow: {name:'Morrow / Specialty coffee', title:['A good','start.'], brief:'Give a neighbourhood coffee brand a warm, recognisable presence in an everyday routine.', idea:'A rising sun and a palette drawn from coffee, clay, and the morning sky.', rollout:'Carry the same identity across packaging, stationery, outdoor, social, and the shop website.', social:'social-slow'},
    roam: {name:'Roam / Outdoor goods', title:['Take the','long way.'], brief:'Build an outdoor brand for people who prefer a detour to a destination.', idea:'Topographic lines and field markings become a flexible visual system.', rollout:'Packaging, outdoor posters, social stories, and a focused landing page.', social:'social-launch'},
    lilt: {name:'Lilt / Sound & culture', title:['Make some','good noise.'], brief:'Give a listening brand an expressive identity beyond the usual tech aesthetic.', idea:'Sound becomes a visible rhythm through loops, colour, and scale.', rollout:'Headphone packaging, launch campaign, vertical stories, outdoor, and digital.', social:'social-launch'},
    soli: {name:'Soli / Everyday body care', title:['A softer','sort of day.'], brief:'Create an approachable body-care identity with a calm, human character.', idea:'Two soft forms make one memorable mark, supported by warm colour pairs.', rollout:'Bottle and carton designs, a ritual-led social series, posters, and a welcoming website.', social:'social-launch'}
  };
  function setCampaign(key) {
    const item = campaigns[key]; if (!item) return;
    $$('[data-case-brand]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.caseBrand === key)));
    $('#case-sector').textContent = item.name;
    const light = document.createElement('span'); light.className = 'light-type'; light.textContent = item.title[1];
    $('#case-title').replaceChildren(document.createTextNode(item.title[0]), document.createElement('br'), light);
    $('#case-brief').textContent = item.brief; $('#case-idea').textContent = item.idea; $('#case-rollout').textContent = item.rollout;
    $('#case-read').href = `assets/${key}/case-study.svg`;
    $('.case-sheet').src = `assets/${key}/case-study.svg`; $('.case-sheet').alt = `${item.name} campaign case study`;
    $('.case-outdoor').src = `assets/${key}/billboard.svg`; $('.case-outdoor').alt = `${item.name} outdoor campaign`;
    $('.case-social').src = `assets/${key}/${item.social}.svg`; $('.case-social').alt = `${item.name} social campaign`;
    caseSteps.forEach(step => step.classList.remove('active')); caseSteps[0]?.classList.add('active');
  }
  $$('[data-case-brand]').forEach(button => button.addEventListener('click', () => setCampaign(button.dataset.caseBrand)));
  $$('[data-select-case]').forEach(card => card.addEventListener('click', () => setCampaign(card.dataset.selectCase)));
  motionButton?.addEventListener('click', () => {
    motion = !motion; root.dataset.motion = motion ? 'on' : 'off'; motionButton.textContent = `Scroll motion: ${motion ? 'on' : 'off'}`; motionButton.setAttribute('aria-pressed', String(motion));
    if (!motion) { caseSection.style.removeProperty('--case-progress'); return; }
    const update = () => { if (!motion) return; const rect = caseSection.getBoundingClientRect(); const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height))); caseSection.style.setProperty('--case-progress', progress.toFixed(3)); caseSteps.forEach((step, index) => step.classList.toggle('active', index === Math.min(2, Math.floor(progress * 3)))); requestAnimationFrame(update); };
    requestAnimationFrame(update);
  });
  $('#enquiry-form')?.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); const subject = encodeURIComponent(`Design Daily project enquiry — ${data.get('business')}`); const body = encodeURIComponent(`Name: ${data.get('name')}\nBusiness / role: ${data.get('business')}\n\nProject:\n${data.get('message')}`); window.location.href = `mailto:julkarnineXdesigndaily@gmail.com?subject=${subject}&body=${body}`; });
  root.dataset.motion = 'off'; setCampaign('morrow');
})();
