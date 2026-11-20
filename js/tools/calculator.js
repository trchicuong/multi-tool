/**
 * Scientific Calculator — DEG/RAD toggle, keyboard support & clickable calculation history
 */

function evalExpr(expr, isDeg) {
  const toRad = (x) => (isDeg ? (x * Math.PI) / 180 : x);
  const fromRad = (x) => (isDeg ? (x * 180) / Math.PI : x);

  const scope = {
    sin: (x) => Math.sin(toRad(x)),
    cos: (x) => Math.cos(toRad(x)),
    tan: (x) => Math.tan(toRad(x)),
    asin: (x) => fromRad(Math.asin(x)),
    acos: (x) => fromRad(Math.acos(x)),
    atan: (x) => fromRad(Math.atan(x)),
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    log: Math.log10,
    ln: Math.log,
    abs: Math.abs,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    PI: Math.PI,
    E: Math.E,
  };

  const safe = expr.replace(/\^/g, '**');
  if (/[^0-9+\-*/().,%\sA-Za-z_*]/.test(safe)) {
    throw new Error('Invalid characters');
  }

  const fn = new Function(...Object.keys(scope), `"use strict"; return (${safe});`);
  const result = fn(...Object.values(scope));
  if (typeof result !== 'number') throw new Error('Invalid');
  if (!Number.isFinite(result)) {
    throw new Error(Number.isNaN(result) ? 'NaN' : result > 0 ? 'Infinity' : '-Infinity');
  }
  return result;
}

const MAP = {
  '÷': '/',
  '×': '*',
  '−': '-',
  π: 'PI',
  e: 'E',
  '√(': 'sqrt(',
};

