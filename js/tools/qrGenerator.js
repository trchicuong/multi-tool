/**
 * QR Code Generator — split 2-column live generator with URL / Wi-Fi / Email / Text templates
 */

import QRCode from 'qrcode';

const QR_TEMPLATES = [
  { label: 'URL', val: 'https://example.com' },
  { label: 'Wi-Fi', val: 'WIFI:T:WPA;S:ExampleNetwork;P:ExamplePassword;;' },
  { label: 'Email', val: 'mailto:user@example.com?subject=Hello' },
  { label: 'Text', val: 'Hello World! Sample QR content.' },
];

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>QR Code Generator</h1>
      <p>Tạo mã QR trực tiếp theo thời gian thực cho URL, Wi-Fi, Email hoặc văn bản. Xuất PNG hoặc SVG sắc nét.</p>
    </div>

    <div class="split-editor" style="align-items:stretch;">
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <span class="field-label">Mẫu nhanh</span>
          <div class="preset-strip">
            ${QR_TEMPLATES.map(
              (t, idx) =>
                `<button type="button" class="btn btn-secondary btn-sm qr-tpl-btn" data-idx="${idx}">${t.label}</button>`,
            ).join('')}
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="qrInput">Nội dung QR</label>
          <textarea
            id="qrInput"
            rows="4"
            class="mono"
            placeholder="Nhập URL, text, WiFi, Email..."
            spellcheck="false"
          >https://example.com</textarea>
        </div>

        <div class="row" style="gap:12px;">
          <div>
            <label class="field-label" for="qrSize">Kích thước (px)</label>
            <input type="number" id="qrSize" value="280" min="128" max="1024" step="16" />
          </div>
          <div>
            <label class="field-label" for="qrEcc">Mức sửa lỗi (ECC)</label>
            <select id="qrEcc">
              <option value="L">L (7%)</option>
              <option value="M" selected>M (15%)</option>
              <option value="Q">Q (25%)</option>
              <option value="H">H (30%)</option>
            </select>
          </div>
        </div>

        <div class="row mt-1" style="gap:12px;">
          <div>
            <label class="field-label" for="qrFg">Màu QR</label>
            <div class="d-flex align-center gap-2">
              <input type="color" id="qrFg" value="#000000" style="width:100%;" />
            </div>
          </div>
          <div>
            <label class="field-label" for="qrBg">Màu nền</label>
            <div class="d-flex align-center gap-2">
              <input type="color" id="qrBg" value="#ffffff" style="width:100%;" />
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
        <div class="card-header">
          <span class="field-label">Preview</span>
          <span class="text-sm text-muted mono" id="qrInfo"></span>
        </div>

        <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:16px; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); min-height:240px;">
          <canvas id="qrCanvas" style="border-radius:6px; max-width:100%; height:auto;"></canvas>
          <span id="qrEmpty" class="text-sm text-muted" style="display:none;">Nhập nội dung để tạo mã QR.</span>
        </div>

        <div class="btn-group" style="justify-content:center;">
          <button type="button" class="btn btn-primary btn-sm" id="qrDownloadPng">Download PNG</button>
          <button type="button" class="btn btn-secondary btn-sm" id="qrDownloadSvg">Download SVG</button>
          <button type="button" class="copy-btn" id="qrCopyDataUrl">Copy Data URL</button>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const inputEl = document.getElementById('qrInput');
  const sizeInput = document.getElementById('qrSize');
  const eccSel = document.getElementById('qrEcc');
  const bgColor = document.getElementById('qrBg');
  const fgColor = document.getElementById('qrFg');
  const canvas = document.getElementById('qrCanvas');
  const emptyEl = document.getElementById('qrEmpty');
  const dlPng = document.getElementById('qrDownloadPng');
  const dlSvg = document.getElementById('qrDownloadSvg');
  const copyUrl = document.getElementById('qrCopyDataUrl');
  const infoEl = document.getElementById('qrInfo');

  let lastSvg = '';

  const generate = async () => {
    const text = inputEl.value.trim();
    if (!text) {
      canvas.style.display = 'none';
      emptyEl.style.display = '';
      infoEl.textContent = '';
      lastSvg = '';
      return;
    }

    const size = Math.min(Math.max(128, parseInt(sizeInput.value, 10) || 280), 1024);
    const ecc = eccSel.value;
    const bg = bgColor.value;
    const fg = fgColor.value;

    try {
      canvas.style.display = '';
      emptyEl.style.display = 'none';
      await QRCode.toCanvas(canvas, text, {
        width: size,
        errorCorrectionLevel: ecc,
        color: { dark: fg, light: bg },
        margin: 2,
      });
      lastSvg = await QRCode.toString(text, {
        type: 'svg',
        errorCorrectionLevel: ecc,
        color: { dark: fg, light: bg },
        margin: 2,
      });
      infoEl.textContent = `${text.length} chars · ${size}×${size}px · ECC ${ecc}`;
    } catch (e) {
      infoEl.textContent = e.message;
    }
  };

  [inputEl, sizeInput, bgColor, fgColor].forEach((el) => el.addEventListener('input', generate));
  eccSel.addEventListener('change', generate);

  document.querySelectorAll('.qr-tpl-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tpl = QR_TEMPLATES[Number(btn.dataset.idx)];
      if (!tpl) return;
      inputEl.value = tpl.val;
      generate();
    });
  });

  dlPng.addEventListener('click', () => {
    if (!lastSvg) return;
    const a = document.createElement('a');
    a.download = 'qr-code.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  dlSvg.addEventListener('click', () => {
    if (!lastSvg) return;
    const blob = new Blob([lastSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'qr-code.svg';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  });

  copyUrl.addEventListener('click', () => {
    if (lastSvg) window.copyToClipboard(canvas.toDataURL('image/png'), copyUrl);
  });

  generate();
}
