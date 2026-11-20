/**
 * Multi Tool v2 — Core App
 * Hash-based routing + concurrency-safe loader + hover/idle preloading + cleanup lifecycle
 */

// ── Tool registry ──────────────────────────────────────────────────────────
// Maps URL hash slug  →  { file: 'tools/xxx.js', label: 'Display Name' }
const TOOLS = {
  // Developer
  'json-formatter': { file: 'tools/jsonFormatter.js', label: 'JSON Formatter' },
  'json-viewer': { file: 'tools/jsonViewer.js', label: 'JSON Tree Viewer' },
  'diff-checker': { file: 'tools/diffChecker.js', label: 'Diff Checker' },
  minify: { file: 'tools/codeMinifier.js', label: 'Minify / Unminify' },
  'regex-tester': { file: 'tools/regexTester.js', label: 'Regex Tester' },
  'rest-client': { file: 'tools/restClient.js', label: 'REST Client' },
  'cron-helper': { file: 'tools/cronHelper.js', label: 'Cron Job Helper' },
  'chart-generator': { file: 'tools/chartGenerator.js', label: 'Chart Generator' },

  // Encoding & Parsing
  'base64-text': { file: 'tools/base64Text.js', label: 'Text ↔ Base64' },
  'base64-file': { file: 'tools/base64File.js', label: 'File ↔ Base64' },
  'csv-json': { file: 'tools/csvJson.js', label: 'CSV ↔ JSON' },
  'html-to-json': { file: 'tools/htmlToJson.js', label: 'HTML/XML → JSON' },
  'url-parser': { file: 'tools/urlParser.js', label: 'URL Parser' },
  'jwt-decoder': { file: 'tools/jwtDecoder.js', label: 'JWT Decoder' },
  'number-base': { file: 'tools/numberBase.js', label: 'Number Base Converter' },

  // Generators
  'hash-generator': { file: 'tools/hashGenerator.js', label: 'Hash Generator' },
  'uuid-generator': { file: 'tools/uuidGenerator.js', label: 'UUID Generator' },
  'password-generator': { file: 'tools/passwordGenerator.js', label: 'Password Generator' },
  'unix-timestamp': { file: 'tools/unixTimestamp.js', label: 'Unix Timestamp' },
  'fake-data': { file: 'tools/fakeData.js', label: 'Fake Data Generator' },
  'lorem-ipsum': { file: 'tools/loremIpsum.js', label: 'Lorem Ipsum' },
  'qr-generator': { file: 'tools/qrGenerator.js', label: 'QR Generator' },

  // CSS & Design
  'color-converter': { file: 'tools/colorConverter.js', label: 'Color Converter' },
  'css-unit': { file: 'tools/cssUnit.js', label: 'CSS Unit Converter' },
  'box-shadow': { file: 'tools/boxShadow.js', label: 'Box-Shadow Generator' },
  gradient: { file: 'tools/gradient.js', label: 'CSS Gradient' },

  // Media
  'image-converter': { file: 'tools/imageConverter.js', label: 'Image Converter' },
  'image-editor': { file: 'tools/imageEditor.js', label: 'Image Editor' },
  watermark: { file: 'tools/watermark.js', label: 'Watermark' },
  'video-thumbnail': { file: 'tools/videoThumbnail.js', label: 'Video Thumbnail' },

  // Tools
  calculator: { file: 'tools/calculator.js', label: 'Calculator' },
  'countdown-timer': { file: 'tools/countdownTimer.js', label: 'Countdown Timer' },
  'typing-test': { file: 'tools/typingTest.js', label: 'Typing Speed Test' },
  markdown: { file: 'tools/markdown.js', label: 'Markdown Preview' },

  // Utilities
  'link-shortener': { file: 'tools/linkShortener.js', label: 'Link Shortener' },
  'file-uploader': { file: 'tools/fileUploader.js', label: 'File Inspector' },
  'currency-converter': { file: 'tools/currencyConverter.js', label: 'Currency Converter' },
  'facebook-utils': { file: 'tools/facebookUtils.js', label: 'Facebook Utils' },

  // Network
  'speed-test': { file: 'tools/speedTest.js', label: 'Speed Test' },
  'ip-checker': { file: 'tools/ipChecker.js', label: 'IP Address Checker' },
};

