/**
 * URL Parser & Builder — inspect URL components, edit query params live & Encode/Decode URI
 */

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/"/g, '&quot;');

const SAMPLE_URL = 'https://api.example.com:8443/v2/items/search?q=example+query&page=1&sort=desc&active=true#results';

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>URL Parser &amp; Builder</h1>
      <p>Phân tích URL, chỉnh sửa/thêm/xóa Query Parameters trực tiếp và Encode/Decode URI.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <label class="field-label" for="urlInput">URL cần phân tích</label>
        <div class="d-flex gap-1">
          <button type="button" class="btn btn-ghost btn-sm" id="urlSampleBtn">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="urlClearBtn">Xóa</button>
        </div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <input
          type="url"
          id="urlInput"
          class="mono flex-1"
          style="min-width:220px;"
          placeholder="https://example.com:8080/path?q=search&id=123#section"
          spellcheck="false"
          autocomplete="off"
        />
        <button type="button" class="btn btn-primary" id="urlParseBtn">Parse</button>
        <button type="button" class="copy-btn" id="urlCopyMainBtn" style="min-height:38px;">Copy URL</button>
      </div>
      <div id="urlError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>

    <div id="urlResult" style="display:none;">
      <div class="card">
        <div class="card-header">
          <span class="field-label">Các thành phần URL</span>
        </div>
        <div id="urlParts" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(195px,1fr)); gap:10px;"></div>
      </div>

      <div class="card" id="urlParamsCard">
        <div class="card-header">
          <span class="field-label">Query Parameters (Chỉnh sửa trực tiếp để cập nhật URL)</span>
          <button type="button" class="btn btn-secondary btn-sm" id="urlAddParamBtn">+ Thêm Param</button>
        </div>
        <div id="urlParamsList" style="display:flex; flex-direction:column; gap:8px;"></div>
        <div id="urlParamsEmpty" class="text-sm text-muted" style="display:none;">URL hiện chưa có query parameter nào.</div>
      </div>
    </div>

    <!-- Encode / Decode always accessible -->
    <div class="card">
      <div class="card-header">
        <span class="field-label">Encode / Decode URI</span>
        <div class="d-flex align-center gap-2">
          <select id="encDecMode" aria-label="Chế độ encode" style="width:auto; min-height:30px; padding:4px 28px 4px 10px; font-size:12.5px;">
            <option value="component" selected>encodeURIComponent (Khuyên dùng cho params)</option>
            <option value="uri">encodeURI (Giữ nguyên :, /, ?, &amp;)</option>
          </select>
        </div>
      </div>
      <div class="field">
        <input
          type="text"
          id="encDecInput"
          class="mono"
          placeholder="Nhập chuỗi hoặc URL cần encode/decode..."
          spellcheck="false"
        />
      </div>
      <div class="btn-group" style="margin-top:0;">
        <button type="button" class="btn btn-secondary btn-sm" id="urlEncodeBtn">Encode</button>
        <button type="button" class="btn btn-secondary btn-sm" id="urlDecodeBtn">Decode</button>
        <button type="button" class="copy-btn" id="encDecCopyBtn">Copy kết quả</button>
      </div>
      <div id="encDecOutput" class="output-box mt-2" style="display:none;">
        <pre id="encDecPre" style="margin:0;"></pre>
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
  const sampleBtn = document.getElementById('urlSampleBtn');
  const clearBtn = document.getElementById('urlClearBtn');
  const copyMainBtn = document.getElementById('urlCopyMainBtn');
  const errorEl = document.getElementById('urlError');
  const resultEl = document.getElementById('urlResult');
  const partsEl = document.getElementById('urlParts');
  const paramsListEl = document.getElementById('urlParamsList');
  const paramsEmptyEl = document.getElementById('urlParamsEmpty');
  const addParamBtn = document.getElementById('urlAddParamBtn');

  let currentUrlObj = null;

  const rebuildUrlFromParams = () => {
    if (!currentUrlObj) return;
    const nextParams = new URLSearchParams();
    paramsListEl.querySelectorAll('.url-param-row').forEach((row) => {
      const k = row.querySelector('.up-key').value.trim();
      const v = row.querySelector('.up-val').value;
      if (k) nextParams.append(k, v);
    });
    const searchStr = nextParams.toString();
    currentUrlObj.search = searchStr ? `?${searchStr}` : '';
    inputEl.value = currentUrlObj.toString();
    renderParts(currentUrlObj);
  };

  const renderParts = (url) => {
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
        </div>`,
      )
      .join('');
  };

  const appendParamRow = (k = '', v = '') => {
    paramsEmptyEl.style.display = 'none';
    const row = document.createElement('div');
    row.className = 'd-flex align-center gap-1 url-param-row';
    row.innerHTML = `
      <input type="text" class="mono up-key" placeholder="Key" value="${escAttr(k)}" style="flex:1;" spellcheck="false" />
      <input type="text" class="mono up-val" placeholder="Value" value="${escAttr(v)}" style="flex:2;" spellcheck="false" />
      <button type="button" class="btn btn-ghost btn-sm up-copy" title="Copy value">Copy</button>
      <button type="button" class="btn btn-ghost btn-sm up-del" style="color:var(--danger);" title="Xóa">✕</button>
    `;
    row.querySelector('.up-key').addEventListener('input', rebuildUrlFromParams);
    row.querySelector('.up-val').addEventListener('input', rebuildUrlFromParams);
    row.querySelector('.up-copy').addEventListener('click', (e) => {
      window.copyToClipboard(row.querySelector('.up-val').value, e.currentTarget);
    });
    row.querySelector('.up-del').addEventListener('click', () => {
      row.remove();
      if (paramsListEl.children.length === 0) paramsEmptyEl.style.display = '';
      rebuildUrlFromParams();
    });
    paramsListEl.appendChild(row);
  };

  const parse = () => {
    errorEl.textContent = '';
    const raw = inputEl.value.trim();
    if (!raw) {
      resultEl.style.display = 'none';
      currentUrlObj = null;
      return;
    }

    try {
      const normalized = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;
      const url = new URL(normalized);
      currentUrlObj = url;

      renderParts(url);
      paramsListEl.replaceChildren();
      const params = [...url.searchParams.entries()];
      if (params.length > 0) {
        paramsEmptyEl.style.display = 'none';
        params.forEach(([k, v]) => appendParamRow(k, v));
      } else {
        paramsEmptyEl.style.display = '';
      }

      resultEl.style.display = '';
    } catch (e) {
      currentUrlObj = null;
      errorEl.textContent = e.message;
      resultEl.style.display = 'none';
    }
  };

  addParamBtn.addEventListener('click', () => {
    appendParamRow('', '');
  });

  parseBtn.addEventListener('click', parse);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) parse();
  });
  inputEl.addEventListener('paste', () => setTimeout(parse, 0));

  sampleBtn.addEventListener('click', () => {
    inputEl.value = SAMPLE_URL;
    parse();
  });

  copyMainBtn.addEventListener('click', () => {
    if (inputEl.value.trim()) window.copyToClipboard(inputEl.value.trim(), copyMainBtn);
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    currentUrlObj = null;
    resultEl.style.display = 'none';
    errorEl.textContent = '';
    inputEl.focus();
  });

  // ── Encode / Decode URI ────────────────────────────────────────────────
  const edInput = document.getElementById('encDecInput');
  const edMode = document.getElementById('encDecMode');
  const edOutput = document.getElementById('encDecOutput');
  const edPre = document.getElementById('encDecPre');
  const edCopy = document.getElementById('encDecCopyBtn');

  const showEnc = (val) => {
    edPre.textContent = val;
    edOutput.style.display = '';
  };

  document.getElementById('urlEncodeBtn').addEventListener('click', () => {
    const v = edInput.value;
    if (!v) return;
    try {
      showEnc(edMode.value === 'uri' ? encodeURI(v) : encodeURIComponent(v));
    } catch {
      window.showToast('Encode thất bại', 'error');
    }
  });

  document.getElementById('urlDecodeBtn').addEventListener('click', () => {
    const v = edInput.value;
    if (!v) return;
    try {
      showEnc(edMode.value === 'uri' ? decodeURI(v) : decodeURIComponent(v));
    } catch {
      window.showToast('Chuỗi mã hóa không hợp lệ', 'error');
    }
  });

  edCopy.addEventListener('click', () => {
    if (edPre.textContent) window.copyToClipboard(edPre.textContent, edCopy);
  });
}
