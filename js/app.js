(() => {
  // ─── State ────────────────────────────────────────────────────────────────
  let state = {
    search: '',
    category: 'ALL',
    sort: 'newest',
    activeModal: null
  };

  // ─── Embed URL helpers ────────────────────────────────────────────────────
  function getThumbEmbedUrl(video) {
    if (video.platform === 'youtube') {
      // autoplay, muted, loop, no controls
      return `https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&loop=1&playlist=${video.videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1`;
    }
    // Vimeo background mode: autoplay, muted, loop, no UI
    return `https://player.vimeo.com/video/${video.videoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`;
  }

  function getModalEmbedUrl(video) {
    if (video.platform === 'youtube') {
      return `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1&controls=0`;
    }
    return `https://player.vimeo.com/video/${video.videoId}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0&controls=0`;
  }

  // Static fallback thumbnail
  function getThumbImg(video) {
    if (video.platform === 'youtube') {
      return `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
    }
    return `https://vumbnail.com/${video.videoId}.jpg`;
  }

  // ─── Filters ──────────────────────────────────────────────────────────────
  const ALL_CATEGORIES_NAV = ['ALL', ...ALL_CATEGORIES];

  function renderSidebarFilters() {
    const list = document.getElementById('filter-list');
    if (!list) return;
    list.innerHTML = ALL_CATEGORIES_NAV.map(cat => `
      <li>
        <button class="${state.category === cat ? 'active' : ''}" onclick="setCategory('${cat}')">
          ${cat}
        </button>
      </li>`).join('');
  }

  window.setCategory = function(cat) {
    state.category = cat;
    updateBadge();
    renderSidebarFilters();
    renderGrid();
    // Close sidebar on mobile after selection
    document.getElementById('sidebar')?.classList.remove('open');
  };

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

    if (state.category && state.category !== 'ALL') {
      result = result.filter(v => v.category === state.category || v.tags.includes(state.category));
    }

    if (state.sort === 'newest') result.sort((a, b) => b.year - a.year);
    else if (state.sort === 'oldest') result.sort((a, b) => a.year - b.year);
    else if (state.sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (state.sort === 'za') result.sort((a, b) => b.title.localeCompare(a.title));

    return result;
  }

  // ─── Render Grid ──────────────────────────────────────────────────────────
  function renderGrid() {
    const grid = document.getElementById('portfolio-grid');
    const count = document.getElementById('results-count');
    if (!grid) return;

    const filtered = applyFilters(VIDEOS);
    count.textContent = `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <p>No projects match your filters.</p>
          <button class="btn-clear" onclick="clearFilters()">Clear filters</button>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(video => {
      const thumbEmbed = getThumbEmbedUrl(video);
      const thumbImg = getThumbImg(video);
      return `
        <article class="video-card" data-id="${video.id}" onclick="openModal(${video.id})">
          <div class="video-card__thumb">
            <img class="thumb-img" src="${thumbImg}" alt="${video.title}"
              onerror="this.style.display='none'" style="transition:opacity 0.5s">
            <iframe
              src="${thumbEmbed}"
              frameborder="0"
              allow="autoplay; fullscreen"
              allowfullscreen
              loading="lazy"
              style="opacity:0;transition:opacity 0.5s"
              onload="setTimeout(()=>{this.style.opacity=1;this.previousElementSibling.style.opacity=0},1500)">
            </iframe>
            <div class="video-card__overlay">
              <div class="video-card__cat">${video.category} // ${video.tags[1] || video.tags[0]}</div>
              <div class="video-card__title-overlay">${video.title}</div>
            </div>
          </div>
          <div class="video-card__body">
            <div class="video-card__client-label">Client</div>
            <div class="video-card__client-name">${video.client}</div>
            <p class="video-card__blurb">${video.blurb}</p>
            <div class="video-card__tags">
              ${video.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>
        </article>`;
    }).join('');
  }

  window.clearFilters = function() {
    state.search = '';
    state.category = 'ALL';
    const inp = document.getElementById('search-input');
    if (inp) inp.value = '';
    updateBadge();
    renderSidebarFilters();
    renderGrid();
  };

  function updateBadge() {
    const badge = document.getElementById('filter-count-badge');
    if (!badge) return;
    const active = (state.category !== 'ALL' ? 1 : 0) + (state.search ? 1 : 0);
    badge.textContent = active || '';
    badge.style.display = active ? 'flex' : 'none';
  }

  // ─── Modal ────────────────────────────────────────────────────────────────
  window.openModal = function(id) {
    const video = VIDEOS.find(v => v.id === id);
    if (!video) return;
    state.activeModal = id;

    document.getElementById('modal-title').textContent = video.title;
    document.getElementById('modal-client').textContent = video.client;
    document.getElementById('modal-blurb').textContent = video.blurb;
    document.getElementById('modal-tags').innerHTML = video.tags.map(t => `<span class="tag">${t}</span>`).join('');

    // Show poster so the iframe only loads on tap — user gesture unlocks autoplay,
    // preventing YouTube/Vimeo from showing their overlay UI before playback starts.
    const wrap = document.getElementById('modal-video-wrap');
    wrap.innerHTML = `<div class="modal__poster" style="background-image:url('${getThumbImg(video)}')" onclick="startModalVideo(${video.id})"><div class="modal__poster-play"></div></div>`;

    document.getElementById('video-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.startModalVideo = function(id) {
    const video = VIDEOS.find(v => v.id === id);
    if (!video) return;
    const wrap = document.getElementById('modal-video-wrap');
    wrap.innerHTML = `<iframe frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen src="${getModalEmbedUrl(video)}"></iframe>`;
  };

  window.closeModal = function() {
    document.getElementById('video-modal').classList.remove('active');
    document.getElementById('modal-video-wrap').innerHTML = '';
    document.body.style.overflow = '';
    state.activeModal = null;
  };

  // ─── Hero slideshow ───────────────────────────────────────────────────────
  function initHero() {
    const slides = document.querySelectorAll('.hero__slide');
    const dots = document.querySelectorAll('.hero__dot');
    let current = 0;
    let timer;

    function goTo(n) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function next() { goTo(current + 1); }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, 5000);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goTo(parseInt(dot.dataset.slide));
        startTimer();
      });
    });

    startTimer();
  }

  // ─── Nav scroll behavior ──────────────────────────────────────────────────
  function initNav() {
    const nav = document.getElementById('main-nav');

    document.getElementById('nav-toggle')?.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) {
          e.preventDefault();
          t.scrollIntoView({ behavior: 'smooth' });
          nav.classList.remove('mobile-open');
        }
      });
    });
  }

  // ─── Mobile sidebar ───────────────────────────────────────────────────────
  window.toggleSidebar = function() {
    document.getElementById('sidebar')?.classList.toggle('open');
  };

  // ─── Reveal on scroll ─────────────────────────────────────────────────────
  function initReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  // ─── Stats counter ────────────────────────────────────────────────────────
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function initStats() {
    const sec = document.getElementById('stats-section');
    if (!sec) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(sec);
  }

  // ─── Contact form ─────────────────────────────────────────────────────────
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const btn  = document.getElementById('submit-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.textContent = 'Sending…';
      btn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          btn.textContent = 'Message Sent ✓';
          btn.classList.add('sent');
          form.reset();
          setTimeout(() => {
            btn.textContent = 'Send Message';
            btn.disabled = false;
            btn.classList.remove('sent');
          }, 5000);
        } else {
          btn.textContent = 'Error — try again';
          btn.disabled = false;
        }
      } catch {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      }
    });
  }

  // ─── Logo carousel ────────────────────────────────────────────────────────
  function initLogoCarousel() {
    const imgs = document.querySelectorAll('.logo-carousel__img');
    if (!imgs.length) return;
    let current = 0;
    setInterval(() => {
      imgs[current].classList.remove('active');
      current = (current + 1) % imgs.length;
      imgs[current].classList.add('active');
    }, 4000);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Search
    document.getElementById('search-input')?.addEventListener('input', e => {
      state.search = e.target.value;
      updateBadge();
      renderGrid();
    });

    // Sort
    document.getElementById('sort-select')?.addEventListener('change', e => {
      state.sort = e.target.value;
      renderGrid();
    });

    // Keyboard close modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.activeModal) closeModal();
    });

    renderSidebarFilters();
    renderGrid();
    initHero();
    initNav();
    initReveal();
    initStats();
    initContactForm();
    initLogoCarousel();
  });
})();
