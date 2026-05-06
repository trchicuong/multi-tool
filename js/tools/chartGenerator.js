/**
 * Chart Generator — Canvas-based charts (bar, line, pie) without external deps
 */

// ─── Tiny chart engine ────────────────────────────────────────────────────────

const COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#a855f7',
  '#f97316',
  '#10b981',
  '#ec4899',
  '#3b82f6',
  '#84cc16',
  '#8b5cf6',
];

function hexToRgb(hex, alpha = 1) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function drawBar(canvas, labels, datasets, title) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  const PAD = { top: 48, right: 24, bottom: 60, left: 60 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const isDark = document.body.classList.contains('dark');
  const fgCol = isDark ? '#e2e8f0' : '#1e293b';
  const gridCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  ctx.clearRect(0, 0, W, H);

  // Title
  if (title) {
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = fgCol;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 26);
  }

  const allVals = datasets.flatMap((d) => d.data);
  const maxVal = Math.max(...allVals, 0);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  // Y gridlines + labels
  const yTicks = 5;
  ctx.textAlign = 'right';
  ctx.font = '11px system-ui, sans-serif';
  for (let i = 0; i <= yTicks; i++) {
    const v = minVal + (range / yTicks) * i;
    const y = PAD.top + cH - (cH * (v - minVal)) / range;
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + cW, y);
    ctx.stroke();
    ctx.fillStyle = fgCol;
    ctx.fillText(v % 1 === 0 ? v : v.toFixed(1), PAD.left - 6, y + 4);
  }

  const n = labels.length;
  const groupW = cW / n;
  const barW = (groupW * 0.7) / datasets.length;

  datasets.forEach((ds, di) => {
    const color = ds.color || COLORS[di % COLORS.length];
    ds.data.forEach((val, i) => {
      const x = PAD.left + i * groupW + groupW * 0.15 + di * barW;
      const barH = (cH * (val - minVal)) / range;
      const y = PAD.top + cH - barH;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW - 2, barH);
    });
  });

  // X labels
  ctx.textAlign = 'center';
  ctx.fillStyle = fgCol;
  ctx.font = '11px system-ui, sans-serif';
  labels.forEach((lbl, i) => {
    const x = PAD.left + i * groupW + groupW / 2;
    ctx.fillText(String(lbl).slice(0, 14), x, PAD.top + cH + 18);
  });

  // Legend
  drawLegend(ctx, datasets, W, H, PAD);
}

