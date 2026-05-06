/**
 * Image Converter & Resizer — Canvas API, no external dependencies
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Image Converter & Resizer</h1>
      <p>Chuyển đổi định dạng và resize ảnh trực tiếp trên trình duyệt. Hỗ trợ PNG, JPEG, WEBP, BMP.</p>
    </div>

    <!-- Drop zone -->
    <div class="card">
      <div class="drop-zone" id="icDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="text-muted text-sm mt-1" id="icDropLabel">Kéo ảnh vào đây hoặc click để chọn file (tối đa 10MB)</p>
        <input type="file" id="icFileInput" accept="image/*" style="display:none;" />
      </div>
    </div>

    <div id="icControls" style="display:none;">
      <div class="row mt-2" style="align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <!-- Preview -->
        <div class="card" style="flex:1; min-width:200px; text-align:center;">
          <div class="field-label">Preview</div>
          <img id="icPreview" style="max-width:100%; max-height:300px; margin-top:8px; border-radius:4px; object-fit:contain;" />
          <div class="text-sm text-muted mt-1" id="icOrigInfo"></div>
        </div>

        <!-- Options -->
        <div class="card flex-1" style="min-width:240px;">
          <div class="field-label">Kích thước</div>
          <div style="display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:flex-end; margin-top:6px;">
            <div>
              <label class="field-label">Rộng (px)</label>
              <input type="number" id="icWidth" min="1" max="8000" />
            </div>
            <span class="text-muted" style="padding-bottom:8px; text-align:center;">×</span>
            <div>
              <label class="field-label">Cao (px)</label>
              <input type="number" id="icHeight" min="1" max="8000" />
            </div>
          </div>
          <label class="d-flex align-center gap-2 mt-1" style="cursor:pointer;">
            <input type="checkbox" id="icAspect" checked /> Giữ tỉ lệ khung hình
          </label>

          <div class="field mt-2">
            <label class="field-label">Định dạng xuất</label>
            <select id="icFormat">
              <option value="image/png">PNG</option>
              <option value="image/jpeg" selected>JPEG</option>
              <option value="image/webp">WEBP</option>
            </select>
          </div>

          <div class="field mt-1" id="icQualityWrap">
            <label class="field-label">Chất lượng: <span id="icQualityVal" class="mono">90%</span></label>
            <input type="range" id="icQuality" min="10" max="100" value="90" style="width:100%;" />
          </div>

          <button class="btn btn-primary w-full mt-2" id="icConvertBtn">Convert & Download</button>
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
  const widthInput = document.getElementById('icWidth');
  const heightInput = document.getElementById('icHeight');
  const aspectChk = document.getElementById('icAspect');
  const formatSel = document.getElementById('icFormat');
  const qualityInput = document.getElementById('icQuality');
  const qualityVal = document.getElementById('icQualityVal');
  const qualWrap = document.getElementById('icQualityWrap');
  const convertBtn = document.getElementById('icConvertBtn');
  const dropLabel = document.getElementById('icDropLabel');

  let origWidth = 0,
    origHeight = 0,
    currentDataUrl = '';

  const loadFile = (file) => {
    if (!file.type.startsWith('image/')) {
      window.showToast('Chỉ hỗ trợ file ảnh', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      window.showToast('File quá lớn (tối đa 10MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        origWidth = img.width;
        origHeight = img.height;
        widthInput.value = img.width;
        heightInput.value = img.height;
        currentDataUrl = e.target.result;
        preview.src = currentDataUrl;
        origInfo.textContent = `${img.width} × ${img.height}px · ${(file.size / 1024).toFixed(1)} KB · ${file.type}`;
        dropLabel.textContent = file.name;
        controls.style.display = '';
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

  // Aspect ratio
  widthInput.addEventListener('input', () => {
    if (!aspectChk.checked || !origWidth) return;
    heightInput.value = Math.round((widthInput.value * origHeight) / origWidth);
  });
  heightInput.addEventListener('input', () => {
    if (!aspectChk.checked || !origHeight) return;
    widthInput.value = Math.round((heightInput.value * origWidth) / origHeight);
  });

  formatSel.addEventListener('change', () => {
    qualWrap.style.display = formatSel.value === 'image/png' ? 'none' : '';
  });

  qualityInput.addEventListener('input', () => {
    qualityVal.textContent = qualityInput.value + '%';
  });

  convertBtn.addEventListener('click', () => {
    if (!currentDataUrl) return;
    const w = parseInt(widthInput.value) || origWidth;
    const h = parseInt(heightInput.value) || origHeight;
    const fmt = formatSel.value;
    const q = parseInt(qualityInput.value) / 100;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (fmt === 'image/jpeg') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const ext = fmt.split('/')[1];
      canvas.toBlob(
        (blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `converted.${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
          window.showToast(`Đã xuất ${w}×${h} ${ext.toUpperCase()}`, 'success');
        },
        fmt,
        q,
      );
    };
    img.src = currentDataUrl;
  });
}
