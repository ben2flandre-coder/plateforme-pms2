(function () {
  const path = window.location.pathname;
  const isToolPage = /\/outils\//.test(path);
  const base = isToolPage ? '../' : './';

  const pages = [
    'index.html',
    'cours-pms.html',
    'td-pms.html',
    'questionnaire-pms.html',
    'outils-modeles.html',
    'documents-pms.html',
    'outils/calculateur-criticite.html',
    'outils/audit-interne.html',
    'outils/registre-nc.html',
    'outils/inspection-ddpp.html',
    'outils/pms-reception.html',
    'outils/pms-temperature.html',
    'outils/pms-tracabilite.html',
    'outils/pms-reception-ddpp.html'
  ];

  const labels = {
    hub: 'Hub',
    prev: 'Section précédente',
    next: 'Section suivante',
    top: 'Haut de page'
  };

  const current = path.replace(/^.*plateforme-pms2\//, '').replace(/^\//, '') || 'index.html';
  const idx = pages.indexOf(current);
  const prev = idx > 0 ? pages[idx - 1] : null;
  const next = idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null;

  function rel(link) {
    return isToolPage && !link.startsWith('outils/') ? `../${link}` : `${base}${link}`;
  }

  function actionButton(text, href, className, ariaLabel, disabled) {
    const a = document.createElement('a');
    a.className = `btn ${className} app-nav-btn`;
    a.textContent = text;
    a.setAttribute('aria-label', ariaLabel);
    if (disabled) {
      a.classList.add('is-disabled');
      a.setAttribute('aria-disabled', 'true');
      a.href = '#';
      a.addEventListener('click', (e) => e.preventDefault());
    } else {
      a.href = rel(href);
    }
    return a;
  }

  function topButton() {
    const b = document.createElement('button');
    b.className = 'btn btn-ghost app-nav-btn';
    b.type = 'button';
    b.textContent = labels.top;
    b.setAttribute('aria-label', labels.top);
    b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    return b;
  }

  function buildNav(className) {
    const nav = document.createElement('nav');
    nav.className = className;
    nav.setAttribute('aria-label', 'Navigation opérateur');
    const wrap = document.createElement('div');
    wrap.className = 'app-shell app-nav-wrap';
    wrap.append(
      actionButton(labels.hub, 'index.html', 'btn-secondary', 'Aller au hub'),
      actionButton(labels.prev, prev, 'btn-ghost', 'Aller à la section précédente', !prev),
      actionButton(labels.next, next, 'btn-primary', 'Aller à la section suivante', !next),
      topButton()
    );
    nav.appendChild(wrap);
    return nav;
  }

  const header = document.querySelector('.core-header');
  if (header) header.insertAdjacentElement('afterend', buildNav('operator-nav operator-nav--top'));
  const footer = document.querySelector('.core-footer');
  if (footer) footer.insertAdjacentElement('beforebegin', buildNav('operator-nav operator-nav--bottom'));
  document.documentElement.dataset.nav = 'core';

  document.querySelectorAll('.scroll-top, .btn-scroll-left, .btn-scroll-right, .app-nav-bottom, .back-home').forEach((el) => el.remove());

  const headers = Array.from(document.querySelectorAll('.core-header'));
  headers.slice(1).forEach((el) => el.remove());

  const topNavs = Array.from(document.querySelectorAll('.operator-nav--top'));
  topNavs.slice(1).forEach((el) => el.remove());

  const left = document.createElement('button');
  const right = document.createElement('button');
  [left, right].forEach((btn, i) => {
    btn.type = 'button';
    btn.className = `floating-top floating-top--${i ? 'right' : 'left'}`;
    btn.textContent = '↑ Haut';
    btn.setAttribute('aria-label', 'Haut de page');
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);
  });

  window.addEventListener('scroll', () => {
    const show = window.scrollY > 300;
    [left, right].forEach((btn) => btn.classList.toggle('is-visible', show));
  }, { passive: true });

  const headerMap = {
    '🏠 Hub': rel('index.html'),
    '📘 Formation': rel('cours-pms.html'),
    '🧰 Outils': rel('outils-modeles.html'),
    '📂 Ressources': rel('documents-pms.html')
  };
  document.querySelectorAll('.core-nav-link').forEach((a) => {
    const key = a.textContent.trim();
    if (headerMap[key]) a.setAttribute('href', headerMap[key]);
  });

  function normalizeLayout() {
    const rootMain = document.querySelector('main');
    if (rootMain) {
      rootMain.classList.add('pms-container', 'pms-stack', 'pms-main');
      rootMain.querySelectorAll(':scope > section, :scope > article, :scope > .section, :scope > .panel').forEach((section) => {
        section.classList.add('pms-section');
      });
    }

    document.querySelectorAll('.tool-grid, .cards-grid, .section-grid, .listing-grid, .container-grid').forEach((grid) => {
      grid.classList.add('pms-grid');
    });

    document.querySelectorAll('.card, .section-card, .content-bloc, .intro-card, .info-box, .box, .tool-card, .panel, .card-module, .card-section, .card-context, .result-box, .result-details, .card-modern').forEach((card) => {
      card.classList.add('pms-uniform-card');
    });
  }

  function syncStickyOffset() {
    const primaryHeader = document.querySelector('.core-header');
    const headerHeight = primaryHeader ? Math.round(primaryHeader.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--pms-header-offset', `${headerHeight}px`);
    document.body.classList.toggle('pms-has-sticky-top', headerHeight > 0);
  }

  function applySvgFallback() {
    const shapeSelectors = 'path, circle, rect, polygon, polyline, line, ellipse, use, image, text';
    document.querySelectorAll('svg').forEach((svg) => {
      const hasShape = Boolean(svg.querySelector(shapeSelectors));
      if (hasShape) return;
      if (svg.dataset.svgFallback === 'true') return;
      svg.dataset.svgFallback = 'true';
      svg.setAttribute('role', 'img');
      if (!svg.getAttribute('aria-label')) svg.setAttribute('aria-label', 'Icône indisponible');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.innerHTML = '<rect x="2" y="2" width="20" height="20" rx="4" fill="#eaf1fb" stroke="#16508f"/><path d="M12 6v7" stroke="#16508f" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.2" fill="#16508f"/>';
    });

    document.querySelectorAll('img[src$=".svg"]').forEach((img) => {
      img.addEventListener('error', () => {
        if (img.dataset.svgFallbackApplied === 'true') return;
        img.dataset.svgFallbackApplied = 'true';
        const fallback = document.createElement('div');
        fallback.className = `${img.className || ''} context-visual`;
        fallback.dataset.svgFallback = 'true';
        fallback.textContent = '🧩 Illustration indisponible';
        fallback.setAttribute('role', 'img');
        fallback.setAttribute('aria-label', img.alt || 'Illustration indisponible');
        img.replaceWith(fallback);
      }, { once: true });
    });
  }

  normalizeLayout();
  applySvgFallback();
  syncStickyOffset();
  window.addEventListener('resize', syncStickyOffset, { passive: true });
})();
