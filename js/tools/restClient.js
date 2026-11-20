/**
 * REST Client — fetch-based HTTP tester with Auth tab, cURL export & Sample Request
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>REST Client</h1>
      <p>Gửi HTTP request trực tiếp từ trình duyệt. Hỗ trợ Auth, Query Params, Headers, Body và xuất lệnh cURL.</p>
    </div>

    <div class="card">
      <!-- Request bar -->
      <div class="d-flex align-center gap-2 flex-wrap">
        <select id="rcMethod" aria-label="HTTP Method" style="width:112px; font-weight:600;">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="HEAD">HEAD</option>
        </select>
        <input
          type="text"
          id="rcUrl"
          placeholder="https://api.example.com/endpoint"
          class="flex-1 mono"
          style="min-width:220px;"
          spellcheck="false"
          autocorrect="off"
          autocapitalize="none"
        />
        <button type="button" class="btn btn-primary" id="rcSend">Send</button>
        <button type="button" class="btn btn-secondary" id="rcCopyCurl" title="Sao chép thành lệnh cURL">Copy cURL</button>
        <button type="button" class="btn btn-ghost btn-sm" id="rcSample">Sample</button>
      </div>

      <!-- Tabs -->
      <div class="d-flex align-center gap-1 mt-2" style="border-bottom:1px solid var(--border); padding-bottom:8px;">
        <button type="button" class="btn btn-ghost btn-sm rc-tab active" data-tab="rcHeaders">Headers</button>
        <button type="button" class="btn btn-ghost btn-sm rc-tab" data-tab="rcQuery">Query Params</button>
        <button type="button" class="btn btn-ghost btn-sm rc-tab" data-tab="rcAuth">Auth</button>
        <button type="button" class="btn btn-ghost btn-sm rc-tab" data-tab="rcBody">Body</button>
      </div>

      <!-- Headers panel -->
      <div id="rcHeaders" class="rc-panel mt-2">
        <div id="rcHeaderRows" style="display:flex; flex-direction:column; gap:8px;"></div>
        <button type="button" class="btn btn-secondary btn-sm mt-1" id="rcAddHeader">+ Add Header</button>
      </div>

      <!-- Query params panel -->
      <div id="rcQuery" class="rc-panel mt-2" style="display:none;">
        <div id="rcQueryRows" style="display:flex; flex-direction:column; gap:8px;"></div>
        <button type="button" class="btn btn-secondary btn-sm mt-1" id="rcAddQuery">+ Add Param</button>
      </div>

      <!-- Auth panel -->
      <div id="rcAuth" class="rc-panel mt-2" style="display:none;">
        <div class="field" style="max-width:260px;">
          <label class="field-label" for="rcAuthType">Loại xác thực</label>
          <select id="rcAuthType">
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
        </div>
        <div id="rcAuthBearer" style="display:none;">
          <label class="field-label" for="rcBearerToken">Token</label>
          <input type="text" id="rcBearerToken" class="mono" placeholder="eyJhbGciOi..." spellcheck="false" />
        </div>
        <div id="rcAuthBasic" class="row" style="display:none;">
          <div>
            <label class="field-label" for="rcBasicUser">Username</label>
            <input type="text" id="rcBasicUser" placeholder="username" spellcheck="false" />
          </div>
          <div>
            <label class="field-label" for="rcBasicPass">Password</label>
            <input type="password" id="rcBasicPass" placeholder="password" />
          </div>
        </div>
      </div>

      <!-- Body panel -->
      <div id="rcBody" class="rc-panel mt-2" style="display:none;">
        <div class="field" style="max-width:220px;">
          <label class="field-label" for="rcBodyType">Content Type</label>
          <select id="rcBodyType">
            <option value="none">None</option>
            <option value="json" selected>JSON (application/json)</option>
            <option value="form-urlencoded">Form URL-encoded</option>
            <option value="text/plain">Plain Text</option>
          </select>
        </div>
        <textarea
          id="rcBodyText"
          rows="8"
          class="mono w-full"
          placeholder='{"key": "value"}'
          spellcheck="false"
          style="resize:vertical;"
        ></textarea>
      </div>
    </div>

    <div id="rcLoading" style="display:none; text-align:center; padding:16px;" class="text-muted text-sm">
      Đang gửi request...
    </div>

    <div id="rcError" style="display:none;" class="card">
      <p class="text-sm text-danger" id="rcErrorMsg"></p>
    </div>

    <!-- Response -->
    <div class="card" id="rcResponseCard" style="display:none;">
      <div class="card-header">
        <div class="d-flex align-center gap-2 flex-wrap">
          <span class="field-label">Response</span>
          <span id="rcStatusBadge" class="badge"></span>
          <span id="rcTimeBadge" class="text-muted text-sm mono"></span>
          <span id="rcSizeBadge" class="text-muted text-sm mono"></span>
        </div>
        <div class="d-flex align-center gap-2">
          <div class="seg-group">
            <button type="button" class="btn btn-sm rc-resp-tab active" data-rtab="rcRespBody">Body</button>
            <button type="button" class="btn btn-sm rc-resp-tab" data-rtab="rcRespHeaders">Headers</button>
          </div>
          <button type="button" class="copy-btn" id="rcCopyResp">Copy</button>
        </div>
      </div>
      <div id="rcRespBody">
        <div class="output-box">
          <pre id="rcRespBodyText" style="margin:0; max-height:420px; overflow:auto;"></pre>
        </div>
      </div>
      <div id="rcRespHeaders" style="display:none;">
        <div class="output-box">
          <pre id="rcRespHeadersText" style="margin:0; max-height:320px; overflow:auto;"></pre>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const methodSel = document.getElementById('rcMethod');
  const urlInput = document.getElementById('rcUrl');
  const sendBtn = document.getElementById('rcSend');
  const curlBtn = document.getElementById('rcCopyCurl');
  const sampleBtn = document.getElementById('rcSample');
  const loadingEl = document.getElementById('rcLoading');
  const errorEl = document.getElementById('rcError');
  const errorMsg = document.getElementById('rcErrorMsg');
  const respCard = document.getElementById('rcResponseCard');
  const statusBadge = document.getElementById('rcStatusBadge');
  const timeBadge = document.getElementById('rcTimeBadge');
  const sizeBadge = document.getElementById('rcSizeBadge');
  const bodyText = document.getElementById('rcRespBodyText');
  const headersText = document.getElementById('rcRespHeadersText');
  const copyRespBtn = document.getElementById('rcCopyResp');
  const bodyTypeSel = document.getElementById('rcBodyType');
  const authTypeSel = document.getElementById('rcAuthType');
  const bearerWrap = document.getElementById('rcAuthBearer');
  const basicWrap = document.getElementById('rcAuthBasic');

  let activeAbort = null;

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

  authTypeSel.addEventListener('change', () => {
    bearerWrap.style.display = authTypeSel.value === 'bearer' ? '' : 'none';
    basicWrap.style.display = authTypeSel.value === 'basic' ? '' : 'none';
  });

  const makeRow = (containerId, placeholder1 = 'Key', placeholder2 = 'Value', kVal = '', vVal = '') => {
    const row = document.createElement('div');
    row.className = 'd-flex align-center gap-1';
    row.innerHTML = `
      <input type="text" placeholder="${placeholder1}" style="flex:1;" spellcheck="false" />
      <input type="text" placeholder="${placeholder2}" style="flex:2;" spellcheck="false" />
      <button type="button" class="btn btn-ghost btn-sm" style="flex:0 0 auto; color:var(--text-3);" title="Xóa">✕</button>
    `;
    const inputs = row.querySelectorAll('input');
    inputs[0].value = kVal;
    inputs[1].value = vVal;
    row.querySelector('button').addEventListener('click', () => row.remove());
    document.getElementById(containerId).appendChild(row);
  };

  document
    .getElementById('rcAddHeader')
    .addEventListener('click', () => makeRow('rcHeaderRows', 'Header', 'Value'));
  document
    .getElementById('rcAddQuery')
    .addEventListener('click', () => makeRow('rcQueryRows', 'Param', 'Value'));

  makeRow('rcHeaderRows', 'Header', 'Value', 'Accept', 'application/json');

  const getRows = (containerId) => {
    const rows = document.querySelectorAll(`#${containerId} > div`);
    const out = {};
    rows.forEach((row) => {
      const inputs = row.querySelectorAll('input');
      const k = inputs[0]?.value.trim();
      const v = inputs[1]?.value.trim() ?? '';
      if (k) out[k] = v;
    });
    return out;
  };

  const buildRequest = () => {
    let url = urlInput.value.trim();
    if (!url) throw new Error('Nhập URL');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const parsedUrl = new URL(url);
    const queryParams = getRows('rcQueryRows');
    for (const [k, v] of Object.entries(queryParams)) {
      parsedUrl.searchParams.set(k, v);
    }

    const method = methodSel.value;
    const headers = getRows('rcHeaderRows');

    if (authTypeSel.value === 'bearer') {
      const token = document.getElementById('rcBearerToken').value.trim();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } else if (authTypeSel.value === 'basic') {
      const user = document.getElementById('rcBasicUser').value;
      const pass = document.getElementById('rcBasicPass').value;
      if (user || pass) {
        const bytes = new TextEncoder().encode(`${user}:${pass}`);
        let bin = '';
        bytes.forEach((b) => (bin += String.fromCharCode(b)));
        headers['Authorization'] = `Basic ${btoa(bin)}`;
      }
    }

    const bodyType = bodyTypeSel.value;
    const bodyRaw = document.getElementById('rcBodyText').value.trim();
    const options = { method, headers };

    if (!['GET', 'HEAD'].includes(method) && bodyType !== 'none' && bodyRaw) {
      options.body = bodyRaw;
      if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
        if (bodyType === 'json') options.headers['Content-Type'] = 'application/json';
        else if (bodyType === 'form-urlencoded')
          options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        else options.headers['Content-Type'] = 'text/plain';
      }
    }

    return { url: parsedUrl.toString(), options };
  };

  sendBtn.addEventListener('click', async () => {
    let req;
    try {
      req = buildRequest();
    } catch (e) {
      window.showToast(e.message, 'error');
      return;
    }

    activeAbort?.abort();
    activeAbort = new AbortController();

    sendBtn.disabled = true;
    loadingEl.style.display = '';
    respCard.style.display = 'none';
    errorEl.style.display = 'none';

    const t0 = performance.now();
    try {
      const resp = await fetch(req.url, { ...req.options, signal: activeAbort.signal });
      const elapsed = Math.round(performance.now() - t0);
      const status = resp.status;

      statusBadge.textContent = `${status} ${resp.statusText || ''}`.trim();
      statusBadge.className = `badge ${
        status < 300 ? 'badge-green' : status < 400 ? 'badge-amber' : 'badge-red'
      }`;
      timeBadge.textContent = `${elapsed} ms`;

      const hdrLines = [];
      resp.headers.forEach((v, k) => hdrLines.push(`${k}: ${v}`));
      headersText.textContent = hdrLines.join('\n') || '(Không có headers hiển thị do CORS)';

      const rawText = await resp.text();
      const byteSize = new TextEncoder().encode(rawText).length;
      sizeBadge.textContent =
        byteSize < 1024 ? `${byteSize} B` : `${(byteSize / 1024).toFixed(1)} KB`;

      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          bodyText.textContent = JSON.stringify(JSON.parse(rawText), null, 2);
        } catch {
          bodyText.textContent = rawText;
        }
      } else {
        bodyText.textContent = rawText;
      }
      respCard.style.display = '';
    } catch (err) {
      if (err.name === 'AbortError') return;
      errorMsg.textContent = `Request failed: ${err.message} (Lưu ý: trình duyệt có thể chặn request do chính sách CORS của server đích.)`;
      errorEl.style.display = '';
    } finally {
      sendBtn.disabled = false;
      loadingEl.style.display = 'none';
    }
  });

  curlBtn.addEventListener('click', () => {
    try {
      const { url, options } = buildRequest();
      const escapeShell = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;
      const parts = [`curl -X ${options.method} ${escapeShell(url)}`];
      for (const [k, v] of Object.entries(options.headers)) {
        parts.push(`-H ${escapeShell(`${k}: ${v}`)}`);
      }
      if (options.body) {
        parts.push(`-d ${escapeShell(options.body)}`);
      }
      window.copyToClipboard(parts.join(' \\\n  '), curlBtn);
    } catch (e) {
      window.showToast(e.message, 'error');
    }
  });

  sampleBtn.addEventListener('click', () => {
    methodSel.value = 'POST';
    urlInput.value = 'https://api.example.com/v1/items';
    document.getElementById('rcBodyType').value = 'json';
    document.getElementById('rcBodyText').value = JSON.stringify(
      { name: 'Example Item', quantity: 2, active: true },
      null,
      2,
    );
    window.showToast('Đã nạp request mẫu!', 'success', 1500);
  });

  copyRespBtn.addEventListener('click', () => {
    const activeBody = document.getElementById('rcRespBody').style.display !== 'none';
    const text = activeBody ? bodyText.textContent : headersText.textContent;
    if (text) window.copyToClipboard(text, copyRespBtn);
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) sendBtn.click();
  });

  return () => activeAbort?.abort();
}
