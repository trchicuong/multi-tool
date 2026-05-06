/**
 * REST Client — fetch-based HTTP tester
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>REST Client</h1>
      <p>Gửi HTTP request trực tiếp từ trình duyệt. Hỗ trợ GET, POST, PUT, PATCH, DELETE, HEAD.</p>
    </div>

    <div class="card">
      <!-- Request bar -->
      <div class="d-flex align-center gap-2" style="flex-wrap:wrap;">
        <select id="rcMethod" style="width:110px; font-weight:600;">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="HEAD">HEAD</option>
        </select>
        <input type="text" id="rcUrl" placeholder="https://api.example.com/endpoint" class="flex-1 mono"
          style="min-width:200px;" spellcheck="false" />
        <button class="btn btn-primary" id="rcSend">Send</button>
      </div>

      <!-- Tabs -->
      <div class="d-flex gap-1 mt-2" style="border-bottom: 1px solid var(--border); padding-bottom:2px;">
        <button class="btn btn-ghost btn-sm rc-tab active" data-tab="rcHeaders">Headers</button>
        <button class="btn btn-ghost btn-sm rc-tab" data-tab="rcBody">Body</button>
        <button class="btn btn-ghost btn-sm rc-tab" data-tab="rcQuery">Query Params</button>
      </div>

      <!-- Headers panel -->
      <div id="rcHeaders" class="rc-panel mt-2">
        <div id="rcHeaderRows" style="display:flex; flex-direction:column; gap:6px;"></div>
        <button class="btn btn-ghost btn-sm mt-1" id="rcAddHeader">+ Add Header</button>
      </div>

      <!-- Body panel -->
      <div id="rcBody" class="rc-panel mt-2" style="display:none;">
        <div class="d-flex align-center gap-2 mb-1" style="flex-wrap:wrap;">
          <select id="rcBodyType" style="width:160px;">
            <option value="none">None</option>
            <option value="json" selected>JSON</option>
            <option value="form-urlencoded">Form URL-encoded</option>
            <option value="text/plain">Plain Text</option>
          </select>
        </div>
        <textarea id="rcBodyText" rows="8" class="mono w-full"
          placeholder='{"key": "value"}' spellcheck="false"
          style="resize:vertical; font-size:13px; line-height:1.5;"></textarea>
      </div>

      <!-- Query params panel -->
      <div id="rcQuery" class="rc-panel mt-2" style="display:none;">
        <div id="rcQueryRows" style="display:flex; flex-direction:column; gap:6px;"></div>
        <button class="btn btn-ghost btn-sm mt-1" id="rcAddQuery">+ Add Param</button>
      </div>
    </div>

    <!-- Response -->
    <div class="card mt-2" id="rcResponseCard" style="display:none;">
      <div class="d-flex align-center gap-2 mb-2" style="flex-wrap:wrap; justify-content:space-between;">
        <div class="d-flex align-center gap-2">
          <span class="field-label" style="margin:0;">Response</span>
          <span id="rcStatusBadge" class="mono text-sm" style="padding:2px 8px; border-radius:4px; font-weight:600;"></span>
          <span id="rcTimeBadge" class="text-muted text-sm"></span>
        </div>
        <div class="btn-group">
          <button class="btn btn-ghost btn-sm rc-resp-tab active" data-rtab="rcRespBody">Body</button>
          <button class="btn btn-ghost btn-sm rc-resp-tab" data-rtab="rcRespHeaders">Headers</button>
        </div>
      </div>
      <div id="rcRespBody">
        <div class="d-flex align-center gap-1 mb-1" style="justify-content:flex-end;">
          <button class="btn btn-ghost btn-sm copy-btn" id="rcCopyResp">Copy</button>
        </div>
        <pre id="rcRespBodyText" class="output-box mono" style="white-space:pre-wrap; overflow:auto; max-height:400px; font-size:13px;"></pre>
      </div>
      <div id="rcRespHeaders" style="display:none;">
        <pre id="rcRespHeadersText" class="output-box mono" style="white-space:pre-wrap; overflow:auto; max-height:300px; font-size:13px;"></pre>
      </div>
    </div>

    <div id="rcLoading" style="display:none; text-align:center; padding:16px;" class="text-muted">Sending request...</div>
    <div id="rcError" style="display:none;" class="card mt-2">
      <p class="text-sm" id="rcErrorMsg" style="color: var(--danger, #ef4444);"></p>
    </div>
  `;
}

export function init() {
  const methodSel = document.getElementById('rcMethod');
  const urlInput = document.getElementById('rcUrl');
  const sendBtn = document.getElementById('rcSend');
  const loadingEl = document.getElementById('rcLoading');
  const errorEl = document.getElementById('rcError');
  const errorMsg = document.getElementById('rcErrorMsg');
  const respCard = document.getElementById('rcResponseCard');
  const statusBadge = document.getElementById('rcStatusBadge');
  const timeBadge = document.getElementById('rcTimeBadge');
  const bodyText = document.getElementById('rcRespBodyText');
  const headersText = document.getElementById('rcRespHeadersText');
  const copyRespBtn = document.getElementById('rcCopyResp');
  const bodyTypeSel = document.getElementById('rcBodyType');

  // --- Tab switching ---
  document.querySelectorAll('.rc-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rc-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.rc-panel').forEach((p) => (p.style.display = 'none'));
      document.getElementById(btn.dataset.tab).style.display = '';
    });
  });

  document.querySelectorAll('.rc-resp-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rc-resp-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('rcRespBody').style.display =
        btn.dataset.rtab === 'rcRespBody' ? '' : 'none';
      document.getElementById('rcRespHeaders').style.display =
        btn.dataset.rtab === 'rcRespHeaders' ? '' : 'none';
    });
  });

  // --- Dynamic key-value rows ---
  const makeRow = (containerId, placeholder1 = 'Key', placeholder2 = 'Value') => {
    const row = document.createElement('div');
    row.className = 'd-flex align-center gap-1';
    row.innerHTML = `
      <input type="text" placeholder="${placeholder1}" style="flex:1;" spellcheck="false" />
      <input type="text" placeholder="${placeholder2}" style="flex:2;" spellcheck="false" />
      <button class="btn btn-ghost btn-sm" style="flex:0 0 auto; color:var(--text-3);" title="Remove">✕</button>
    `;
    row.querySelector('button').addEventListener('click', () => row.remove());
    document.getElementById(containerId).appendChild(row);
  };

  document
    .getElementById('rcAddHeader')
    .addEventListener('click', () => makeRow('rcHeaderRows', 'Header', 'Value'));
  document
    .getElementById('rcAddQuery')
    .addEventListener('click', () => makeRow('rcQueryRows', 'Param', 'Value'));

  // Add default headers row
  makeRow('rcHeaderRows', 'Header', 'Value');
  // Set a default header
  const firstRow = document.getElementById('rcHeaderRows').querySelector('input');
  if (firstRow) {
    firstRow.value = 'Content-Type';
    firstRow.nextElementSibling.value = 'application/json';
  }

  const getRows = (containerId) => {
    const rows = document.querySelectorAll(`#${containerId} .d-flex`);
    const out = {};
    rows.forEach((row) => {
      const inputs = row.querySelectorAll('input');
      const k = inputs[0]?.value.trim();
      const v = inputs[1]?.value.trim();
      if (k) out[k] = v;
    });
    return out;
  };

  // --- Send ---
  sendBtn.addEventListener('click', async () => {
    let url = urlInput.value.trim();
    if (!url) {
      window.showToast('Nhập URL', 'error');
      return;
    }
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;

    // Append query params
    const queryParams = getRows('rcQueryRows');
    if (Object.keys(queryParams).length) {
      const sep = url.includes('?') ? '&' : '?';
      url +=
        sep +
        Object.entries(queryParams)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
    }

    const method = methodSel.value;
    const headers = getRows('rcHeaderRows');
    const bodyType = bodyTypeSel.value;
    const bodyRaw = document.getElementById('rcBodyText').value.trim();

    const options = { method, headers };
    if (!['GET', 'HEAD'].includes(method) && bodyType !== 'none' && bodyRaw) {
      if (bodyType === 'json') {
        options.body = bodyRaw;
        options.headers['Content-Type'] = 'application/json';
      } else if (bodyType === 'form-urlencoded') {
        options.body = bodyRaw;
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        options.body = bodyRaw;
        options.headers['Content-Type'] = 'text/plain';
      }
    }

    sendBtn.disabled = true;
    loadingEl.style.display = '';
    respCard.style.display = 'none';
    errorEl.style.display = 'none';

    const t0 = performance.now();
    try {
      const resp = await fetch(url, options);
      const elapsed = Math.round(performance.now() - t0);
      const status = resp.status;
      const statusText = resp.statusText;

      // Status badge color
      statusBadge.textContent = `${status} ${statusText}`;
      statusBadge.style.background =
        status < 300
          ? 'var(--success-bg, #d1fae5)'
          : status < 400
            ? 'var(--warn-bg, #fef3c7)'
            : 'var(--danger-bg, #fee2e2)';
      statusBadge.style.color =
        status < 300
          ? 'var(--success, #059669)'
          : status < 400
            ? 'var(--warn, #d97706)'
            : 'var(--danger, #ef4444)';
      timeBadge.textContent = `${elapsed}ms`;

      // Response headers
      const hdrs = {};
      resp.headers.forEach((v, k) => {
        hdrs[k] = v;
      });
      headersText.textContent = Object.entries(hdrs)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      const ct = resp.headers.get('content-type') || '';
      const raw = ct.includes('json')
        ? JSON.stringify(await resp.json(), null, 2)
        : await resp.text();
      bodyText.textContent = raw;
      respCard.style.display = '';
    } catch (err) {
      errorMsg.textContent = `Request failed: ${err.message}`;
      errorEl.style.display = '';
    } finally {
      sendBtn.disabled = false;
      loadingEl.style.display = 'none';
    }
  });

  copyRespBtn.addEventListener('click', () =>
    window.copyToClipboard(bodyText.textContent, copyRespBtn),
  );

  // Submit on Enter in URL bar
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });
}
