/**
 * File Uploader / Inspector — client-side file metadata, base64, object URL
 */

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>File Inspector</h1>
      <p>Xem thông tin file, tạo Data URL / Object URL và sao chép Base64 — hoàn toàn trên trình duyệt.</p>
    </div>

    <!-- Drop zone -->
    <div class="card">
      <div class="drop-zone" id="fuDropZone">
        <input type="file" id="fuFileInput" style="display:none;" multiple />
        <div class="drop-zone-text">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
            style="display:block; margin:0 auto 10px; opacity:.5;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <strong>Chọn file</strong> hoặc kéo thả vào đây<br>
          <span class="text-sm text-muted">Hỗ trợ mọi loại file — không upload lên server</span>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div id="fuResults" style="display:none;">
      <div id="fuFileList" class="mt-2" style="display:flex; flex-direction:column; gap:12px;"></div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('fuDropZone');
  const fileInput = document.getElementById('fuFileInput');
  const results = document.getElementById('fuResults');
  const fileList = document.getElementById('fuFileList');

  const processFiles = (files) => {
    results.style.display = '';
    [...files].forEach((file) => {
      const card = document.createElement('div');
      card.className = 'card';

      const isImage = file.type.startsWith('image/');
      const previewId = `fu-img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const b64Id = `fu-b64-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      card.innerHTML = `
        <div class="d-flex align-center gap-2 mb-2" style="flex-wrap:wrap;">
          <strong style="font-size:15px; word-break:break-all;">${file.name}</strong>
          <span class="badge badge-blue" style="font-size:11px;">${file.type || 'unknown'}</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:8px; margin-bottom:12px;">
          <div class="ts-box"><div class="ts-box-label">Kích thước</div><div class="ts-box-val">${formatSize(file.size)}</div></div>
          <div class="ts-box"><div class="ts-box-label">Bytes</div><div class="ts-box-val">${file.size.toLocaleString()}</div></div>
          <div class="ts-box"><div class="ts-box-label">Sửa lần cuối</div><div class="ts-box-val">${new Date(file.lastModified).toLocaleString()}</div></div>
          <div class="ts-box"><div class="ts-box-label">MIME Type</div><div class="ts-box-val mono">${file.type || '—'}</div></div>
        </div>
        ${isImage ? `<div id="${previewId}" class="mb-2" style="text-align:center;"></div>` : ''}
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-primary btn-sm fu-b64-btn">Load Base64</button>
          <button class="btn btn-secondary btn-sm fu-objurl-btn">Object URL</button>
          <button class="btn btn-ghost btn-sm fu-dl-btn">Download</button>
        </div>
        <div id="${b64Id}" style="display:none; margin-top:10px;">
          <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
            <span class="field-label" style="margin:0;">Base64 Data URL</span>
            <button class="copy-btn fu-copy-b64" style="position:static;">Copy</button>
          </div>
          <textarea class="mono w-full fu-b64-output" rows="4" readonly
            style="font-size:11px; resize:vertical; background:var(--surface-2);"></textarea>
        </div>
        <style>.ts-box{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:8px 10px}.ts-box-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:2px}.ts-box-val{font-size:13px;word-break:break-all;font-family:var(--font-mono,monospace)}</style>
      `;

      fileList.prepend(card);

      const b64Wrap = card.querySelector(`#${b64Id}`);
      const b64Output = card.querySelector('.fu-b64-output');
      const b64Btn = card.querySelector('.fu-b64-btn');
      const objBtn = card.querySelector('.fu-objurl-btn');
      const dlBtn = card.querySelector('.fu-dl-btn');
      const copyB64Btn = card.querySelector('.fu-copy-b64');
      const previewEl = isImage ? card.querySelector(`#${previewId}`) : null;

      b64Btn.addEventListener('click', () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          b64Output.value = dataUrl;
          b64Wrap.style.display = '';
          b64Btn.textContent = 'Loaded';
          if (isImage && previewEl) {
            previewEl.innerHTML = `<img src="${dataUrl}" style="max-width:100%; max-height:240px; border-radius:var(--radius); border:1px solid var(--border);" />`;
          }
        };
        reader.readAsDataURL(file);
      });

      copyB64Btn.addEventListener('click', () => {
        window.copyToClipboard(b64Output.value, copyB64Btn);
      });

      objBtn.addEventListener('click', () => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      });

      dlBtn.addEventListener('click', () => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      });
    });
  };

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
