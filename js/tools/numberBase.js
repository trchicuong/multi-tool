/**
 * Number Base Converter — BigInt precision (supports 64-bit / 128-bit+), copy buttons & bit grid
 */

function parseBigIntBase(str, base) {
  let clean = str.trim().replace(/[\s_]/g, '').toLowerCase();
  if (!clean) return null;
  let neg = false;
  if (clean.startsWith('-')) {
    neg = true;
    clean = clean.slice(1);
  } else if (clean.startsWith('+')) {
    clean = clean.slice(1);
  }
  if (!clean) throw new Error('Chuỗi số trống');

  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  const validChars = digits.slice(0, base);
  for (const ch of clean) {
    if (!validChars.includes(ch)) {
      throw new Error(`Ký tự "${ch.toUpperCase()}" không hợp lệ ở cơ số ${base}`);
    }
  }

  let acc = 0n;
  const b = BigInt(base);
  for (const ch of clean) {
    acc = acc * b + BigInt(digits.indexOf(ch));
  }
  return neg ? -acc : acc;
}

export function getHtml() {
  const fields = [
    { id: 'nbDec', label: 'Decimal (Base 10)', placeholder: '255' },
    { id: 'nbBin', label: 'Binary (Base 2)', placeholder: '11111111' },
    { id: 'nbOct', label: 'Octal (Base 8)', placeholder: '377' },
    { id: 'nbHex', label: 'Hexadecimal (Base 16)', placeholder: 'FF' },
  ];

  return `
    <div class="tool-header">
      <h1>Number Base Converter</h1>
      <p>Chuyển đổi số nguyên chính xác (hỗ trợ số lớn BigInt 64/128-bit) giữa các hệ cơ số 2–36.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Các hệ cơ số phổ biến</span>
        <button type="button" class="btn btn-ghost btn-sm" id="nbClear">Xóa tất cả</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
        ${fields
          .map(
            (f) => `
          <div>
            <label class="field-label" for="${f.id}">${f.label}</label>
            <div class="d-flex align-center gap-1">
              <input type="text" id="${f.id}" class="mono flex-1" placeholder="${f.placeholder}" autocomplete="off" spellcheck="false" />
              <button type="button" class="copy-btn nb-copy" data-target="${f.id}" style="min-height:38px;">Copy</button>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
      <div id="nbError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>

    <!-- Bit visualization -->
    <div class="card" id="nbBitCard" style="display:none;">
      <div class="card-header">
        <span class="field-label">Bit Visualization (8-bit groups)</span>
        <span id="nbBitWidth" class="badge badge-blue"></span>
      </div>
      <div id="nbBits" style="font-family:var(--font-mono); font-size:12.5px; display:flex; flex-wrap:wrap; gap:6px;"></div>
    </div>

    <!-- Custom base -->
    <div class="card">
      <div class="card-header">
        <span class="field-label">Custom Base (Base 2 → Base 36)</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; align-items:end;">
        <div>
          <label class="field-label" for="nbFromBase">From Base</label>
          <input type="number" id="nbFromBase" value="10" min="2" max="36" />
        </div>
        <div>
          <label class="field-label" for="nbToBase">To Base</label>
          <input type="number" id="nbToBase" value="36" min="2" max="36" />
        </div>
        <div>
          <label class="field-label" for="nbCustomIn">Input</label>
          <input type="text" id="nbCustomIn" class="mono" placeholder="255" spellcheck="false" />
        </div>
        <div>
          <label class="field-label" for="nbCustomOut">Output</label>
          <div class="d-flex align-center gap-1">
            <input type="text" id="nbCustomOut" class="mono flex-1" readonly placeholder="73" style="background:var(--code-bg);" />
            <button type="button" class="copy-btn" id="nbCustomCopy" style="min-height:38px;">Copy</button>
          </div>
        </div>
      </div>
      <div id="nbCustomError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>
  `;
}

export function init() {
  const dec = document.getElementById('nbDec');
  const bin = document.getElementById('nbBin');
  const oct = document.getElementById('nbOct');
  const hex = document.getElementById('nbHex');
  const errEl = document.getElementById('nbError');
  const bitCard = document.getElementById('nbBitCard');
  const bitWidthEl = document.getElementById('nbBitWidth');
  const bitsEl = document.getElementById('nbBits');
  const clearBtn = document.getElementById('nbClear');

  const fromBase = document.getElementById('nbFromBase');
  const toBase = document.getElementById('nbToBase');
  const customIn = document.getElementById('nbCustomIn');
  const customOut = document.getElementById('nbCustomOut');
  const customErr = document.getElementById('nbCustomError');
  const customCopy = document.getElementById('nbCustomCopy');

  const updateBits = (n) => {
    if (n === null || n < 0n) {
      bitCard.style.display = 'none';
      return;
    }
    const rawBin = n.toString(2);
    if (rawBin.length > 128) {
      bitWidthEl.textContent = `${rawBin.length} bits`;
      bitsEl.innerHTML = `<span class="text-sm text-muted">Số quá lớn (${rawBin.length} bits) — thu gọn hiển thị bit.</span>`;
      bitCard.style.display = '';
      return;
    }

    const paddedLen = Math.max(8, Math.ceil(rawBin.length / 8) * 8);
    const padded = rawBin.padStart(paddedLen, '0');
    const chunks = padded.match(/.{1,8}/g) || [];
    bitWidthEl.textContent = `${paddedLen} bits`;
    bitsEl.innerHTML = chunks
      .map((chunk, ci) => {
        const byteOffset = (chunks.length - 1 - ci) * 8;
        const cells = chunk
          .split('')
          .map(
            (b) =>
              `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:3px;background:${b === '1' ? 'var(--accent)' : 'var(--surface-2)'};color:${b === '1' ? '#fff' : 'var(--text-3)'};font-size:12px;">${b}</span>`,
          )
          .join('');
        return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px;border:1px solid var(--border);border-radius:var(--radius);padding:4px;background:var(--surface);">
          <div style="display:flex;gap:2px;">${cells}</div>
          <span class="text-muted" style="font-size:10px;">bit ${byteOffset + 7}..${byteOffset}</span>
        </div>`;
      })
      .join('');
    bitCard.style.display = '';
  };

  const clearAll = () => {
    dec.value = bin.value = oct.value = hex.value = '';
    errEl.textContent = '';
    bitCard.style.display = 'none';
  };

  const setAll = (n, source) => {
    errEl.textContent = '';
    if (source !== dec) dec.value = n.toString(10);
    if (source !== bin) bin.value = n.toString(2);
    if (source !== oct) oct.value = n.toString(8);
    if (source !== hex) hex.value = n.toString(16).toUpperCase();
    updateBits(n);
  };

  const bindBase = (el, base) => {
    el.addEventListener('input', () => {
      const val = el.value.trim();
      if (!val) {
        clearAll();
        return;
      }
      try {
        const n = parseBigIntBase(val, base);
        setAll(n, el);
      } catch (e) {
        errEl.textContent = e.message;
      }
    });
  };

  bindBase(dec, 10);
  bindBase(bin, 2);
  bindBase(oct, 8);
  bindBase(hex, 16);

  document.querySelectorAll('.nb-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target?.value) window.copyToClipboard(target.value, btn);
    });
  });

  clearBtn.addEventListener('click', clearAll);

  const runCustom = () => {
    customErr.textContent = '';
    const inp = customIn.value.trim();
    const from = Number(fromBase.value);
    const to = Number(toBase.value);
    if (!inp) {
      customOut.value = '';
      return;
    }
    if (!Number.isInteger(from) || from < 2 || from > 36) {
      customErr.textContent = 'From base phải từ 2 đến 36';
      return;
    }
    if (!Number.isInteger(to) || to < 2 || to > 36) {
      customErr.textContent = 'To base phải từ 2 đến 36';
      return;
    }
    try {
      const n = parseBigIntBase(inp, from);
      customOut.value = n.toString(to).toUpperCase();
    } catch (e) {
      customErr.textContent = e.message;
      customOut.value = '';
    }
  };

  [customIn, fromBase, toBase].forEach((el) => el.addEventListener('input', runCustom));
  customCopy.addEventListener('click', () => {
    if (customOut.value) window.copyToClipboard(customOut.value, customCopy);
  });
}
