/**
 * CSS Unit Converter — px, rem, em, vw, vh, pt, cm, mm with live base recalculation
 */

const UNITS = ['px', 'rem', 'em', 'vw', 'vh', 'pt', 'cm', 'mm'];

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>CSS Unit Converter</h1>
      <p>Chuyển đổi tức thì giữa các đơn vị CSS (px, rem, em, vw, vh, pt, cm, mm) theo kích thước gốc tùy chỉnh.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Tham số chuẩn (Base &amp; Viewport)</span>
        <button type="button" class="btn btn-ghost btn-sm" id="cuResetCfg">Mặc định (16px · 1440×900)</button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px;">
        <div>
          <label class="field-label" for="cuBase">Base Font Size (px)</label>
          <input type="number" id="cuBase" value="16" min="1" max="100" />
        </div>
        <div>
          <label class="field-label" for="cuVw">Viewport Width (px)</label>
          <input type="number" id="cuVw" value="1440" min="1" />
        </div>
        <div>
          <label class="field-label" for="cuVh">Viewport Height (px)</label>
          <input type="number" id="cuVh" value="900" min="1" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Nhập giá trị vào bất kỳ đơn vị nào</span>
      </div>
      <div id="cuGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr)); gap:12px;"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label" id="cuTableLabel">Bảng quy đổi nhanh</span>
      </div>
      <div class="table-wrap">
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
  const tableLabel = document.getElementById('cuTableLabel');
  const resetCfgBtn = document.getElementById('cuResetCfg');

  grid.innerHTML = UNITS.map(
    (u) => `
    <div>
      <label class="field-label" for="cu_${u}">${u}</label>
      <div class="d-flex align-center gap-1">
        <input type="number" id="cu_${u}" class="mono flex-1" placeholder="0" step="any" />
        <button type="button" class="copy-btn cu-copy" data-unit="${u}" style="min-height:38px;">Copy</button>
      </div>
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
    if (Math.abs(n) < 0.0001) return '0';
    return parseFloat(n.toFixed(4)).toString();
  };

  let busy = false;
  let lastSourceUnit = 'px';

  const updateFrom = (sourceUnit) => {
    if (busy) return;
    lastSourceUnit = sourceUnit;
    const el = document.getElementById(`cu_${sourceUnit}`);
    const val = parseFloat(el.value);
    if (Number.isNaN(val)) return;
    busy = true;
    const px = toPx(val, sourceUnit);
    UNITS.forEach((u) => {
      if (u === sourceUnit) return;
      document.getElementById(`cu_${u}`).value = fmt(fromPx(px, u));
    });
    busy = false;
  };

  UNITS.forEach((u) => {
    document.getElementById(`cu_${u}`).addEventListener('input', () => updateFrom(u));
  });

  grid.querySelectorAll('.cu-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = btn.dataset.unit;
      const val = document.getElementById(`cu_${u}`)?.value;
      if (val !== '') window.copyToClipboard(`${val}${u}`, btn);
    });
  });

  const updateTable = () => {
    const base = parseFloat(baseInput.value) || 16;
    const vw = parseFloat(vwInput.value) || 1440;
    const vh = parseFloat(vhInput.value) || 900;
    tableLabel.textContent = `Bảng quy đổi nhanh (base ${base}px, viewport ${vw}×${vh})`;
    const rows = [1, 2, 4, 8, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 80, 96];
    tableBody.innerHTML = rows
      .map((px) => `<tr>${UNITS.map((u) => `<td class="mono">${fmt(fromPx(px, u))}</td>`).join('')}</tr>`)
      .join('');
  };

  const onConfigChange = () => {
    updateFrom(lastSourceUnit);
    updateTable();
  };

  [baseInput, vwInput, vhInput].forEach((el) => el.addEventListener('input', onConfigChange));

  resetCfgBtn.addEventListener('click', () => {
    baseInput.value = '16';
    vwInput.value = '1440';
    vhInput.value = '900';
    onConfigChange();
  });

  document.getElementById('cu_px').value = '16';
  updateFrom('px');
  updateTable();
}
