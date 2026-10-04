/**
 * Design Daily — Design Library & Accessible Modal Viewer
 */
(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const grid = $('#library-grid');
  const status = $('#library-status');
  const moreButton = $('.library-more');
  const dialog = $('#asset-dialog');
  const categoryButtons = $$('[data-category]');
  const brandSelect = $('#library-brand');

  if (!grid || !status) return;

  let assets = [];
  let category = 'All';
  let brand = 'All';
  let limit = 12;
  let current = 0;
  let returnFocus = null;

  const curatedOrder = [
    'morrow-coffee-bag',
    'roam-billboard',
    'lilt-product-object',
    'soli-social-editorial',
    'morrow-business-front',
    'roam-stationery',
    'lilt-web-hero',
    'soli-packaging-carton',
    'morrow-social-pause',
    'roam-social-story',
    'lilt-identity',
    'soli-case-study'
  ];

  const getFilteredAssets = () => {
    return assets.filter(item => {
      const matchCategory = category === 'All' || item.category === category;
      const matchBrand = brand === 'All' || item.brandId === brand;
      return matchCategory && matchBrand;
    });
  };

  function showAsset(assetId) {
    const list = getFilteredAssets();
    current = list.findIndex(a => a.id === assetId);
    if (current < 0) return;

    const asset = list[current];
    const titleEl = $('#asset-title');
    const catEl = $('#asset-category');
    const descEl = $('#asset-description');
    const imgEl = $('#asset-image');
    const origEl = $('#asset-original');
    const posEl = $('#asset-position');

    if (titleEl) titleEl.textContent = `${asset.brand} / ${asset.title}`;
    if (catEl) catEl.textContent = `${asset.category} / Studio Concept`;
    if (descEl) descEl.textContent = asset.description;
    if (imgEl) {
      imgEl.src = asset.src;
      imgEl.alt = `${asset.brand}: ${asset.title}`;
    }
    if (origEl) {
      origEl.href = asset.src;
    }
    if (posEl) {
      posEl.textContent = `${current + 1} of ${list.length}`;
    }

    if (dialog && !dialog.open) {
      returnFocus = document.activeElement;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      document.body.style.overflow = 'hidden';
      const closeBtn = $('.asset-close');
      if (closeBtn) closeBtn.focus();
    }
  }

  function renderGrid() {
    const list = getFilteredAssets();
    const visible = list.slice(0, limit);
    const fragment = document.createDocumentFragment();

    visible.forEach((asset, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `library-card brand-${asset.brandId}`;
      card.dataset.assetId = asset.id;
      card.setAttribute('aria-label', `View ${asset.brand}: ${asset.title}`);
      card.style.setProperty('--card-stagger', `${(idx % 12) * 35}ms`);

      const thumb = document.createElement('span');
      thumb.className = `library-card-thumb brand-${asset.brandId}`;

      const img = document.createElement('img');
      img.src = asset.src;
      img.alt = '';
      img.width = asset.width || 600;
      img.height = asset.height || 400;
      img.loading = 'lazy';
      thumb.append(img);

      const caption = document.createElement('span');
      caption.className = 'library-card-caption';

      const title = document.createElement('strong');
      title.textContent = asset.title;

      const meta = document.createElement('span');
      meta.textContent = `${asset.brand} · ${asset.category}`;

      caption.append(title, meta);
      card.append(thumb, caption);
      fragment.append(card);
    });

    grid.replaceChildren(fragment);

    const brandLabel = brand === 'All' ? 'Four studio concepts' : (list[0]?.brand || brand);
    status.textContent = `Showing ${visible.length} of ${list.length} designs / ${brandLabel}`;

    if (moreButton) {
      const remaining = list.length - visible.length;
      if (remaining > 0) {
        moreButton.hidden = false;
        moreButton.textContent = `Show ${Math.min(12, remaining)} more +`;
      } else {
        moreButton.hidden = true;
      }
    }
  }

  // Card click delegation
  grid.addEventListener('click', event => {
    const card = event.target.closest('[data-asset-id]');
    if (card) {
      showAsset(card.dataset.assetId);
    }
  });

  // Category filter buttons
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      category = button.dataset.category || 'All';
      limit = 12;
      categoryButtons.forEach(btn => {
        const isMatch = btn === button;
        btn.classList.toggle('is-active', isMatch);
        btn.setAttribute('aria-pressed', String(isMatch));
      });
      renderGrid();
    });
  });

  // Brand selector dropdown
  if (brandSelect) {
    brandSelect.addEventListener('change', event => {
      brand = event.target.value;
      limit = 12;
      renderGrid();
    });
  }

  // Pagination button
  if (moreButton) {
    moreButton.addEventListener('click', () => {
      const prevCount = Math.min(limit, getFilteredAssets().length);
      limit += 12;
      renderGrid();
      const nextCard = grid.children[prevCount];
      if (nextCard) {
        nextCard.focus({ preventScroll: true });
      }
    });
  }

  // Dialog Controls
  if (dialog) {
    const closeBtn = $('.asset-close');
    const prevBtn = $('#asset-previous');
    const nextBtn = $('#asset-next');

    function closeDialog() {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      document.body.style.overflow = '';
      if (returnFocus && typeof returnFocus.focus === 'function') {
        returnFocus.focus({ preventScroll: true });
      }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeDialog);
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      if (returnFocus && typeof returnFocus.focus === 'function') {
        returnFocus.focus({ preventScroll: true });
      }
    });

    // Backdrop click close
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          closeDialog();
        }
      }
    });

    const step = direction => {
      const list = getFilteredAssets();
      if (!list.length) return;
      const nextIndex = (current + direction + list.length) % list.length;
      showAsset(list[nextIndex].id);
    };

    if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => step(1));

    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    });
  }

  // Fetch library data
  fetch('assets/design-library.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load design-library.json');
      return response.json();
    })
    .then(items => {
      if (Array.isArray(items)) {
        assets = [
          ...curatedOrder.map(id => items.find(a => a.id === id)).filter(Boolean),
          ...items.filter(a => !curatedOrder.includes(a.id))
        ];
        renderGrid();
      }
    })
    .catch(() => {
      // Fallback message if fetch fails
      status.textContent = 'Showing static curated sample designs. Browse all artwork in the static index below.';
    });
})();
