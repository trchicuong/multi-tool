/**
 * File ↔ Base64 — encode file to Base64 string or decode back
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>File ↔ Base64</h1>
      <p>Chuyển đổi file sang chuỗi Base64 và ngược lại.</p>
    </div>

    <div class="d-flex gap-1 mb-2">
      <button class="btn btn-primary btn-sm mode-btn active" data-mode="encode">File → Base64</button>
      <button class="btn btn-secondary btn-sm mode-btn" data-mode="decode">Base64 → File</button>
    </div>

    <!-- Encode panel -->
    <div id="encodePanel" class="card">
      <div class="drop-zone" id="encDropZone">
        <input type="file" id="encFileInput" style="display:none;" />
        <div class="drop-zone-text">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 8px;opacity:.6;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <strong>Chọn file</strong> hoặc kéo thả vào đây<br>
          <span class="text-sm text-muted">Tối đa 10 MB</span>
        </div>
      </div>
      <div id="encInfo" class="text-sm text-muted mt-1" style="min-height:18px;"></div>
      <div id="encResult" style="display:none; margin-top:12px;">
        <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
          <span class="field-label" style="margin:0;">Base64 Output</span>
          <div class="d-flex gap-1">
            <button class="copy-btn" id="encCopyBtn">Copy</button>
            <button class="btn btn-ghost btn-sm" id="encDownloadBtn">Download .txt</button>
          </div>
        </div>
        <textarea id="encOutput" class="mono w-full" rows="6" readonly style="resize:vertical; background:var(--code-bg); font-size:12px;"></textarea>
      </div>
    </div>

    <!-- Decode panel -->
    <div id="decodePanel" class="card" style="display:none;">
      <div class="field">
        <label class="field-label">Base64 String</label>
        <textarea id="decInput" class="mono w-full" rows="6" placeholder="Dán chuỗi Base64 vào đây..." spellcheck="false" style="resize:vertical;"></textarea>
      </div>
      <div class="row">
        <div class="flex-1">
          <label class="field-label">MIME Type</label>
          <input type="text" id="decMime" placeholder="image/png" />
        </div>
        <div class="flex-1">
          <label class="field-label">Tên file</label>
          <input type="text" id="decFilename" placeholder="download.png" />
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" id="decDownloadBtn">Giải mã & Tải về</button>
      </div>
    </div>
  `;
}

export function init() {
  const MAX = 10 * 1024 * 1024;
  const modeBtns = document.querySelectorAll('.mode-btn');
  const encodePanel = document.getElementById('encodePanel');
  const decodePanel = document.getElementById('decodePanel');

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');
      const isEncode = btn.dataset.mode === 'encode';
      encodePanel.style.display = isEncode ? '' : 'none';
      decodePanel.style.display = isEncode ? 'none' : '';
    });
  });

  // ── Encode ──────────────────────────────────────────────────────────────
  const fileInput = document.getElementById('encFileInput');
  const dropZone = document.getElementById('encDropZone');
  const encInfo = document.getElementById('encInfo');
  const encResult = document.getElementById('encResult');
  const encOutput = document.getElementById('encOutput');
  const encCopyBtn = document.getElementById('encCopyBtn');
  const encDlBtn = document.getElementById('encDownloadBtn');

  const encodeFile = (file) => {
    if (file.size > MAX) {
      window.showToast('File vượt quá 10 MB.', 'error');
      return;
    }
    encInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      encOutput.value = base64;
      encResult.style.display = 'block';
    };
    reader.onerror = () => window.showToast('Không thể đọc file.', 'error');
    reader.readAsDataURL(file);
  };

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) encodeFile(fileInput.files[0]);
  });

  dropZone.addEventListener('click', () => fileInput.click());

  // Drag-drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) encodeFile(file);
  });

  encCopyBtn.addEventListener('click', () => {
    window.copyToClipboard(encOutput.value, encCopyBtn);
  });

  encDlBtn.addEventListener('click', () => {
    const blob = new Blob([encOutput.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  // ── Decode ──────────────────────────────────────────────────────────────
  const decInput = document.getElementById('decInput');
  const decMime = document.getElementById('decMime');
  const decFilename = document.getElementById('decFilename');
  const decDlBtn = document.getElementById('decDownloadBtn');

  decMime.addEventListener('input', () => {
    const ext = decMime.value.split('/')[1];
    if (ext) decFilename.placeholder = `download.${ext}`;
  });

  decDlBtn.addEventListener('click', () => {
    const b64 = decInput.value.trim();
    if (!b64) {
      window.showToast('Nhập Base64 trước.', 'error');
      return;
    }
    const mime = decMime.value.trim() || 'application/octet-stream';
    const name = decFilename.value.trim() || decFilename.placeholder || 'download';
    try {
      const byteStr = atob(b64);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      window.showToast('Tải file thành công!', 'success');
    } catch {
      window.showToast('Chuỗi Base64 không hợp lệ.', 'error');
    }
  });
}
