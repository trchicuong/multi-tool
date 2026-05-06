/**
 * Scientific Calculator — keyboard + button, no external deps
 */

// Safe expression evaluator (no eval)
function evalExpr(expr) {
  // Replace math functions and constants
  const safe = expr
    .replace(/\bsin\(/g, 'Math.sin(')
    .replace(/\bcos\(/g, 'Math.cos(')
    .replace(/\btan\(/g, 'Math.tan(')
    .replace(/\basin\(/g, 'Math.asin(')
    .replace(/\bacos\(/g, 'Math.acos(')
    .replace(/\batan\(/g, 'Math.atan(')
    .replace(/\bsqrt\(/g, 'Math.sqrt(')
    .replace(/\bcbrt\(/g, 'Math.cbrt(')
    .replace(/\blog\(/g, 'Math.log10(')
    .replace(/\bln\(/g, 'Math.log(')
    .replace(/\babs\(/g, 'Math.abs(')
    .replace(/\bfloor\(/g, 'Math.floor(')
    .replace(/\bceil\(/g, 'Math.ceil(')
    .replace(/\bround\(/g, 'Math.round(')
    .replace(/\bPI\b/g, 'Math.PI')
    .replace(/\bE\b/g, 'Math.E')
    .replace(/\^/g, '**');

  // Only allow safe characters
  if (/[^0-9+\-*/().,%\s_MathsincotagqrtblPI^*E]/.test(safe)) {
    throw new Error('Invalid expression');
  }

  // Use Function constructor in a limited scope
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${safe})`)();
  if (typeof result !== 'number') throw new Error('Invalid');
  if (!isFinite(result))
    throw new Error(isNaN(result) ? 'NaN' : result > 0 ? 'Infinity' : '-Infinity');
  return result;
}

// Map display → actual token
const MAP = {
  '÷': '/',
  '×': '*',
  '−': '-',
  π: 'PI',
  e: 'E',
  '√(': 'sqrt(',
  'x²': '**2',
  'x³': '**3',
  '1/x': '1/',
};

export function getHtml() {
  // Number buttons — outline only, no fill
  const mkBtn = (val, label, extra = '') => {
    let cls;
    if (val === '=') cls = 'btn btn-primary calc-btn';
    else if (['+', '−', '×', '÷'].includes(val)) cls = 'btn btn-secondary calc-btn';
    else cls = 'btn calc-btn calc-num';
    return `<button class="${cls}" data-val="${val}" style="font-size:13px; padding:10px 4px; min-width:0; ${extra}">${label ?? val}</button>`;
  };

  // Scientific buttons — accent tint with border
  const sciBtn = (val, label) =>
    `<button class="btn calc-btn calc-sci" data-val="${val}" style="font-size:11px; padding:8px 2px; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${label ?? val}</button>`;

  // Constant/bracket buttons — softer tint
  const constBtn = (val, label) =>
    `<button class="btn calc-btn calc-const" data-val="${val}" style="font-size:13px; padding:10px 4px; min-width:0;">${label ?? val}</button>`;

  const row = (btns, gen = mkBtn) =>
    `<div style="display:grid; grid-template-columns:repeat(${btns.length},1fr); gap:5px;">${btns.map(([v, l]) => gen(v, l)).join('')}</div>`;

  return `
    <style>
      .calc-num {
        background: transparent !important;
        border: 1px solid var(--border) !important;
        color: var(--text-1) !important;
      }
      .calc-num:hover {
        background: var(--surface-2) !important;
        border-color: var(--text-3) !important;
      }
      .calc-sci {
        background: var(--accent-bg) !important;
        border: 1px solid var(--accent) !important;
        color: var(--accent) !important;
      }
      .calc-sci:hover {
        background: var(--accent) !important;
        color: #fff !important;
      }
      .calc-const {
        background: var(--surface-2) !important;
        border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border)) !important;
        color: var(--text-1) !important;
      }
      .calc-const:hover {
        background: var(--accent-bg) !important;
        border-color: var(--accent) !important;
        color: var(--accent) !important;
      }
    </style>

    <div class="tool-header">
      <h1>Scientific Calculator</h1>
      <p>Máy tính khoa học hỗ trợ bàn phím. Dùng sin, cos, tan, log, sqrt, ^ và hơn thế nữa.</p>
    </div>

    <div style="display:flex; justify-content:center;">
      <div class="card" style="max-width:420px; width:100%;">
        <!-- Display -->
        <div id="calcHistory" class="text-muted text-sm mono" style="min-height:18px; text-align:right; padding:4px 0 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"></div>
        <input type="text" id="calcDisplay"
          style="width:100%; text-align:right; font-size:26px; font-weight:700; border:none;
                 background:transparent; outline:none; padding:6px 0 10px; font-family:monospace;
                 color:var(--text-1); caret-color:var(--accent);"
          spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <div style="height:1px; background:var(--border); margin-bottom:10px;"></div>

        <!-- Buttons -->
        <div style="display:flex; flex-direction:column; gap:5px;">
          <!-- Scientific row 1: trig -->
          ${row(
            [
              ['sin(', 'sin'],
              ['cos(', 'cos'],
              ['tan(', 'tan'],
              ['ln(', 'ln'],
              ['log(', 'log'],
              ['√(', '√'],
            ],
            sciBtn,
          )}
          <!-- Scientific row 2: inverse / power -->
          ${row(
            [
              ['asin(', 'sin⁻¹'],
              ['acos(', 'cos⁻¹'],
              ['atan(', 'tan⁻¹'],
              ['x²', 'x²'],
              ['x³', 'x³'],
              ['1/x', '1/x'],
            ],
            sciBtn,
          )}
          <!-- Constants + brackets + control -->
          <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:5px;">
            ${constBtn('π', 'π')}${constBtn('e', 'e')}${constBtn('(', '(')}${constBtn(')', ')')}
            <button class="btn btn-danger calc-btn" data-val="⌫" style="font-size:13px; padding:10px 4px; min-width:0;">⌫</button>
            <button class="btn btn-danger calc-btn" data-val="C" style="font-size:13px; padding:10px 4px; min-width:0;">C</button>
          </div>
          <div style="height:1px; background:var(--border);"></div>
          <!-- Main numpad -->
          <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:5px;">
            ${mkBtn('7')}${mkBtn('8')}${mkBtn('9')}${mkBtn('÷')}
            ${mkBtn('4')}${mkBtn('5')}${mkBtn('6')}${mkBtn('×')}
            ${mkBtn('1')}${mkBtn('2')}${mkBtn('3')}${mkBtn('−')}
            <button class="btn calc-btn calc-num" data-val="0" style="font-size:13px; padding:10px 4px; grid-column:span 2; min-width:0;">0</button>
            ${mkBtn('.')}
            ${mkBtn('+')}
          </div>
          <!-- Equal + sign -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
            ${mkBtn('±', '±')}
            ${mkBtn('=', '=', 'font-size:18px; font-weight:700;')}
          </div>
        </div>

        <p class="text-muted text-sm mt-2" style="text-align:center;">
          Keyboard supported · <code>^</code> power · <code>%</code> modulo
        </p>
      </div>
    </div>
  `;
}

export function init() {
  const display = document.getElementById('calcDisplay');
  const history = document.getElementById('calcHistory');
  let expr = '';
  let justEvaled = false;

  const setDisplay = (val) => {
    expr = val;
    display.value = val;
  };

  const appendToken = (token) => {
    if (justEvaled && /^[0-9.(]/.test(token)) {
      expr = '';
    }
    justEvaled = false;
    expr += token;
    display.value = expr;
  };

  const handleBtn = (val) => {
    if (val === 'C') {
      setDisplay('');
      history.textContent = '';
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
      // Negate last number
      const match = expr.match(/^(.*?)(-?\d+\.?\d*)$/);
      if (match) {
        const num = match[2];
        setDisplay(match[1] + (num.startsWith('-') ? num.slice(1) : '-' + num));
      }
      return;
    }

    const token = MAP[val] ?? val;

    // x² / x³ / 1/x — wrap current expression
    if (val === 'x²') {
      setDisplay('(' + (expr || '0') + ')**2');
      return;
    }
    if (val === 'x³') {
      setDisplay('(' + (expr || '0') + ')**3');
      return;
    }
    if (val === '1/x') {
      setDisplay('1/(' + (expr || '1') + ')');
      return;
    }

    appendToken(token);
  };

  const calculate = () => {
    if (!expr.trim()) return;
    try {
      const result = evalExpr(expr);
      const rounded = parseFloat(result.toPrecision(12));
      history.textContent = expr + ' =';
      setDisplay(String(rounded));
      justEvaled = true;
    } catch (e) {
      history.textContent = expr;
      display.value = e.message;
      setTimeout(() => {
        display.value = expr;
      }, 1600);
    }
  };

  // Button clicks
  document.querySelectorAll('.calc-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleBtn(btn.dataset.val));
  });

  // Keyboard
  display.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      calculate();
    } else if (e.key === 'Escape') {
      setDisplay('');
      history.textContent = '';
    }
    // Allow normal typing into the display
  });

  display.addEventListener('input', () => {
    expr = display.value;
  });

  display.focus();
}
