/**
 * Watermark — add text or image watermark to photos with live canvas preview
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Watermark</h1>
      <p>Thêm watermark văn bản hoặc logo vào ảnh với cập nhật trực tiếp theo thời gian thực.</p>
    </div>

    <div class="card">
      <div class="drop-zone" id="wmDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="text-muted text-sm mt-1" id="wmDropLabel">Kéo ảnh gốc vào đây hoặc click để chọn (tối đa 10MB)</p>
        <input type="file" id="wmFileInput" accept="image/*" style="display:none;" />
      </div>
    </div>

    <div id="wmMain" style="display:none;">
      <div class="split-editor" style="align-items:stretch;">
        <!-- Preview -->
        <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
          <div class="card-header">
            <span class="field-label">Preview</span>
            <span id="wmImgInfo" class="text-sm text-muted mono"></span>
          </div>
          <div style="flex:1; display:flex; align-items:center; justify-content:center; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px; overflow:auto;">
            <canvas id="wmCanvas" style="max-width:100%; max-height:420px; border-radius:4px;"></canvas>
          </div>
        </div>

        <!-- Controls -->
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <span class="field-label">Cấu hình Watermark</span>
            <div class="seg-group">
              <button type="button" class="btn wm-mode-btn active" data-mode="text">Văn bản</button>
              <button type="button" class="btn wm-mode-btn" data-mode="image">Logo / Ảnh</button>
            </div>
          </div>

          <!-- Text mode -->
          <div id="wmTextControls">
            <div class="field">
              <label class="field-label" for="wmText">Nội dung</label>
              <input type="text" id="wmText" value="© Sample Text" spellcheck="false" />
            </div>
            <div class="row" style="gap:10px;">
              <div>
                <label class="field-label" for="wmFontSize">Cỡ chữ (px)</label>
                <input type="number" id="wmFontSize" value="36" min="8" max="250" />
              </div>
              <div>
                <label class="field-label" for="wmFont">Font</label>
                <select id="wmFont">
                  <option value="Inter, Arial, sans-serif">Sans-serif</option>
                  <option value="Georgia, serif">Serif</option>
                  <option value="'Fira Code', monospace">Monospace</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>
            </div>
            <div style="display:grid; grid-template-columns:auto 1fr; gap:12px; align-items:end; margin-top:12px;">
              <div>
                <label class="field-label" for="wmColor">Màu chữ</label>
                <input type="color" id="wmColor" value="#ffffff" />
              </div>
              <div>
                <label class="field-label" for="wmOpacity" style="display:flex; justify-content:space-between;">
                  <span>Độ mờ (Opacity)</span>
                  <span id="wmOpacityVal" class="mono">65%</span>
                </label>
                <div style="height:38px; display:flex; align-items:center;">
                  <input type="range" id="wmOpacity" value="65" min="5" max="100" />
                </div>
              </div>
            </div>
          </div>

          <!-- Image mode -->
          <div id="wmImageControls" style="display:none;">
            <div class="drop-zone" id="wmLogoZone" style="padding:16px;">
              <p class="text-muted text-sm" id="wmLogoLabel">Kéo logo/ảnh PNG vào đây hoặc click để chọn</p>
              <input type="file" id="wmLogoInput" accept="image/*" style="display:none;" />
            </div>
            <div class="field mt-2">
              <label class="field-label" for="wmLogoSize" style="display:flex; justify-content:space-between;">
                <span>Kích thước logo</span>
                <span id="wmLogoSizeVal" class="mono">20%</span>
              </label>
              <input type="range" id="wmLogoSize" min="5" max="80" value="20" />
            </div>
            <div class="field">
              <label class="field-label" for="wmLogoOpacity" style="display:flex; justify-content:space-between;">
                <span>Độ mờ (Opacity)</span>
                <span id="wmLogoOpacityVal" class="mono">80%</span>
              </label>
              <input type="range" id="wmLogoOpacity" value="80" min="5" max="100" />
            </div>
          </div>

          <!-- Position & Padding -->
          <div class="row mt-2" style="gap:10px;">
            <div>
              <label class="field-label" for="wmPosition">Vị trí</label>
              <select id="wmPosition">
                <option value="bottom-right">Góc dưới phải</option>
                <option value="bottom-left">Góc dưới trái</option>
                <option value="top-right">Góc trên phải</option>
                <option value="top-left">Góc trên trái</option>
                <option value="center">Chính giữa</option>
                <option value="tile">Lặp toàn ảnh (Tile)</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="wmPadding">Padding (px)</label>
              <input type="number" id="wmPadding" value="24" min="0" max="300" />
            </div>
          </div>

          <div class="row mt-2">
            <button type="button" class="btn btn-primary flex-1" id="wmDownloadPng">Download PNG</button>
            <button type="button" class="btn btn-secondary flex-1" id="wmDownloadJpeg">Download JPEG</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('wmDropZone');
  const fileInput = document.getElementById('wmFileInput');
  const dropLabel = document.getElementById('wmDropLabel');
  const mainEl = document.getElementById('wmMain');
  const imgInfo = document.getElementById('wmImgInfo');
  const canvas = document.getElementById('wmCanvas');
  const ctx = canvas.getContext('2d');
  const logoZone = document.getElementById('wmLogoZone');
  const logoInput = document.getElementById('wmLogoInput');
  const logoLabel = document.getElementById('wmLogoLabel');
  const logoSize = document.getElementById('wmLogoSize');
  const logoSizeVal = document.getElementById('wmLogoSizeVal');
  const textOpacity = document.getElementById('wmOpacity');
  const textOpacityVal = document.getElementById('wmOpacityVal');
  const logoOpacity = document.getElementById('wmLogoOpacity');
  const logoOpacityVal = document.getElementById('wmLogoOpacityVal');

  let sourceImg = null;
  let logoImg = null;
  let mode = 'text';

  document.querySelectorAll('.wm-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wm-mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      document.getElementById('wmTextControls').style.display = mode === 'text' ? '' : 'none';
      document.getElementById('wmImageControls').style.display = mode === 'image' ? '' : 'none';
      draw();
    });
  });

  const loadSource = (file) => {
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
        sourceImg = img;
        dropLabel.textContent = file.name;
        imgInfo.textContent = `${img.naturalWidth}×${img.naturalHeight}px`;
        mainEl.style.display = '';
        draw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadLogo = (file) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        logoImg = img;
        logoLabel.textContent = `Logo: ${file.name}`;
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

  const getPos = (w, h, wmW, wmH, pad) => {
    const pos = document.getElementById('wmPosition').value;
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

  function draw() {
    if (!sourceImg) return;
    canvas.width = sourceImg.naturalWidth;
    canvas.height = sourceImg.naturalHeight;
    ctx.drawImage(sourceImg, 0, 0);

    const pos = document.getElementById('wmPosition').value;
    const pad = Math.max(0, parseInt(document.getElementById('wmPadding').value, 10) || 0);

    if (mode === 'text') {
      const text = document.getElementById('wmText').value;
      if (!text) return;
      const fontSize = Math.max(8, parseInt(document.getElementById('wmFontSize').value, 10) || 36);
      const font = document.getElementById('wmFont').value;
      const color = document.getElementById('wmColor').value;
      const opacity = (parseInt(textOpacity.value, 10) || 65) / 100;

      ctx.save();
      ctx.font = `600 ${fontSize}px ${font}`;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      const met = ctx.measureText(text);
      const wmW = met.width;
      const wmH = fontSize;

      if (pos === 'tile') {
        const stepX = Math.max(80, wmW + pad + 60);
        const stepY = Math.max(60, wmH * 2.5 + pad);
        for (let y = pad; y < canvas.height; y += stepY) {
          for (let x = pad; x < canvas.width; x += stepX) {
            ctx.fillText(text, x, y);
          }
        }
      } else {
        const { x, y } = getPos(canvas.width, canvas.height, wmW, wmH, pad);
        ctx.fillText(text, x, y);
      }
      ctx.restore();
    } else if (mode === 'image' && logoImg) {
      const opacity = (parseInt(logoOpacity.value, 10) || 80) / 100;
      const pct = parseInt(logoSize.value, 10) / 100;
      const wmW = canvas.width * pct;
      const wmH = wmW * (logoImg.naturalHeight / logoImg.naturalWidth);

      ctx.save();
      ctx.globalAlpha = opacity;
      if (pos === 'tile') {
        for (let y = pad; y < canvas.height; y += wmH + pad + 24) {
          for (let x = pad; x < canvas.width; x += wmW + pad + 24) {
            ctx.drawImage(logoImg, x, y, wmW, wmH);
          }
        }
      } else {
        const { x, y } = getPos(canvas.width, canvas.height, wmW, wmH, pad);
        ctx.drawImage(logoImg, x, y, wmW, wmH);
      }
      ctx.restore();
    }
  }

  textOpacity.addEventListener('input', () => {
    textOpacityVal.textContent = `${textOpacity.value}%`;
    draw();
  });
  logoOpacity.addEventListener('input', () => {
    logoOpacityVal.textContent = `${logoOpacity.value}%`;
    draw();
  });
  logoSize.addEventListener('input', () => {
    logoSizeVal.textContent = `${logoSize.value}%`;
    draw();
  });

  ['wmText', 'wmFontSize', 'wmColor', 'wmPadding'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', draw);
  });
  ['wmFont', 'wmPosition'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', draw);
  });

  const download = (fmt, ext, q = 0.92) => {
    if (!sourceImg) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watermarked.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      fmt,
      q,
    );
  };

  document.getElementById('wmDownloadPng').addEventListener('click', () => download('image/png', 'png'));
  document
    .getElementById('wmDownloadJpeg')
    .addEventListener('click', () => download('image/jpeg', 'jpg', 0.92));
}
