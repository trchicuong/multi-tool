/**
 * JSON Formatter & Validator — Split Editor with Format, Minify, Sort Keys & Line/Col Error
 */

const SAMPLE_JSON = {
  name: 'Example App',
  version: '1.0.0',
  active: true,
  tags: ['developer', 'example', 'json'],
  owner: {
    name: 'Jane Doe',
    email: 'jane@example.com',
  },
  items: [
    { id: 1, title: 'Sample Item A', enabled: true },
    { id: 2, title: 'Sample Item B', enabled: false },
  ],
};

function sortKeysDeep(val) {
  if (Array.isArray(val)) return val.map(sortKeysDeep);
  if (val !== null && typeof val === 'object') {
    return Object.keys(val)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, k) => {
        acc[k] = sortKeysDeep(val[k]);
        return acc;
      }, {});
  }
  return val;
}

function getLineColFromError(raw, errMsg) {
  const posMatch = errMsg.match(/position\s+(\d+)/i);
  if (!posMatch) return errMsg;
  const pos = Number(posMatch[1]);
  if (!Number.isFinite(pos)) return errMsg;
  const before = raw.slice(0, pos);
  const lines = before.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return `${errMsg} (Dòng ${line}, Cột ${col})`;
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>JSON Formatter</h1>
      <p>Format, validate, minify và sắp xếp keys JSON theo chuẩn với bố cục 2 cột đối xứng.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="d-flex align-center gap-2 flex-wrap">
          <span id="jsonStatus" class="badge badge-gray">Chờ nhập liệu</span>
          <span id="jsonStats" class="text-sm text-muted mono"></span>
        </div>
        <div class="d-flex align-center gap-1 flex-wrap">
          <select id="jsonIndent" aria-label="Thụt lề" style="width:auto; min-height:30px; padding:4px 28px 4px 10px; font-size:12.5px;">
            <option value="2" selected>2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
          <label class="checkbox-row" style="padding:0 6px;">
            <input type="checkbox" id="jsonSortKeys" />
            <span>Sort Keys</span>
          </label>
          <button type="button" class="btn btn-primary btn-sm" id="jsonFormatBtn">Format</button>
          <button type="button" class="btn btn-secondary btn-sm" id="jsonMinifyBtn">Minify</button>
          <button type="button" class="btn btn-ghost btn-sm" id="jsonSampleBtn">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="jsonClearBtn">Xóa</button>
        </div>
      </div>

      <div class="split-editor">
        <div>
          <div class="card-header" style="margin-bottom:6px;">
            <span class="field-label">Input JSON</span>
            <button type="button" class="btn btn-ghost btn-sm" id="jsonPasteBtn">Paste</button>
          </div>
          <textarea
            class="mono w-full"
            id="jsonInput"
            rows="16"
            placeholder='{"name":"John","age":30,"courses":["History","Math"]}'
            style="min-height:360px; resize:vertical;"
            spellcheck="false"
            autocorrect="off"
            autocapitalize="none"
          ></textarea>
        </div>

        <div>
          <div class="card-header" style="margin-bottom:6px;">
            <span class="field-label">Output</span>
            <div class="d-flex align-center gap-1">
              <button type="button" class="copy-btn" id="jsonCopyBtn">Copy</button>
              <button type="button" class="btn btn-secondary btn-sm" id="jsonDownloadBtn">Download .json</button>
            </div>
          </div>
          <textarea
            class="mono w-full"
            id="jsonOutput"
            rows="16"
            readonly
            placeholder="Kết quả JSON sẽ hiển thị ở đây..."
            style="min-height:360px; resize:vertical; background:var(--code-bg);"
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <div id="jsonError" class="text-sm text-danger mt-1" style="min-height:18px;" role="status"></div>
    </div>
  `;
}

export function init() {
  const inputEl = document.getElementById('jsonInput');
  const outputEl = document.getElementById('jsonOutput');
  const statusEl = document.getElementById('jsonStatus');
  const statsEl = document.getElementById('jsonStats');
  const errEl = document.getElementById('jsonError');
  const indentSel = document.getElementById('jsonIndent');
  const sortChk = document.getElementById('jsonSortKeys');
  const formatBtn = document.getElementById('jsonFormatBtn');
  const minifyBtn = document.getElementById('jsonMinifyBtn');
  const sampleBtn = document.getElementById('jsonSampleBtn');
  const clearBtn = document.getElementById('jsonClearBtn');
  const pasteBtn = document.getElementById('jsonPasteBtn');
  const copyBtn = document.getElementById('jsonCopyBtn');
  const dlBtn = document.getElementById('jsonDownloadBtn');

  let currentMode = 'format';

  const getIndent = () => {
    if (indentSel.value === 'tab') return '\t';
    return Number(indentSel.value) || 2;
  };

  const countKeys = (val) => {
    if (Array.isArray(val)) return val.reduce((sum, item) => sum + countKeys(item), 0);
    if (val !== null && typeof val === 'object') {
      const keys = Object.keys(val);
      return keys.length + keys.reduce((sum, k) => sum + countKeys(val[k]), 0);
    }
    return 0;
  };

  const process = (mode = currentMode) => {
    currentMode = mode;
    const raw = inputEl.value.trim();
    if (!raw) {
      outputEl.value = '';
      statusEl.textContent = 'Chờ nhập liệu';
      statusEl.className = 'badge badge-gray';
      statsEl.textContent = '';
      errEl.textContent = '';
      return false;
    }

    try {
      let parsed = JSON.parse(raw);
      if (sortChk.checked) parsed = sortKeysDeep(parsed);

      const formatted =
        mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, getIndent());

      outputEl.value = formatted;
      statusEl.textContent = '✓ Valid JSON';
      statusEl.className = 'badge badge-green';
      errEl.textContent = '';

      const bytes = new TextEncoder().encode(formatted).length;
      const keys = countKeys(parsed);
      statsEl.textContent = `${bytes.toLocaleString()} bytes · ${keys} keys`;
      return true;
    } catch (e) {
      statusEl.textContent = '✗ Invalid JSON';
      statusEl.className = 'badge badge-red';
      statsEl.textContent = '';
      errEl.textContent = getLineColFromError(raw, e.message);
      return false;
    }
  };

  inputEl.addEventListener('input', () => process(currentMode));
  indentSel.addEventListener('change', () => process('format'));
  sortChk.addEventListener('change', () => process(currentMode));

  formatBtn.addEventListener('click', () => process('format'));
  minifyBtn.addEventListener('click', () => process('minify'));

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = inputEl.selectionStart;
      const end = inputEl.selectionEnd;
      inputEl.value = inputEl.value.slice(0, s) + '  ' + inputEl.value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = s + 2;
      process(currentMode);
    }
  });

  sampleBtn.addEventListener('click', () => {
    inputEl.value = JSON.stringify(SAMPLE_JSON);
    process('format');
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        inputEl.value = text;
        process(currentMode);
      }
    } catch {
      window.showToast('Không thể đọc clipboard, hãy dán trực tiếp (Ctrl+V)', 'error');
    }
  });

  copyBtn.addEventListener('click', () => {
    if (outputEl.value.trim()) window.copyToClipboard(outputEl.value, copyBtn);
  });

  dlBtn.addEventListener('click', () => {
    const content = outputEl.value.trim();
    if (!content) {
      window.showToast('Chưa có JSON để tải về', 'error');
      return;
    }
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentMode === 'minify' ? 'data.min.json' : 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    process('format');
    inputEl.focus();
  });
}
