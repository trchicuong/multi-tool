/**
 * Video Thumbnail Extractor — visible video scrubbing + fine frame stepping + PNG/JPEG export
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Video Thumbnail Extractor</h1>
      <p>Xem trước trực tiếp video, tua chính xác từng 0.1 giây và trích xuất frame ảnh chất lượng gốc.</p>
    </div>

    <div class="card">
      <div class="drop-zone" id="vtDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <p class="text-muted text-sm mt-1" id="vtDropLabel">Kéo file video vào đây hoặc click để chọn (MP4, WEBM, MOV...)</p>
        <input type="file" id="vtFileInput" accept="video/*" style="display:none;" />
      </div>
    </div>

    <div id="vtMain" style="display:none;">
      <div class="split-editor mb-2" style="align-items:stretch;">
        <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
          <div class="card-header">
            <span class="field-label">Video Preview</span>
            <span class="text-sm text-muted mono" id="vtVideoDims"></span>
          </div>
          <video id="vtVideo" controls preload="metadata" style="width:100%; max-height:320px; border-radius:var(--radius); background:#000;"></video>
        </div>

        <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="card-header">
              <span class="field-label">Điều chỉnh thời điểm</span>
              <span class="text-sm text-muted mono" id="vtTimeReadout">0:00.0 / 0:00.0</span>
            </div>

            <div class="field">
              <label class="field-label" for="vtSeek">Thanh tua nhanh</label>
              <input type="range" id="vtSeek" min="0" max="100" value="0" step="0.05" />
            </div>

            <div class="field">
              <span class="field-label">Giờ : Phút : Giây</span>
              <div class="d-flex align-center gap-1">
                <input type="number" id="vtH" value="0" min="0" style="width:70px;" aria-label="Giờ" />
                <span>:</span>
                <input type="number" id="vtM" value="0" min="0" max="59" style="width:70px;" aria-label="Phút" />
                <span>:</span>
                <input type="number" id="vtS" value="0" min="0" max="59.9" step="0.1" style="width:84px;" aria-label="Giây" />
              </div>
            </div>

            <div class="field">
              <span class="field-label">Bước nhảy chính xác</span>
              <div class="preset-strip">
                <button type="button" class="btn btn-secondary btn-sm vt-step" data-step="-1">−1s</button>
                <button type="button" class="btn btn-secondary btn-sm vt-step" data-step="-0.1">−0.1s</button>
                <button type="button" class="btn btn-secondary btn-sm vt-step" data-step="0.1">+0.1s</button>
                <button type="button" class="btn btn-secondary btn-sm vt-step" data-step="1">+1s</button>
              </div>
            </div>
          </div>

          <button type="button" class="btn btn-primary w-full mt-2" id="vtCapture">Chụp Frame Hiện Tại</button>
        </div>
      </div>

      <div class="card" id="vtResultCard" style="display:none;">
        <div class="card-header">
          <span class="field-label" id="vtFrameInfo">Frame đã chụp</span>
          <div class="d-flex gap-1">
            <button type="button" class="btn btn-primary btn-sm" id="vtDownloadPng">Download PNG</button>
            <button type="button" class="btn btn-secondary btn-sm" id="vtDownloadJpeg">Download JPEG</button>
          </div>
        </div>
        <div style="text-align:center; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
          <canvas id="vtCanvas" style="max-width:100%; max-height:460px; border-radius:4px;"></canvas>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('vtDropZone');
  const fileInput = document.getElementById('vtFileInput');
  const dropLabel = document.getElementById('vtDropLabel');
  const mainEl = document.getElementById('vtMain');
  const video = document.getElementById('vtVideo');
  const videoDims = document.getElementById('vtVideoDims');
  const seekInput = document.getElementById('vtSeek');
  const hInput = document.getElementById('vtH');
  const mInput = document.getElementById('vtM');
  const sInput = document.getElementById('vtS');
  const readout = document.getElementById('vtTimeReadout');
  const captureBtn = document.getElementById('vtCapture');
  const resultCard = document.getElementById('vtResultCard');
  const canvas = document.getElementById('vtCanvas');
  const frameInfo = document.getElementById('vtFrameInfo');
  const ctx = canvas.getContext('2d');

  let activeObjectUrl = null;
  let duration = 0;

  const fmtTime = (s) => {
    const safe = Math.max(0, Number(s) || 0);
    const m = Math.floor(safe / 60);
    const sec = (safe % 60).toFixed(1);
    return `${m}:${sec.padStart(4, '0')}`;
  };

  const syncTimeUI = (t) => {
    const clamped = Math.max(0, Math.min(duration || 0, t));
    hInput.value = String(Math.floor(clamped / 3600));
    mInput.value = String(Math.floor((clamped % 3600) / 60));
    sInput.value = (clamped % 60).toFixed(1);
    seekInput.value = String(clamped);
    readout.textContent = `${fmtTime(clamped)} / ${fmtTime(duration)}`;
  };

  const loadFile = (file) => {
    if (!file.type.startsWith('video/')) {
      window.showToast('Chỉ hỗ trợ file video', 'error');
      return;
    }
    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = URL.createObjectURL(file);
    video.src = activeObjectUrl;
    video.load();
    dropLabel.textContent = file.name;
    resultCard.style.display = 'none';

    video.addEventListener(
      'loadedmetadata',
      () => {
        duration = video.duration || 0;
        seekInput.max = String(duration);
        videoDims.textContent = `${video.videoWidth}×${video.videoHeight}px`;
        syncTimeUI(0);
        mainEl.style.display = '';
      },
      { once: true },
    );
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

  video.addEventListener('timeupdate', () => {
    syncTimeUI(video.currentTime);
  });

  seekInput.addEventListener('input', () => {
    const t = parseFloat(seekInput.value) || 0;
    video.currentTime = t;
    syncTimeUI(t);
  });

  const hmsToSec = () =>
    (+hInput.value || 0) * 3600 + (+mInput.value || 0) * 60 + (+sInput.value || 0);

  [hInput, mInput, sInput].forEach((el) => {
    el.addEventListener('change', () => {
      const t = Math.max(0, Math.min(duration, hmsToSec()));
      video.currentTime = t;
      syncTimeUI(t);
    });
  });

  document.querySelectorAll('.vt-step').forEach((btn) => {
    btn.addEventListener('click', () => {
      const delta = parseFloat(btn.dataset.step) || 0;
      const next = Math.max(0, Math.min(duration, video.currentTime + delta));
      video.currentTime = next;
      syncTimeUI(next);
    });
  });

  const captureCurrentFrame = () => {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    frameInfo.textContent = `${video.videoWidth}×${video.videoHeight}px · t = ${fmtTime(video.currentTime)}`;
    resultCard.style.display = '';
  };

  captureBtn.addEventListener('click', captureCurrentFrame);

  const download = (fmt, ext, q = 0.92) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thumbnail.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      fmt,
      q,
    );
  };

  document.getElementById('vtDownloadPng').addEventListener('click', () => download('image/png', 'png'));
  document
    .getElementById('vtDownloadJpeg')
    .addEventListener('click', () => download('image/jpeg', 'jpg', 0.92));

  return () => {
    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
  };
}
