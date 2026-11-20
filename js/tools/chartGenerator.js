/**
 * Chart Generator — Canvas charts (Bar, Line, Pie, Doughnut), live render & PNG copy/export
 */

const COLORS = [
  '#0066ff',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

function drawAxesChart(canvas, labels, datasets, title, mode) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const PAD = { top: 48, right: 24, bottom: 56, left: 60 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const isDark = document.body.classList.contains('dark');
  const fgCol = isDark ? '#e5e7eb' : '#111827';
  const gridCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  ctx.clearRect(0, 0, W, H);
  if (title) {
    ctx.font = '600 15px Inter, system-ui, sans-serif';
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
  ctx.font = '11px Inter, system-ui, sans-serif';
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
    ctx.fillText(v % 1 === 0 ? String(v) : v.toFixed(1), PAD.left - 8, y + 4);
  }

  const n = Math.max(1, labels.length);
  if (mode === 'bar') {
    const groupW = cW / n;
    const barW = (groupW * 0.7) / Math.max(1, datasets.length);
    datasets.forEach((ds, di) => {
      const color = ds.color || COLORS[di % COLORS.length];
      ds.data.forEach((val, i) => {
        const x = PAD.left + i * groupW + groupW * 0.15 + di * barW;
        const barH = (cH * (val - minVal)) / range;
        const y = PAD.top + cH - barH;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.max(2, barW - 2), barH);
      });
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = fgCol;
    labels.forEach((lbl, i) => {
      ctx.fillText(String(lbl).slice(0, 14), PAD.left + i * groupW + groupW / 2, PAD.top + cH + 18);
    });
  } else {
    const xStep = n > 1 ? cW / (n - 1) : cW;
    datasets.forEach((ds, di) => {
      const color = ds.color || COLORS[di % COLORS.length];
      ctx.beginPath();
      ds.data.forEach((val, i) => {
        const x = PAD.left + i * xStep;
        const y = PAD.top + cH - (cH * (val - minVal)) / range;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

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
    labels.forEach((lbl, i) => {
      ctx.fillText(String(lbl).slice(0, 14), PAD.left + i * xStep, PAD.top + cH + 18);
    });
  }

  if (datasets.length > 1) {
    let lx = PAD.left;
    datasets.forEach((ds, i) => {
      const color = ds.color || COLORS[i % COLORS.length];
      ctx.fillStyle = color;
      ctx.fillRect(lx, H - 18, 12, 12);
      ctx.fillStyle = fgCol;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      const label = ds.label || `Series ${i + 1}`;
      ctx.fillText(label, lx + 16, H - 8);
      lx += ctx.measureText(label).width + 32;
    });
  }
}

function drawPie(canvas, labels, datasets, title, isDoughnut) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const isDark = document.body.classList.contains('dark');
  const fgCol = isDark ? '#e5e7eb' : '#111827';

  ctx.clearRect(0, 0, W, H);
  if (title) {
    ctx.font = '600 15px Inter, system-ui, sans-serif';
    ctx.fillStyle = fgCol;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 26);
  }

  const data = datasets[0]?.data || [];
  const total = data.reduce((a, b) => a + Math.max(0, b), 0);
  if (!total) return;

  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) * 0.34;
  let angle = -Math.PI / 2;

  data.forEach((val, i) => {
    const safeVal = Math.max(0, val);
    const slice = (safeVal / total) * Math.PI * 2;
    const color = COLORS[i % COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isDark ? '#141414' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const mid = angle + slice / 2;
    const labelRadius = isDoughnut ? r * 0.74 : r * 0.65;
    const lx = cx + Math.cos(mid) * labelRadius;
    const ly = cy + Math.sin(mid) * labelRadius;
    const pct = ((safeVal / total) * 100).toFixed(1);
    if (Number(pct) > 4) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pct}%`, lx, ly + 4);
    }
    angle += slice;
  });

  if (isDoughnut) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#141414' : '#ffffff';
    ctx.fill();
  }

  let lx = 24;
  const legY = H - 16;
  data.forEach((_, i) => {
    const label = String(labels[i] || `Item ${i + 1}`).slice(0, 14);
    const itemW = ctx.measureText(label).width + 32;
    if (lx + itemW > W) return;
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fillRect(lx, legY - 10, 12, 12);
    ctx.fillStyle = fgCol;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + 16, legY);
    lx += itemW;
  });
}

function parseData(raw) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Nhập dữ liệu trước');

  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed);
    if (!Array.isArray(arr) || !arr.length) throw new Error('Cần một JSON array không rỗng');
    const keys = Object.keys(arr[0]);
    const labelKey = keys[0];
    const valKeys = keys.slice(1);
    return {
      labels: arr.map((r) => String(r[labelKey])),
      datasets: valKeys.map((k, i) => ({
        label: k,
        data: arr.map((r) => parseFloat(r[k]) || 0),
        color: COLORS[i % COLORS.length],
      })),
    };
  }

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV cần ít nhất 1 dòng header và 1 dòng dữ liệu');
  const header = lines[0].split(',').map((s) => s.trim());
  const valKeys = header.slice(1);
  const rows = lines.slice(1).map((l) => l.split(',').map((s) => s.trim()));
  return {
    labels: rows.map((cols) => cols[0]),
    datasets: valKeys.map((k, i) => ({
      label: k,
      data: rows.map((cols) => parseFloat(cols[i + 1]) || 0),
      color: COLORS[i % COLORS.length],
    })),
  };
}

const SAMPLE_CSV = `Quarter,Revenue,Expenses
Q1,12000,8000
Q2,15000,9200
Q3,14200,8800
Q4,19500,11400`;

const SAMPLE_JSON = `[
  { "Quarter": "Q1", "Revenue": 12000, "Expenses": 8000 },
  { "Quarter": "Q2", "Revenue": 15000, "Expenses": 9200 },
  { "Quarter": "Q3", "Revenue": 14200, "Expenses": 8800 },
  { "Quarter": "Q4", "Revenue": 19500, "Expenses": 11400 }
]`;

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Chart Generator</h1>
      <p>Tạo biểu đồ Bar, Line, Pie, Doughnut từ CSV hoặc JSON theo thời gian thực. Sao chép ảnh hoặc tải PNG.</p>
    </div>

    <div class="split-editor" style="align-items:stretch;">
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <span class="field-label">Cấu hình &amp; Dữ liệu</span>
          <div class="d-flex gap-1">
            <button type="button" class="btn btn-ghost btn-sm" id="cgSampleCsv">Sample CSV</button>
            <button type="button" class="btn btn-ghost btn-sm" id="cgSampleJson">Sample JSON</button>
          </div>
        </div>

        <div class="row" style="gap:10px;">
          <div>
            <label class="field-label" for="cgType">Loại biểu đồ</label>
            <select id="cgType">
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="cgTitle">Tiêu đề biểu đồ</label>
            <input type="text" id="cgTitle" value="Quarterly Overview" placeholder="Chart Title" />
          </div>
        </div>

        <div class="row mt-1" style="gap:10px;">
          <div>
            <label class="field-label" for="cgWidth">Rộng (px)</label>
            <input type="number" id="cgWidth" value="720" min="300" max="2000" />
          </div>
          <div>
            <label class="field-label" for="cgHeight">Cao (px)</label>
            <input type="number" id="cgHeight" value="400" min="200" max="1400" />
          </div>
        </div>

        <div class="field mt-2">
          <label class="field-label" for="cgData">Dữ liệu (CSV hoặc JSON array)</label>
          <textarea
            id="cgData"
            rows="9"
            class="mono w-full"
            style="resize:vertical; font-size:12.5px; line-height:1.55;"
            spellcheck="false"
          >${SAMPLE_CSV}</textarea>
        </div>
        <div id="cgError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
      </div>

      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
        <div class="card-header">
          <span class="field-label">Xem trước</span>
          <div class="d-flex gap-1">
            <button type="button" class="copy-btn" id="cgCopyImg">Copy Image</button>
            <button type="button" class="btn btn-primary btn-sm" id="cgDownload">Download PNG</button>
          </div>
        </div>
        <div style="flex:1; display:flex; align-items:center; justify-content:center; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px; overflow:auto;">
          <canvas id="cgCanvas" width="720" height="400" style="max-width:100%; border-radius:4px;"></canvas>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const downloadBtn = document.getElementById('cgDownload');
  const copyImgBtn = document.getElementById('cgCopyImg');
  const canvas = document.getElementById('cgCanvas');
  const errorEl = document.getElementById('cgError');
  const typeEl = document.getElementById('cgType');
  const titleEl = document.getElementById('cgTitle');
  const widthEl = document.getElementById('cgWidth');
  const heightEl = document.getElementById('cgHeight');
  const dataEl = document.getElementById('cgData');

  const render = () => {
    errorEl.textContent = '';
    canvas.width = Math.max(300, Math.min(2000, parseInt(widthEl.value, 10) || 720));
    canvas.height = Math.max(200, Math.min(1400, parseInt(heightEl.value, 10) || 400));
    try {
      const { labels, datasets } = parseData(dataEl.value);
      const type = typeEl.value;
      const title = titleEl.value.trim();
      if (type === 'bar' || type === 'line') drawAxesChart(canvas, labels, datasets, title, type);
      else drawPie(canvas, labels, datasets, title, type === 'doughnut');
    } catch (e) {
      errorEl.textContent = e.message;
    }
  };

  [typeEl, titleEl, widthEl, heightEl, dataEl].forEach((el) => {
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', render);
  });

  document.getElementById('cgSampleCsv').addEventListener('click', () => {
    dataEl.value = SAMPLE_CSV;
    render();
  });
  document.getElementById('cgSampleJson').addEventListener('click', () => {
    dataEl.value = SAMPLE_JSON;
    render();
  });

  downloadBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chart.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });

  copyImgBtn.addEventListener('click', () => {
    canvas.toBlob(async (blob) => {
      if (!blob || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        window.showToast('Trình duyệt không hỗ trợ copy ảnh trực tiếp', 'error');
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        window.showToast('Đã copy ảnh biểu đồ!', 'success');
      } catch {
        window.showToast('Không thể copy ảnh', 'error');
      }
    }, 'image/png');
  });

  render();
}
