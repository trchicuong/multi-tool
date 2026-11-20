/**
 * Box Shadow Generator — visual CSS box-shadow builder with presets & multi-layer controls
 */

const PRESETS = [
  {
    label: 'Subtle',
    layers: [{ offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#000000', opacity: 12, inset: false, enabled: true }],
  },
  {
    label: 'Card',
    layers: [
      { offsetX: 0, offsetY: 4, blur: 12, spread: -2, color: '#000000', opacity: 10, inset: false, enabled: true },
      { offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#000000', opacity: 6, inset: false, enabled: true },
    ],
  },
  {
    label: 'Floating',
    layers: [{ offsetX: 0, offsetY: 20, blur: 32, spread: -8, color: '#000000', opacity: 22, inset: false, enabled: true }],
  },
  {
    label: 'Soft Glow',
    layers: [{ offsetX: 0, offsetY: 0, blur: 24, spread: 2, color: '#0066ff', opacity: 35, inset: false, enabled: true }],
  },
  {
    label: 'Inner',
    layers: [{ offsetX: 0, offsetY: 2, blur: 8, spread: 0, color: '#000000', opacity: 22, inset: true, enabled: true }],
  },
];

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Box-Shadow Generator</h1>
      <p>Thiết kế CSS box-shadow nhiều lớp trực quan với bộ Preset mẫu và xem trước theo thời gian thực.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Mẫu nhanh (Presets)</span>
        <div class="preset-strip">
          ${PRESETS.map(
            (p, idx) =>
              `<button type="button" class="btn btn-secondary btn-sm bs-preset" data-idx="${idx}">${p.label}</button>`,
          ).join('')}
        </div>
      </div>
    </div>

    <div class="split-editor mb-2" style="align-items:stretch;">
      <!-- Preview -->
      <div id="bsPreviewWrap" class="card" style="margin-bottom:0; min-height:300px; display:flex; flex-direction:column; justify-content:space-between;">
        <div class="card-header">
          <span class="field-label">Preview</span>
          <div class="d-flex align-center gap-2">
            <label class="d-flex align-center gap-1 text-sm text-muted">
              Box <input type="color" id="bsBoxColor" value="#0066ff" style="width:32px; height:28px;" />
            </label>
            <label class="d-flex align-center gap-1 text-sm text-muted">
              BG <input type="color" id="bsBgColor" value="#f7f7f7" style="width:32px; height:28px;" />
            </label>
          </div>
        </div>
        <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
          <div id="bsPreviewBox" style="width:140px; height:140px; background:#0066ff; border-radius:12px; transition:box-shadow 100ms;"></div>
        </div>
      </div>

      <!-- Controls -->
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <span class="field-label">Layers</span>
          <button type="button" class="btn btn-secondary btn-sm" id="bsAddLayer">+ Add layer</button>
        </div>
        <div id="bsLayers" style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px;"></div>

        <div id="bsControls">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            ${[
              { key: 'offsetX', label: 'Offset X' },
              { key: 'offsetY', label: 'Offset Y' },
              { key: 'blur', label: 'Blur', min: 0 },
              { key: 'spread', label: 'Spread' },
            ]
              .map(
                (item) => `
              <div>
                <label class="field-label" style="display:flex; justify-content:space-between;">
                  <span>${item.label}</span>
                  <span id="bsVal_${item.key}" class="mono">0px</span>
                </label>
                <input type="range" id="bs_${item.key}" min="${item.min ?? -80}" max="100" value="0" step="1" />
              </div>
            `,
              )
              .join('')}
          </div>

          <div style="display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:end; margin-top:16px;">
            <div>
              <label class="field-label" for="bs_color">Color</label>
              <input type="color" id="bs_color" value="#000000" />
            </div>
            <div>
              <label class="field-label" style="display:flex; justify-content:space-between;">
                <span>Opacity</span>
                <span id="bsVal_opacity" class="mono">25%</span>
              </label>
              <div style="height:38px; display:flex; align-items:center;">
                <input type="range" id="bs_opacity" min="0" max="100" value="25" />
              </div>
            </div>
            <div style="height:38px; display:flex; align-items:center;">
              <label class="checkbox-row">
                <input type="checkbox" id="bs_inset" />
                <span>Inset</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Output -->
    <div class="card">
      <div class="card-header">
        <span class="field-label">CSS Output</span>
        <button type="button" class="copy-btn" id="bsCopyBtn">Copy</button>
      </div>
      <div class="output-box">
        <pre id="bsCssOutput" style="margin:0;"></pre>
      </div>
    </div>
  `;
}

export function init() {
  const previewWrap = document.getElementById('bsPreviewWrap');
  const previewBox = document.getElementById('bsPreviewBox');
  const layersEl = document.getElementById('bsLayers');
  const addBtn = document.getElementById('bsAddLayer');
  const cssOutput = document.getElementById('bsCssOutput');
  const copyBtn = document.getElementById('bsCopyBtn');
  const boxColor = document.getElementById('bsBoxColor');
  const bgColor = document.getElementById('bsBgColor');

  const ctrlOffX = document.getElementById('bs_offsetX');
  const ctrlOffY = document.getElementById('bs_offsetY');
  const ctrlBlur = document.getElementById('bs_blur');
  const ctrlSpread = document.getElementById('bs_spread');
  const ctrlColor = document.getElementById('bs_color');
  const ctrlOpacity = document.getElementById('bs_opacity');
  const ctrlInset = document.getElementById('bs_inset');

  const newLayer = () => ({
    offsetX: 0,
    offsetY: 8,
    blur: 24,
    spread: -4,
    color: '#000000',
    opacity: 18,
    inset: false,
    enabled: true,
  });

  let layers = [newLayer()];
  let selected = 0;

  function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
  }

  function layerToCss(l) {
    return `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${hexToRgba(l.color, l.opacity)}`;
  }

  function render() {
    const active = layers.filter((l) => l.enabled);
    const shadowCss = active.map(layerToCss).join(',\n  ') || 'none';
    previewBox.style.boxShadow = active.map(layerToCss).join(', ') || 'none';
    cssOutput.textContent = `box-shadow: ${shadowCss};`;

    layersEl.innerHTML = layers
      .map(
        (l, i) => `
      <div class="d-flex align-center gap-2" style="padding:6px 10px; border-radius:var(--radius); background:${i === selected ? 'var(--accent-bg)' : 'var(--surface-2)'}; border:1px solid ${i === selected ? 'var(--accent)' : 'var(--border)'}; cursor:pointer;">
        <input type="checkbox" class="bs-layer-toggle" data-i="${i}" ${l.enabled ? 'checked' : ''} aria-label="Bật lớp ${i + 1}" />
        <span class="flex-1 text-sm mono" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" data-sel="${i}">${layerToCss(l)}</span>
        <button type="button" class="btn btn-ghost btn-sm bs-del" data-i="${i}" ${layers.length === 1 ? 'disabled' : ''} style="min-height:24px; padding:2px 6px;">×</button>
      </div>
    `,
      )
      .join('');

    layersEl.querySelectorAll('[data-sel]').forEach((el) => {
      el.addEventListener('click', () => {
        selected = Number(el.dataset.sel);
        syncControls();
        render();
      });
    });
    layersEl.querySelectorAll('.bs-layer-toggle').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        layers[Number(cb.dataset.i)].enabled = cb.checked;
        render();
      });
    });
    layersEl.querySelectorAll('.bs-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        layers.splice(Number(btn.dataset.i), 1);
        if (selected >= layers.length) selected = layers.length - 1;
        syncControls();
        render();
      });
    });
  }

  function syncControls() {
    const l = layers[selected];
    ctrlOffX.value = l.offsetX;
    document.getElementById('bsVal_offsetX').textContent = `${l.offsetX}px`;
    ctrlOffY.value = l.offsetY;
    document.getElementById('bsVal_offsetY').textContent = `${l.offsetY}px`;
    ctrlBlur.value = l.blur;
    document.getElementById('bsVal_blur').textContent = `${l.blur}px`;
    ctrlSpread.value = l.spread;
    document.getElementById('bsVal_spread').textContent = `${l.spread}px`;
    ctrlColor.value = l.color;
    ctrlOpacity.value = l.opacity;
    document.getElementById('bsVal_opacity').textContent = `${l.opacity}%`;
    ctrlInset.checked = l.inset;
  }

  function bindControl(el, prop, valEl, suffix = 'px') {
    el.addEventListener('input', () => {
      const val = prop === 'inset' ? el.checked : prop === 'color' ? el.value : Number(el.value);
      layers[selected][prop] = val;
      if (valEl) document.getElementById(valEl).textContent = `${val}${suffix}`;
      render();
    });
  }

  bindControl(ctrlOffX, 'offsetX', 'bsVal_offsetX');
  bindControl(ctrlOffY, 'offsetY', 'bsVal_offsetY');
  bindControl(ctrlBlur, 'blur', 'bsVal_blur');
  bindControl(ctrlSpread, 'spread', 'bsVal_spread');
  bindControl(ctrlColor, 'color', null, '');
  bindControl(ctrlOpacity, 'opacity', 'bsVal_opacity', '%');
  bindControl(ctrlInset, 'inset', null, '');

  addBtn.addEventListener('click', () => {
    layers.push(newLayer());
    selected = layers.length - 1;
    syncControls();
    render();
  });

  document.querySelectorAll('.bs-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = PRESETS[Number(btn.dataset.idx)];
      if (!p) return;
      layers = p.layers.map((l) => ({ ...l }));
      selected = 0;
      syncControls();
      render();
    });
  });

  boxColor.addEventListener('input', () => {
    previewBox.style.background = boxColor.value;
  });
  bgColor.addEventListener('input', () => {
    previewWrap.style.background = bgColor.value;
  });

  copyBtn.addEventListener('click', () => window.copyToClipboard(cssOutput.textContent, copyBtn));

  syncControls();
  render();
}
