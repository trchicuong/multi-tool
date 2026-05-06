/**
 * Unix Timestamp Converter
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Unix Timestamp Converter</h1>
      <p>Chuyển đổi giữa Unix timestamp (giây/mili giây) và ngày giờ thông thường.</p>
    </div>

    <!-- Current time -->
    <div class="card">
      <div class="field-label">Thời gian hiện tại</div>
      <div class="row mt-1" style="align-items:center; flex-wrap:wrap; gap:10px;">
        <code class="mono" id="tsNowSec" style="font-size:20px; font-weight:700;"></code>
        <span class="badge badge-blue" style="font-size:11px;">giây</span>
        <code class="mono" id="tsNowMs"  style="font-size:20px; font-weight:700;"></code>
        <span class="badge badge-green" style="font-size:11px;">mili giây</span>
        <button class="btn btn-ghost btn-sm" id="tsRefreshBtn">Refresh</button>
      </div>
      <div class="text-sm text-muted mt-1" id="tsNowHuman"></div>
    </div>

    <!-- Timestamp → Date -->
    <div class="card mt-2">
      <div class="field-label">Timestamp → Ngày giờ</div>
      <div class="row mt-1">
        <div class="flex-1">
          <input type="text" id="tsInput" class="mono" placeholder="1700000000 hoặc 1700000000000" spellcheck="false" />
        </div>
        <button class="btn btn-primary btn-sm" id="tsConvertBtn" style="align-self:flex-end;">Convert</button>
      </div>
      <div id="tsDateResult" style="display:none; margin-top:12px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:10px;">
          <div class="ts-box">
            <div class="ts-box-label">Local</div>
            <div class="ts-box-val" id="tsLocal"></div>
          </div>
          <div class="ts-box">
            <div class="ts-box-label">UTC</div>
            <div class="ts-box-val" id="tsUtc"></div>
          </div>
          <div class="ts-box">
            <div class="ts-box-label">ISO 8601</div>
            <div class="ts-box-val" id="tsIso"></div>
          </div>
          <div class="ts-box">
            <div class="ts-box-label">Relative</div>
            <div class="ts-box-val" id="tsRelative"></div>
          </div>
        </div>
      </div>
      <div id="tsConvertError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>

    <!-- Date → Timestamp -->
    <div class="card mt-2">
      <div class="field-label">Ngày giờ → Timestamp</div>
      <div class="row mt-1" style="align-items:flex-end; flex-wrap:wrap;">
        <div class="flex-1">
          <label class="field-label">Ngày giờ (local)</label>
          <input type="datetime-local" id="dateInput" step="1" />
        </div>
        <button class="btn btn-primary btn-sm" id="dateConvertBtn" style="align-self:flex-end;">Convert</button>
      </div>
      <div id="dateResult" style="display:none; margin-top:12px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:10px;">
          <div class="ts-box">
            <div class="ts-box-label">Seconds</div>
            <div class="ts-box-val d-flex align-center gap-1" id="dateSec">
              <span id="dateSecVal" class="mono"></span>
              <button class="btn btn-ghost btn-sm copy-ts" data-target="dateSecVal">Copy</button>
            </div>
          </div>
          <div class="ts-box">
            <div class="ts-box-label">Milliseconds</div>
            <div class="ts-box-val d-flex align-center gap-1" id="dateMs">
              <span id="dateMsVal" class="mono"></span>
              <button class="btn btn-ghost btn-sm copy-ts" data-target="dateMsVal">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .ts-box { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:10px 12px; }
      .ts-box-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); margin-bottom:4px; }
      .ts-box-val { font-family:var(--font-mono); font-size:13px; word-break:break-all; }
      input[type="datetime-local"]#dateInput {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        color: var(--text-1);
        font-size: 14px;
        font-family: var(--font-mono);
        outline: none;
        transition: border-color var(--speed);
        color-scheme: light dark;
      }
      input[type="datetime-local"]#dateInput:focus {
        border-color: var(--accent);
      }
    </style>
  `;
}

export function init() {
  const relativeTime = (ms) => {
    const diff = Date.now() - ms;
    const abs = Math.abs(diff);
    const secs = Math.floor(abs / 1000);
    const mins = Math.floor(abs / 60000);
    const hrs = Math.floor(abs / 3600000);
    const days = Math.floor(abs / 86400000);
    let str = '';
    if (days > 365) str = `${Math.floor(days / 365)}y`;
    else if (days > 0) str = `${days}d`;
    else if (hrs > 0) str = `${hrs}h`;
    else if (mins > 0) str = `${mins}m`;
    else str = `${secs}s`;
    return diff > 0 ? `${str} trước` : `${str} nữa`;
  };

  // Current time panel
  const updateNow = () => {
    const now = Date.now();
    document.getElementById('tsNowSec').textContent = Math.floor(now / 1000);
    document.getElementById('tsNowMs').textContent = now;
    document.getElementById('tsNowHuman').textContent = new Date(now).toString();
  };
  updateNow();
  document.getElementById('tsRefreshBtn').addEventListener('click', updateNow);

  // Timestamp → Date
  const tsInput = document.getElementById('tsInput');
  const convertBtn = document.getElementById('tsConvertBtn');
  const tsDateResult = document.getElementById('tsDateResult');
  const tsError = document.getElementById('tsConvertError');

  const convertTs = () => {
    tsError.textContent = '';
    const raw = tsInput.value.trim();
    if (!raw) return;
    let n = Number(raw);
    if (isNaN(n)) {
      tsError.textContent = 'Timestamp không hợp lệ';
      return;
    }
    // Detect ms vs s: if > 1e12 treat as ms
    if (n > 1e12) {
      /* already ms */
    } else {
      n *= 1000;
    }
    const d = new Date(n);
    if (isNaN(d.getTime())) {
      tsError.textContent = 'Ngày giờ không hợp lệ';
      return;
    }
    document.getElementById('tsLocal').textContent = d.toLocaleString();
    document.getElementById('tsUtc').textContent = d.toUTCString();
    document.getElementById('tsIso').textContent = d.toISOString();
    document.getElementById('tsRelative').textContent = relativeTime(n);
    tsDateResult.style.display = '';
  };

  convertBtn.addEventListener('click', convertTs);
  tsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') convertTs();
  });
  tsInput.addEventListener('input', convertTs);

  // Date → Timestamp
  const dateInput = document.getElementById('dateInput');
  const dateConvBtn = document.getElementById('dateConvertBtn');
  const dateResult = document.getElementById('dateResult');

  // Set default to now
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
  dateInput.value = local;

  const convertDate = () => {
    const d = new Date(dateInput.value);
    if (isNaN(d.getTime())) return;
    document.getElementById('dateSecVal').textContent = Math.floor(d.getTime() / 1000);
    document.getElementById('dateMsVal').textContent = d.getTime();
    dateResult.style.display = '';
  };

  dateConvBtn.addEventListener('click', convertDate);
  dateInput.addEventListener('change', convertDate);
  convertDate();

  // Copy buttons
  document.querySelectorAll('.copy-ts').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = document.getElementById(btn.dataset.target).textContent;
      window.copyToClipboard(val, btn);
    });
  });
}
