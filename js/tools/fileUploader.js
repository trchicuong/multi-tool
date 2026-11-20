/**
 * File Inspector — Metadata, SHA-256 Checksum, Magic Bytes (Hex/ASCII), Base64 & Object URL
 */

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function formatMagicBytes(uint8) {
  const slice = uint8.subarray(0, 16);
  const hex = Array.from(slice, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  const ascii = Array.from(slice, (b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
  return `${hex}  |  ${ascii}`;
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>File Inspector</h1>
      <p>Kiểm tra metadata, tính SHA-256 Checksum, xem 16 Magic Bytes đầu và trích xuất Base64 ngay trên trình duyệt.</p>
    </div>

    <div class="card">
      <div class="drop-zone" id="fuDropZone">
        <input type="file" id="fuFileInput" style="display:none;" multiple />
        <div class="drop-zone-text">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block; margin:0 auto 8px; opacity:.55;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <strong>Chọn file</strong> hoặc kéo thả vào đây (hỗ trợ nhiều file cùng lúc)
        </div>
      </div>
    </div>

    <div id="fuResults" style="display:none;">
      <div class="d-flex align-center justify-between mb-1">
        <span class="field-label" style="margin:0;">Danh sách File đã phân tích</span>
        <button type="button" class="btn btn-ghost btn-sm" id="fuClearList">Xóa danh sách</button>
      </div>
      <div id="fuFileList" style="display:flex; flex-direction:column; gap:12px;"></div>
    </div>

    <style>
      .fu-meta-box { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:8px 10px; }
      .fu-meta-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); margin-bottom:2px; }
      .fu-meta-val { font-size:12.5px; word-break:break-all; font-family:var(--font-mono); }
    </style>
  `;
}

export function init() {
  const dropZone = document.getElementById('fuDropZone');
  const fileInput = document.getElementById('fuFileInput');
  const results = document.getElementById('fuResults');
  const fileList = document.getElementById('fuFileList');
  const clearListBtn = document.getElementById('fuClearList');

  const processFiles = (files) => {
    results.style.display = '';
    [...files].forEach(async (file) => {
      const card = document.createElement('div');
      card.className = 'card';
      const isImage = file.type.startsWith('image/');

      card.innerHTML = `
        <div class="card-header">
          <div class="d-flex align-center gap-2 flex-wrap">
            <strong style="font-size:14.5px; word-break:break-all;">${escHtml(file.name)}</strong>
            <span class="badge badge-blue">${escHtml(file.type || 'unknown')}</span>
          </div>
          <div class="d-flex gap-1">
            <button type="button" class="btn btn-secondary btn-sm fu-b64-btn">Load Base64</button>
            <button type="button" class="btn btn-ghost btn-sm fu-objurl-btn">Mở tab mới</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(185px,1fr)); gap:8px; margin-bottom:10px;">
          <div class="fu-meta-box"><div class="fu-meta-label">Kích thước</div><div class="fu-meta-val">${formatSize(file.size)} (${file.size.toLocaleString()} B)</div></div>
          <div class="fu-meta-box"><div class="fu-meta-label">Sửa lần cuối</div><div class="fu-meta-val">${new Date(file.lastModified).toLocaleString()}</div></div>
          <div class="fu-meta-box"><div class="fu-meta-label">MIME Type</div><div class="fu-meta-val">${escHtml(file.type || '—')}</div></div>
        </div>

        <div class="fu-meta-box mb-1">
          <div class="d-flex align-center justify-between gap-2">
            <div style="min-width:0; flex:1;">
              <div class="fu-meta-label">SHA-256 Checksum</div>
              <div class="fu-meta-val fu-sha256">Đang tính...</div>
            </div>
            <button type="button" class="copy-btn fu-copy-sha">Copy</button>
          </div>
        </div>

        <div class="fu-meta-box mb-1">
          <div class="fu-meta-label">Magic Bytes (16 byte đầu: Hex | ASCII)</div>
          <div class="fu-meta-val fu-magic">Đang đọc...</div>
        </div>

        ${isImage ? `<div class="fu-img-preview mt-2" style="text-align:center;"></div>` : ''}

        <div class="fu-b64-wrap mt-2" style="display:none;">
          <div class="card-header" style="margin-bottom:6px;">
            <span class="field-label">Base64 Data URL</span>
            <button type="button" class="copy-btn fu-copy-b64">Copy</button>
          </div>
          <textarea class="mono w-full fu-b64-output" rows="4" readonly style="font-size:11.5px; resize:vertical; background:var(--code-bg);"></textarea>
        </div>
      `;

      fileList.prepend(card);

      const shaEl = card.querySelector('.fu-sha256');
      const magicEl = card.querySelector('.fu-magic');
      const copyShaBtn = card.querySelector('.fu-copy-sha');
      const b64Wrap = card.querySelector('.fu-b64-wrap');
      const b64Output = card.querySelector('.fu-b64-output');
      const b64Btn = card.querySelector('.fu-b64-btn');
      const objBtn = card.querySelector('.fu-objurl-btn');
      const copyB64Btn = card.querySelector('.fu-copy-b64');
      const previewEl = card.querySelector('.fu-img-preview');

      // Read magic bytes & SHA-256
      try {
        const headBuf = await file.slice(0, 16).arrayBuffer();
        magicEl.textContent = formatMagicBytes(new Uint8Array(headBuf));

        if (file.size <= 100 * 1024 * 1024) {
          const fullBuf = await file.arrayBuffer();
          const digest = await crypto.subtle.digest('SHA-256', fullBuf);
          const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
          shaEl.textContent = hex;
          copyShaBtn.addEventListener('click', () => window.copyToClipboard(hex, copyShaBtn));
        } else {
          shaEl.textContent = 'File > 100MB (bỏ qua băm tự động)';
        }
      } catch {
        shaEl.textContent = 'Không thể đọc buffer file';
      }

      b64Btn.addEventListener('click', () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = String(e.target.result || '');
          b64Output.value = dataUrl;
          b64Wrap.style.display = '';
          b64Btn.textContent = 'Loaded';
          if (isImage && previewEl) {
            previewEl.innerHTML = `<img src="${dataUrl}" alt="Preview" style="max-width:100%; max-height:240px; border-radius:var(--radius); border:1px solid var(--border);" />`;
          }
        };
        reader.readAsDataURL(file);
      });

      copyB64Btn.addEventListener('click', () => window.copyToClipboard(b64Output.value, copyB64Btn));

      objBtn.addEventListener('click', () => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      });
    });
  };

  clearListBtn.addEventListener('click', () => {
    fileList.innerHTML = '';
    results.style.display = 'none';
  });

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) processFiles(fileInput.files);
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  });
}
