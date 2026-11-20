/**
 * File ↔ Base64 — encode files as Raw Base64 or Data URL, decode with Data URL auto-detection & image preview
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>File ↔ Base64</h1>
      <p>Chuyển đổi file sang Base64 / Data URL và giải mã ngược lại thành file (hỗ trợ xem trước ảnh).</p>
    </div>

    <div class="seg-group mb-2" role="group" aria-label="Chế độ">
      <button type="button" class="btn mode-btn active" data-mode="encode">File → Base64</button>
      <button type="button" class="btn mode-btn" data-mode="decode">Base64 → File</button>
    </div>

    <!-- Encode panel -->
    <div id="encodePanel" class="card">
      <div class="card-header">
        <span class="field-label">Chọn file nguồn (tối đa 10 MB)</span>
        <label class="checkbox-row">
          <input type="checkbox" id="encDataUrl" />
          <span>Xuất dạng Data URL (<code>data:...;base64,</code>)</span>
        </label>
      </div>

      <div class="drop-zone" id="encDropZone">
        <input type="file" id="encFileInput" style="display:none;" />
        <div class="drop-zone-text">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 8px;opacity:.6;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <strong>Chọn file</strong> hoặc kéo thả vào đây
        </div>
      </div>

      <div id="encInfo" class="text-sm text-muted mt-1" style="min-height:18px;"></div>

      <div id="encResult" style="display:none; margin-top:12px;">
        <div class="card-header" style="margin-bottom:6px;">
          <span class="field-label">Base64 Output</span>
          <div class="d-flex gap-1">
            <button type="button" class="copy-btn" id="encCopyBtn">Copy</button>
            <button type="button" class="btn btn-secondary btn-sm" id="encDownloadBtn">Download .txt</button>
          </div>
        </div>
        <textarea id="encOutput" class="mono w-full" rows="7" readonly style="resize:vertical; background:var(--code-bg); font-size:12px;"></textarea>
      </div>
    </div>

    <!-- Decode panel -->
    <div id="decodePanel" class="card" style="display:none;">
      <div class="field">
        <label class="field-label" for="decInput">Chuỗi Base64 hoặc Data URL</label>
        <textarea id="decInput" class="mono w-full" rows="6" placeholder="Dán chuỗi Base64 hoặc data:image/png;base64,... vào đây" spellcheck="false" style="resize:vertical;"></textarea>
      </div>
      <div class="row">
        <div>
          <label class="field-label" for="decMime">MIME Type (tự nhận diện nếu là Data URL)</label>
          <input type="text" id="decMime" placeholder="image/png" spellcheck="false" />
        </div>
        <div>
          <label class="field-label" for="decFilename">Tên file tải về</label>
          <input type="text" id="decFilename" placeholder="download.png" spellcheck="false" />
        </div>
      </div>
      <div class="btn-group">
        <button type="button" class="btn btn-primary" id="decPreviewBtn">Giải mã &amp; Xem trước</button>
        <button type="button" class="btn btn-secondary" id="decDownloadBtn">Tải file về</button>
      </div>
      <div id="decPreviewWrap" style="display:none; margin-top:14px; text-align:center; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
        <img id="decPreviewImg" alt="Decoded preview" style="max-width:100%; max-height:280px; border-radius:4px;" />
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
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const isEncode = btn.dataset.mode === 'encode';
      encodePanel.style.display = isEncode ? '' : 'none';
      decodePanel.style.display = isEncode ? 'none' : '';
    });
  });

  // ── Encode ──────────────────────────────────────────────────────────────
  const fileInput = document.getElementById('encFileInput');
  const dropZone = document.getElementById('encDropZone');
  const dataUrlChk = document.getElementById('encDataUrl');
  const encInfo = document.getElementById('encInfo');
  const encResult = document.getElementById('encResult');
  const encOutput = document.getElementById('encOutput');
  const encCopyBtn = document.getElementById('encCopyBtn');
  const encDlBtn = document.getElementById('encDownloadBtn');

  let lastFullDataUrl = '';

  const renderEncoded = () => {
    if (!lastFullDataUrl) return;
    encOutput.value = dataUrlChk.checked ? lastFullDataUrl : lastFullDataUrl.split(',')[1] || '';
    encResult.style.display = '';
  };

  const encodeFile = (file) => {
    if (file.size > MAX) {
      window.showToast('File vượt quá 10 MB.', 'error');
      return;
    }
    encInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB · ${file.type || 'application/octet-stream'})`;
    const reader = new FileReader();
    reader.onload = (e) => {
      lastFullDataUrl = String(e.target.result || '');
      renderEncoded();
    };
    reader.onerror = () => window.showToast('Không thể đọc file.', 'error');
    reader.readAsDataURL(file);
  };

  dataUrlChk.addEventListener('change', renderEncoded);
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) encodeFile(fileInput.files[0]);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) encodeFile(e.dataTransfer.files[0]);
  });

  encCopyBtn.addEventListener('click', () => {
    if (encOutput.value) window.copyToClipboard(encOutput.value, encCopyBtn);
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
  const decPreviewBtn = document.getElementById('decPreviewBtn');
  const decDlBtn = document.getElementById('decDownloadBtn');
  const decPreviewWrap = document.getElementById('decPreviewWrap');
  const decPreviewImg = document.getElementById('decPreviewImg');

  let previewUrl = null;

  const parseDecodeInput = () => {
    const raw = decInput.value.trim();
    if (!raw) throw new Error('Nhập Base64 trước.');
    let b64 = raw;
    let detectedMime = decMime.value.trim();
    const match = raw.match(/^data:([^;]+);base64,(.+)$/s);
    if (match) {
      if (!detectedMime) {
        detectedMime = match[1];
        decMime.value = detectedMime;
      }
      b64 = match[2];
    }
    const mime = detectedMime || 'application/octet-stream';
    const ext = mime.includes('/') ? mime.split('/')[1].split('+')[0] : 'bin';
    if (!decFilename.value.trim()) decFilename.placeholder = `download.${ext}`;
    const cleanB64 = b64.replace(/\s+/g, '');
    const byteStr = atob(cleanB64);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    return { bytes, mime, name: decFilename.value.trim() || `download.${ext}` };
  };

  decInput.addEventListener('input', () => {
    const match = decInput.value.trim().match(/^data:([^;]+);base64,/);
    if (match && !decMime.value.trim()) {
      decMime.value = match[1];
      const ext = match[1].split('/')[1]?.split('+')[0] || 'bin';
      decFilename.placeholder = `download.${ext}`;
    }
  });

  decMime.addEventListener('input', () => {
    const ext = decMime.value.split('/')[1]?.split('+')[0];
    if (ext) decFilename.placeholder = `download.${ext}`;
  });

  decPreviewBtn.addEventListener('click', () => {
    try {
      const { bytes, mime } = parseDecodeInput();
      const blob = new Blob([bytes], { type: mime });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(blob);
      if (mime.startsWith('image/')) {
        decPreviewImg.src = previewUrl;
        decPreviewWrap.style.display = '';
      } else {
        decPreviewWrap.style.display = 'none';
        window.showToast(`Giải mã thành công (${(bytes.length / 1024).toFixed(1)} KB · ${mime})`, 'success');
      }
    } catch (e) {
      window.showToast(e.message || 'Chuỗi Base64 không hợp lệ.', 'error');
    }
  });

  decDlBtn.addEventListener('click', () => {
    try {
      const { bytes, mime, name } = parseDecodeInput();
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      window.showToast('Tải file thành công!', 'success');
    } catch (e) {
      window.showToast(e.message || 'Chuỗi Base64 không hợp lệ.', 'error');
    }
  });

  return () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };
}
