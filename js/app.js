(() => {
  // ─── State ────────────────────────────────────────────────────────────────
  let state = {
    search: '',
    tags: [],
    categories: [],
    clients: [],
    sort: 'newest',
    activeModal: null
  };

  // ─── Thumbnail helpers ────────────────────────────────────────────────────
  function ytThumb(id) {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }

  function vimeoThumb(id) {
    // Use Vimeo's oEmbed image; fallback handled in img onerror
    return `https://vumbnail.com/${id}.jpg`;
  }

  function getThumb(video) {
    return video.platform === 'youtube' ? ytThumb(video.videoId) : vimeoThumb(video.videoId);
  }

  function getEmbedUrl(video) {
    if (video.platform === 'youtube') {
      return `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    return `https://player.vimeo.com/video/${video.videoId}?autoplay=1&color=D4A853&title=0&byline=0&portrait=0`;
  }

  // ─── Filter & Sort ────────────────────────────────────────────────────────
  function applyFilters(videos) {
    let result = [...videos];

    if (state.search.trim()) {
      const q = state.search.toLowerCase();
      result = result.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.client.toLowerCase().includes(q) ||
        v.blurb.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (state.tags.length) {
      result = result.filter(v => state.tags.every(t => v.tags.includes(t)));
    }

    if (state.categories.length) {
      result = result.filter(v => state.categories.includes(v.category));
    }

    if (state.clients.length) {
      result = result.filter(v => state.clients.includes(v.client));
    }

    if (state.sort === 'newest') result.sort((a, b) => b.year - a.year);
    else if (state.sort === 'oldest') result.sort((a, b) => a.year - b.year);
    else if (state.sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (state.sort === 'za') result.sort((a, b) => b.title.localeCompare(a.title));

    return result;
  }

  // ─── Render portfolio grid ────────────────────────────────────────────────
  function renderGrid() {
    const grid = document.getElementById('portfolio-grid');
    const count = document.getElementById('results-count');
    if (!grid) return;

    const filtered = applyFilters(VIDEOS);
    count.textContent = `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">◉</div>
          <p>No projects match your filters.</p>
          <button class="btn-clear-all" onclick="clearAllFilters()">Clear filters</button>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(video => {
      const thumb = getThumb(video);
      const platformIcon = video.platform === 'youtube'
        ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0C5.282 16.736 5.017 15.622 5 12c.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0C18.718 7.264 18.982 8.378 19 12c-.018 3.629-.285 4.736-2.559 4.892zM10 9.658l4.917 2.338L10 14.342V9.658z"/></svg>`;

      return `
        <article class="video-card" data-id="${video.id}" onclick="openModal(${video.id})">
          <div class="video-card__thumb">
            <img src="${thumb}" alt="${video.title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22><rect width=%2216%22 height=%229%22 fill=%22%231a1a1a%22/><text x=%228%22 y=%225.5%22 text-anchor=%22middle%22 fill=%22%23555%22 font-size=%221.5%22>VIDEO</text></svg>'">
            <div class="video-card__overlay">
              <div class="play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div class="platform-badge">${platformIcon}</div>
            </div>
          </div>
          <div class="video-card__body">
            <div class="video-card__meta">
              <span class="video-card__category">${video.category}</span>
              <span class="video-card__year">${video.year}</span>
            </div>
            <h3 class="video-card__title">${video.title}</h3>
            <p class="video-card__blurb">${video.blurb}</p>
            <div class="video-card__footer">
              <span class="video-card__client">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${video.client}
              </span>
              <div class="video-card__tags">
                ${video.tags.map(t => `<span class="tag">${t}</span>`).join('')}
              </div>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  // ─── Modal ────────────────────────────────────────────────────────────────
  window.openModal = function(id) {
    const video = VIDEOS.find(v => v.id === id);
    if (!video) return;
    state.activeModal = id;

    const modal = document.getElementById('video-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalClient = document.getElementById('modal-client');
    const modalBlurb = document.getElementById('modal-blurb');
    const modalTags = document.getElementById('modal-tags');
    const modalIframe = document.getElementById('modal-iframe');

    modalTitle.textContent = video.title;
    modalClient.textContent = video.client;
    modalBlurb.textContent = video.blurb;
    modalTags.innerHTML = video.tags.map(t => `<span class="tag">${t}</span>`).join('');
    modalIframe.src = getEmbedUrl(video);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function() {
    const modal = document.getElementById('video-modal');
    const modalIframe = document.getElementById('modal-iframe');
    modal.classList.remove('active');
    modalIframe.src = '';
    document.body.style.overflow = '';
    state.activeModal = null;
  };

  // ─── Sidebar filter rendering ─────────────────────────────────────────────
  function renderFilters() {
    renderFilterGroup('filter-categories', ALL_CATEGORIES, state.categories, toggleCategory);
    renderFilterGroup('filter-tags', ALL_TAGS, state.tags, toggleTag);
    renderFilterGroup('filter-clients', ALL_CLIENTS, state.clients, toggleClient);
  }

  function renderFilterGroup(containerId, items, activeItems, toggleFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(item => {
      const active = activeItems.includes(item);
      return `<button class="filter-chip ${active ? 'active' : ''}" onclick="${toggleFn.name}('${item.replace(/'/g, "\\'")}')">
        ${item}
        ${active ? '<span class="filter-chip__x">×</span>' : ''}
      </button>`;
    }).join('');
  }

  function toggleTag(tag) {
    state.tags = state.tags.includes(tag)
      ? state.tags.filter(t => t !== tag)
      : [...state.tags, tag];
    update();
  }

  function toggleCategory(cat) {
    state.categories = state.categories.includes(cat)
      ? state.categories.filter(c => c !== cat)
      : [...state.categories, cat];
    update();
  }

  function toggleClient(client) {
    state.clients = state.clients.includes(client)
      ? state.clients.filter(c => c !== client)
      : [...state.clients, client];
    update();
  }

  window.toggleTag = toggleTag;
  window.toggleCategory = toggleCategory;
  window.toggleClient = toggleClient;

  window.clearAllFilters = function() {
    state.search = '';
    state.tags = [];
    state.categories = [];
    state.clients = [];
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    update();
  };

  // ─── Active filter pills ──────────────────────────────────────────────────
  function renderActiveFilters() {
    const container = document.getElementById('active-filters');
    if (!container) return;
    const all = [
      ...state.categories.map(c => ({ label: c, type: 'category' })),
      ...state.tags.map(t => ({ label: t, type: 'tag' })),
      ...state.clients.map(c => ({ label: c, type: 'client' }))
    ];

    if (!all.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="active-filters-row">
        <span class="active-filters-label">Active:</span>
        ${all.map(f => `
          <button class="active-filter-pill" onclick="removeFilter('${f.type}','${f.label.replace(/'/g, "\\'")}')">
            ${f.label} <span>×</span>
          </button>`).join('')}
        <button class="btn-clear-all" onclick="clearAllFilters()">Clear all</button>
      </div>`;
  }

  window.removeFilter = function(type, label) {
    if (type === 'category') state.categories = state.categories.filter(c => c !== label);
    else if (type === 'tag') state.tags = state.tags.filter(t => t !== label);
    else if (type === 'client') state.clients = state.clients.filter(c => c !== label);
    update();
  };

  // ─── Update ───────────────────────────────────────────────────────────────
  function update() {
    renderFilters();
    renderActiveFilters();
    renderGrid();
    updateActiveCount();
  }

  function updateActiveCount() {
    const total = state.tags.length + state.categories.length + state.clients.length;
    const badge = document.getElementById('filter-count-badge');
    if (badge) {
      badge.textContent = total || '';
      badge.style.display = total ? 'flex' : 'none';
    }
  }

  // ─── Mobile sidebar toggle ────────────────────────────────────────────────
  window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
  };

  // ─── Nav / Scroll behavior ────────────────────────────────────────────────
  function initNav() {
    const nav = document.getElementById('main-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 80) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');

      if (y > lastScroll && y > 200) nav.classList.add('nav-hidden');
      else nav.classList.remove('nav-hidden');
      lastScroll = y;
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
          document.getElementById('main-nav')?.classList.remove('mobile-open');
        }
      });
    });

    // Mobile menu
    document.getElementById('nav-toggle')?.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  // ─── Hero reel animation ──────────────────────────────────────────────────
  function initHeroReel() {
    const words = ['Commercials.', 'Mini-Docs.', 'Brand Films.', 'Real Stories.'];
    let i = 0;
    const el = document.getElementById('hero-word');
    if (!el) return;
    el.textContent = words[0];
    setInterval(() => {
      el.classList.add('fade-out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove('fade-out');
      }, 400);
    }, 2800);
  }

  // ─── Intersection observer for reveal animations ──────────────────────────
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // ─── Stats counter animation ──────────────────────────────────────────────
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const duration = 1800;
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + (el.dataset.suffix || '');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function initCounters() {
    const section = document.getElementById('stats-section');
    if (!section) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(section);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        state.search = e.target.value;
        update();
      });
    }

    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        state.sort = e.target.value;
        update();
      });
    }

    // Modal close on backdrop click
    document.getElementById('video-modal')?.addEventListener('click', e => {
      if (e.target.id === 'video-modal') closeModal();
    });

    // Keyboard close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.activeModal) closeModal();
    });

    // Contact form
    document.getElementById('contact-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.textContent = 'Message Sent ✓';
      btn.disabled = true;
      btn.classList.add('sent');
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.disabled = false;
        btn.classList.remove('sent');
        e.target.reset();
      }, 4000);
    });

    initNav();
    initHeroReel();
    initReveal();
    initCounters();
    update();
  });
})();
