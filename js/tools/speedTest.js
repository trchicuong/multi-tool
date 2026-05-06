/**
 * Speed Test — measures download/upload speed via fetch timing, no external deps
 */

export function getHtml() {
  return `
    <style>
      .st-card {
        max-width: 520px;
        margin: 0 auto;
        padding: 24px 28px 28px;
      }
      .st-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
      }
      .st-title {
        font-size: 17px;
        font-weight: 700;
        color: var(--text-1);
      }
      .st-powered {
        font-size: 12px;
        color: var(--text-3);
      }
      .st-run-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 16px;
      }
      .st-run-btn {
        width: 130px;
        height: 130px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--accent) 20%, var(--surface-2));
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, transform 0.15s;
        position: relative;
        outline: none;
      }
      .st-run-btn:hover:not(:disabled) {
        background: color-mix(in srgb, var(--accent) 32%, var(--surface-2));
        transform: scale(1.04);
      }
      .st-run-btn:disabled { cursor: default; }
      .st-run-btn svg { width: 36px; height: 36px; color: var(--text-1); }
      /* spinning ring when testing */
      .st-run-btn.testing::before {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 3px solid transparent;
        border-top-color: var(--accent);
        animation: st-spin 0.9s linear infinite;
      }
      @keyframes st-spin { to { transform: rotate(360deg); } }
      .st-log {
        text-align: center;
        font-size: 12.5px;
        color: var(--text-2);
        min-height: 20px;
        margin-bottom: 28px;
      }
      .st-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      @media (max-width: 460px) {
        .st-stats { grid-template-columns: repeat(2, 1fr); }
      }
      .st-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .st-stat-icon {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-2);
      }
      .st-stat-icon svg { width: 15px; height: 15px; }
      .st-stat-val {
        font-size: 28px;
        font-weight: 700;
        font-family: var(--font-mono, monospace);
        color: var(--text-1);
        line-height: 1.1;
      }
      .st-stat-unit {
        font-size: 11.5px;
        color: var(--text-3);
      }
    </style>

    <div class="tool-header">
      <h1>Speed Test</h1>
      <p>Kiểm tra tốc độ mạng: Download, Upload, Latency và Jitter.</p>
    </div>

    <div class="card st-card">
      <!-- Header row -->
      <div class="st-header">
        <span class="st-title">Speed Test</span>
        <span class="st-powered">Powered by Cloudflare</span>
      </div>

      <!-- Circle run button -->
      <div class="st-run-wrap">
        <button class="st-run-btn" id="stRunBtn" title="Bắt đầu test">
          <!-- Play icon -->
          <svg id="stRunIcon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z"/>
          </svg>
        </button>
      </div>

      <!-- Status log -->
      <div class="st-log" id="stLog"></div>

      <!-- Stats -->
      <div class="st-stats">
        <div class="st-stat">
          <div class="st-stat-icon" style="color:#4caf50;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            Download
          </div>
          <div class="st-stat-val" id="stDlVal">0</div>
          <div class="st-stat-unit">Mbps</div>
        </div>
        <div class="st-stat">
          <div class="st-stat-icon" style="color:#2196f3;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            Upload
          </div>
          <div class="st-stat-val" id="stUlVal">0</div>
          <div class="st-stat-unit">Mbps</div>
        </div>
        <div class="st-stat">
          <div class="st-stat-icon" style="color:#ff9800;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Latency
          </div>
          <div class="st-stat-val" id="stPingVal">0</div>
          <div class="st-stat-unit">ms</div>
        </div>
        <div class="st-stat">
          <div class="st-stat-icon" style="color:#ff9800;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12h3l3-7 4 14 3-7h4l2-3"/>
            </svg>
            Jitter
          </div>
          <div class="st-stat-val" id="stJitterVal">0</div>
          <div class="st-stat-unit">ms</div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const runBtn = document.getElementById('stRunBtn');
  const runIcon = document.getElementById('stRunIcon');
  const stLog = document.getElementById('stLog');
  const stDlVal = document.getElementById('stDlVal');
  const stUlVal = document.getElementById('stUlVal');
  const stPingVal = document.getElementById('stPingVal');
  const stJitterVal = document.getElementById('stJitterVal');

  const setLog = (msg) => {
    stLog.textContent = msg;
  };

  // ── Ping + Jitter ─────────────────────────────────────────────────────
  const measurePing = async () => {
    const url = 'https://speed.cloudflare.com/__down?bytes=1000';
    const samples = [];
    for (let i = 0; i < 6; i++) {
      try {
        const t0 = performance.now();
        await fetch(url, { cache: 'no-store' });
        samples.push(performance.now() - t0);
      } catch {
        /* ignore */
      }
    }
    if (!samples.length) return { ping: null, jitter: null };
    samples.sort((a, b) => a - b);
    const ping = Math.round(samples[1] ?? samples[0]);
    // jitter = mean absolute deviation between consecutive samples
    const jitter =
      samples.length > 1
        ? Math.round(
            samples.slice(1).reduce((s, v, i) => s + Math.abs(v - samples[i]), 0) /
              (samples.length - 1),
          )
        : 0;
    return { ping, jitter };
  };

  // ── Download ──────────────────────────────────────────────────────────
  const measureDownload = async (onProgress) => {
    const chunks = [
      { url: 'https://speed.cloudflare.com/__down?bytes=100000', bytes: 100_000 },
      { url: 'https://speed.cloudflare.com/__down?bytes=1000000', bytes: 1_000_000 },
      { url: 'https://speed.cloudflare.com/__down?bytes=10000000', bytes: 10_000_000 },
      { url: 'https://speed.cloudflare.com/__down?bytes=25000000', bytes: 25_000_000 },
    ];
    let totalBytes = 0,
      totalMs = 0;
    for (const c of chunks) {
      try {
        const t0 = performance.now();
        const res = await fetch(c.url + '&r=' + Math.random(), { cache: 'no-store' });
        await res.arrayBuffer();
        const ms = performance.now() - t0;
        totalBytes += c.bytes;
        totalMs += ms;
        onProgress((totalBytes * 8) / (totalMs / 1000) / 1_000_000);
      } catch {
        /* ignore */
      }
    }
    if (!totalMs) return null;
    return (totalBytes * 8) / (totalMs / 1000) / 1_000_000;
  };

  // ── Upload ────────────────────────────────────────────────────────────
  const measureUpload = async (onProgress) => {
    const sizes = [65_536, 262_144, 1_048_576, 4_194_304];
    let totalBytes = 0,
      totalMs = 0;
    for (const size of sizes) {
      try {
        const buf = new Uint8Array(size);
        crypto.getRandomValues(buf.subarray(0, Math.min(4096, size)));
        const t0 = performance.now();
        await fetch('https://speed.cloudflare.com/__up', {
          method: 'POST',
          body: new Blob([buf]),
          cache: 'no-store',
        });
        const ms = performance.now() - t0;
        totalBytes += size;
        totalMs += ms;
        onProgress((totalBytes * 8) / (totalMs / 1000) / 1_000_000);
      } catch {
        /* ignore */
      }
    }
    if (!totalMs) return null;
    return (totalBytes * 8) / (totalMs / 1000) / 1_000_000;
  };

  // ── Run ───────────────────────────────────────────────────────────────
  const run = async () => {
    runBtn.disabled = true;
    runBtn.classList.add('testing');
    // three dots icon while running
    runIcon.setAttribute('viewBox', '0 0 24 24');
    runIcon.innerHTML =
      '<circle cx="4" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="20" cy="12" r="2" fill="currentColor"/>';
    stDlVal.textContent = '--';
    stUlVal.textContent = '--';
    stPingVal.textContent = '--';
    stJitterVal.textContent = '--';

    // Ping
    setLog('Đo Latency...');
    const { ping, jitter } = await measurePing();
    stPingVal.textContent = ping ?? '--';
    stJitterVal.textContent = jitter ?? '--';
    setLog(`Latency: ${ping ?? '?'} ms · Jitter: ${jitter ?? '?'} ms · Đo Download...`);

    // Download
    const dl = await measureDownload((mbps) => {
      stDlVal.textContent = mbps.toFixed(1);
      setLog(`Download: ${mbps.toFixed(1)} Mbps (đang đo...)`);
    });
    const dlFinal = dl !== null ? +dl.toFixed(2) : null;
    stDlVal.textContent = dlFinal ?? '--';
    setLog(`Download: ${dlFinal ?? '?'} Mbps · Đo Upload...`);

    // Upload
    const ul = await measureUpload((mbps) => {
      stUlVal.textContent = mbps.toFixed(1);
      setLog(`Upload: ${mbps.toFixed(1)} Mbps (đang đo...)`);
    });
    const ulFinal = ul !== null ? +ul.toFixed(2) : null;
    stUlVal.textContent = ulFinal ?? '--';

    // Done — restore play icon
    runBtn.disabled = false;
    runBtn.classList.remove('testing');
    runIcon.setAttribute('viewBox', '0 0 24 24');
    runIcon.innerHTML = '<path d="M8 5.14v14l11-7-11-7z" fill="currentColor"/>';
    setLog('');
  };

  runBtn.addEventListener('click', run);
}