function drawLine(canvas, labels, datasets, title) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  const PAD = { top: 48, right: 24, bottom: 60, left: 60 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const isDark = document.body.classList.contains('dark');
  const fgCol = isDark ? '#e2e8f0' : '#1e293b';
  const gridCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  ctx.clearRect(0, 0, W, H);

  if (title) {
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = fgCol;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 26);
  }

  const allVals = datasets.flatMap((d) => d.data);
  const maxVal = Math.max(...allVals, 0);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const yTicks = 5;
  ctx.textAlign = 'right';
  ctx.font = '11px system-ui, sans-serif';
  for (let i = 0; i <= yTicks; i++) {
    const v = minVal + (range / yTicks) * i;
    const y = PAD.top + cH - (cH * (v - minVal)) / range;
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + cW, y);
    ctx.stroke();
    ctx.fillStyle = fgCol;
    ctx.fillText(v % 1 === 0 ? v : v.toFixed(1), PAD.left - 6, y + 4);
  }

  const n = labels.length;
  const xStep = n > 1 ? cW / (n - 1) : cW;

  datasets.forEach((ds, di) => {
    const color = ds.color || COLORS[di % COLORS.length];
    // Fill under line
    ctx.beginPath();
    ds.data.forEach((val, i) => {
      const x = PAD.left + i * xStep;
      const y = PAD.top + cH - (cH * (val - minVal)) / range;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots
    ctx.fillStyle = color;
    ds.data.forEach((val, i) => {
      const x = PAD.left + i * xStep;
      const y = PAD.top + cH - (cH * (val - minVal)) / range;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = fgCol;
  ctx.font = '11px system-ui, sans-serif';
  labels.forEach((lbl, i) => {
    const x = PAD.left + i * xStep;
    ctx.fillText(String(lbl).slice(0, 14), x, PAD.top + cH + 18);
  });

  drawLegend(ctx, datasets, W, H, PAD);
}

function drawPie(canvas, labels, datasets, title) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width,
    H = canvas.height;
  const isDark = document.body.classList.contains('dark');
  const fgCol = isDark ? '#e2e8f0' : '#1e293b';

  ctx.clearRect(0, 0, W, H);

  if (title) {
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = fgCol;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 26);
  }

  const data = datasets[0]?.data || [];
  const total = data.reduce((a, b) => a + b, 0);
  if (!total) return;

  const cx = W / 2,
    cy = H / 2 + 10,
    r = Math.min(W, H) * 0.32;
  let angle = -Math.PI / 2;

  data.forEach((val, i) => {
    const slice = (val / total) * Math.PI * 2;
    const color = COLORS[i % COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isDark ? '#1e293b' : '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Percent label
    const mid = angle + slice / 2;
    const lx = cx + Math.cos(mid) * (r * 0.65);
    const ly = cy + Math.sin(mid) * (r * 0.65);
    const pct = ((val / total) * 100).toFixed(1);
    if (pct > 3) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${pct}%`, lx, ly + 4);
    }
    angle += slice;
  });

  // Legend at bottom
  const legX = 24,
    legY = H - 28;
  data.forEach((_, i) => {
    const x = legX + i * 110;
    if (x + 100 > W) return;
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fillRect(x, legY - 10, 12, 12);
    ctx.fillStyle = fgCol;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(String(labels[i] || '').slice(0, 10), x + 16, legY);
  });
}

function drawLegend(ctx, datasets, W, H, PAD) {
  if (datasets.length <= 1) return;
  const isDark = document.body.classList.contains('dark');
  const fgCol = isDark ? '#e2e8f0' : '#1e293b';
  let lx = PAD.left;
  datasets.forEach((ds, i) => {
    const color = ds.color || COLORS[i % COLORS.length];
    ctx.fillStyle = color;
    ctx.fillRect(lx, H - 18, 12, 12);
    ctx.fillStyle = fgCol;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(ds.label || `Series ${i + 1}`, lx + 16, H - 7);
    lx += ctx.measureText(ds.label || `Series ${i + 1}`).width + 30;
  });
}

// ─── Parse CSV/JSON data ──────────────────────────────────────────────────────

function parseData(raw) {
  raw = raw.trim();
  if (!raw) throw new Error('No data');

  // Try JSON array
  if (raw.startsWith('[')) {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error('Expected JSON array');
    const keys = Object.keys(arr[0]);
    const labelKey = keys[0];
    const valKeys = keys.slice(1);
    const labels = arr.map((r) => String(r[labelKey]));
    const datasets = valKeys.map((k, i) => ({
      label: k,
      data: arr.map((r) => parseFloat(r[k]) || 0),
      color: COLORS[i % COLORS.length],
    }));
    return { labels, datasets };
  }

  // CSV
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const header = lines[0].split(',').map((s) => s.trim());
  const labelKey = header[0];
  const valKeys = header.slice(1);
  const rows = lines.slice(1).map((l) => {
    const cols = l.split(',').map((s) => s.trim());
    const obj = {};
    header.forEach((k, i) => {
      obj[k] = cols[i];
    });
    return obj;
  });
  const labels = rows.map((r) => r[labelKey]);
  const datasets = valKeys.map((k, i) => ({
    label: k,
    data: rows.map((r) => parseFloat(r[k]) || 0),
    color: COLORS[i % COLORS.length],
  }));
  return { labels, datasets };
}

// ─── HTML + init ─────────────────────────────────────────────────────────────

const SAMPLE_CSV = `Month,Revenue,Expenses
Jan,12000,8000
Feb,15000,9000
Mar,13000,8500
Apr,17000,11000
May,16000,10500
Jun,19000,12000`;

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Chart Generator</h1>
      <p>Tạo biểu đồ Bar, Line, Pie từ CSV hoặc JSON. Xuất PNG không cần thư viện ngoài.</p>
    </div>

    <div class="row" style="align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <!-- Controls -->
      <div class="card" style="min-width:260px; width:300px; flex:0 0 300px;">
        <div class="field">
          <label class="field-label">Loại biểu đồ</label>
          <select id="cgType">
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </div>
        <div class="field mt-1">
          <label class="field-label">Tiêu đề</label>
          <input type="text" id="cgTitle" placeholder="My Chart" />
        </div>
        <div class="row mt-1" style="gap:10px;">
          <div class="flex-1">
            <label class="field-label">Rộng (px)</label>
            <input type="number" id="cgWidth" value="720" min="300" max="2000" />
          </div>
          <div class="flex-1">
            <label class="field-label">Cao (px)</label>
            <input type="number" id="cgHeight" value="400" min="200" max="1400" />
          </div>
        </div>

        <div class="field mt-2">
          <label class="field-label">Dữ liệu (CSV hoặc JSON array)</label>
          <textarea id="cgData" rows="12" class="mono w-full"
            style="resize:vertical; font-size:12px; line-height:1.5;"
            spellcheck="false">${SAMPLE_CSV}</textarea>
        </div>
        <button class="btn btn-primary w-full mt-2" id="cgRender">Render Chart</button>
        <button class="btn btn-ghost btn-sm w-full mt-1" id="cgDownload">Download PNG</button>
      </div>

      <!-- Canvas preview -->
      <div class="card flex-1" style="min-width:220px; overflow:auto; text-align:center;">
        <canvas id="cgCanvas" width="720" height="400"
          style="max-width:100%; border-radius:4px;"></canvas>
        <p id="cgError" class="text-sm mt-1" style="color:var(--danger,#ef4444); display:none;"></p>
      </div>
    </div>
  `;
}

export function init() {
  const renderBtn = document.getElementById('cgRender');
  const downloadBtn = document.getElementById('cgDownload');
  const canvas = document.getElementById('cgCanvas');
  const errorEl = document.getElementById('cgError');
  const typeEl = document.getElementById('cgType');
  const titleEl = document.getElementById('cgTitle');
  const widthEl = document.getElementById('cgWidth');
  const heightEl = document.getElementById('cgHeight');
  const dataEl = document.getElementById('cgData');

  const render = () => {
    errorEl.style.display = 'none';
    canvas.width = parseInt(widthEl.value) || 720;
    canvas.height = parseInt(heightEl.value) || 400;
    try {
      const { labels, datasets } = parseData(dataEl.value);
      const type = typeEl.value;
      const title = titleEl.value.trim();
      if (type === 'bar') drawBar(canvas, labels, datasets, title);
      if (type === 'line') drawLine(canvas, labels, datasets, title);
      if (type === 'pie') drawPie(canvas, labels, datasets, title);
    } catch (e) {
      errorEl.textContent = 'Lỗi: ' + e.message;
      errorEl.style.display = '';
    }
  };

  renderBtn.addEventListener('click', render);
  downloadBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'chart.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  });

  // Auto-render on load
  render();
}
