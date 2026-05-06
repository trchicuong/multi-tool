/**
 * Number Base Converter — decimal, binary, octal, hex
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Number Base Converter</h1>
      <p>Chuyển đổi số giữa các hệ cơ số: Decimal, Binary, Octal, Hexadecimal.</p>
    </div>

    <div class="card">
      <div class="row">
        <div class="flex-1">
          <label class="field-label">Decimal (Base 10)</label>
          <input type="text" id="nbDec" class="mono" placeholder="255" autocomplete="off" spellcheck="false" />
        </div>
        <div class="flex-1">
          <label class="field-label">Binary (Base 2)</label>
          <input type="text" id="nbBin" class="mono" placeholder="11111111" autocomplete="off" spellcheck="false" />
        </div>
      </div>
      <div class="row mt-2">
        <div class="flex-1">
          <label class="field-label">Octal (Base 8)</label>
          <input type="text" id="nbOct" class="mono" placeholder="377" autocomplete="off" spellcheck="false" />
        </div>
        <div class="flex-1">
          <label class="field-label">Hexadecimal (Base 16)</label>
          <input type="text" id="nbHex" class="mono" placeholder="FF" autocomplete="off" spellcheck="false" />
        </div>
      </div>
      <div id="nbError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
      <div class="btn-group">
        <button class="btn btn-ghost btn-sm" id="nbClear">Xóa tất cả</button>
      </div>
    </div>

    <!-- Bit visualization -->
    <div class="card mt-2" id="nbBitCard" style="display:none;">
      <div class="field-label">Bit Visualization</div>
      <div id="nbBits" style="margin-top:8px; font-family:var(--font-mono); font-size:13px; display:flex; flex-wrap:wrap; gap:4px;"></div>
    </div>

    <!-- Custom base -->
    <div class="card mt-2">
      <div class="field-label">Custom Base</div>
      <div class="row mt-1">
        <div style="flex:0 0 80px;">
          <label class="field-label">From Base</label>
          <input type="number" id="nbFromBase" value="10" min="2" max="36" />
        </div>
        <div style="flex:0 0 80px;">
          <label class="field-label">To Base</label>
          <input type="number" id="nbToBase" value="16" min="2" max="36" />
        </div>
        <div class="flex-1">
          <label class="field-label">Input</label>
          <input type="text" id="nbCustomIn" class="mono" placeholder="255" spellcheck="false" />
        </div>
        <div class="flex-1" style="position:relative;">
          <label class="field-label">Output</label>
          <div class="output-box" style="margin-top:0;">
            <pre id="nbCustomOut" style="margin:0; padding:8px 12px; min-height:38px;"></pre>
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
  const bitsEl = document.getElementById('nbBits');
  const clearBtn = document.getElementById('nbClear');

  const fromBase = document.getElementById('nbFromBase');
  const toBase = document.getElementById('nbToBase');
  const customIn = document.getElementById('nbCustomIn');
  const customOut = document.getElementById('nbCustomOut');
  const customErr = document.getElementById('nbCustomError');

  const updateBits = (n) => {
    if (isNaN(n) || n < 0) {
      bitCard.style.display = 'none';
      return;
    }
    const bits = n.toString(2).padStart(Math.max(8, Math.ceil(n.toString(2).length / 8) * 8), '0');
    const chunks = bits.match(/.{1,8}/g) || [];
    bitsEl.innerHTML = chunks
      .map((chunk, i) => {
        const byte = parseInt(chunk, 2);
        const bits = chunk
          .split('')
          .map(
            (b, bi) =>
              `<span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:3px;margin:1px;background:${b === '1' ? 'var(--accent)' : 'var(--surface-2)'};color:${b === '1' ? '#fff' : 'var(--text-3)'};font-size:12px;">${b}</span>`,
          )
          .join('');
        return `<div style="display:inline-flex;gap:1px;border:1px solid var(--border);border-radius:4px;padding:3px;margin:2px;">${bits}</div>`;
      })
      .join('');
    bitCard.style.display = '';
  };

  const setAll = (n, source) => {
    errEl.textContent = '';
    if (isNaN(n) || !isFinite(n)) {
      errEl.textContent = 'Giá trị không hợp lệ';
      return;
    }
    if (source !== dec) dec.value = n.toString(10);
    if (source !== bin) bin.value = n.toString(2);
    if (source !== oct) oct.value = n.toString(8);
    if (source !== hex) hex.value = n.toString(16).toUpperCase();
    updateBits(n);
  };

  dec.addEventListener('input', () => {
    const v = parseInt(dec.value.trim(), 10);
    if (dec.value.trim() === '') {
      bin.value = oct.value = hex.value = '';
      bitCard.style.display = 'none';
      errEl.textContent = '';
      return;
    }
    setAll(v, dec);
  });

  bin.addEventListener('input', () => {
    const v = parseInt(bin.value.trim(), 2);
    if (bin.value.trim() === '') {
      dec.value = oct.value = hex.value = '';
      bitCard.style.display = 'none';
      errEl.textContent = '';
      return;
    }
    if (/[^01]/.test(bin.value.trim())) {
      errEl.textContent = 'Binary chỉ chứa 0 và 1';
      return;
    }
    setAll(v, bin);
  });

  oct.addEventListener('input', () => {
    const v = parseInt(oct.value.trim(), 8);
    if (oct.value.trim() === '') {
      dec.value = bin.value = hex.value = '';
      bitCard.style.display = 'none';
      errEl.textContent = '';
      return;
    }
    if (/[^0-7]/.test(oct.value.trim())) {
      errEl.textContent = 'Octal chỉ chứa 0-7';
      return;
    }
    setAll(v, oct);
  });

  hex.addEventListener('input', () => {
    const v = parseInt(hex.value.trim(), 16);
    if (hex.value.trim() === '') {
      dec.value = bin.value = oct.value = '';
      bitCard.style.display = 'none';
      errEl.textContent = '';
      return;
    }
    if (/[^0-9a-fA-F]/.test(hex.value.trim())) {
      errEl.textContent = 'Hex chỉ chứa 0-9, A-F';
      return;
    }
    setAll(v, hex);
  });

  clearBtn.addEventListener('click', () => {
    dec.value = bin.value = oct.value = hex.value = '';
    errEl.textContent = '';
    bitCard.style.display = 'none';
  });

  // Custom base
  const runCustom = () => {
    customErr.textContent = '';
    const inp = customIn.value.trim().toUpperCase();
    const from = parseInt(fromBase.value);
    const to = parseInt(toBase.value);
    if (!inp) {
      customOut.textContent = '';
      return;
    }
    if (isNaN(from) || from < 2 || from > 36) {
      customErr.textContent = 'From base phải từ 2-36';
      return;
    }
    if (isNaN(to) || to < 2 || to > 36) {
      customErr.textContent = 'To base phải từ 2-36';
      return;
    }
    try {
      const n = parseInt(inp, from);
      if (isNaN(n)) {
        customErr.textContent = `"${inp}" không hợp lệ ở base ${from}`;
        customOut.textContent = '';
        return;
      }
      customOut.textContent = n.toString(to).toUpperCase();
    } catch (e) {
      customErr.textContent = e.message;
    }
  };

  [customIn, fromBase, toBase].forEach((el) => el.addEventListener('input', runCustom));
}
