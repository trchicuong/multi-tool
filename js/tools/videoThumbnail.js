/**
 * Video Thumbnail — extract frame from video at given timestamp
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Video Thumbnail Extractor</h1>
      <p>Trích xuất frame ảnh từ video tại bất kỳ thời điểm nào. Xuất dạng PNG hoặc JPEG.</p>
    </div>

    <div class="card">
      <div class="drop-zone" id="vtDropZone">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <p class="text-muted text-sm mt-1" id="vtDropLabel">Kéo file video vào đây hoặc click để chọn (MP4, WEBM, MOV...)</p>
        <input type="file" id="vtFileInput" accept="video/*" style="display:none;" />
      </div>
    </div>

    <div id="vtMain" style="display:none; margin-top:8px;">
      <!-- Video player (hidden, used for seeking) -->
      <video id="vtVideo" style="display:none;" preload="auto"></video>

      <div class="card">
        <div class="field-label">Chọn thời điểm</div>
        <div class="row mt-1" style="flex-wrap:wrap; gap:10px; align-items:center;">
          <div style="flex:0 0 auto;">
            <label class="field-label">Giờ : Phút : Giây</label>
            <div class="d-flex align-center gap-1">
              <input type="number" id="vtH" value="0" min="0" style="width:55px;" /> :
              <input type="number" id="vtM" value="0" min="0" max="59" style="width:55px;" /> :
              <input type="number" id="vtS" value="0" min="0" max="59" step="0.1" style="width:70px;" />
            </div>
          </div>
          <div class="flex-1" style="min-width:180px;">
            <label class="field-label">Hoặc kéo thanh thời gian</label>
            <input type="range" id="vtSeek" min="0" max="100" value="0" step="0.01" style="width:100%;" />
            <div class="d-flex align-center" style="justify-content:space-between;">
              <span class="text-muted text-sm" id="vtCurrent">0:00</span>
              <span class="text-muted text-sm" id="vtDuration"></span>
            </div>
          </div>
          <button class="btn btn-primary" id="vtCapture" style="align-self:flex-end;">Capture</button>
        </div>
      </div>

      <div class="card mt-2" id="vtResultCard" style="display:none;">
        <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
          <span class="field-label" style="margin:0;" id="vtFrameInfo"></span>
          <div class="btn-group" style="margin:0;">
            <button class="btn btn-primary btn-sm" id="vtDownloadPng">Download PNG</button>
            <button class="btn btn-secondary btn-sm" id="vtDownloadJpeg">Download JPEG</button>
          </div>
        </div>
        <canvas id="vtCanvas" style="max-width:100%; max-height:500px; border-radius:4px; margin-top:4px;"></canvas>
      </div>
    </div>
  `;
}

export function init() {
  const dropZone = document.getElementById('vtDropZone');
  const fileInput = document.getElementById('vtFileInput');
  const mainEl = document.getElementById('vtMain');
  const video = document.getElementById('vtVideo');
  const seekInput = document.getElementById('vtSeek');
  const hInput = document.getElementById('vtH');
  const mInput = document.getElementById('vtM');
  const sInput = document.getElementById('vtS');
  const curLabel = document.getElementById('vtCurrent');
  const durLabel = document.getElementById('vtDuration');
  const captureBtn = document.getElementById('vtCapture');
  const resultCard = document.getElementById('vtResultCard');
  const canvas = document.getElementById('vtCanvas');
  const frameInfo = document.getElementById('vtFrameInfo');
  const dropLabel = document.getElementById('vtDropLabel');
  const ctx = canvas.getContext('2d');

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1);
    return `${m}:${sec.padStart(4, '0')}`;
  };

  const loadFile = (file) => {
    if (!file.type.startsWith('video/')) {
      window.showToast('Chỉ hỗ trợ file video', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
    dropLabel.textContent = file.name;
    video.addEventListener(
      'loadedmetadata',
      () => {
        seekInput.max = video.duration;
        durLabel.textContent = fmtTime(video.duration);
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

  // Seekbar → HMS
  seekInput.addEventListener('input', () => {
    const t = parseFloat(seekInput.value);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = (t % 60).toFixed(1);
    hInput.value = h;
    mInput.value = m;
    sInput.value = s;
    curLabel.textContent = fmtTime(t);
  });

  // HMS → seekbar
  const hmsToSec = () =>
    (+hInput.value || 0) * 3600 + (+mInput.value || 0) * 60 + (+sInput.value || 0);
  [hInput, mInput, sInput].forEach((el) => {
    el.addEventListener('input', () => {
      const t = hmsToSec();
      seekInput.value = t;
      curLabel.textContent = fmtTime(t);
    });
  });

  captureBtn.addEventListener('click', () => {
    const t = hmsToSec();
    video.currentTime = t;
    video.addEventListener(
      'seeked',
      () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        frameInfo.textContent = `${video.videoWidth} × ${video.videoHeight}px · t=${fmtTime(t)}`;
        resultCard.style.display = '';
      },
      { once: true },
    );
  });

  const download = (fmt, ext, q = 0.92) => {
    canvas.toBlob(
      (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `thumbnail.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      fmt,
      q,
    );
  };

  document
    .getElementById('vtDownloadPng')
    .addEventListener('click', () => download('image/png', 'png'));
  document
    .getElementById('vtDownloadJpeg')
    .addEventListener('click', () => download('image/jpeg', 'jpg', 0.92));
}
