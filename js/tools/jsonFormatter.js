/**
 * JSON Formatter & Validator
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>JSON Formatter</h1>
      <p>Format, validate và minify JSON. Tự động xử lý khi nhập.</p>
    </div>

    <div class="card">
      <div class="d-flex align-center gap-2 mb-2" style="justify-content:space-between; flex-wrap:wrap;">
        <div class="d-flex gap-1">
          <span id="jsonStatus" class="badge badge-gray">Chờ nhập liệu</span>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-secondary btn-sm" id="jsonMinifyBtn">Minify</button>
          <button class="btn btn-secondary btn-sm" id="jsonCopyBtn">Copy</button>
          <button class="btn btn-ghost btn-sm" id="jsonClearBtn">Xóa</button>
        </div>
      </div>
      <textarea
        class="mono w-full"
        id="jsonInput"
        rows="18"
        placeholder='{"name":"John","age":30,"courses":["History","Math"]}'
        style="min-height:340px; resize:vertical;"
        spellcheck="false"
      ></textarea>
      <div id="jsonError" class="text-sm text-danger mt-1" style="min-height:18px;"></div>
    </div>
  `;
}

export function init() {
  const input = document.getElementById('jsonInput');
  const status = document.getElementById('jsonStatus');
  const errMsg = document.getElementById('jsonError');
  const minifyBtn = document.getElementById('jsonMinifyBtn');
  const copyBtn = document.getElementById('jsonCopyBtn');
  const clearBtn = document.getElementById('jsonClearBtn');

  let isMinified = false;

  const setStatus = (valid, msg) => {
    status.textContent = msg;
    status.className = `badge ${valid ? 'badge-green' : 'badge-red'}`;
  };

  const tryFormat = (pretty = true) => {
    const raw = input.value.trim();
    if (!raw) {
      status.textContent = 'Chờ nhập liệu';
      status.className = 'badge badge-gray';
      errMsg.textContent = '';
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const formatted = pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      // Preserve cursor position
      const cursor = input.selectionStart;
      input.value = formatted;
      input.selectionStart = input.selectionEnd = Math.min(cursor, formatted.length);
      setStatus(true, '✓ Valid JSON');
      errMsg.textContent = '';
      return true;
    } catch (e) {
      setStatus(false, '✗ Invalid JSON');
      errMsg.textContent = e.message;
      return false;
    }
  };

  // Real-time validation (no auto-format while typing, only validate)
  input.addEventListener('input', () => {
    const raw = input.value.trim();
    if (!raw) {
      status.textContent = 'Chờ nhập liệu';
      status.className = 'badge badge-gray';
      errMsg.textContent = '';
      return;
    }
    try {
      JSON.parse(raw);
      setStatus(true, '✓ Valid JSON');
      errMsg.textContent = '';
    } catch (e) {
      setStatus(false, '✗ Invalid JSON');
      errMsg.textContent = e.message;
    }
  });

  // Format on Tab key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      tryFormat(!isMinified);
    }
  });

  // Format on paste
  input.addEventListener('paste', () => {
    setTimeout(() => tryFormat(true), 0);
  });

  minifyBtn.addEventListener('click', () => {
    isMinified = !isMinified;
    const ok = tryFormat(!isMinified);
    if (ok) {
      minifyBtn.textContent = isMinified ? 'Prettify' : 'Minify';
    }
  });

  copyBtn.addEventListener('click', () => {
    if (input.value.trim()) {
      window.copyToClipboard(input.value, copyBtn);
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    status.textContent = 'Chờ nhập liệu';
    status.className = 'badge badge-gray';
    errMsg.textContent = '';
    isMinified = false;
    minifyBtn.textContent = 'Minify';
    input.focus();
  });
}
