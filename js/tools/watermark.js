/**
 * Watermark — add text or image watermark to photos
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Watermark</h1>
      <p>Thêm watermark văn bản hoặc logo vào ảnh. Xuất kết quả dưới dạng PNG/JPEG.</p>
    </div>

    <!-- Upload source image -->
    <div class="card">
      <div class="drop-zone" id="wmDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="text-muted text-sm mt-1">Kéo ảnh gốc vào đây hoặc click để chọn (tối đa 10MB)</p>
        <input type="file" id="wmFileInput" accept="image/*" style="display:none;" />
      </div>
    </div>

    <div id="wmMain" style="display:none;">
      <div class="row mt-2" style="align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <!-- Preview -->
        <div class="card flex-1" style="min-width:220px; text-align:center; overflow:auto;">
          <canvas id="wmCanvas" style="max-width:100%; max-height:400px; border-radius:4px;"></canvas>
        </div>

        <!-- Controls -->
        <div class="card" style="min-width:260px; width:300px; flex:0 0 300px;">

          <!-- Mode -->
          <div class="field-label">Loại watermark</div>
          <div class="btn-group mt-1" style="margin-bottom:12px;">
            <button class="btn btn-secondary wm-mode-btn active" data-mode="text">Văn bản</button>
            <button class="btn btn-secondary wm-mode-btn" data-mode="image">Logo/Ảnh</button>
          </div>

          <!-- Text mode -->
          <div id="wmTextControls">
            <div class="field">
              <label class="field-label">Nội dung</label>
              <input type="text" id="wmText" value="© My Brand" spellcheck="false" />
            </div>
            <div class="row mt-1" style="gap:10px;">
              <div class="flex-1">
                <label class="field-label">Cỡ chữ (px)</label>
                <input type="number" id="wmFontSize" value="32" min="8" max="200" />
              </div>
              <div class="flex-1">
                <label class="field-label">Font</label>
                <select id="wmFont">
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
            </div>
            <div class="row mt-1" style="gap:10px; align-items:flex-end;">
              <div>
                <label class="field-label">Màu</label>
                <input type="color" id="wmColor" value="#ffffff"
                  style="width:60px; height:36px; cursor:pointer; padding:2px; border-radius:4px;" />
              </div>
              <div class="flex-1">
                <label class="field-label">Opacity (%)</label>
                <input type="number" id="wmOpacity" value="60" min="1" max="100" />
              </div>
            </div>
          </div>

          <!-- Image mode -->
          <div id="wmImageControls" style="display:none;">
            <div class="drop-zone" id="wmLogoZone" style="padding:12px;">
              <p class="text-muted text-sm">Kéo logo/ảnh vào đây</p>
              <input type="file" id="wmLogoInput" accept="image/*" style="display:none;" />
            </div>
            <div class="field mt-1">
              <label class="field-label">Kích thước (%)</label>
              <input type="range" id="wmLogoSize" min="5" max="80" value="20" style="width:100%;" />
              <span id="wmLogoSizeVal" class="mono text-sm">20%</span>
            </div>
            <div class="field mt-1">
              <label class="field-label">Opacity (%)</label>
              <input type="number" id="wmLogoOpacity" value="80" min="1" max="100" />
            </div>
          </div>

          <!-- Position -->
          <div class="field mt-2">
            <label class="field-label">Vị trí</label>
            <select id="wmPosition">
              <option value="bottom-right">Góc dưới phải</option>
              <option value="bottom-left">Góc dưới trái</option>
              <option value="top-right">Góc trên phải</option>
              <option value="top-left">Góc trên trái</option>
              <option value="center">Giữa</option>
              <option value="tile">Lặp (tile)</option>
            </select>
          </div>

          <!-- Margin -->
          <div class="field mt-1">
            <label class="field-label">Padding (px)</label>
            <input type="number" id="wmPadding" value="20" min="0" max="200" />
          </div>

          <button class="btn btn-ghost btn-sm w-full mt-2" id="wmPreviewBtn">↺ Update preview</button>
          <div class="row mt-2">
            <button class="btn btn-primary flex-1" id="wmDownloadPng">Download PNG</button>
            <button class="btn btn-secondary flex-1" id="wmDownloadJpeg">Download JPEG</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('wmDropZone');
  const fileInput = document.getElementById('wmFileInput');
  const mainEl = document.getElementById('wmMain');
  const canvas = document.getElementById('wmCanvas');
  const ctx = canvas.getContext('2d');
  const previewBtn = document.getElementById('wmPreviewBtn');
  const logoZone = document.getElementById('wmLogoZone');
  const logoInput = document.getElementById('wmLogoInput');
  const logoSize = document.getElementById('wmLogoSize');
  const logoSizeVal = document.getElementById('wmLogoSizeVal');

  let sourceImg = null,
    logoImg = null,
    mode = 'text';

  // Mode toggle
  document.querySelectorAll('.wm-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wm-mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      document.getElementById('wmTextControls').style.display = mode === 'text' ? '' : 'none';
      document.getElementById('wmImageControls').style.display = mode === 'image' ? '' : 'none';
    });
  });

  const loadSource = (file) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      window.showToast('File quá lớn', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImg = img;
        draw();
        mainEl.style.display = '';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadLogo = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        logoImg = img;
        draw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadSource(fileInput.files[0]);
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) loadSource(e.dataTransfer.files[0]);
  });

  logoZone.addEventListener('click', () => logoInput.click());
  logoInput.addEventListener('change', () => {
    if (logoInput.files[0]) loadLogo(logoInput.files[0]);
  });
  logoZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoZone.classList.add('drag-over');
  });
  logoZone.addEventListener('dragleave', () => logoZone.classList.remove('drag-over'));
  logoZone.addEventListener('drop', (e) => {
    e.preventDefault();
    logoZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) loadLogo(e.dataTransfer.files[0]);
  });
  logoSize.addEventListener('input', () => {
    logoSizeVal.textContent = logoSize.value + '%';
  });

  const getPos = (w, h, wmW, wmH) => {
    const pos = document.getElementById('wmPosition').value;
    const pad = parseInt(document.getElementById('wmPadding').value) || 20;
    switch (pos) {
      case 'bottom-right':
        return { x: w - wmW - pad, y: h - wmH - pad };
      case 'bottom-left':
        return { x: pad, y: h - wmH - pad };
      case 'top-right':
        return { x: w - wmW - pad, y: pad };
      case 'top-left':
        return { x: pad, y: pad };
      case 'center':
        return { x: (w - wmW) / 2, y: (h - wmH) / 2 };
      default:
        return { x: w - wmW - pad, y: h - wmH - pad };
    }
  };

  const draw = () => {
    if (!sourceImg) return;
    canvas.width = sourceImg.naturalWidth;
    canvas.height = sourceImg.naturalHeight;
    ctx.drawImage(sourceImg, 0, 0);

    const pos = document.getElementById('wmPosition').value;
    const pad = parseInt(document.getElementById('wmPadding').value) || 20;

    if (mode === 'text') {
      const text = document.getElementById('wmText').value || '© Watermark';
      const fontSize = parseInt(document.getElementById('wmFontSize').value) || 32;
      const font = document.getElementById('wmFont').value;
      const color = document.getElementById('wmColor').value;
      const opacity = (parseInt(document.getElementById('wmOpacity').value) || 60) / 100;

      ctx.save();
      ctx.font = `${fontSize}px ${font}`;
      ctx.globalAlpha = opacity;
      const met = ctx.measureText(text);
      const wmW = met.width,
        wmH = fontSize;

      if (pos === 'tile') {
        ctx.fillStyle = color;
        for (let y = 0; y < canvas.height; y += wmH * 3) {
          for (let x = 0; x < canvas.width; x += wmW + 60) {
            ctx.fillText(text, x, y + wmH);
          }
        }
      } else {
        const { x, y } = getPos(canvas.width, canvas.height, wmW, wmH);
        ctx.fillStyle = color;
        ctx.fillText(text, x, y + wmH);
      }
      ctx.restore();
    } else if (mode === 'image' && logoImg) {
      const opacity = (parseInt(document.getElementById('wmLogoOpacity').value) || 80) / 100;
      const pct = parseInt(logoSize.value) / 100;
      const wmW = canvas.width * pct;
      const wmH = wmW * (logoImg.naturalHeight / logoImg.naturalWidth);

      ctx.save();
      ctx.globalAlpha = opacity;
      if (pos === 'tile') {
        for (let y = 0; y < canvas.height; y += wmH + 40) {
          for (let x = 0; x < canvas.width; x += wmW + 40) {
            ctx.drawImage(logoImg, x, y, wmW, wmH);
          }
        }
      } else {
        const { x, y } = getPos(canvas.width, canvas.height, wmW, wmH);
        ctx.drawImage(logoImg, x, y, wmW, wmH);
      }
      ctx.restore();
    }
  };

  previewBtn.addEventListener('click', draw);

  // Auto-update on input changes
  [
    'wmText',
    'wmFontSize',
    'wmFont',
    'wmColor',
    'wmOpacity',
    'wmPosition',
    'wmPadding',
    'wmLogoOpacity',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', draw);
  });

  const download = (fmt, ext, q = 0.92) => {
    canvas.toBlob(
      (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `watermarked.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      fmt,
      q,
    );
  };

  document
    .getElementById('wmDownloadPng')
    .addEventListener('click', () => download('image/png', 'png'));
  document
    .getElementById('wmDownloadJpeg')
    .addEventListener('click', () => download('image/jpeg', 'jpg', 0.92));
}
