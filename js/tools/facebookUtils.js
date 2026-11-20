/**
 * Facebook Utils — Extract UID, Parse & Clean Tracking URL, Share Generator & Open Graph Meta Builder
 */

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Facebook Utils</h1>
      <p>Trích xuất ID, làm sạch tham số tracking trên URL, tạo Share Link và sinh thẻ Meta Open Graph.</p>
    </div>

    <div class="seg-group mb-2" role="group" aria-label="Công cụ Facebook">
      <button type="button" class="btn fb-tab-btn active" data-tab="uid">Extract UID</button>
      <button type="button" class="btn fb-tab-btn" data-tab="parse">Parse &amp; Clean URL</button>
      <button type="button" class="btn fb-tab-btn" data-tab="share">Share Generator</button>
      <button type="button" class="btn fb-tab-btn" data-tab="og">Open Graph</button>
    </div>

    <!-- Tab: Extract UID -->
    <div class="fb-tab-panel card" id="fbTab-uid">
      <div class="card-header">
        <label class="field-label" for="fbUidInput">Facebook Profile / Page / Post / Reel URL</label>
        <div class="d-flex gap-1">
          <button type="button" class="btn btn-ghost btn-sm" id="fbUidSample">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="fbUidClear">Xóa</button>
        </div>
      </div>
      <div class="d-flex gap-2 align-center flex-wrap">
        <input
          type="url"
          id="fbUidInput"
          class="flex-1 mono"
          style="min-width:220px;"
          placeholder="https://www.facebook.com/profile.php?id=100012345678901"
          spellcheck="false"
        />
        <button type="button" class="btn btn-primary" id="fbUidExtract">Extract ID</button>
      </div>
      <div id="fbUidResult" class="mt-2" style="display:none;">
        <div class="field-label">Kết quả nhận diện</div>
        <div id="fbUidOutput" style="display:flex; flex-direction:column; gap:8px;"></div>
      </div>
      <div class="output-box mt-2" style="padding:12px 14px; font-size:12.5px; color:var(--text-2);">
        Hỗ trợ nhận diện tự động: <code>?id=...</code>, <code>?fbid=...</code>, <code>/people/.../ID</code>, <code>/groups/ID</code>, <code>/pages/.../ID</code>, <code>/posts/ID</code>, <code>/videos/ID</code>, <code>/reel/ID</code> và username.
      </div>
    </div>

    <!-- Tab: Parse & Clean URL -->
    <div class="fb-tab-panel card" id="fbTab-parse" style="display:none;">
      <div class="card-header">
        <label class="field-label" for="fbParseInput">Facebook URL (có chứa tham số tracking)</label>
        <div class="d-flex gap-1">
          <button type="button" class="btn btn-ghost btn-sm" id="fbParseSample">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="fbParseClear">Xóa</button>
        </div>
      </div>
      <div class="field">
        <textarea
          id="fbParseInput"
          class="mono w-full"
          rows="3"
          placeholder="https://www.facebook.com/groups/123456789/posts/987654321/?fbclid=IwAR...&__cft__[0]=..."
          spellcheck="false"
        ></textarea>
      </div>
      <button type="button" class="btn btn-primary" id="fbParseBtn">Phân tích &amp; Làm sạch URL</button>

      <div id="fbParseResult" class="mt-2" style="display:none;">
        <div id="fbCleanBox" class="field" style="background:var(--accent-bg); border:1px solid color-mix(in srgb, var(--accent) 35%, var(--border)); border-radius:var(--radius); padding:12px;">
          <div class="card-header" style="margin-bottom:6px;">
            <span class="field-label" style="color:var(--accent);">Clean URL (Đã gỡ fbclid / tracking)</span>
            <button type="button" class="copy-btn" id="fbCopyClean">Copy Clean URL</button>
          </div>
          <div id="fbCleanUrlText" class="mono text-sm" style="word-break:break-all;"></div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:8px;" id="fbParseOutput"></div>
      </div>
    </div>

    <!-- Tab: Share Generator -->
    <div class="fb-tab-panel card" id="fbTab-share" style="display:none;">
      <div class="field">
        <label class="field-label" for="fbShareUrl">URL cần chia sẻ</label>
        <input type="url" id="fbShareUrl" placeholder="https://example.com/article" spellcheck="false" />
      </div>
      <div class="row">
        <div>
          <label class="field-label" for="fbShareQuote">Quote (tuỳ chọn)</label>
          <input type="text" id="fbShareQuote" placeholder="Trích dẫn đính kèm..." />
        </div>
        <div>
          <label class="field-label" for="fbShareHashtag">Hashtag (tuỳ chọn, không cần #)</label>
          <input type="text" id="fbShareHashtag" placeholder="example" spellcheck="false" />
        </div>
      </div>
      <div class="btn-group">
        <button type="button" class="btn btn-primary" id="fbGenShare">Tạo Share Link</button>
      </div>
      <div id="fbShareResult" style="display:none; margin-top:14px;">
        <label class="field-label" for="fbShareOutput">Share URL</label>
        <div class="d-flex gap-2 align-center">
          <input type="text" id="fbShareOutput" class="flex-1 mono" readonly style="background:var(--code-bg);" />
          <button type="button" class="copy-btn" id="fbCopyShare" style="min-height:38px;">Copy</button>
          <a id="fbOpenShare" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Mở thử ↗</a>
        </div>
      </div>
    </div>

    <!-- Tab: Open Graph Builder & Debugger -->
    <div class="fb-tab-panel card" id="fbTab-og" style="display:none;">
      <div class="card-header">
        <span class="field-label">Tạo thẻ Meta Open Graph (og:*)</span>
        <button type="button" class="copy-btn" id="fbOgCopyTags">Copy HTML Meta</button>
      </div>
      <div class="row">
        <div>
          <label class="field-label" for="fbOgTitle">og:title</label>
          <input type="text" id="fbOgTitle" placeholder="Example Page Title" />
        </div>
        <div>
          <label class="field-label" for="fbOgType">og:type</label>
          <select id="fbOgType">
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="product">product</option>
            <option value="video.other">video.other</option>
          </select>
        </div>
      </div>
      <div class="row mt-1">
        <div>
          <label class="field-label" for="fbOgPageUrl">og:url</label>
          <input type="url" id="fbOgPageUrl" placeholder="https://example.com/page" spellcheck="false" />
        </div>
        <div>
          <label class="field-label" for="fbOgImage">og:image</label>
          <input type="url" id="fbOgImage" placeholder="https://example.com/cover.png" spellcheck="false" />
        </div>
      </div>
      <div class="field mt-1">
        <label class="field-label" for="fbOgDesc">og:description</label>
        <input type="text" id="fbOgDesc" placeholder="Short description for social preview..." />
      </div>
      <div class="output-box mt-2">
        <pre id="fbOgMetaCode" style="margin:0;"></pre>
      </div>

      <div class="field mt-2" style="padding-top:14px; border-top:1px solid var(--border);">
        <label class="field-label" for="fbOgUrl">Kiểm tra URL trên trình gỡ lỗi (Debugger)</label>
        <div class="d-flex gap-2">
          <input type="url" id="fbOgUrl" class="flex-1" placeholder="https://example.com" spellcheck="false" />
          <button type="button" class="btn btn-primary" id="fbOgCheck">Mở Debugger</button>
        </div>
        <div id="fbOgError" class="text-sm text-danger mt-1"></div>
        <div id="fbOgResult" class="mt-2" style="display:none;">
          <div id="fbOgOutput"></div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  document.querySelectorAll('.fb-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fb-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.fb-tab-panel').forEach((p) => (p.style.display = 'none'));
      btn.classList.add('active');
      document.getElementById(`fbTab-${btn.dataset.tab}`).style.display = '';
    });
  });

  // ── Extract UID ─────────────────────────────────────────────────────────
  const uidInput = document.getElementById('fbUidInput');
  const uidResult = document.getElementById('fbUidResult');
  const uidOutput = document.getElementById('fbUidOutput');

  const extractUid = () => {
    const url = uidInput.value.trim();
    if (!url) {
      window.showToast('Nhập URL Facebook', 'error');
      return;
    }

    const results = [];
    const pushUnique = (label, value, note = '') => {
      if (!results.some((r) => r.label === label && r.value === value)) {
        results.push({ label, value, note });
      }
    };

    const patterns = [
      { re: /[?&]id=(\d+)/, label: 'User / Page UID (?id)' },
      { re: /[?&]fbid=(\d+)/, label: 'Object FBID (?fbid)' },
      { re: /\/people\/[^/]+\/(\d+)/, label: 'People Profile ID' },
      { re: /\/pages\/[^/]+\/(\d+)/, label: 'Page ID' },
      { re: /\/groups\/(\d+)/, label: 'Group ID' },
      { re: /\/events\/(\d+)/, label: 'Event ID' },
      { re: /\/posts\/(\d+)/, label: 'Post ID' },
      { re: /\/videos\/(\d+)/, label: 'Video ID' },
      { re: /\/reel\/(\d+)/, label: 'Reel ID' },
    ];

    patterns.forEach(({ re, label }) => {
      const m = url.match(re);
      if (m) pushUnique(label, m[1]);
    });

    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      const seg = u.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
      const reserved = new Set(['groups', 'pages', 'events', 'watch', 'reel', 'share', 'profile.php', 'people']);
      if (seg.length === 1 && !/^\d+$/.test(seg[0]) && !reserved.has(seg[0])) {
        pushUnique('Username', seg[0], 'Username công khai (UID số nằm trong source HTML trang)');
      }
    } catch {}

    if (!results.length) {
      results.push({
        label: 'Không tìm thấy ID số trong URL',
        value: 'Thử URL có chứa ?id=, /groups/ID, /posts/ID hoặc /people/.../ID',
        isNote: true,
      });
    }

    uidOutput.innerHTML = results
      .map(
        (r) => `
      <div class="d-flex align-center justify-between gap-2" style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:10px 12px; flex-wrap:wrap;">
        <div style="flex:1; min-width:0;">
          <div class="text-sm text-muted">${escHtml(r.label)}</div>
          <div class="mono" style="font-weight:600; font-size:14.5px; word-break:break-all;">${escHtml(r.value)}</div>
          ${r.note ? `<div class="text-sm text-muted">${escHtml(r.note)}</div>` : ''}
        </div>
        ${!r.isNote ? `<button type="button" class="copy-btn fb-copy-uid" data-val="${escAttr(r.value)}">Copy</button>` : ''}
      </div>
    `,
      )
      .join('');

    uidResult.style.display = '';
    uidOutput.querySelectorAll('.fb-copy-uid').forEach((btn) => {
      btn.addEventListener('click', () => window.copyToClipboard(btn.dataset.val, btn));
    });
  };

  document.getElementById('fbUidExtract').addEventListener('click', extractUid);
  document.getElementById('fbUidSample').addEventListener('click', () => {
    uidInput.value = 'https://www.facebook.com/groups/123456789012/posts/987654321098/';
    extractUid();
  });
  document.getElementById('fbUidClear').addEventListener('click', () => {
    uidInput.value = '';
    uidResult.style.display = 'none';
  });
  uidInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) extractUid();
  });

  // ── Parse & Clean URL ──────────────────────────────────────────────────
  const parseInput = document.getElementById('fbParseInput');
  const parseResult = document.getElementById('fbParseResult');
  const parseOutput = document.getElementById('fbParseOutput');
  const cleanUrlText = document.getElementById('fbCleanUrlText');
  const copyCleanBtn = document.getElementById('fbCopyClean');

  const parseAndClean = () => {
    const raw = parseInput.value.trim();
    if (!raw) return;
    let parsed;
    try {
      parsed = new URL(raw.startsWith('http') ? raw : `https://www.facebook.com/${raw.replace(/^\/+/, '')}`);
    } catch {
      window.showToast('URL không hợp lệ', 'error');
      return;
    }

    const clean = new URL(parsed.href);
    ['__cft__', '__tn__', '__eep__', 'fbclid', 'mibextid', 'rdid'].forEach((prefix) => {
      [...clean.searchParams.keys()]
        .filter((k) => k === prefix || k.startsWith(`${prefix}[`))
        .forEach((k) => clean.searchParams.delete(k));
    });

    cleanUrlText.textContent = clean.href;
    copyCleanBtn.onclick = () => window.copyToClipboard(clean.href, copyCleanBtn);

    const parts = [
      { label: 'Domain', value: parsed.hostname },
      { label: 'Path', value: parsed.pathname },
    ];
    const path = parsed.pathname;
    if (path.includes('/groups/')) parts.push({ label: 'Loại nội dung', value: 'Group' });
    else if (path.includes('/pages/')) parts.push({ label: 'Loại nội dung', value: 'Page' });
    else if (path.includes('/events/')) parts.push({ label: 'Loại nội dung', value: 'Event' });
    else if (path.includes('/videos/')) parts.push({ label: 'Loại nội dung', value: 'Video' });
    else if (path.includes('/posts/')) parts.push({ label: 'Loại nội dung', value: 'Post' });
    else if (path.includes('/reel/')) parts.push({ label: 'Loại nội dung', value: 'Reel' });

    parsed.searchParams.forEach((val, key) => {
      if (!['__cft__', '__tn__', '__eep__', 'fbclid', 'mibextid'].some((t) => key.startsWith(t))) {
        parts.push({ label: `Param: ${key}`, value: val });
      }
    });

    parseOutput.innerHTML = parts
      .map(
        (p) => `
      <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:8px 10px;">
        <div class="text-sm text-muted">${escHtml(p.label)}</div>
        <div class="mono text-sm" style="word-break:break-all; margin-top:2px;">${escHtml(p.value)}</div>
      </div>
    `,
      )
      .join('');

    parseResult.style.display = '';
  };

  document.getElementById('fbParseBtn').addEventListener('click', parseAndClean);
  document.getElementById('fbParseSample').addEventListener('click', () => {
    parseInput.value = 'https://www.facebook.com/groups/123456789/posts/987654321/?fbclid=IwAR0ExampleTrackingToken&__cft__[0]=AZXExample&mibextid=ZbWKwL';
    parseAndClean();
  });
  document.getElementById('fbParseClear').addEventListener('click', () => {
    parseInput.value = '';
    parseResult.style.display = 'none';
  });

  // ── Share Generator ────────────────────────────────────────────────────
  document.getElementById('fbGenShare').addEventListener('click', () => {
    const url = document.getElementById('fbShareUrl').value.trim();
    const quote = document.getElementById('fbShareQuote').value.trim();
    const hashtag = document.getElementById('fbShareHashtag').value.trim();

    if (!url) {
      window.showToast('Nhập URL cần share', 'error');
      return;
    }
    try {
      new URL(url);
    } catch {
      window.showToast('URL không hợp lệ', 'error');
      return;
    }

    const params = new URLSearchParams({ u: url });
    if (quote) params.set('quote', quote);
    if (hashtag) params.set('hashtag', '#' + hashtag.replace(/^#/, ''));
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?${params}`;

    document.getElementById('fbShareOutput').value = shareUrl;
    document.getElementById('fbOpenShare').href = shareUrl;
    document.getElementById('fbShareResult').style.display = '';
  });

  document.getElementById('fbCopyShare').addEventListener('click', (e) => {
    const val = document.getElementById('fbShareOutput').value;
    if (val) window.copyToClipboard(val, e.currentTarget);
  });

  // ── Open Graph Builder & Debugger ──────────────────────────────────────
  const ogTitle = document.getElementById('fbOgTitle');
  const ogType = document.getElementById('fbOgType');
  const ogPageUrl = document.getElementById('fbOgPageUrl');
  const ogImage = document.getElementById('fbOgImage');
  const ogDesc = document.getElementById('fbOgDesc');
  const ogMetaCode = document.getElementById('fbOgMetaCode');
  const ogCopyTags = document.getElementById('fbOgCopyTags');

  const updateOgTags = () => {
    const tags = [
      `<meta property="og:type" content="${escAttr(ogType.value)}" />`,
      `<meta property="og:title" content="${escAttr(ogTitle.value.trim() || 'Example Page Title')}" />`,
      `<meta property="og:description" content="${escAttr(ogDesc.value.trim() || 'Short description for social preview.')}" />`,
      `<meta property="og:url" content="${escAttr(ogPageUrl.value.trim() || 'https://example.com/page')}" />`,
      `<meta property="og:image" content="${escAttr(ogImage.value.trim() || 'https://example.com/cover.png')}" />`,
    ];
    ogMetaCode.textContent = tags.join('\n');
  };

  [ogTitle, ogType, ogPageUrl, ogImage, ogDesc].forEach((el) => el.addEventListener('input', updateOgTags));
  ogCopyTags.addEventListener('click', () => window.copyToClipboard(ogMetaCode.textContent, ogCopyTags));
  updateOgTags();

  document.getElementById('fbOgCheck').addEventListener('click', () => {
    const url = document.getElementById('fbOgUrl').value.trim();
    const errEl = document.getElementById('fbOgError');
    const resultEl = document.getElementById('fbOgResult');
    const output = document.getElementById('fbOgOutput');

    errEl.textContent = '';
    if (!url) {
      errEl.textContent = 'Nhập URL để kiểm tra';
      return;
    }
    try {
      new URL(url);
    } catch {
      errEl.textContent = 'URL không hợp lệ';
      return;
    }

    const debugUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`;
    output.innerHTML = `
      <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
        <p class="text-sm text-muted">Do giới hạn CORS trên trình duyệt, hãy dùng trực tiếp công cụ chính thức để quét lại thẻ Open Graph:</p>
        <div class="d-flex gap-2 flex-wrap mt-2">
          <a href="${debugUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Facebook Sharing Debugger ↗</a>
          <a href="https://www.opengraph.xyz/url/${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">OpenGraph.xyz ↗</a>
        </div>
      </div>
    `;
    resultEl.style.display = '';
  });
}
