/**
 * CSS Gradient Generator — linear, radial, conic with presets & live preview
 */

const PRESETS = [
  {
    label: 'Ocean',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#0066ff', pos: 0 },
      { color: '#00ccff', pos: 100 },
    ],
  },
  {
    label: 'Sunset',
    type: 'linear',
    angle: 120,
    stops: [
      { color: '#ff512f', pos: 0 },
      { color: '#f09819', pos: 100 },
    ],
  },
  {
    label: 'Emerald',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#11998e', pos: 0 },
      { color: '#38ef7d', pos: 100 },
    ],
  },
  {
    label: 'Berry',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#6366f1', pos: 0 },
      { color: '#a855f7', pos: 50 },
      { color: '#ec4899', pos: 100 },
    ],
  },
  {
    label: 'Minimal Dark',
    type: 'linear',
    angle: 160,
    stops: [
      { color: '#18181b', pos: 0 },
      { color: '#3f3f46', pos: 100 },
    ],
  },
];

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>CSS Gradient Generator</h1>
      <p>Tạo CSS gradient (linear, radial, conic) với nhiều điểm màu và bộ Preset tinh gọn.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Mẫu nhanh (Presets)</span>
        <div class="preset-strip">
          ${PRESETS.map(
            (p, idx) =>
              `<button type="button" class="btn btn-secondary btn-sm gg-preset" data-idx="${idx}">${p.label}</button>`,
          ).join('')}
          <button type="button" class="btn btn-ghost btn-sm" id="ggRandom">Ngẫu nhiên</button>
        </div>
      </div>

      <div class="row" style="align-items:flex-end;">
        <div style="flex:0 0 auto;">
          <span class="field-label">Loại Gradient</span>
          <div class="seg-group">
            <button type="button" class="btn gg-type active" data-type="linear">Linear</button>
            <button type="button" class="btn gg-type" data-type="radial">Radial</button>
            <button type="button" class="btn gg-type" data-type="conic">Conic</button>
          </div>
        </div>
        <div id="ggAngleWrap" class="flex-1" style="min-width:180px;">
          <label class="field-label" for="ggAngle" style="display:flex; justify-content:space-between;">
            <span>Góc xoay</span>
            <span id="ggAngleVal" class="mono">135°</span>
          </label>
          <div style="height:38px; display:flex; align-items:center;">
            <input type="range" id="ggAngle" min="0" max="360" value="135" />
          </div>
        </div>
        <div id="ggShapeWrap" style="flex:0 0 160px; display:none;">
          <label class="field-label" for="ggShape">Hình dạng (Shape)</label>
          <select id="ggShape">
            <option value="ellipse">Ellipse</option>
            <option value="circle">Circle</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Color Stops</span>
        <button type="button" class="btn btn-secondary btn-sm" id="ggAddStop">+ Thêm điểm màu</button>
      </div>
      <div id="ggStops" style="display:flex; flex-direction:column; gap:10px;"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Preview</span>
      </div>
      <div id="ggPreview" style="height:180px; border-radius:var(--radius); border:1px solid var(--border);"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">CSS Output</span>
        <button type="button" class="copy-btn" id="ggCopyBtn">Copy</button>
      </div>
      <div class="output-box">
        <pre id="ggCssOutput" style="margin:0;"></pre>
      </div>
    </div>
  `;
}

export function init() {
  const previewEl = document.getElementById('ggPreview');
  const cssOutput = document.getElementById('ggCssOutput');
  const copyBtn = document.getElementById('ggCopyBtn');
  const angleInput = document.getElementById('ggAngle');
  const angleVal = document.getElementById('ggAngleVal');
  const angleWrap = document.getElementById('ggAngleWrap');
  const shapeWrap = document.getElementById('ggShapeWrap');
  const shapeSel = document.getElementById('ggShape');
  const stopsEl = document.getElementById('ggStops');
  const addBtn = document.getElementById('ggAddStop');
  const randomBtn = document.getElementById('ggRandom');

  let type = 'linear';
  let stops = [
    { color: '#0066ff', pos: 0 },
    { color: '#00ccff', pos: 50 },
    { color: '#9933ff', pos: 100 },
  ];

  const syncTypeUI = () => {
    document.querySelectorAll('.gg-type').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === type);
    });
    angleWrap.style.display = type === 'linear' || type === 'conic' ? '' : 'none';
    shapeWrap.style.display = type === 'radial' ? '' : 'none';
  };

  document.querySelectorAll('.gg-type').forEach((btn) => {
    btn.addEventListener('click', () => {
      type = btn.dataset.type;
      syncTypeUI();
      render();
    });
  });

  angleInput.addEventListener('input', () => {
    angleVal.textContent = angleInput.value + '°';
    render();
  });
  shapeSel.addEventListener('change', () => render());

  const buildGradient = () => {
    const sorted = [...stops].sort((a, b) => a.pos - b.pos);
    const colorStr = sorted.map((s) => `${s.color} ${s.pos}%`).join(', ');
    const angle = angleInput.value;
    if (type === 'linear') return `linear-gradient(${angle}deg, ${colorStr})`;
    if (type === 'radial') return `radial-gradient(${shapeSel.value} at center, ${colorStr})`;
    return `conic-gradient(from ${angle}deg, ${colorStr})`;
  };

  const render = () => {
    const css = buildGradient();
    previewEl.style.background = css;
    cssOutput.textContent = `background: ${css};`;
  };

  const renderStops = () => {
    stopsEl.innerHTML = stops
      .map(
        (s, i) => `
      <div class="d-flex align-center gap-2">
        <input type="color" class="gg-stop-color" data-i="${i}" value="${s.color}" aria-label="Color stop ${i + 1}" />
        <code class="mono text-sm" id="ggHex_${i}" style="min-width:64px; color:var(--text-2);">${s.color}</code>
        <input type="range" class="gg-stop-pos flex-1" data-i="${i}" min="0" max="100" value="${s.pos}" aria-label="Vị trí stop ${i + 1}" />
        <span class="mono text-sm" id="ggPosVal_${i}" style="min-width:38px; text-align:right;">${s.pos}%</span>
        <button type="button" class="btn btn-ghost btn-sm gg-del" data-i="${i}" ${stops.length <= 2 ? 'disabled' : ''} style="min-height:30px; padding:4px 8px;">×</button>
      </div>
    `,
      )
      .join('');

    stopsEl.querySelectorAll('.gg-stop-color').forEach((el) => {
      el.addEventListener('input', () => {
        const idx = Number(el.dataset.i);
        stops[idx].color = el.value;
        document.getElementById(`ggHex_${idx}`).textContent = el.value;
        render();
      });
    });
    stopsEl.querySelectorAll('.gg-stop-pos').forEach((el) => {
      el.addEventListener('input', () => {
        const idx = Number(el.dataset.i);
        stops[idx].pos = Number(el.value);
        document.getElementById(`ggPosVal_${idx}`).textContent = `${el.value}%`;
        render();
      });
    });
    stopsEl.querySelectorAll('.gg-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        stops.splice(Number(btn.dataset.i), 1);
        renderStops();
        render();
      });
    });
  };

  const randHex = () =>
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0');

  document.querySelectorAll('.gg-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = PRESETS[Number(btn.dataset.idx)];
      if (!p) return;
      type = p.type;
      angleInput.value = String(p.angle);
      angleVal.textContent = `${p.angle}°`;
      stops = p.stops.map((s) => ({ ...s }));
      syncTypeUI();
      renderStops();
      render();
    });
  });

  randomBtn.addEventListener('click', () => {
    const angle = Math.floor(Math.random() * 360);
    angleInput.value = String(angle);
    angleVal.textContent = `${angle}°`;
    stops = [
      { color: randHex(), pos: 0 },
      { color: randHex(), pos: 100 },
    ];
    renderStops();
    render();
  });

  addBtn.addEventListener('click', () => {
    stops.push({ color: randHex(), pos: 75 });
    renderStops();
    render();
  });

  copyBtn.addEventListener('click', () => window.copyToClipboard(cssOutput.textContent, copyBtn));

  syncTypeUI();
  renderStops();
  render();
}
