/**
 * URL Parser — parse and inspect URL components
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>URL Parser</h1>
      <p>Phân tích URL thành các thành phần: protocol, hostname, path, query params, fragment.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label">URL</label>
        <input type="url" id="urlInput" placeholder="https://example.com:8080/path?q=search&id=123#section" spellcheck="false" autocomplete="off" />
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" id="urlParseBtn">Parse</button>
        <button class="btn btn-ghost" id="urlClearBtn">Xóa</button>
      </div>
      <div id="urlError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>

    <div id="urlResult" style="display:none;">

      <div class="card mt-2">
        <div class="field-label">Các thành phần</div>
        <div id="urlParts" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:10px; margin-top:8px;"></div>
      </div>

      <div class="card mt-2" id="urlParamsCard" style="display:none;">
        <div class="field-label">Query Parameters</div>
        <div class="table-wrap mt-1">
          <table>
            <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
            <tbody id="urlParamsTable"></tbody>
          </table>
        </div>
      </div>

      <!-- URL builder -->
      <div class="card mt-2">
        <div class="field-label">Encode / Decode</div>
        <div class="row mt-1">
          <div class="flex-1">
            <label class="field-label">Raw URL</label>
            <input type="text" id="encDecInput" placeholder="Nhập URL hoặc chuỗi cần encode/decode..." spellcheck="false" />
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-secondary btn-sm" id="urlEncodeBtn">Encode URI</button>
          <button class="btn btn-secondary btn-sm" id="urlDecodeBtn">Decode URI</button>
          <button class="copy-btn" id="encDecCopyBtn" style="position:static;">Copy</button>
        </div>
        <div id="encDecOutput" class="output-box mt-1" style="display:none;">
          <pre id="encDecPre" style="margin:0;"></pre>
        </div>
      </div>

    </div>

    <style>
      .url-part { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:10px 12px; }
      .url-part-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); margin-bottom:3px; }
      .url-part-value { font-family:var(--font-mono); font-size:12.5px; word-break:break-all; }
    </style>
  `;
}

export function init() {
  const inputEl = document.getElementById('urlInput');
  const parseBtn = document.getElementById('urlParseBtn');
  const clearBtn = document.getElementById('urlClearBtn');
  const errorEl = document.getElementById('urlError');
  const resultEl = document.getElementById('urlResult');
  const partsEl = document.getElementById('urlParts');
  const paramsCard = document.getElementById('urlParamsCard');
  const paramsTable = document.getElementById('urlParamsTable');

  const parse = () => {
    errorEl.textContent = '';
    const raw = inputEl.value.trim();
    if (!raw) {
      resultEl.style.display = 'none';
      return;
    }

    try {
      const url = new URL(raw);

      const parts = [
        ['Protocol', url.protocol],
        ['Hostname', url.hostname],
        ['Port', url.port || '(default)'],
        ['Pathname', url.pathname],
        ['Search', url.search || '(none)'],
        ['Hash', url.hash || '(none)'],
        ['Origin', url.origin],
        ['Host', url.host],
      ];

      partsEl.innerHTML = parts
        .map(
          ([label, val]) => `
        <div class="url-part">
          <div class="url-part-label">${label}</div>
          <div class="url-part-value">${escHtml(val)}</div>
        </div>
      `,
        )
        .join('');

      // Query params
      const params = [...url.searchParams.entries()];
      if (params.length > 0) {
        paramsTable.innerHTML = params
          .map(
            ([k, v]) => `
          <tr>
            <td><code>${escHtml(k)}</code></td>
            <td style="word-break:break-all;">${escHtml(v)}</td>
            <td><button class="btn btn-ghost btn-sm copy-param-btn" data-val="${escAttr(v)}">Copy value</button></td>
          </tr>
        `,
          )
          .join('');
        paramsCard.style.display = '';
        paramsTable.querySelectorAll('.copy-param-btn').forEach((btn) => {
          btn.addEventListener('click', () => window.copyToClipboard(btn.dataset.val, btn));
        });
      } else {
        paramsCard.style.display = 'none';
      }

      resultEl.style.display = '';
    } catch (e) {
      errorEl.textContent = e.message;
      resultEl.style.display = 'none';
    }
  };

  parseBtn.addEventListener('click', parse);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') parse();
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    resultEl.style.display = 'none';
    errorEl.textContent = '';
    inputEl.focus();
  });

  // Paste auto-parse
  inputEl.addEventListener('paste', () => setTimeout(parse, 0));

  // ── Encode/Decode section ──────────────────────────────────────────────
  const edInput = document.getElementById('encDecInput');
  const edOutput = document.getElementById('encDecOutput');
  const edPre = document.getElementById('encDecPre');
  const edCopy = document.getElementById('encDecCopyBtn');
  const encBtn = document.getElementById('urlEncodeBtn');
  const decBtn = document.getElementById('urlDecodeBtn');

  const showEnc = (val) => {
    edPre.textContent = val;
    edOutput.style.display = '';
  };

  encBtn.addEventListener('click', () => {
    const v = edInput.value;
    if (!v) return;
    try {
      showEnc(encodeURIComponent(v));
    } catch {
      window.showToast('Encode thất bại', 'error');
    }
  });

  decBtn.addEventListener('click', () => {
    const v = edInput.value;
    if (!v) return;
    try {
      showEnc(decodeURIComponent(v));
    } catch {
      window.showToast('Decode thất bại', 'error');
    }
  });

  edCopy.addEventListener('click', () => window.copyToClipboard(edPre.textContent, edCopy));
}

const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => s.replace(/"/g, '&quot;');