// ── Glob all tool modules so Vite bundles them as chunks at build time ────
const toolGlob = import.meta.glob('./tools/*.js');

// ── Module cache & in-flight deduplication ────────────────────────────────
const moduleCache = new Map();
const inflightLoads = new Map();

// ── DOM refs ───────────────────────────────────────────────────────────────
const panel = document.getElementById('panel');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
const hamburger = document.getElementById('hamburger');
const sidebarClose = document.getElementById('sidebarClose');
const themeToggle = document.getElementById('themeToggle');
const topbarTitle = document.getElementById('topbarTitle');
const toolSearch = document.getElementById('toolSearch');
const navItems = document.querySelectorAll('.nav-item[data-tool]');
const brandHome = document.getElementById('brandHome');

// ── Theme ──────────────────────────────────────────────────────────────────
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ── Mobile sidebar ─────────────────────────────────────────────────────────
const openSidebar = () => {
  sidebar.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
};

const closeSidebar = () => {
  sidebar.classList.remove('open');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
};

hamburger.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
backdrop.addEventListener('click', closeSidebar);

// ── Sidebar search & '/' shortcut ──────────────────────────────────────────
toolSearch.addEventListener('input', () => {
  const q = toolSearch.value.trim().toLowerCase();
  navItems.forEach((item) => {
    const label = item.textContent.trim().toLowerCase();
    const slug = (item.dataset.tool || '').toLowerCase();
    item.classList.toggle('hidden', q.length > 0 && !label.includes(q) && !slug.includes(q));
  });
  document.querySelectorAll('.nav-group-label').forEach((label) => {
    let el = label.nextElementSibling;
    let hasVisible = false;
    while (el && !el.classList.contains('nav-group-label')) {
      if (!el.classList.contains('hidden')) hasVisible = true;
      el = el.nextElementSibling;
    }
    label.style.display = hasVisible ? '' : 'none';
  });
});

document.addEventListener('keydown', (e) => {
  if (
    e.key === '/' &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
  ) {
    e.preventDefault();
    if (window.innerWidth <= 768) openSidebar();
    toolSearch.focus();
  }
});

// ── Preloader (with in-flight deduplication) ───────────────────────────────
function preloadTool(slug) {
  if (!slug) return Promise.resolve(null);
  if (moduleCache.has(slug)) return Promise.resolve(moduleCache.get(slug));
  if (inflightLoads.has(slug)) return inflightLoads.get(slug);

  const toolDef = TOOLS[slug];
  if (!toolDef) return Promise.resolve(null);

  const loader = toolGlob[`./${toolDef.file}`];
  if (!loader) return Promise.reject(new Error(`Module not found: ${toolDef.file}`));

  const promise = loader()
    .then((mod) => {
      moduleCache.set(slug, mod);
      inflightLoads.delete(slug);
      return mod;
    })
    .catch((err) => {
      inflightLoads.delete(slug);
      throw err;
    });

  inflightLoads.set(slug, promise);
  return promise;
}

// ── Tool lifecycle & concurrency-safe navigation ───────────────────────────
let currentTool = null;
let currentNavToken = 0;
let activeCleanup = null;

function runCleanup() {
  if (typeof activeCleanup === 'function') {
    try {
      activeCleanup();
    } catch (err) {
      console.error('[cleanup]', err);
    }
    activeCleanup = null;
  }
}

function syncNavUI(slug, label) {
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.tool === slug);
  });
  topbarTitle.textContent = label || 'Multi Tool';
  document.title = label ? `${label} — Multi Tool` : 'Multi Tool';
}

function triggerPanelEnter() {
  panel.classList.remove('panel-enter');
  // Force style flush so rapid consecutive switches replay the subtle enter animation cleanly
  void panel.offsetWidth;
  panel.classList.add('panel-enter');
}

