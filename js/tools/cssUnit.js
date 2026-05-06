/**
 * CSS Unit Converter — px, rem, em, vw, vh, pt, cm, mm
 */

const UNITS = ['px', 'rem', 'em', 'vw', 'vh', 'pt', 'cm', 'mm'];

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>CSS Unit Converter</h1>
      <p>Chuyển đổi giữa các đơn vị CSS: px, rem, em, vw, vh, pt, cm, mm.</p>
    </div>

    <div class="card">
      <div class="row" style="flex-wrap:wrap; gap:12px; align-items:flex-end;">
        <div style="flex:0 0 120px;">
          <label class="field-label">Base Font Size</label>
          <div class="d-flex align-center gap-1">
            <input type="number" id="cuBase" value="16" min="1" max="100" style="width:70px;" />
            <span class="text-muted text-sm">px</span>
          </div>
        </div>
        <div style="flex:0 0 120px;">
          <label class="field-label">Viewport Width</label>
          <div class="d-flex align-center gap-1">
            <input type="number" id="cuVw" value="1440" min="1" style="width:80px;" />
            <span class="text-muted text-sm">px</span>
          </div>
        </div>
        <div style="flex:0 0 120px;">
          <label class="field-label">Viewport Height</label>
          <div class="d-flex align-center gap-1">
            <input type="number" id="cuVh" value="900" min="1" style="width:80px;" />
            <span class="text-muted text-sm">px</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-2">
      <div class="field-label">Nhập giá trị vào bất kỳ ô nào</div>
      <div id="cuGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:10px; margin-top:12px;"></div>
    </div>

    <!-- Reference table -->
    <div class="card mt-2">
      <div class="field-label">Bảng quy đổi nhanh (base 16px, viewport 1440×900)</div>
      <div class="table-wrap mt-1">
        <table id="cuTable">
          <thead>
            <tr>
              <th>px</th><th>rem</th><th>em</th><th>vw</th><th>vh</th><th>pt</th><th>cm</th><th>mm</th>
            </tr>
          </thead>
          <tbody id="cuTableBody"></tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  const baseInput = document.getElementById('cuBase');
  const vwInput = document.getElementById('cuVw');
  const vhInput = document.getElementById('cuVh');
  const grid = document.getElementById('cuGrid');
  const tableBody = document.getElementById('cuTableBody');

  // Build inputs
  grid.innerHTML = UNITS.map(
    (u) => `
    <div>
      <label class="field-label">${u}</label>
      <input type="number" id="cu_${u}" class="mono" placeholder="0" step="any" />
    </div>
  `,
  ).join('');

  const toPx = (val, unit) => {
    const base = parseFloat(baseInput.value) || 16;
    const vw = parseFloat(vwInput.value) || 1440;
    const vh = parseFloat(vhInput.value) || 900;
    switch (unit) {
      case 'px':
        return val;
      case 'rem':
        return val * base;
      case 'em':
        return val * base;
      case 'vw':
        return (val * vw) / 100;
      case 'vh':
        return (val * vh) / 100;
      case 'pt':
        return val * (96 / 72);
      case 'cm':
        return val * 37.7952755906;
      case 'mm':
        return val * 3.77952755906;
      default:
        return val;
    }
  };

  const fromPx = (px, unit) => {
    const base = parseFloat(baseInput.value) || 16;
    const vw = parseFloat(vwInput.value) || 1440;
    const vh = parseFloat(vhInput.value) || 900;
    switch (unit) {
      case 'px':
        return px;
      case 'rem':
        return px / base;
      case 'em':
        return px / base;
      case 'vw':
        return (px / vw) * 100;
      case 'vh':
        return (px / vh) * 100;
      case 'pt':
        return px / (96 / 72);
      case 'cm':
        return px / 37.7952755906;
      case 'mm':
        return px / 3.77952755906;
      default:
        return px;
    }
  };

  const fmt = (n) => {
    if (Math.abs(n) < 0.001) return '0';
    const s = parseFloat(n.toFixed(6)).toString();
    return s;
  };

  let busy = false;
  const updateFrom = (sourceUnit) => {
    if (busy) return;
    const el = document.getElementById(`cu_${sourceUnit}`);
    const val = parseFloat(el.value);
    if (isNaN(val)) return;
    busy = true;
    const px = toPx(val, sourceUnit);
    UNITS.forEach((u) => {
      if (u === sourceUnit) return;
      const target = document.getElementById(`cu_${u}`);
      target.value = fmt(fromPx(px, u));
    });
    busy = false;
  };

  UNITS.forEach((u) => {
    const el = document.getElementById(`cu_${u}`);
    el.addEventListener('input', () => updateFrom(u));
  });

  const updateTable = () => {
    const rows = [1, 2, 4, 8, 10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 80, 96];
    tableBody.innerHTML = rows
      .map(
        (px) => `
      <tr>${UNITS.map((u) => `<td class="mono">${fmt(fromPx(px, u))}</td>`).join('')}</tr>
    `,
      )
      .join('');
  };

  [baseInput, vwInput, vhInput].forEach((el) => {
    el.addEventListener('input', () => {
      // Re-trigger last active input
      updateTable();
    });
  });

  // Default: set px = 16
  document.getElementById('cu_px').value = 16;
  updateFrom('px');
  updateTable();
}
