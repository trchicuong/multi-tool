/**
 * Facebook Utils — extract UID, parse share URLs, generate post links
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Facebook Utils</h1>
      <p>Trích xuất Facebook UID, phân tích URL, tạo share link và kiểm tra Open Graph.</p>
    </div>

    <!-- Tab navigation -->
    <div class="d-flex gap-1 mb-2" style="flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm fb-tab-btn active" data-tab="uid">Extract UID</button>
      <button class="btn btn-secondary btn-sm fb-tab-btn" data-tab="parse">Parse URL</button>
      <button class="btn btn-secondary btn-sm fb-tab-btn" data-tab="share">Share Generator</button>
      <button class="btn btn-secondary btn-sm fb-tab-btn" data-tab="og">Open Graph</button>
    </div>

    <!-- Tab: Extract UID -->
    <div class="fb-tab-panel card" id="fbTab-uid">
      <div class="field">
        <label class="field-label">Facebook Profile / Page URL</label>
        <input type="url" id="fbUidInput" class="w-full"
          placeholder="https://facebook.com/username hoặc https://www.facebook.com/profile.php?id=..." />
      </div>
      <button class="btn btn-primary mt-1" id="fbUidExtract">Extract UID</button>
      <div id="fbUidResult" class="mt-2" style="display:none;">
        <div class="field-label">Kết quả</div>
        <div id="fbUidOutput" style="display:flex; flex-direction:column; gap:8px; margin-top:6px;"></div>
      </div>
      <div class="mt-2 output-box" style="font-size:13px;">
        <strong>Hướng dẫn:</strong><br>
        • URL dạng <code>?id=123456789</code> → UID trực tiếp trong URL<br>
        • URL dạng <code>/username</code> → cần truy cập trang và xem source để lấy UID<br>
        • Mẹo: tìm <code>"userID":"</code> hoặc <code>"pageID":"</code> trong HTML nguồn trang
      </div>
    </div>

    <!-- Tab: Parse URL -->
    <div class="fb-tab-panel card" id="fbTab-parse" style="display:none;">
      <div class="field">
        <label class="field-label">Facebook URL</label>
        <textarea id="fbParseInput" class="mono w-full" rows="3"
          placeholder="https://www.facebook.com/groups/123/posts/456?__cft__[0]=..."
          spellcheck="false"></textarea>
      </div>
      <button class="btn btn-primary" id="fbParseBtn">Phân tích</button>
      <div id="fbParseResult" class="mt-2" style="display:none;">
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:8px; margin-top:8px;"
          id="fbParseOutput"></div>
      </div>
    </div>

    <!-- Tab: Share Generator -->
    <div class="fb-tab-panel card" id="fbTab-share" style="display:none;">
      <div class="field">
        <label class="field-label">URL cần chia sẻ</label>
        <input type="url" id="fbShareUrl" class="w-full"
          placeholder="https://example.com/article" />
      </div>
      <div class="field mt-1">
        <label class="field-label">Quote (tuỳ chọn)</label>
        <input type="text" id="fbShareQuote" class="w-full"
          placeholder="Văn bản trích dẫn kèm theo bài share..." />
      </div>
      <div class="field mt-1">
        <label class="field-label">Hashtag (tuỳ chọn, không cần #)</label>
        <input type="text" id="fbShareHashtag" class="w-full"
          placeholder="vietnam" />
      </div>
      <button class="btn btn-primary mt-1" id="fbGenShare">Tạo Share Link</button>
      <div id="fbShareResult" style="display:none; margin-top:12px;">
        <label class="field-label">Share URL</label>
        <div class="d-flex gap-2 align-center mt-1">
          <input type="text" id="fbShareOutput" class="flex-1 mono" readonly />
          <button class="copy-btn" id="fbCopyShare" style="position:static;">Copy</button>
          <a id="fbOpenShare" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Test</a>
        </div>
      </div>
    </div>

    <!-- Tab: Open Graph -->
    <div class="fb-tab-panel card" id="fbTab-og" style="display:none;">
      <div class="field">
        <label class="field-label">URL để kiểm tra Open Graph</label>
        <div class="d-flex gap-2">
          <input type="url" id="fbOgUrl" class="flex-1"
            placeholder="https://example.com" />
          <button class="btn btn-primary" id="fbOgCheck">Check</button>
        </div>
      </div>
      <div id="fbOgError" style="color:var(--danger,#ef4444); font-size:13px; min-height:18px; margin-top:4px;"></div>
      <div id="fbOgResult" style="display:none; margin-top:12px;">
        <div id="fbOgOutput" style="display:grid; gap:8px;"></div>
      </div>
      <div class="mt-2 output-box" style="font-size:13px;">
        <strong>Lưu ý:</strong> Tính năng này sử dụng Facebook Sharing Debugger để kiểm tra.<br>
        <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener" style="color:var(--accent);">
          Mở Facebook Sharing Debugger ↗
        </a>
      </div>
    </div>
  `;
}

export function init() {
  // Tab switching
  document.querySelectorAll('.fb-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fb-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.fb-tab-panel').forEach((p) => {
        p.style.display = 'none';
      });
      btn.classList.add('active');
      document.getElementById(`fbTab-${btn.dataset.tab}`).style.display = '';
    });
  });

  // ── Extract UID ─────────────────────────────────────────────────────────
  document.getElementById('fbUidExtract').addEventListener('click', () => {
    const url = document.getElementById('fbUidInput').value.trim();
    const resultEl = document.getElementById('fbUidResult');
    const outputEl = document.getElementById('fbUidOutput');

    if (!url) {
      window.showToast('Nhập URL Facebook', 'error');
      return;
    }

    const results = [];

    // Pattern 1: ?id=NUMERIC
    const idMatch = url.match(/[?&]id=(\d+)/);
    if (idMatch) results.push({ label: 'Numeric UID (from URL)', value: idMatch[1] });

    // Pattern 2: /profile.php?id=
    const profileMatch = url.match(/profile\.php\?id=(\d+)/);
    if (profileMatch) results.push({ label: 'Profile UID', value: profileMatch[1] });

    // Pattern 3: /pages/.../ID
    const pageMatch = url.match(/\/pages\/[^/]+\/(\d+)/);
    if (pageMatch) results.push({ label: 'Page ID', value: pageMatch[1] });

    // Pattern 4: /groups/ID
    const groupMatch = url.match(/\/groups\/(\d+)/);
    if (groupMatch) results.push({ label: 'Group ID', value: groupMatch[1] });

    // Pattern 5: /events/ID
    const eventMatch = url.match(/\/events\/(\d+)/);
    if (eventMatch) results.push({ label: 'Event ID', value: eventMatch[1] });

    // Detect username
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      const path = u.pathname.replace(/^\/|\/$/g, '');
      const seg = path.split('/').filter(Boolean);
      if (seg.length === 1 && !/^\d+$/.test(seg[0]) && seg[0] !== 'groups' && seg[0] !== 'pages') {
        results.push({
          label: 'Username',
          value: seg[0],
          note: 'Username — UID cần xem source HTML',
        });
      }
    } catch {}

    if (!results.length) {
      results.push({
        label: 'Không tìm thấy ID',
        value: 'Thử URL dạng ?id=NUMERIC hoặc /profile.php?id=',
        isNote: true,
      });
    }

    outputEl.innerHTML = results
      .map(
        (r) => `
      <div class="d-flex align-center gap-2" style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:8px 12px; flex-wrap:wrap;">
        <div style="flex:1; min-width:0;">
          <div class="text-sm text-muted">${r.label}</div>
          <div class="mono" style="font-weight:600; font-size:15px; word-break:break-all;">${r.value}</div>
          ${r.note ? `<div class="text-sm text-muted">${r.note}</div>` : ''}
        </div>
        ${!r.isNote ? `<button class="btn btn-ghost btn-sm fb-copy-uid" data-val="${r.value}">Copy</button>` : ''}
      </div>
    `,
      )
      .join('');

    resultEl.style.display = '';

    outputEl.querySelectorAll('.fb-copy-uid').forEach((btn) => {
      btn.addEventListener('click', () => window.copyToClipboard(btn.dataset.val, btn));
    });
  });

  // ── Parse URL ──────────────────────────────────────────────────────────
  document.getElementById('fbParseBtn').addEventListener('click', () => {
    const raw = document.getElementById('fbParseInput').value.trim();
    const resultEl = document.getElementById('fbParseResult');
    const output = document.getElementById('fbParseOutput');

    if (!raw) return;
    let parsed;
    try {
      parsed = new URL(raw.startsWith('http') ? raw : 'https://facebook.com/' + raw);
    } catch {
      window.showToast('URL không hợp lệ', 'error');
      return;
    }

    const parts = [];
    parts.push({ label: 'Full URL', value: parsed.href });
    parts.push({ label: 'Domain', value: parsed.hostname });
    parts.push({ label: 'Path', value: parsed.pathname });

    // Detect content type
    const path = parsed.pathname;
    if (path.includes('/groups/')) parts.push({ label: 'Type', value: 'Group' });
    else if (path.includes('/pages/')) parts.push({ label: 'Type', value: 'Page' });
    else if (path.includes('/events/')) parts.push({ label: 'Type', value: 'Event' });
    else if (path.includes('/videos/')) parts.push({ label: 'Type', value: 'Video' });
    else if (path.includes('/photos/')) parts.push({ label: 'Type', value: 'Photo' });
    else if (path.includes('/posts/')) parts.push({ label: 'Type', value: 'Post' });
    else if (path.includes('/reel/')) parts.push({ label: 'Type', value: 'Reel' });
    else if (path.includes('/stories/')) parts.push({ label: 'Type', value: 'Story' });

    // Query params
    parsed.searchParams.forEach((val, key) => {
      // Skip tracking params
      if (!['__cft__', '__tn__', '__eep__'].some((t) => key.startsWith(t))) {
        parts.push({ label: `Param: ${key}`, value: val });
      }
    });

    // Clean URL (strip tracking)
    const clean = new URL(parsed.href);
    ['__cft__', '__tn__', '__eep__', 'fbclid'].forEach((k) => {
      [...clean.searchParams.keys()]
        .filter((key) => key.startsWith(k))
        .forEach((key) => clean.searchParams.delete(key));
    });
    if (clean.href !== parsed.href)
      parts.push({ label: 'Clean URL (no tracking)', value: clean.href });

    output.innerHTML = parts
      .map(
        (p) => `
      <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:8px 10px;">
        <div class="text-sm text-muted">${p.label}</div>
        <div class="mono text-sm" style="word-break:break-all; margin-top:2px;">${p.value}</div>
      </div>
    `,
      )
      .join('');

    resultEl.style.display = '';
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

  document.getElementById('fbCopyShare').addEventListener('click', () => {
    window.copyToClipboard(
      document.getElementById('fbShareOutput').value,
      document.getElementById('fbCopyShare'),
    );
  });

  // ── Open Graph ──────────────────────────────────────────────────────────
  document.getElementById('fbOgCheck').addEventListener('click', () => {
    const url = document.getElementById('fbOgUrl').value.trim();
    const errEl = document.getElementById('fbOgError');
    const resultEl = document.getElementById('fbOgResult');
    const output = document.getElementById('fbOgOutput');

    errEl.textContent = '';
    if (!url) {
      errEl.textContent = 'Nhập URL';
      return;
    }
    try {
      new URL(url);
    } catch {
      errEl.textContent = 'URL không hợp lệ';
      return;
    }

    // We can't fetch arbitrary URLs due to CORS, so we open FB debugger
    const debugUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`;
    output.innerHTML = `
      <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
        <p class="text-sm">Do giới hạn CORS, không thể fetch Open Graph trực tiếp từ trình duyệt.</p>
        <p class="text-sm mt-1">Sử dụng các công cụ sau để kiểm tra:</p>
        <div class="d-flex gap-2 flex-wrap mt-2">
          <a href="${debugUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Facebook Sharing Debugger ↗</a>
          <a href="https://www.opengraph.xyz/url/${encodeURIComponent(url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">OpenGraph.xyz ↗</a>
        </div>
      </div>
    `;
    resultEl.style.display = '';
  });
}