export function getHtml() {
  const mkBtn = (val, label, extra = '') => {
    let cls;
    if (val === '=') cls = 'btn btn-primary calc-btn';
    else if (['+', '−', '×', '÷'].includes(val)) cls = 'btn btn-secondary calc-btn';
    else cls = 'btn calc-btn calc-num';
    return `<button type="button" class="${cls}" data-val="${val}" style="font-size:13.5px; min-width:0; ${extra}">${label ?? val}</button>`;
  };

  const sciBtn = (val, label) =>
    `<button type="button" class="btn calc-btn calc-sci" data-val="${val}" style="font-size:12px; min-height:34px; padding:4px 2px; min-width:0;">${label ?? val}</button>`;

  const constBtn = (val, label) =>
    `<button type="button" class="btn calc-btn calc-const" data-val="${val}" style="font-size:13px; min-height:34px; padding:4px 2px; min-width:0;">${label ?? val}</button>`;

  const row = (btns, gen = mkBtn) =>
    `<div style="display:grid; grid-template-columns:repeat(${btns.length},1fr); gap:6px;">${btns.map(([v, l]) => gen(v, l)).join('')}</div>`;

  return `
    <style>
      .calc-num { background:var(--surface) !important; border:1px solid var(--border) !important; color:var(--text-1) !important; }
      .calc-num:hover { background:var(--surface-2) !important; border-color:var(--text-3) !important; }
      .calc-sci { background:var(--accent-bg) !important; border:1px solid color-mix(in srgb, var(--accent) 40%, var(--border)) !important; color:var(--accent) !important; }
      .calc-sci:hover { background:var(--accent) !important; color:#fff !important; }
      .calc-const { background:var(--surface-2) !important; border:1px solid var(--border) !important; color:var(--text-1) !important; }
      .calc-const:hover { border-color:var(--accent) !important; color:var(--accent) !important; }
      .calc-hist-item { display:flex; justify-content:space-between; gap:8px; padding:6px 8px; border-radius:var(--radius-sm); cursor:pointer; font-family:var(--font-mono); font-size:12px; }
      .calc-hist-item:hover { background:var(--surface-2); }
    </style>

    <div class="tool-header">
      <h1>Scientific Calculator</h1>
      <p>Máy tính khoa học hỗ trợ DEG/RAD, phím tắt bàn phím và lịch sử phép tính.</p>
    </div>

    <div class="split-editor" style="align-items:start;">
      <div class="card" style="margin-bottom:0;">
        <div class="card-header" style="margin-bottom:8px;">
          <div class="seg-group">
            <button type="button" class="btn calc-angle active" data-mode="deg">DEG</button>
            <button type="button" class="btn calc-angle" data-mode="rad">RAD</button>
          </div>
          <button type="button" class="copy-btn" id="calcCopyBtn">Copy</button>
        </div>

        <div id="calcHistory" class="text-muted text-sm mono" style="min-height:18px; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"></div>
        <input
          type="text"
          id="calcDisplay"
          style="width:100%; text-align:right; font-size:26px; font-weight:700; border:none; background:transparent; outline:none; padding:6px 0 10px; font-family:var(--font-mono); color:var(--text-1);"
          spellcheck="false"
          autocomplete="off"
          aria-label="Màn hình máy tính"
        />
        <div style="height:1px; background:var(--border); margin-bottom:12px;"></div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          ${row([['sin(', 'sin'], ['cos(', 'cos'], ['tan(', 'tan'], ['ln(', 'ln'], ['log(', 'log'], ['√(', '√']], sciBtn)}
          ${row([['asin(', 'sin⁻¹'], ['acos(', 'cos⁻¹'], ['atan(', 'tan⁻¹'], ['x²', 'x²'], ['x³', 'x³'], ['1/x', '1/x']], sciBtn)}
          <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:6px;">
            ${constBtn('π', 'π')}${constBtn('e', 'e')}${constBtn('(', '(')}${constBtn(')', ')')}
            <button type="button" class="btn btn-danger calc-btn" data-val="⌫" style="min-height:34px; padding:4px; min-width:0;">⌫</button>
            <button type="button" class="btn btn-danger calc-btn" data-val="C" style="min-height:34px; padding:4px; min-width:0;">C</button>
          </div>
          <div style="height:1px; background:var(--border); margin:2px 0;"></div>
          <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:6px;">
            ${mkBtn('7')}${mkBtn('8')}${mkBtn('9')}${mkBtn('÷')}
            ${mkBtn('4')}${mkBtn('5')}${mkBtn('6')}${mkBtn('×')}
            ${mkBtn('1')}${mkBtn('2')}${mkBtn('3')}${mkBtn('−')}
            <button type="button" class="btn calc-btn calc-num" data-val="0" style="grid-column:span 2; min-width:0;">0</button>
            ${mkBtn('.')}${mkBtn('+')}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            ${mkBtn('±', '±')}${mkBtn('=', '=', 'font-size:17px; font-weight:700;')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <span class="field-label">Lịch sử phép tính (Click để nạp lại)</span>
          <button type="button" class="btn btn-ghost btn-sm" id="calcClearHist">Xóa</button>
        </div>
        <div id="calcHistList" style="display:flex; flex-direction:column; gap:4px; max-height:360px; overflow:auto;">
          <span class="text-sm text-muted">Chưa có phép tính nào.</span>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const display = document.getElementById('calcDisplay');
  const historyEl = document.getElementById('calcHistory');
  const histListEl = document.getElementById('calcHistList');
  const copyBtn = document.getElementById('calcCopyBtn');
  const clearHistBtn = document.getElementById('calcClearHist');

  let expr = '';
  let justEvaled = false;
  let isDeg = true;
  const histItems = [];

  document.querySelectorAll('.calc-angle').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.calc-angle').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      isDeg = btn.dataset.mode === 'deg';
    });
  });

  const renderHist = () => {
    if (!histItems.length) {
      histListEl.innerHTML = '<span class="text-sm text-muted">Chưa có phép tính nào.</span>';
      return;
    }
    histListEl.innerHTML = histItems
      .map(
        (h, i) => `
      <div class="calc-hist-item" data-idx="${i}">
        <span class="text-muted" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${h.expr}</span>
        <strong class="text-accent">${h.result}</strong>
      </div>
    `,
      )
      .join('');
    histListEl.querySelectorAll('.calc-hist-item').forEach((row) => {
      row.addEventListener('click', () => {
        const item = histItems[Number(row.dataset.idx)];
        if (!item) return;
        setDisplay(item.expr);
        justEvaled = false;
        display.focus();
      });
    });
  };

  const setDisplay = (val) => {
    expr = val;
    display.value = val;
  };

  const appendToken = (token) => {
    if (justEvaled && /^[0-9.(]/.test(token)) expr = '';
    justEvaled = false;
    expr += token;
    display.value = expr;
  };

  const calculate = () => {
    if (!expr.trim()) return;
    try {
      const result = evalExpr(expr, isDeg);
      const rounded = String(parseFloat(result.toPrecision(12)));
      historyEl.textContent = `${expr} =`;
      histItems.unshift({ expr, result: rounded });
      if (histItems.length > 25) histItems.pop();
      renderHist();
      setDisplay(rounded);
      justEvaled = true;
    } catch (e) {
      historyEl.textContent = expr;
      display.value = e.message;
      setTimeout(() => {
        display.value = expr;
      }, 1400);
    }
  };

  const handleBtn = (val) => {
    if (val === 'C') {
      setDisplay('');
      historyEl.textContent = '';
      justEvaled = false;
      return;
    }
    if (val === '⌫') {
      setDisplay(expr.slice(0, -1));
      return;
    }
    if (val === '=') {
      calculate();
      return;
    }
    if (val === '±') {
      const match = expr.match(/^(.*?)(-?\d+\.?\d*)$/);
      if (match) {
        const num = match[2];
        setDisplay(match[1] + (num.startsWith('-') ? num.slice(1) : '-' + num));
      }
      return;
    }
    if (val === 'x²') {
      setDisplay(`(${expr || '0'})^2`);
      return;
    }
    if (val === 'x³') {
      setDisplay(`(${expr || '0'})^3`);
      return;
    }
    if (val === '1/x') {
      setDisplay(`1/(${expr || '1'})`);
      return;
    }
    appendToken(MAP[val] ?? val);
  };

  document.querySelectorAll('.calc-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleBtn(btn.dataset.val));
  });

  display.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      calculate();
    } else if (e.key === 'Escape') {
      setDisplay('');
      historyEl.textContent = '';
    }
  });

  display.addEventListener('input', () => {
    expr = display.value;
    justEvaled = false;
  });

  copyBtn.addEventListener('click', () => {
    if (display.value.trim()) window.copyToClipboard(display.value.trim(), copyBtn);
  });

  clearHistBtn.addEventListener('click', () => {
    histItems.length = 0;
    renderHist();
  });

  display.focus();
}
