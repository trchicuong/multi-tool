/**
 * Image Editor — brightness, contrast, saturation, rotation, flip, filters
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Image Editor</h1>
      <p>Chỉnh sửa ảnh: lọc màu, độ sáng, tương phản, xoay, lật. Xuất kết quả dưới dạng PNG/JPEG.</p>
    </div>

    <div class="card">
      <div class="drop-zone" id="ieDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="text-muted text-sm mt-1">Kéo ảnh vào đây hoặc click để chọn file (tối đa 10MB)</p>
        <input type="file" id="ieFileInput" accept="image/*" style="display:none;" />
      </div>
    </div>

    <div id="ieMain" style="display:none;">
      <div class="row mt-2" style="align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <!-- Canvas preview -->
        <div class="card flex-1" style="min-width:220px; text-align:center; overflow:auto;">
          <canvas id="ieCanvas" style="max-width:100%; max-height:380px; object-fit:contain; border-radius:4px;"></canvas>
        </div>

        <!-- Controls -->
        <div class="card" style="min-width:260px; width:300px; flex:0 0 300px;">
          <!-- Quick filters -->
          <div class="field-label">Bộ lọc nhanh</div>
          <div class="btn-group mt-1" style="flex-wrap:wrap; gap:4px;">
            <button class="btn btn-ghost btn-sm ie-filter" data-filter="none">Normal</button>
            <button class="btn btn-ghost btn-sm ie-filter" data-filter="grayscale(100%)">Grayscale</button>
            <button class="btn btn-ghost btn-sm ie-filter" data-filter="sepia(100%)">Sepia</button>
            <button class="btn btn-ghost btn-sm ie-filter" data-filter="invert(100%)">Invert</button>
            <button class="btn btn-ghost btn-sm ie-filter" data-filter="blur(2px)">Blur</button>
          </div>

          <!-- Sliders -->
          <div class="mt-2" style="display:flex; flex-direction:column; gap:10px;">
            ${[
              { id: 'ieBrightness', label: 'Độ sáng', min: 0, max: 200, val: 100, unit: '%' },
              { id: 'ieContrast', label: 'Tương phản', min: 0, max: 200, val: 100, unit: '%' },
              { id: 'ieSaturation', label: 'Bão hòa', min: 0, max: 200, val: 100, unit: '%' },
              { id: 'ieHue', label: 'Hue', min: -180, max: 180, val: 0, unit: '°' },
              { id: 'ieSharpness', label: 'Opacity', min: 0, max: 100, val: 100, unit: '%' },
            ]
              .map(
                (s) => `
              <div>
                <label class="field-label" style="display:flex; justify-content:space-between;">
                  ${s.label}
                  <span id="${s.id}Val" class="mono">${s.val}${s.unit}</span>
                </label>
                <input type="range" id="${s.id}" min="${s.min}" max="${s.max}" value="${s.val}" style="width:100%;" />
              </div>
            `,
              )
              .join('')}
          </div>

          <!-- Transform -->
          <div class="field-label mt-2">Transform</div>
          <div class="btn-group mt-1">
            <button class="btn btn-ghost btn-sm" id="ieRotLeft">↺ 90°</button>
            <button class="btn btn-ghost btn-sm" id="ieRotRight">↻ 90°</button>
            <button class="btn btn-ghost btn-sm" id="ieFlipH">⟺ H</button>
            <button class="btn btn-ghost btn-sm" id="ieFlipV">⥮ V</button>
          </div>

          <!-- Reset + Download -->
          <div class="btn-group mt-2">
            <button class="btn btn-danger btn-sm" id="ieResetBtn">Reset</button>
          </div>
          <div class="row mt-1">
            <button class="btn btn-primary flex-1" id="ieDownloadPng">Download PNG</button>
            <button class="btn btn-secondary flex-1" id="ieDownloadJpeg">Download JPEG</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('ieDropZone');
  const fileInput = document.getElementById('ieFileInput');
  const mainEl = document.getElementById('ieMain');
  const canvas = document.getElementById('ieCanvas');
  const ctx = canvas.getContext('2d');

  let origImg = null;
  let rotation = 0;
  let flipH = false,
    flipV = false;
  let quickFilter = 'none';

  const state = {
    ieBrightness: { val: 100, unit: '%', css: 'brightness' },
    ieContrast: { val: 100, unit: '%', css: 'contrast' },
    ieSaturation: { val: 100, unit: '%', css: 'saturate' },
    ieHue: { val: 0, unit: '°', css: 'hue-rotate' },
    ieSharpness: { val: 100, unit: '%', css: 'opacity' },
  };

  const buildFilter = () => {
    if (quickFilter !== 'none') return quickFilter;
    return [
      `brightness(${state.ieBrightness.val}%)`,
      `contrast(${state.ieContrast.val}%)`,
      `saturate(${state.ieSaturation.val}%)`,
      `hue-rotate(${state.ieHue.val}deg)`,
      `opacity(${state.ieSharpness.val}%)`,
    ].join(' ');
  };

  const draw = () => {
    if (!origImg) return;
    const rad = (rotation * Math.PI) / 180;
    const isRotated90 = rotation % 180 !== 0;
    const w = isRotated90 ? origImg.naturalHeight : origImg.naturalWidth;
    const h = isRotated90 ? origImg.naturalWidth : origImg.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.save();
    ctx.filter = buildFilter();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(origImg, -origImg.naturalWidth / 2, -origImg.naturalHeight / 2);
    ctx.restore();
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
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        origImg = img;
        rotation = 0;
        flipH = flipV = false;
        resetSliders();
        draw();
        mainEl.style.display = '';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const resetSliders = () => {
    for (const [id, s] of Object.entries(state)) {
      s.val =
        id === 'ieBrightness' || id === 'ieContrast' || id === 'ieSaturation'
          ? 100
          : id === 'ieSharpness'
            ? 100
            : 0;
      document.getElementById(id).value = s.val;
      document.getElementById(id + 'Val').textContent = s.val + s.unit;
    }
    quickFilter = 'none';
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

  // Sliders
  for (const [id, s] of Object.entries(state)) {
    document.getElementById(id).addEventListener('input', (e) => {
      s.val = +e.target.value;
      document.getElementById(id + 'Val').textContent = s.val + s.unit;
      quickFilter = 'none';
      draw();
    });
  }

  // Quick filters
  document.querySelectorAll('.ie-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ie-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      quickFilter = btn.dataset.filter;
      draw();
    });
  });

  // Transform
  document.getElementById('ieRotLeft').addEventListener('click', () => {
    rotation = (rotation - 90 + 360) % 360;
    draw();
  });
  document.getElementById('ieRotRight').addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    draw();
  });
  document.getElementById('ieFlipH').addEventListener('click', () => {
    flipH = !flipH;
    draw();
  });
  document.getElementById('ieFlipV').addEventListener('click', () => {
    flipV = !flipV;
    draw();
  });
  document.getElementById('ieResetBtn').addEventListener('click', () => {
    rotation = 0;
    flipH = flipV = false;
    resetSliders();
    draw();
  });

  const download = (fmt, ext, quality = 0.92) => {
    canvas.toBlob(
      (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `edited.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      fmt,
      quality,
    );
  };

  document
    .getElementById('ieDownloadPng')
    .addEventListener('click', () => download('image/png', 'png'));
  document
    .getElementById('ieDownloadJpeg')
    .addEventListener('click', () => download('image/jpeg', 'jpg', 0.92));
}