function renderToolModule(slug, mod) {
  const getHtml =
    mod.getHtml ??
    Object.values(mod).find((v) => typeof v === 'function' && v.name?.startsWith('get'));
  const init =
    mod.init ??
    Object.values(mod).find((v) => typeof v === 'function' && v.name?.startsWith('init'));

  if (getHtml && init) {
    panel.dataset.activeTool = slug;
    panel.innerHTML = getHtml();
    panel.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const cleanup = init();
    if (typeof cleanup === 'function') activeCleanup = cleanup;
    triggerPanelEnter();
  } else {
    panel.dataset.activeTool = slug;
    panel.innerHTML = `<div class="tool-header"><h1>Lỗi</h1><p>Không tìm thấy hàm khởi tạo cho tool này.</p></div>`;
  }
}

async function loadTool(slug) {
  const toolDef = TOOLS[slug];
  if (!toolDef) {
    showWelcome();
    return;
  }

  // Already active and rendered in DOM
  if (slug === currentTool && panel.dataset.activeTool === slug) {
    if (window.innerWidth <= 768) closeSidebar();
    return;
  }

  const token = ++currentNavToken;
  runCleanup();
  currentTool = slug;

  // Immediate synchronous UI feedback (0ms) so URL, sidebar, and topbar never drift
  syncNavUI(slug, toolDef.label);
  if (window.innerWidth <= 768) closeSidebar();

  const cached = moduleCache.get(slug);
  if (cached) {
    try {
      renderToolModule(slug, cached);
    } catch (err) {
      console.error('[loadTool]', slug, err);
      panel.innerHTML = `<div class="tool-header"><h1>Lỗi khởi tạo tool</h1><p class="text-muted">${err.message}</p></div>`;
    }
    return;
  }

  // Only show loading indicator if the chunk takes > 60ms to arrive
  const loadingTimer = setTimeout(() => {
    if (token !== currentNavToken) return;
    panel.innerHTML = `
      <div class="tool-loading">
        <span class="tool-spinner" aria-hidden="true"></span>
        <span>Đang tải ${toolDef.label}...</span>
      </div>`;
  }, 60);

  try {
    const mod = await preloadTool(slug);
    clearTimeout(loadingTimer);
    // Abort render if user already navigated elsewhere while chunk was fetching
    if (token !== currentNavToken) return;
    renderToolModule(slug, mod);
  } catch (err) {
    clearTimeout(loadingTimer);
    if (token !== currentNavToken) return;
    console.error('[loadTool]', slug, err);
    panel.dataset.activeTool = slug;
    panel.innerHTML = `<div class="tool-header"><h1>Lỗi tải tool</h1><p class="text-muted">${err.message}</p></div>`;
  }
}

