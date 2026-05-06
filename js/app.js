/**
 * Multi Tool v2 — Core App
 * Hash-based routing + module cache + smooth transitions
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
  'typing-test': { file: 'tools/typingTest.js', label: 'Typing Speed Test' },
  markdown: { file: 'tools/markdown.js', label: 'Markdown Preview' },

  // Utilities
  'link-shortener': { file: 'tools/linkShortener.js', label: 'Link Shortener' },
  'file-uploader': { file: 'tools/fileUploader.js', label: 'File Inspector' },
  'currency-converter': { file: 'tools/currencyConverter.js', label: 'Currency Converter' },

  // Network
  'speed-test': { file: 'tools/speedTest.js', label: 'Speed Test' },
  'ip-checker': { file: 'tools/ipChecker.js', label: 'IP Address Checker' },
};

// ── Glob all tool modules so Vite bundles them as chunks at build time ────
const toolGlob = import.meta.glob('./tools/*.js');

// ── Module cache ──────────────────────────────────────────────────────────
const moduleCache = new Map();

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
const welcomeScreen = document.getElementById('welcomeScreen');
const welcomeGrid = document.getElementById('welcomeGrid');

// ── Theme ──────────────────────────────────────────────────────────────────
// Note: initial dark class is applied synchronously by the inline script
// in <head> before first paint — see index.html. This listener handles toggle.
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
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

// ── Sidebar search ─────────────────────────────────────────────────────────
toolSearch.addEventListener('input', () => {
  const q = toolSearch.value.trim().toLowerCase();
  navItems.forEach((item) => {
    const label = item.textContent.trim().toLowerCase();
    item.classList.toggle('hidden', q.length > 0 && !label.includes(q));
  });
  // Also hide group labels if all items in group are hidden
  document.querySelectorAll('.nav-group-label').forEach((label) => {
    // Find all nav-items until next label
    let el = label.nextElementSibling;
    let hasVisible = false;
    while (el && !el.classList.contains('nav-group-label')) {
      if (!el.classList.contains('hidden')) hasVisible = true;
      el = el.nextElementSibling;
    }
    label.style.display = hasVisible ? '' : 'none';
  });
});

// ── Tool loading ───────────────────────────────────────────────────────────
let currentTool = null;
let isTransitioning = false;
let welcomeGridBuilt = false;

async function loadTool(slug) {
  if (slug === currentTool || isTransitioning) return;

  const toolDef = TOOLS[slug];
  if (!toolDef) return;

  isTransitioning = true;
  currentTool = slug;

  // Update active nav item
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.tool === slug);
  });

  // Update topbar title
  topbarTitle.textContent = toolDef.label;

  // Animate out
  panel.classList.add('transitioning');

  // Wait for CSS transition (120ms)
  await new Promise((r) => setTimeout(r, 120));

  try {
    // Load module (cached after first load)
    let mod = moduleCache.get(slug);
    if (!mod) {
      const loader = toolGlob[`./${toolDef.file}`];
      if (!loader) throw new Error(`Module not found: ${toolDef.file}`);
      mod = await loader();
      moduleCache.set(slug, mod);
    }

    // Find getHtml + init functions by convention
    const getHtml =
      mod.getHtml ??
      Object.values(mod).find((v) => typeof v === 'function' && v.name?.startsWith('get'));
    const init =
      mod.init ??
      Object.values(mod).find((v) => typeof v === 'function' && v.name?.startsWith('init'));

    if (getHtml && init) {
      panel.innerHTML = getHtml();
      // Hide welcome screen if it's still in DOM
      welcomeScreen?.remove();
      init();
    } else {
      panel.innerHTML = `<div class="tool-header"><h1>Lỗi</h1><p>Không tìm thấy hàm khởi tạo cho tool này.</p></div>`;
    }
  } catch (err) {
    console.error('[loadTool]', slug, err);
    panel.innerHTML = `<div class="tool-header"><h1>Lỗi tải tool</h1><p class="text-muted">${err.message}</p></div>`;
  }

  // Scroll to top
  panel.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Animate in
  // Use rAF to ensure DOM is painted before removing transitioning class
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.classList.remove('transitioning');
      isTransitioning = false;
    });
  });

  // Close mobile sidebar if open
  if (window.innerWidth <= 768) closeSidebar();
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
    // Show welcome screen
    showWelcome();
  }
}

function showWelcome() {
  currentTool = null;
  navItems.forEach((item) => item.classList.remove('active'));
  topbarTitle.textContent = 'Multi Tool';

  // Rebuild welcome screen only when a tool removed it; keep static HTML on first load
  if (!document.getElementById('welcomeScreen')) {
    welcomeGridBuilt = false;
    panel.innerHTML = `
      <div class="welcome-screen" id="welcomeScreen">
        <div class="welcome-inner">
          <h2>Multi Tool</h2>
          <p>Bộ công cụ lập trình & tiện ích, chạy hoàn toàn trên trình duyệt.</p>
          <p class="welcome-cache-hint">💡 Lần đầu mở mỗi tool có thể mất vài giây để trình duyệt tải về. Các lần sau sẽ mở ngay lập tức nhờ cache.</p>
          <div class="welcome-grid" id="welcomeGrid"></div>
        </div>
      </div>
    `;
  }

  // Populate welcome grid only once (skip rebuild on repeated navigations back)
  if (!welcomeGridBuilt) {
    const grid = document.getElementById('welcomeGrid');
    if (grid) {
      navItems.forEach((item) => {
        const slug = item.dataset.tool;
        const label = item.textContent.trim();
        const svgEl = item.querySelector('svg');
        const a = document.createElement('a');
        a.className = 'welcome-card';
        a.href = `#${slug}`;
        a.innerHTML = `${svgEl ? svgEl.outerHTML : ''}<span>${label}</span>`;
        grid.appendChild(a);
      });
      welcomeGridBuilt = true;
    }
  }
}

// Listen to hash changes
window.addEventListener('hashchange', handleRoute);

// ── Init ───────────────────────────────────────────────────────────────────
handleRoute();

// ── Idle preloading ────────────────────────────────────────────────────────
// After the initial route is handled, preload the most popular tools in the
// background so they feel instant when the user first clicks them.
// Falls back to setTimeout for browsers without requestIdleCallback (old Safari).
const PRELOAD_TOOLS = [
  'json-formatter',
  'base64-text',
  'password-generator',
  'uuid-generator',
  'hash-generator',
  'regex-tester',
];

const scheduleIdle = window.requestIdleCallback
  ? (cb) => window.requestIdleCallback(cb, { timeout: 4000 })
  : (cb) => setTimeout(cb, 300);

scheduleIdle(() => {
  for (const slug of PRELOAD_TOOLS) {
    if (moduleCache.has(slug)) continue;
    const toolDef = TOOLS[slug];
    if (!toolDef) continue;
    const loader = toolGlob[`./${toolDef.file}`];
    if (loader)
      loader()
        .then((mod) => moduleCache.set(slug, mod))
        .catch(() => {});
  }
});

// ── Toast utility (global) ─────────────────────────────────────────────────
const toastContainer = document.createElement('div');
toastContainer.id = 'toastContainer';
document.body.appendChild(toastContainer);

window.showToast = function (message, type = 'default', duration = 2500) {
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
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 1500);
    }
    showToast('Đã copy!', 'success', 1500);
  } catch {
    showToast('Không thể copy', 'error');
  }
};
