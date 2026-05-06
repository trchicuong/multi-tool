/**
 * QR Code Generator — using qrcode package (canvas-based)
 */

import QRCode from 'qrcode';

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>QR Code Generator</h1>
      <p>Tạo QR code từ text, URL hoặc bất kỳ chuỗi nào. Tải về dạng PNG hoặc SVG.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label">Nội dung</label>
        <textarea id="qrInput" rows="4" placeholder="Nhập URL, text, vCard, WiFi credentials..." spellcheck="false"></textarea>
      </div>

      <div class="row" style="flex-wrap:wrap; gap:12px; align-items:flex-end;">
        <div style="flex:0 0 120px;">
          <label class="field-label">Kích thước (px)</label>
          <input type="number" id="qrSize" value="300" min="128" max="1024" step="16" />
        </div>
        <div style="flex:0 0 120px;">
          <label class="field-label">Mức sửa lỗi</label>
          <select id="qrEcc">
            <option value="L">L (7%)</option>
            <option value="M" selected>M (15%)</option>
            <option value="Q">Q (25%)</option>
            <option value="H">H (30%)</option>
          </select>
        </div>
        <div style="flex:0 0 100px;">
          <label class="field-label">Nền</label>
          <input type="color" id="qrBg" value="#ffffff" style="width:100%; height:38px; border-radius:var(--radius); cursor:pointer; padding:2px;" />
        </div>
        <div style="flex:0 0 100px;">
          <label class="field-label">Màu QR</label>
          <input type="color" id="qrFg" value="#000000" style="width:100%; height:38px; border-radius:var(--radius); cursor:pointer; padding:2px;" />
        </div>
        <button class="btn btn-primary" id="qrGenBtn" style="align-self:flex-end;">Generate</button>
      </div>
    </div>

    <div class="card mt-2" id="qrResultCard" style="display:none; align-items:center; flex-direction:column; gap:16px;">
      <canvas id="qrCanvas" style="border-radius:8px; max-width:100%;"></canvas>
      <div class="btn-group">
        <button class="btn btn-primary" id="qrDownloadPng">Download PNG</button>
        <button class="btn btn-secondary" id="qrDownloadSvg">Download SVG</button>
        <button class="btn btn-ghost" id="qrCopyDataUrl">Copy Data URL</button>
      </div>
      <div class="text-sm text-muted" id="qrInfo"></div>
    </div>
  `;
}

export function init() {
  const inputEl = document.getElementById('qrInput');
  const sizeInput = document.getElementById('qrSize');
  const eccSel = document.getElementById('qrEcc');
  const bgColor = document.getElementById('qrBg');
  const fgColor = document.getElementById('qrFg');
  const genBtn = document.getElementById('qrGenBtn');
  const resultCard = document.getElementById('qrResultCard');
  const canvas = document.getElementById('qrCanvas');
  const dlPng = document.getElementById('qrDownloadPng');
  const dlSvg = document.getElementById('qrDownloadSvg');
  const copyUrl = document.getElementById('qrCopyDataUrl');
  const infoEl = document.getElementById('qrInfo');

  let lastSvg = '';

  const generate = async () => {
    const text = inputEl.value.trim();
    if (!text) {
      window.showToast('Nhập nội dung trước', 'error');
      return;
    }
    const size = Math.min(Math.max(128, parseInt(sizeInput.value) || 300), 1024);
    const ecc = eccSel.value;
    const bg = bgColor.value;
    const fg = fgColor.value;

    try {
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
      infoEl.textContent = `${text.length} ký tự · ${size}×${size}px · ECC ${ecc}`;
      resultCard.style.display = 'flex';
    } catch (e) {
      window.showToast('Lỗi: ' + e.message, 'error');
    }
  };

  genBtn.addEventListener('click', generate);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) generate();
  });

  dlPng.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'qr-code.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  dlSvg.addEventListener('click', () => {
    if (!lastSvg) return;
    const blob = new Blob([lastSvg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.download = 'qr-code.svg';
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  });

  copyUrl.addEventListener('click', () => {
    window.copyToClipboard(canvas.toDataURL('image/png'), copyUrl);
  });
}