// ── Hash routing ───────────────────────────────────────────────────────────
function getSlugFromHash() {
  return location.hash.replace(/^#/, '').toLowerCase() || null;
}

function handleRoute() {
  const slug = getSlugFromHash();
  if (slug && TOOLS[slug]) {
    loadTool(slug);
  } else {
    showWelcome();
  }
}

function showWelcome() {
  ++currentNavToken;
  runCleanup();
  currentTool = null;
  delete panel.dataset.activeTool;
  syncNavUI(null, 'Multi Tool');

  if (!document.getElementById('welcomeScreen')) {
    panel.innerHTML = `
      <div class="welcome-screen" id="welcomeScreen">
        <div class="welcome-inner">
          <h2>Multi Tool</h2>
          <p>Bộ công cụ lập trình &amp; tiện ích đa năng, chạy hoàn toàn trên trình duyệt.</p>
          <div class="welcome-grid" id="welcomeGrid"></div>
        </div>
      </div>
    `;
  }

  const grid = document.getElementById('welcomeGrid');
  if (grid && grid.childElementCount === 0) {
    const frag = document.createDocumentFragment();
    navItems.forEach((item) => {
      const slug = item.dataset.tool;
      const label = item.textContent.trim();
      const svgEl = item.querySelector('svg');
      const a = document.createElement('a');
      a.className = 'welcome-card';
      a.href = `#${slug}`;
      a.dataset.tool = slug;
      a.innerHTML = `${svgEl ? svgEl.outerHTML : ''}<span>${label}</span>`;
      frag.appendChild(a);
    });
    grid.appendChild(frag);
  }

  panel.scrollTop = 0;
  if (window.innerWidth <= 768) closeSidebar();
}

// Listen to hash changes
window.addEventListener('hashchange', handleRoute);

// Brand click returns to welcome screen without full reload
brandHome?.addEventListener('click', (e) => {
  if (location.hash) {
    e.preventDefault();
    history.pushState(null, '', location.pathname + location.search);
    handleRoute();
  }
});

// Resync guard when clicking an active/current nav item
sidebar.addEventListener('click', (e) => {
  const item = e.target.closest('.nav-item[data-tool]');
  if (!item) return;
  const slug = item.dataset.tool;
  if (getSlugFromHash() === slug && panel.dataset.activeTool !== slug) {
    loadTool(slug);
  }
});

// Hover/focus intent preloading so modules are ready before click completes
const handlePreloadIntent = (e) => {
  const target = e.target.closest('[data-tool]');
  if (target?.dataset.tool) {
    preloadTool(target.dataset.tool).catch(() => {});
  }
};
sidebar.addEventListener('pointerover', handlePreloadIntent);
sidebar.addEventListener('focusin', handlePreloadIntent);
panel.addEventListener('pointerover', handlePreloadIntent);
panel.addEventListener('focusin', handlePreloadIntent);

// ── Init ───────────────────────────────────────────────────────────────────
handleRoute();

// ── Idle preloading ────────────────────────────────────────────────────────
// Preload popular tools first, then remaining lightweight tools in gentle batches
// (skipping 'fake-data' because @faker-js/faker is ~2.4 MB and loads on demand/hover).
const PRIORITY_PRELOAD = [
  'json-formatter',
  'base64-text',
  'password-generator',
  'uuid-generator',
  'hash-generator',
  'regex-tester',
];

const ALL_LIGHT_TOOLS = [
  ...PRIORITY_PRELOAD,
  ...Object.keys(TOOLS).filter((s) => !PRIORITY_PRELOAD.includes(s) && s !== 'fake-data'),
];

const scheduleIdle = window.requestIdleCallback
  ? (cb) => window.requestIdleCallback(cb, { timeout: 3000 })
  : (cb) => setTimeout(cb, 250);

let preloadCursor = 0;
function preloadNextBatch() {
  const batch = ALL_LIGHT_TOOLS.slice(preloadCursor, preloadCursor + 4);
  preloadCursor += 4;
  if (!batch.length) return;
  Promise.allSettled(batch.map((slug) => preloadTool(slug))).then(() => {
    if (preloadCursor < ALL_LIGHT_TOOLS.length) {
      scheduleIdle(preloadNextBatch);
    }
  });
}

scheduleIdle(preloadNextBatch);

// ── Toast utility (global) ─────────────────────────────────────────────────
const toastContainer = document.createElement('div');
toastContainer.id = 'toastContainer';
document.body.appendChild(toastContainer);

window.showToast = function (message, type = 'default', duration = 2400) {
  const toast = document.createElement('div');
  toast.className = `toast${type !== 'default' ? ` toast-${type}` : ''}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
};

// ── Copy utility (global) ──────────────────────────────────────────────────
window.copyToClipboard = async function (text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    if (btn) {
      if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.textContent;
      clearTimeout(btn._copyTimer);
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      btn._copyTimer = setTimeout(() => {
        btn.textContent = btn.dataset.origLabel;
        btn.classList.remove('copied');
      }, 1400);
    }
    showToast('Đã copy!', 'success', 1400);
  } catch {
    showToast('Không thể copy', 'error');
  }
};
