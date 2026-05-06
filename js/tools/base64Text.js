/**
 * Text ↔ Base64 encoder/decoder
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Text ↔ Base64</h1>
      <p>Mã hóa văn bản sang Base64 và giải mã ngược lại.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label">Input</label>
        <textarea id="b64Input" rows="8" placeholder="Nhập văn bản hoặc chuỗi Base64..." spellcheck="false" style="min-height:160px; resize:vertical;"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" id="b64EncodeBtn">Encode → Base64</button>
        <button class="btn btn-secondary" id="b64DecodeBtn">Decode ← Base64</button>
        <button class="btn btn-ghost" id="b64SwapBtn">⇄ Swap</button>
        <button class="btn btn-ghost" id="b64ClearBtn">Xóa</button>
      </div>
    </div>

    <div id="b64ResultSection" style="display:none; margin-top:8px;" class="card">
      <div class="d-flex align-center gap-1 mb-2" style="justify-content:space-between;">
        <span class="field-label" style="margin:0;">Output</span>
        <button class="copy-btn" id="b64CopyBtn">Copy</button>
      </div>
      <div class="output-box">
        <pre id="b64Output" style="margin:0;"></pre>
      </div>
    </div>
  `;
}

export function init() {
  const input = document.getElementById('b64Input');
  const encodeBtn = document.getElementById('b64EncodeBtn');
  const decodeBtn = document.getElementById('b64DecodeBtn');
  const swapBtn = document.getElementById('b64SwapBtn');
  const clearBtn = document.getElementById('b64ClearBtn');
  const resultSection = document.getElementById('b64ResultSection');
  const output = document.getElementById('b64Output');
  const copyBtn = document.getElementById('b64CopyBtn');

  const show = (text) => {
    output.textContent = text;
    resultSection.style.display = 'block';
  };

  encodeBtn.addEventListener('click', () => {
    const val = input.value;
    if (!val) {
      window.showToast('Nhập text trước.', 'error');
      return;
    }
    try {
      show(btoa(unescape(encodeURIComponent(val))));
    } catch (e) {
      window.showToast('Lỗi encode: ' + e.message, 'error');
    }
  });

  decodeBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) {
      window.showToast('Nhập Base64 trước.', 'error');
      return;
    }
    try {
      show(decodeURIComponent(escape(atob(val))));
    } catch {
      window.showToast('Chuỗi Base64 không hợp lệ.', 'error');
    }
  });

  swapBtn.addEventListener('click', () => {
    if (output.textContent) {
      input.value = output.textContent;
      resultSection.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    resultSection.style.display = 'none';
    input.focus();
  });

  copyBtn.addEventListener('click', () => {
    window.copyToClipboard(output.textContent, copyBtn);
  });
}
