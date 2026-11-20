/**
 * Image Converter & Resizer — Canvas API with quick scale presets & live estimated file size
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Image Converter &amp; Resizer</h1>
      <p>Chuyển đổi định dạng (PNG, JPEG, WEBP), thay đổi kích thước theo tỉ lệ và xem dung lượng sau nén.</p>
    </div>

    <div class="card">
      <div class="drop-zone" id="icDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="text-muted text-sm mt-1" id="icDropLabel">Kéo ảnh vào đây hoặc click để chọn file (tối đa 10MB)</p>
        <input type="file" id="icFileInput" accept="image/*" style="display:none;" />
      </div>
    </div>

    <div id="icControls" style="display:none;">
      <div class="split-editor" style="align-items:stretch;">
        <!-- Preview -->
        <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
          <div class="card-header">
            <span class="field-label">Preview</span>
            <span id="icOrigInfo" class="text-sm text-muted mono"></span>
          </div>
          <div style="flex:1; display:flex; align-items:center; justify-content:center; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px; min-height:240px;">
            <img id="icPreview" alt="Preview" style="max-width:100%; max-height:300px; border-radius:4px; object-fit:contain;" />
          </div>
          <div id="icEstInfo" class="text-sm text-muted mt-1 mono" style="min-height:18px;"></div>
        </div>

        <!-- Options -->
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <span class="field-label">Kích thước &amp; Định dạng</span>
            <div class="preset-strip">
              ${[25, 50, 75, 100]
                .map(
                  (pct) =>
                    `<button type="button" class="btn btn-secondary btn-sm ic-scale-btn" data-scale="${pct}">${pct}%</button>`,
                )
                .join('')}
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr auto 1fr; gap:10px; align-items:end;">
            <div>
              <label class="field-label" for="icWidth">Rộng (px)</label>
              <input type="number" id="icWidth" min="1" max="8000" />
            </div>
            <span class="text-muted" style="height:38px; display:flex; align-items:center;">×</span>
            <div>
              <label class="field-label" for="icHeight">Cao (px)</label>
              <input type="number" id="icHeight" min="1" max="8000" />
            </div>
          </div>

          <div class="mt-1">
            <label class="checkbox-row">
              <input type="checkbox" id="icAspect" checked />
              <span>Giữ tỉ lệ khung hình</span>
            </label>
          </div>

          <div class="field mt-2">
            <label class="field-label" for="icFormat">Định dạng xuất</label>
            <select id="icFormat">
              <option value="image/png">PNG (Lossless)</option>
              <option value="image/jpeg" selected>JPEG</option>
              <option value="image/webp">WEBP (Nhẹ nhất)</option>
            </select>
          </div>

          <div class="field" id="icQualityWrap">
            <label class="field-label" for="icQuality" style="display:flex; justify-content:space-between;">
              <span>Chất lượng nén</span>
              <span id="icQualityVal" class="mono">90%</span>
            </label>
            <input type="range" id="icQuality" min="10" max="100" value="90" />
          </div>

          <button type="button" class="btn btn-primary w-full mt-2" id="icConvertBtn">Convert &amp; Download</button>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('icDropZone');
  const fileInput = document.getElementById('icFileInput');
  const controls = document.getElementById('icControls');
  const preview = document.getElementById('icPreview');
  const origInfo = document.getElementById('icOrigInfo');
  const estInfo = document.getElementById('icEstInfo');
  const widthInput = document.getElementById('icWidth');
  const heightInput = document.getElementById('icHeight');
  const aspectChk = document.getElementById('icAspect');
  const formatSel = document.getElementById('icFormat');
  const qualityInput = document.getElementById('icQuality');
  const qualityVal = document.getElementById('icQualityVal');
  const qualWrap = document.getElementById('icQualityWrap');
  const convertBtn = document.getElementById('icConvertBtn');
  const dropLabel = document.getElementById('icDropLabel');

  let origWidth = 0;
  let origHeight = 0;
  let origSize = 0;
  let origName = 'image';
  let loadedImg = null;
  let estTimer = null;

  const renderCanvasBlob = (cb) => {
    if (!loadedImg) return;
    const w = Math.max(1, parseInt(widthInput.value, 10) || origWidth);
    const h = Math.max(1, parseInt(heightInput.value, 10) || origHeight);
    const fmt = formatSel.value;
    const q = parseInt(qualityInput.value, 10) / 100;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (fmt === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(loadedImg, 0, 0, w, h);
    canvas.toBlob((blob) => cb(blob, w, h, fmt), fmt, q);
  };

  const estimateOutput = () => {
    clearTimeout(estTimer);
    if (!loadedImg) return;
    estInfo.textContent = 'Đang ước tính dung lượng...';
    estTimer = setTimeout(() => {
      renderCanvasBlob((blob, w, h, fmt) => {
        if (!blob) return;
        const ext = fmt.split('/')[1].toUpperCase();
        const kb = (blob.size / 1024).toFixed(1);
        const ratio = origSize ? (((blob.size - origSize) / origSize) * 100).toFixed(1) : '0';
        const sign = Number(ratio) > 0 ? `+${ratio}%` : `${ratio}%`;
        estInfo.textContent = `Dự kiến: ${w}×${h}px · ${ext} · ${kb} KB (${sign} so với ảnh gốc)`;
      });
    }, 180);
  };

  const loadFile = (file) => {
    if (!file.type.startsWith('image/')) {
      window.showToast('Chỉ hỗ trợ file ảnh', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      window.showToast('File quá lớn (tối đa 10MB)', 'error');
      return;
    }
    origSize = file.size;
    origName = file.name.replace(/\.[^.]+$/, '') || 'converted';
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        origWidth = img.width;
        origHeight = img.height;
        widthInput.value = String(img.width);
        heightInput.value = String(img.height);
        preview.src = e.target.result;
        origInfo.textContent = `${img.width}×${img.height}px · ${(file.size / 1024).toFixed(1)} KB`;
        dropLabel.textContent = file.name;
        controls.style.display = '';
        estimateOutput();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadFile(fileInput.files[0]);
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });

  document.querySelectorAll('.ic-scale-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!origWidth) return;
      const pct = Number(btn.dataset.scale) / 100;
      widthInput.value = String(Math.max(1, Math.round(origWidth * pct)));
      heightInput.value = String(Math.max(1, Math.round(origHeight * pct)));
      estimateOutput();
    });
  });

  widthInput.addEventListener('input', () => {
    if (aspectChk.checked && origWidth) {
      heightInput.value = String(Math.max(1, Math.round((Number(widthInput.value) * origHeight) / origWidth)));
    }
    estimateOutput();
  });
  heightInput.addEventListener('input', () => {
    if (aspectChk.checked && origHeight) {
      widthInput.value = String(Math.max(1, Math.round((Number(heightInput.value) * origWidth) / origHeight)));
    }
    estimateOutput();
  });

  formatSel.addEventListener('change', () => {
    qualWrap.style.display = formatSel.value === 'image/png' ? 'none' : '';
    estimateOutput();
  });

  qualityInput.addEventListener('input', () => {
    qualityVal.textContent = `${qualityInput.value}%`;
    estimateOutput();
  });

  convertBtn.addEventListener('click', () => {
    renderCanvasBlob((blob, w, h, fmt) => {
      if (!blob) return;
      const ext = fmt.split('/')[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${origName}-${w}x${h}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      window.showToast(`Đã xuất ${w}×${h} ${ext.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)`, 'success');
    });
  });

  return () => clearTimeout(estTimer);
}
