/**
 * CSS Gradient Generator — linear, radial, conic with live preview
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>CSS Gradient Generator</h1>
      <p>Tạo CSS gradient: linear, radial, conic với nhiều color stops.</p>
    </div>

    <!-- Type + Angle/Shape -->
    <div class="card">
      <div class="row" style="flex-wrap:wrap; gap:12px; align-items:flex-end;">
        <div style="flex:0 0 auto;">
          <label class="field-label">Loại</label>
          <div class="btn-group" style="margin:0;">
            <button class="btn btn-secondary gg-type active" data-type="linear">Linear</button>
            <button class="btn btn-secondary gg-type" data-type="radial">Radial</button>
            <button class="btn btn-secondary gg-type" data-type="conic">Conic</button>
          </div>
        </div>
        <div id="ggAngleWrap" style="flex:0 0 200px;">
          <label class="field-label">Góc: <span id="ggAngleVal" class="mono">135°</span></label>
          <input type="range" id="ggAngle" min="0" max="360" value="135" style="width:100%;" />
        </div>
        <div id="ggShapeWrap" style="flex:0 0 auto; display:none;">
          <label class="field-label">Shape</label>
          <select id="ggShape">
            <option value="ellipse">Ellipse</option>
            <option value="circle">Circle</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Color stops -->
    <div class="card mt-2">
      <div class="d-flex align-center gap-1 mb-2" style="justify-content:space-between;">
        <span class="field-label" style="margin:0;">Color Stops</span>
        <button class="btn btn-secondary btn-sm" id="ggAddStop">+ Add stop</button>
      </div>
      <div id="ggStops" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>

    <!-- Preview -->
    <div class="card mt-2">
      <div class="field-label">Preview</div>
      <div id="ggPreview" style="height:160px; border-radius:var(--radius); margin-top:8px; border:1px solid var(--border);"></div>
    </div>

    <!-- Output -->
    <div class="card mt-2">
      <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
        <span class="field-label" style="margin:0;">CSS Output</span>
        <button class="copy-btn" id="ggCopyBtn" style="position:static;">Copy</button>
      </div>
      <pre id="ggCssOutput" class="mono" style="font-size:13px; padding:10px 12px; background:var(--surface-2); border-radius:var(--radius); margin:0; white-space:pre-wrap; word-break:break-all;"></pre>
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

  let type = 'linear';
  let stops = [
    { color: '#0066FF', pos: 0 },
    { color: '#00CCFF', pos: 50 },
    { color: '#9933FF', pos: 100 },
  ];

  document.querySelectorAll('.gg-type').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gg-type').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      type = btn.dataset.type;
      angleWrap.style.display = type === 'linear' || type === 'conic' ? '' : 'none';
      shapeWrap.style.display = type === 'radial' ? '' : 'none';
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
    cssOutput.textContent = `background: ${css};\nbackground-image: ${css};`;
  };

  const renderStops = () => {
    stopsEl.innerHTML = stops
      .map(
        (s, i) => `
      <div class="d-flex align-center gap-2">
        <input type="color" class="gg-stop-color" data-i="${i}" value="${s.color}"
          style="width:48px; height:36px; cursor:pointer; padding:2px; border-radius:4px; border:1px solid var(--border);" />
        <label class="field-label" style="margin:0; white-space:nowrap;">Position</label>
        <input type="range" class="gg-stop-pos flex-1" data-i="${i}" min="0" max="100" value="${s.pos}" />
        <span class="mono text-sm" id="ggPosVal_${i}" style="min-width:36px;">${s.pos}%</span>
        <button class="btn btn-ghost btn-sm gg-del" data-i="${i}" ${stops.length <= 2 ? 'disabled' : ''}>×</button>
      </div>
    `,
      )
      .join('');

    stopsEl.querySelectorAll('.gg-stop-color').forEach((el) => {
      el.addEventListener('input', () => {
        stops[+el.dataset.i].color = el.value;
        render();
      });
    });
    stopsEl.querySelectorAll('.gg-stop-pos').forEach((el) => {
      el.addEventListener('input', () => {
        const i = +el.dataset.i;
        stops[i].pos = +el.value;
        document.getElementById(`ggPosVal_${i}`).textContent = el.value + '%';
        render();
      });
    });
    stopsEl.querySelectorAll('.gg-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        stops.splice(+btn.dataset.i, 1);
        renderStops();
        render();
      });
    });
  };

  addBtn.addEventListener('click', () => {
    stops.push({
      color:
        '#' +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0'),
      pos: 75,
    });
    renderStops();
    render();
  });

  copyBtn.addEventListener('click', () => window.copyToClipboard(cssOutput.textContent, copyBtn));

  renderStops();
  render();
}
