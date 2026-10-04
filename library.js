(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const grid = $('#library-grid');
  const status = $('#library-status');
  const more = $('.library-more');
  const dialog = $('#asset-dialog');
  let assets = [], category = 'All', brand = 'All', limit = 12, current = 0, returnFocus = null;
  const curated = ['morrow-coffee-bag','roam-billboard','lilt-product-object','soli-social-editorial','morrow-business-front','roam-stationery','lilt-web-hero','soli-packaging-carton','morrow-social-pause','roam-social-story','lilt-identity','soli-case-study'];
  const filtered = () => assets.filter(a => (category === 'All' || a.category === category) && (brand === 'All' || a.brandId === brand));
  function showAsset(id) {
    const list = filtered();
    current = list.findIndex(a => a.id === id);
    if (current < 0) return;
    const asset = list[current];
    $('#asset-title').textContent = `${asset.brand} / ${asset.title}`;
    $('#asset-category').textContent = `${asset.category} / Original studio concept`;
    $('#asset-description').textContent = asset.description;
    $('#asset-image').src = asset.src;
    $('#asset-image').alt = `${asset.brand}: ${asset.title}`;
    $('#asset-original').href = asset.src;
    $('#asset-position').textContent = `${current + 1} / ${list.length}`;
    if (!dialog.open) { returnFocus = document.activeElement; dialog.showModal(); document.body.classList.add('artwork-open'); $('.asset-close').focus(); }
  }
  function render() {
    const list = filtered();
    const visible = list.slice(0, limit);
    const fragment = document.createDocumentFragment();
    visible.forEach(asset => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'library-card'; card.dataset.assetId = asset.id;
      card.setAttribute('aria-label', `View ${asset.brand}: ${asset.title}`);
      const figure = document.createElement('span'); figure.className = `library-card-image brand-${asset.brandId}`;
      const image = document.createElement('img'); image.src = asset.src; image.alt = ''; image.width = asset.width; image.height = asset.height; image.loading = 'lazy';
      figure.append(image);
      const caption = document.createElement('span'); caption.className = 'library-card-caption';
      const title = document.createElement('strong'); title.textContent = asset.title;
      const meta = document.createElement('span'); meta.textContent = `${asset.brand} / ${asset.category}`;
      caption.append(title,meta); card.append(figure,caption); fragment.append(card);
    });
    grid.replaceChildren(fragment);
    status.textContent = `Showing ${visible.length} of ${list.length} designs${brand === 'All' ? ' / Four studio concepts' : ` / ${list[0]?.brand || brand}`}`;
    more.hidden = visible.length >= list.length;
    more.firstChild.textContent = `Show ${Math.min(12,list.length-visible.length)} more `;
  }
  grid.addEventListener('click', event => { const card = event.target.closest('[data-asset-id]'); if (card) showAsset(card.dataset.assetId); });
  $$('[data-category]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category; limit = 12;
    $$('[data-category]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  }));
  $('#library-brand').addEventListener('change', event => { brand = event.target.value; limit = 12; render(); });
  more.addEventListener('click', () => { const previous = Math.min(limit, filtered().length); limit += 12; render(); grid.children[previous]?.focus({preventScroll:true}); });
  $('.asset-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('artwork-open'); returnFocus?.focus({preventScroll:true}); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close(); } });
  const next = direction => { const list = filtered(); if (list.length) showAsset(list[(current + direction + list.length) % list.length].id); };
  $('#asset-previous').addEventListener('click', () => next(-1));
  $('#asset-next').addEventListener('click', () => next(1));
  dialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); next(event.key === 'ArrowLeft' ? -1 : 1); } });
  fetch('assets/design-library.json').then(response => { if (!response.ok) throw new Error('Library unavailable'); return response.json(); }).then(items => {
    assets = [...curated.map(id => items.find(a => a.id === id)).filter(Boolean), ...items.filter(a => !curated.includes(a.id))]; render();
  }).catch(() => { status.textContent = 'The library could not load. Please refresh the page, or browse the original artwork below.'; const link = document.createElement('a'); link.href='assets/library-index.html';link.textContent='Browse all 60 original designs';grid.append(link); });

  const campaigns = {
    morrow: {name:'Morrow / Specialty coffee',lines:['A good','start.'],brief:'A warm, recognisable coffee brand that belongs in an everyday routine.',idea:'A rising sun, a grounded wordmark, and four colours with a familiar warmth.',rollout:'A complete stationery and packaging family, outdoor campaign, social series, and shop website.',social:'social-slow'},
    roam: {name:'Roam / Outdoor goods',lines:['Take the','long way.'],brief:'An outdoor brand for people who prefer a detour to a destination.',idea:'Topographic lines, field markings, and a recognisable mountain symbol.',rollout:'Packaging, outdoor posters, social stories, and a focused landing page.',social:'social-launch'},
    lilt: {name:'Lilt / Sound & culture',lines:['Make some','good noise.'],brief:'An expressive listening brand with personality beyond the usual tech aesthetic.',idea:'Sound becomes a visible rhythm, using bold loops and a flexible frequency mark.',rollout:'Headphone packaging, a launch campaign, vertical stories, outdoor, and a digital storefront.',social:'social-launch'},
    soli: {name:'Soli / Everyday body care',lines:['A softer','sort of day.'],brief:'An approachable body-care brand with a calm, human sense of character.',idea:'Two soft forms make one memorable mark, supported by warm colour pairings.',rollout:'Bottle and carton designs, a ritual-led social series, posters, and a welcoming website.',social:'social-launch'}
  };
  $$('[data-case-brand]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.caseBrand, item = campaigns[key];
    $$('[data-case-brand]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $('#case-sector').textContent = item.name;
    const light = document.createElement('span'); light.className='light-type';light.textContent=item.lines[1];
    $('#case-title').replaceChildren(document.createTextNode(item.lines[0]),document.createElement('br'),light);
    $('#case-brief').textContent=item.brief;$('#case-idea').textContent=item.idea;$('#case-rollout').textContent=item.rollout;
    $('#case-read').href=`assets/${key}/case-study.svg`;
    $('.case-sheet').src=`assets/${key}/case-study.svg`;$('.case-sheet').alt=`${item.name} campaign brief, idea, and rollout`;
    $('.case-outdoor').src=`assets/${key}/billboard.svg`;$('.case-outdoor').alt=`${item.name} outdoor campaign`;
    $('.case-social').src=`assets/${key}/${item.social}.svg`;$('.case-social').alt=`${item.name} social campaign`;
  }));
})();
