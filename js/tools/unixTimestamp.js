/**
 * Unix Timestamp Converter — live ticking clock with pause/resume, copy buttons & cleanup
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Unix Timestamp Converter</h1>
      <p>Theo dõi thời gian Unix thực tế và chuyển đổi qua lại giữa Timestamp (s/ms) với Ngày giờ.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Thời gian hiện tại (Live)</span>
        <button type="button" class="btn btn-secondary btn-sm" id="tsPauseBtn">Tạm dừng</button>
      </div>
      <div class="split-editor">
        <div class="ts-box">
          <div class="d-flex align-center justify-between gap-2">
            <div>
              <div class="ts-box-label">Seconds (Giây)</div>
              <div class="ts-box-val" id="tsNowSec" style="font-size:20px; font-weight:700; color:var(--accent);"></div>
            </div>
            <button type="button" class="copy-btn" id="tsCopyNowSec">Copy</button>
          </div>
        </div>
        <div class="ts-box">
          <div class="d-flex align-center justify-between gap-2">
            <div>
              <div class="ts-box-label">Milliseconds (Mili giây)</div>
              <div class="ts-box-val" id="tsNowMs" style="font-size:20px; font-weight:700;"></div>
            </div>
            <button type="button" class="copy-btn" id="tsCopyNowMs">Copy</button>
          </div>
        </div>
      </div>
      <div class="text-sm text-muted mt-1 mono" id="tsNowHuman"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <label class="field-label" for="tsInput">Timestamp → Ngày giờ</label>
        <button type="button" class="btn btn-ghost btn-sm" id="tsUseNowBtn">Dùng thời gian hiện tại</button>
      </div>
      <div class="d-flex gap-2 align-center">
        <input type="text" id="tsInput" class="mono flex-1" placeholder="1700000000 hoặc 1700000000000" spellcheck="false" />
        <button type="button" class="btn btn-primary" id="tsConvertBtn">Convert</button>
      </div>
      <div id="tsDateResult" style="display:none; margin-top:14px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(210px,1fr)); gap:10px;">
          ${[
            { id: 'tsLocal', label: 'Local Time' },
            { id: 'tsUtc', label: 'UTC' },
            { id: 'tsIso', label: 'ISO 8601' },
            { id: 'tsRelative', label: 'Relative' },
          ]
            .map(
              (item) => `
            <div class="ts-box">
              <div class="d-flex align-center justify-between gap-1">
                <div class="ts-box-label">${item.label}</div>
                <button type="button" class="copy-btn copy-ts" data-target="${item.id}" style="min-height:22px; padding:2px 6px; font-size:11px;">Copy</button>
              </div>
              <div class="ts-box-val" id="${item.id}"></div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
      <div id="tsConvertError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <label class="field-label" for="dateInput">Ngày giờ → Timestamp</label>
      </div>
      <div class="d-flex gap-2 align-center flex-wrap">
        <input type="datetime-local" id="dateInput" step="1" class="mono flex-1" style="min-width:220px;" />
        <button type="button" class="btn btn-primary" id="dateConvertBtn">Convert</button>
      </div>
      <div id="dateResult" style="display:none; margin-top:14px;">
        <div class="split-editor">
          <div class="ts-box d-flex align-center justify-between gap-2">
            <div>
              <div class="ts-box-label">Seconds</div>
              <div class="ts-box-val" id="dateSecVal"></div>
            </div>
            <button type="button" class="copy-btn copy-ts" data-target="dateSecVal">Copy</button>
          </div>
          <div class="ts-box d-flex align-center justify-between gap-2">
            <div>
              <div class="ts-box-label">Milliseconds</div>
              <div class="ts-box-val" id="dateMsVal"></div>
            </div>
            <button type="button" class="copy-btn copy-ts" data-target="dateMsVal">Copy</button>
          </div>
        </div>
      </div>
    </div>

    <style>
      .ts-box { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:10px 12px; }
      .ts-box-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); margin-bottom:4px; }
      .ts-box-val { font-family:var(--font-mono); font-size:13px; word-break:break-all; }
    </style>
  `;
}

export function init() {
  const nowSecEl = document.getElementById('tsNowSec');
  const nowMsEl = document.getElementById('tsNowMs');
  const nowHumanEl = document.getElementById('tsNowHuman');
  const pauseBtn = document.getElementById('tsPauseBtn');
  const copyNowSecBtn = document.getElementById('tsCopyNowSec');
  const copyNowMsBtn = document.getElementById('tsCopyNowMs');
  const useNowBtn = document.getElementById('tsUseNowBtn');

  let paused = false;

  const updateNow = () => {
    const now = Date.now();
    nowSecEl.textContent = String(Math.floor(now / 1000));
    nowMsEl.textContent = String(now);
    nowHumanEl.textContent = new Date(now).toLocaleString('vi-VN') + ' · ' + new Date(now).toISOString();
  };

  updateNow();
  const clockId = setInterval(() => {
    if (!paused) updateNow();
  }, 1000);

  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
    if (!paused) updateNow();
  });

  copyNowSecBtn.addEventListener('click', () => window.copyToClipboard(nowSecEl.textContent, copyNowSecBtn));
  copyNowMsBtn.addEventListener('click', () => window.copyToClipboard(nowMsEl.textContent, copyNowMsBtn));

  const relativeTime = (ms) => {
    const diff = Date.now() - ms;
    const abs = Math.abs(diff);
    const secs = Math.floor(abs / 1000);
    const mins = Math.floor(abs / 60000);
    const hrs = Math.floor(abs / 3600000);
    const days = Math.floor(abs / 86400000);
    let str = `${secs}s`;
    if (days > 365) str = `${Math.floor(days / 365)} năm`;
    else if (days > 0) str = `${days} ngày`;
    else if (hrs > 0) str = `${hrs} giờ`;
    else if (mins > 0) str = `${mins} phút`;
    else str = `${secs} giây`;
    return diff > 0 ? `${str} trước` : `${str} nữa`;
  };

  const tsInput = document.getElementById('tsInput');
  const convertBtn = document.getElementById('tsConvertBtn');
  const tsDateResult = document.getElementById('tsDateResult');
  const tsError = document.getElementById('tsConvertError');

  const convertTs = () => {
    tsError.textContent = '';
    const raw = tsInput.value.trim();
    if (!raw) {
      tsDateResult.style.display = 'none';
      return;
    }
    let n = Number(raw);
    if (!Number.isFinite(n)) {
      tsError.textContent = 'Timestamp không hợp lệ';
      tsDateResult.style.display = 'none';
      return;
    }
    if (Math.abs(n) < 1e12) n *= 1000;
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) {
      tsError.textContent = 'Ngày giờ không hợp lệ';
      tsDateResult.style.display = 'none';
      return;
    }
    document.getElementById('tsLocal').textContent = d.toLocaleString('vi-VN');
    document.getElementById('tsUtc').textContent = d.toUTCString();
    document.getElementById('tsIso').textContent = d.toISOString();
    document.getElementById('tsRelative').textContent = relativeTime(n);
    tsDateResult.style.display = '';
  };

  useNowBtn.addEventListener('click', () => {
    tsInput.value = String(Math.floor(Date.now() / 1000));
    convertTs();
  });
  convertBtn.addEventListener('click', convertTs);
  tsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) convertTs();
  });
  tsInput.addEventListener('input', convertTs);

  const dateInput = document.getElementById('dateInput');
  const dateConvBtn = document.getElementById('dateConvertBtn');
  const dateResult = document.getElementById('dateResult');

  const now = new Date();
  dateInput.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);

  const convertDate = () => {
    const d = new Date(dateInput.value);
    if (Number.isNaN(d.getTime())) return;
    document.getElementById('dateSecVal').textContent = String(Math.floor(d.getTime() / 1000));
    document.getElementById('dateMsVal').textContent = String(d.getTime());
    dateResult.style.display = '';
  };

  dateConvBtn.addEventListener('click', convertDate);
  dateInput.addEventListener('change', convertDate);
  convertDate();

  document.querySelectorAll('.copy-ts').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = document.getElementById(btn.dataset.target)?.textContent;
      if (val) window.copyToClipboard(val, btn);
    });
  });

  return () => clearInterval(clockId);
}
