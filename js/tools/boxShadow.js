/**
 * Box Shadow Generator — visual CSS box-shadow builder
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Box-Shadow Generator</h1>
      <p>Tạo CSS box-shadow trực quan. Điều chỉnh các thông số và xem kết quả ngay lập tức.</p>
    </div>

    <div class="row" style="align-items:flex-start; flex-wrap:wrap; gap:16px;">

      <!-- Preview -->
      <div class="card" style="flex:1; min-width:260px; min-height:260px; display:flex; align-items:center; justify-content:center;">
        <div id="bsPreviewBox" style="
          width:140px; height:140px;
          background:var(--accent);
          border-radius:8px;
          transition:box-shadow .15s;
        "></div>
      </div>

      <!-- Controls -->
      <div class="card flex-1" style="min-width:280px;">

        <!-- Layers -->
        <div class="d-flex align-center gap-1 mb-2" style="justify-content:space-between;">
          <span class="field-label" style="margin:0;">Layers</span>
          <button class="btn btn-secondary btn-sm" id="bsAddLayer">+ Add layer</button>
        </div>
        <div id="bsLayers" style="display:flex; flex-direction:column; gap:6px; margin-bottom:14px;"></div>

        <!-- Controls for selected layer -->
        <div id="bsControls">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            ${['offsetX', 'offsetY', 'blur', 'spread']
              .map(
                (name) => `
              <div>
                <label class="field-label" style="display:flex; justify-content:space-between;">
                  ${name.charAt(0).toUpperCase() + name.slice(1)} <span id="bsVal_${name}" class="mono">0px</span>
                </label>
                <input type="range" id="bs_${name}" min="-100" max="100" value="0" step="1" style="width:100%;" />
              </div>
            `,
              )
              .join('')}
          </div>

          <div class="row mt-2" style="gap:10px; flex-wrap:wrap;">
            <div>
              <label class="field-label">Color</label>
              <input type="color" id="bs_color" value="#00000040"
                style="width:80px; height:38px; border-radius:var(--radius); cursor:pointer; padding:2px;" />
            </div>
            <div>
              <label class="field-label">Opacity</label>
              <input type="range" id="bs_opacity" min="0" max="100" value="25"
                style="width:120px; margin-top:10px;" />
              <span id="bsVal_opacity" class="mono text-sm"> 25%</span>
            </div>
            <label class="d-flex align-center gap-2 mt-1">
              <input type="checkbox" id="bs_inset" /> Inset
            </label>
          </div>
        </div>

        <!-- Box color -->
        <div class="d-flex align-center gap-2 mt-2">
          <label class="field-label" style="margin:0; min-width:80px;">Box color</label>
          <input type="color" id="bsBoxColor" value="#4D94FF"
            style="width:50px; height:32px; cursor:pointer; padding:1px; border-radius:4px;" />
          <label class="field-label" style="margin:0; min-width:80px;">BG color</label>
          <input type="color" id="bsBgColor" value="#F7F7F7"
            style="width:50px; height:32px; cursor:pointer; padding:1px; border-radius:4px;" />
        </div>
      </div>
    </div>

    <!-- Output -->
    <div class="card mt-2">
      <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
        <span class="field-label" style="margin:0;">CSS Output</span>
        <button class="copy-btn" id="bsCopyBtn" style="position:static;">Copy</button>
      </div>
      <pre id="bsCssOutput" class="mono" style="font-size:13px; padding:10px 12px; background:var(--surface-2); border-radius:var(--radius); margin:0;"></pre>
    </div>
  `;
}

export function init() {
  const previewBox = document.getElementById('bsPreviewBox');
  const layersEl = document.getElementById('bsLayers');
  const addBtn = document.getElementById('bsAddLayer');
  const cssOutput = document.getElementById('bsCssOutput');
  const copyBtn = document.getElementById('bsCopyBtn');
  const boxColor = document.getElementById('bsBoxColor');
  const bgColor = document.getElementById('bsBgColor');

  // Controls
  const ctrlOffX = document.getElementById('bs_offsetX');
  const ctrlOffY = document.getElementById('bs_offsetY');
  const ctrlBlur = document.getElementById('bs_blur');
  const ctrlSpread = document.getElementById('bs_spread');
  const ctrlColor = document.getElementById('bs_color');
  const ctrlOpacity = document.getElementById('bs_opacity');
  const ctrlInset = document.getElementById('bs_inset');

  let layers = [newLayer()];
  let selected = 0;

  function newLayer() {
    return {
      offsetX: 5,
      offsetY: 5,
      blur: 15,
      spread: 0,
      color: '#000000',
      opacity: 25,
      inset: false,
      enabled: true,
    };
  }

  function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
  }

  function layerToCss(l) {
    const rgba = hexToRgba(l.color, l.opacity);
    return `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${rgba}`;
  }

  function render() {
    const shadowCss =
      layers
        .filter((l) => l.enabled)
        .map(layerToCss)
        .join(',\n       ') || 'none';
    previewBox.style.boxShadow = layers
      .filter((l) => l.enabled)
      .map(layerToCss)
      .join(', ');
    cssOutput.textContent = `box-shadow: ${shadowCss};`;

    // Render layer buttons
    layersEl.innerHTML = layers
      .map(
        (l, i) => `
      <div class="d-flex align-center gap-2" style="padding:6px 8px; border-radius:var(--radius); background:${i === selected ? 'var(--surface-2)' : 'transparent'}; border:1px solid ${i === selected ? 'var(--accent)' : 'var(--border)'}; cursor:pointer;">
        <input type="checkbox" class="bs-layer-toggle" data-i="${i}" ${l.enabled ? 'checked' : ''} />
        <span class="flex-1 text-sm mono" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" data-sel="${i}">${layerToCss(l)}</span>
        <button class="btn btn-ghost btn-sm bs-del" data-i="${i}" ${layers.length === 1 ? 'disabled' : ''}>×</button>
      </div>
    `,
      )
      .join('');

    layersEl.querySelectorAll('[data-sel]').forEach((el) => {
      el.addEventListener('click', () => {
        selected = +el.dataset.sel;
        syncControls();
        render();
      });
    });
    layersEl.querySelectorAll('.bs-layer-toggle').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        layers[+cb.dataset.i].enabled = cb.checked;
        render();
      });
    });
    layersEl.querySelectorAll('.bs-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        layers.splice(+btn.dataset.i, 1);
        if (selected >= layers.length) selected = layers.length - 1;
        syncControls();
        render();
      });
    });
  }

  function syncControls() {
    const l = layers[selected];
    ctrlOffX.value = l.offsetX;
    document.getElementById('bsVal_offsetX').textContent = l.offsetX + 'px';
    ctrlOffY.value = l.offsetY;
    document.getElementById('bsVal_offsetY').textContent = l.offsetY + 'px';
    ctrlBlur.value = l.blur;
    document.getElementById('bsVal_blur').textContent = l.blur + 'px';
    ctrlSpread.value = l.spread;
    document.getElementById('bsVal_spread').textContent = l.spread + 'px';
    ctrlColor.value = l.color;
    ctrlOpacity.value = l.opacity;
    document.getElementById('bsVal_opacity').textContent = ' ' + l.opacity + '%';
    ctrlInset.checked = l.inset;
  }

  function bindControl(el, prop, valEl, suffix = 'px') {
    el.addEventListener('input', () => {
      const val = prop === 'inset' ? el.checked : prop === 'color' ? el.value : +el.value;
      layers[selected][prop] = val;
      if (valEl)
        document.getElementById(valEl).textContent = (suffix === '%' ? ' ' : '') + val + suffix;
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

  boxColor.addEventListener('input', () => {
    previewBox.style.background = boxColor.value;
  });
  bgColor.addEventListener('input', () => {
    previewBox.parentElement.style.background = bgColor.value;
  });

  copyBtn.addEventListener('click', () => window.copyToClipboard(cssOutput.textContent, copyBtn));

  // Initial render
  syncControls();
  render();
}
