/**
 * Text ↔ Base64 encoder/decoder — symmetric 2-column live converter with UTF-8 & URL-safe support
 */

function encodeBase64(text, urlSafe) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  let b64 = btoa(bin);
  if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return b64;
}

function decodeBase64(b64) {
  let clean = b64.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (clean.length % 4) clean += '=';
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Text ↔ Base64</h1>
      <p>Mã hóa và giải mã UTF-8 Base64 hai chiều tức thì, hỗ trợ chuẩn URL-Safe (RFC 4648).</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="d-flex align-center gap-2 flex-wrap">
          <label class="checkbox-row">
            <input type="checkbox" id="b64Live" checked />
            <span>Tự động chuyển khi gõ</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="b64UrlSafe" />
            <span>URL-Safe (- / _ , bỏ =)</span>
          </label>
        </div>
        <div class="d-flex align-center gap-1">
          <button type="button" class="btn btn-ghost btn-sm" id="b64SampleBtn">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="b64ClearBtn">Xóa</button>
        </div>
      </div>

      <div class="split-editor">
        <div>
          <div class="card-header" style="margin-bottom:6px;">
            <label class="field-label" for="b64Plain">Văn bản gốc (UTF-8)</label>
            <button type="button" class="copy-btn" id="b64CopyPlain">Copy</button>
          </div>
          <textarea
            id="b64Plain"
            class="mono w-full"
            rows="12"
            placeholder="Nhập văn bản thuần (hỗ trợ tiếng Việt, emoji...)"
            spellcheck="false"
            style="min-height:260px; resize:vertical;"
          ></textarea>
        </div>

        <div>
          <div class="card-header" style="margin-bottom:6px;">
            <label class="field-label" for="b64Encoded">Chuỗi Base64</label>
            <button type="button" class="copy-btn" id="b64CopyEncoded">Copy</button>
          </div>
          <textarea
            id="b64Encoded"
            class="mono w-full"
            rows="12"
            placeholder="Chuỗi Base64..."
            spellcheck="false"
            style="min-height:260px; resize:vertical;"
          ></textarea>
        </div>
      </div>

      <div id="b64Error" class="text-sm text-danger mt-1" style="min-height:18px;"></div>

      <div class="btn-group">
        <button type="button" class="btn btn-primary" id="b64EncodeBtn">Encode → Base64</button>
        <button type="button" class="btn btn-secondary" id="b64DecodeBtn">← Decode Text</button>
      </div>
    </div>
  `;
}

export function init() {
  const plainEl = document.getElementById('b64Plain');
  const encodedEl = document.getElementById('b64Encoded');
  const liveChk = document.getElementById('b64Live');
  const urlSafeChk = document.getElementById('b64UrlSafe');
  const errEl = document.getElementById('b64Error');
  const encodeBtn = document.getElementById('b64EncodeBtn');
  const decodeBtn = document.getElementById('b64DecodeBtn');
  const sampleBtn = document.getElementById('b64SampleBtn');
  const clearBtn = document.getElementById('b64ClearBtn');
  const copyPlainBtn = document.getElementById('b64CopyPlain');
  const copyEncodedBtn = document.getElementById('b64CopyEncoded');

  const doEncode = () => {
    errEl.textContent = '';
    const val = plainEl.value;
    if (!val) {
      encodedEl.value = '';
      return;
    }
    try {
      encodedEl.value = encodeBase64(val, urlSafeChk.checked);
    } catch (e) {
      errEl.textContent = 'Lỗi encode: ' + e.message;
    }
  };

  const doDecode = () => {
    errEl.textContent = '';
    const val = encodedEl.value.trim();
    if (!val) {
      plainEl.value = '';
      return;
    }
    try {
      plainEl.value = decodeBase64(val);
    } catch {
      errEl.textContent = 'Chuỗi Base64 không hợp lệ hoặc không phải UTF-8 chuẩn.';
    }
  };

  plainEl.addEventListener('input', () => {
    if (liveChk.checked) doEncode();
  });

  encodedEl.addEventListener('input', () => {
    if (liveChk.checked) doDecode();
  });

  urlSafeChk.addEventListener('change', () => {
    if (plainEl.value) doEncode();
  });

  encodeBtn.addEventListener('click', doEncode);
  decodeBtn.addEventListener('click', doDecode);

  sampleBtn.addEventListener('click', () => {
    plainEl.value = 'Hello World! 🚀\n{"example":"base64","utf8":true}';
    doEncode();
  });

  clearBtn.addEventListener('click', () => {
    plainEl.value = '';
    encodedEl.value = '';
    errEl.textContent = '';
    plainEl.focus();
  });

  copyPlainBtn.addEventListener('click', () => {
    if (plainEl.value) window.copyToClipboard(plainEl.value, copyPlainBtn);
  });
  copyEncodedBtn.addEventListener('click', () => {
    if (encodedEl.value) window.copyToClipboard(encodedEl.value, copyEncodedBtn);
  });
}
