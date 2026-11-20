/**
 * Image Editor — combined filters + sliders, rotation, flip & split layout
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Image Editor</h1>
      <p>Chỉnh sửa ảnh trực tiếp trên trình duyệt: kết hợp bộ lọc nhanh với độ sáng, tương phản, bão hòa, xoay và lật.</p>
    </div>

    <div class="card">
      <div class="drop-zone" id="ieDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="text-muted text-sm mt-1" id="ieDropLabel">Kéo ảnh vào đây hoặc click để chọn file (tối đa 10MB)</p>
        <input type="file" id="ieFileInput" accept="image/*" style="display:none;" />
      </div>
    </div>

    <div id="ieMain" style="display:none;">
      <div class="split-editor" style="align-items:stretch;">
        <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
          <div class="card-header">
            <span class="field-label">Canvas Preview</span>
            <span id="ieDims" class="text-sm text-muted mono"></span>
          </div>
          <div style="flex:1; display:flex; align-items:center; justify-content:center; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px; overflow:auto;">
            <canvas id="ieCanvas" style="max-width:100%; max-height:420px; object-fit:contain; border-radius:4px;"></canvas>
          </div>
        </div>

        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <span class="field-label">Bộ lọc nhanh (Kết hợp với thông số)</span>
            <button type="button" class="btn btn-ghost btn-sm" id="ieResetBtn" style="color:var(--danger);">Reset</button>
          </div>

          <div class="preset-strip mb-2">
            <button type="button" class="btn btn-ghost btn-sm ie-filter active" data-filter="none">Normal</button>
            <button type="button" class="btn btn-ghost btn-sm ie-filter" data-filter="grayscale(100%)">Grayscale</button>
            <button type="button" class="btn btn-ghost btn-sm ie-filter" data-filter="sepia(100%)">Sepia</button>
            <button type="button" class="btn btn-ghost btn-sm ie-filter" data-filter="invert(100%)">Invert</button>
            <button type="button" class="btn btn-ghost btn-sm ie-filter" data-filter="blur(2px)">Blur</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            ${[
              { id: 'ieBrightness', label: 'Độ sáng', min: 0, max: 200, val: 100, unit: '%' },
              { id: 'ieContrast', label: 'Tương phản', min: 0, max: 200, val: 100, unit: '%' },
              { id: 'ieSaturation', label: 'Bão hòa', min: 0, max: 200, val: 100, unit: '%' },
              { id: 'ieHue', label: 'Hue Rotate', min: -180, max: 180, val: 0, unit: '°' },
              { id: 'ieOpacity', label: 'Opacity', min: 0, max: 100, val: 100, unit: '%' },
            ]
              .map(
                (s) => `
              <div>
                <label class="field-label" for="${s.id}" style="display:flex; justify-content:space-between;">
                  <span>${s.label}</span>
                  <span id="${s.id}Val" class="mono">${s.val}${s.unit}</span>
                </label>
                <input type="range" id="${s.id}" min="${s.min}" max="${s.max}" value="${s.val}" />
              </div>
            `,
              )
              .join('')}
          </div>

          <div class="field mt-2">
            <span class="field-label">Xoay &amp; Lật (Transform)</span>
            <div class="d-flex gap-1 flex-wrap">
              <button type="button" class="btn btn-secondary btn-sm" id="ieRotLeft">↺ 90°</button>
              <button type="button" class="btn btn-secondary btn-sm" id="ieRotRight">↻ 90°</button>
              <button type="button" class="btn btn-secondary btn-sm" id="ieFlipH">⟺ Ngang</button>
              <button type="button" class="btn btn-secondary btn-sm" id="ieFlipV">⥮ Dọc</button>
            </div>
          </div>

          <div class="row mt-2">
            <button type="button" class="btn btn-primary flex-1" id="ieDownloadPng">Download PNG</button>
            <button type="button" class="btn btn-secondary flex-1" id="ieDownloadJpeg">Download JPEG</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('ieDropZone');
  const dropLabel = document.getElementById('ieDropLabel');
  const fileInput = document.getElementById('ieFileInput');
  const mainEl = document.getElementById('ieMain');
  const dimsEl = document.getElementById('ieDims');
  const canvas = document.getElementById('ieCanvas');
  const ctx = canvas.getContext('2d');

  let origImg = null;
  let rotation = 0;
  let flipH = false;
  let flipV = false;
  let quickFilter = 'none';

  const state = {
    ieBrightness: { val: 100, def: 100, unit: '%' },
    ieContrast: { val: 100, def: 100, unit: '%' },
    ieSaturation: { val: 100, def: 100, unit: '%' },
    ieHue: { val: 0, def: 0, unit: '°' },
    ieOpacity: { val: 100, def: 100, unit: '%' },
  };

  const buildFilter = () => {
    const base = [
      `brightness(${state.ieBrightness.val}%)`,
      `contrast(${state.ieContrast.val}%)`,
      `saturate(${state.ieSaturation.val}%)`,
      `hue-rotate(${state.ieHue.val}deg)`,
      `opacity(${state.ieOpacity.val}%)`,
    ];
    if (quickFilter !== 'none') base.push(quickFilter);
    return base.join(' ');
  };

  const draw = () => {
    if (!origImg) return;
    const rad = (rotation * Math.PI) / 180;
    const isRotated90 = rotation % 180 !== 0;
    const w = isRotated90 ? origImg.naturalHeight : origImg.naturalWidth;
    const h = isRotated90 ? origImg.naturalWidth : origImg.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    dimsEl.textContent = `${w}×${h}px`;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.filter = buildFilter();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(origImg, -origImg.naturalWidth / 2, -origImg.naturalHeight / 2);
    ctx.restore();
  };

  const resetAll = () => {
    rotation = 0;
    flipH = flipV = false;
    quickFilter = 'none';
    for (const [id, s] of Object.entries(state)) {
      s.val = s.def;
      document.getElementById(id).value = String(s.def);
      document.getElementById(`${id}Val`).textContent = `${s.def}${s.unit}`;
    }
    document.querySelectorAll('.ie-filter').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === 'none');
    });
    draw();
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
        dropLabel.textContent = file.name;
        resetAll();
        mainEl.style.display = '';
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

  for (const [id, s] of Object.entries(state)) {
    document.getElementById(id).addEventListener('input', (e) => {
      s.val = Number(e.target.value);
      document.getElementById(`${id}Val`).textContent = `${s.val}${s.unit}`;
      draw();
    });
  }

  document.querySelectorAll('.ie-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ie-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      quickFilter = btn.dataset.filter;
      draw();
    });
  });

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
  document.getElementById('ieResetBtn').addEventListener('click', resetAll);

  const download = (fmt, ext, quality = 0.92) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      fmt,
      quality,
    );
  };

  document.getElementById('ieDownloadPng').addEventListener('click', () => download('image/png', 'png'));
  document
    .getElementById('ieDownloadJpeg')
    .addEventListener('click', () => download('image/jpeg', 'jpg', 0.92));
}
