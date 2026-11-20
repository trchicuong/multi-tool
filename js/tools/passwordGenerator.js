/**
 * Password Generator — live slider regeneration, quick length presets, refresh button & entropy meter
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Password Generator</h1>
      <p>Tạo mật khẩu ngẫu nhiên an toàn bằng Web Crypto API với đánh giá độ mạnh theo entropy.</p>
    </div>

    <div class="card">
      <div class="d-flex align-center gap-2">
        <input
          type="text"
          id="pwOutput"
          class="mono flex-1"
          readonly
          style="font-size:17px; font-weight:600; letter-spacing:.04em; background:var(--code-bg);"
          placeholder="Bấm Generate..."
          aria-label="Mật khẩu được tạo"
        />
        <button type="button" class="btn btn-secondary" id="pwRefreshBtn" title="Tạo lại">↻</button>
        <button type="button" class="btn btn-primary" id="pwCopyBtn">Copy</button>
      </div>

      <!-- Strength bar -->
      <div style="margin-top:10px; height:4px; border-radius:2px; background:var(--surface-2); overflow:hidden;">
        <div id="pwStrengthBar" style="height:100%; width:0; transition:width .25s, background .25s;"></div>
      </div>
      <div class="d-flex align-center justify-between gap-2 mt-1">
        <span class="text-sm text-muted" id="pwStrengthLabel"></span>
        <span class="text-sm text-muted mono" id="pwEntropyLabel"></span>
      </div>

      <!-- Length -->
      <div class="field mt-2">
        <div class="card-header" style="margin-bottom:6px;">
          <label class="field-label" for="pwLength">Độ dài: <strong id="pwLenDisplay">16</strong> ký tự</label>
          <div class="preset-strip">
            ${[12, 16, 24, 32]
              .map(
                (len) =>
                  `<button type="button" class="btn btn-secondary btn-sm pw-len-preset" data-len="${len}">${len}</button>`,
              )
              .join('')}
          </div>
        </div>
        <input type="range" id="pwLength" min="4" max="128" value="16" />
      </div>

      <!-- Options -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(210px,1fr)); gap:10px; margin-top:12px;">
        <label class="checkbox-row">
          <input type="checkbox" id="pwUpper" checked />
          <span>Chữ hoa (A–Z)</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" id="pwLower" checked />
          <span>Chữ thường (a–z)</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" id="pwDigits" checked />
          <span>Số (0–9)</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" id="pwSymbols" />
          <span>Ký tự đặc biệt (!@#$)</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" id="pwNoAmb" />
          <span>Bỏ ký tự dễ nhầm (0, O, I, l, 1)</span>
        </label>
      </div>

      <div class="row mt-2" style="align-items:flex-end;">
        <div style="flex:1 1 220px;">
          <label class="field-label" for="pwCustom">Ký tự tùy chỉnh thêm (tuỳ chọn)</label>
          <input type="text" id="pwCustom" class="mono" placeholder="Ví dụ: @#!~" spellcheck="false" />
        </div>
        <div style="flex:0 0 110px;">
          <label class="field-label" for="pwCount">Số lượng</label>
          <input type="number" id="pwCount" value="1" min="1" max="50" />
        </div>
        <div style="flex:0 0 auto;">
          <button type="button" class="btn btn-primary" id="pwGenBtn">Generate</button>
        </div>
      </div>
    </div>

    <div class="card" id="pwListCard" style="display:none;">
      <div class="card-header">
        <span class="field-label" id="pwListLabel"></span>
        <button type="button" class="copy-btn" id="pwCopyAllBtn">Copy All</button>
      </div>
      <div id="pwList" style="display:flex; flex-direction:column; gap:6px; max-height:400px; overflow-y:auto;"></div>
    </div>
  `;
}

export function init() {
  const outputEl = document.getElementById('pwOutput');
  const copyBtn = document.getElementById('pwCopyBtn');
  const refreshBtn = document.getElementById('pwRefreshBtn');
  const lengthSlider = document.getElementById('pwLength');
  const lenDisplay = document.getElementById('pwLenDisplay');
  const genBtn = document.getElementById('pwGenBtn');
  const strBar = document.getElementById('pwStrengthBar');
  const strLabel = document.getElementById('pwStrengthLabel');
  const entropyLabel = document.getElementById('pwEntropyLabel');
  const listCard = document.getElementById('pwListCard');
  const listEl = document.getElementById('pwList');
  const listLabel = document.getElementById('pwListLabel');
  const copyAllBtn = document.getElementById('pwCopyAllBtn');
  const countInput = document.getElementById('pwCount');

  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const AMBIG = /[0Oo1IlL]/g;

  const buildCharset = () => {
    let cs = '';
    if (document.getElementById('pwUpper').checked) cs += UPPER;
    if (document.getElementById('pwLower').checked) cs += LOWER;
    if (document.getElementById('pwDigits').checked) cs += DIGITS;
    if (document.getElementById('pwSymbols').checked) cs += SYMBOLS;
    cs += document.getElementById('pwCustom').value;
    if (document.getElementById('pwNoAmb').checked) cs = cs.replace(AMBIG, '');
    return cs;
  };

  const secureRand = (max) => {
    const arr = new Uint32Array(1);
    const limit = Math.floor(4294967296 / max) * max;
    let val;
    do {
      crypto.getRandomValues(arr);
      val = arr[0];
    } while (val >= limit);
    return val % max;
  };

  const generate = (len, charset) => {
    if (!charset.length) return '';
    const noAmb = document.getElementById('pwNoAmb').checked;
    const clean = (s) => (noAmb ? s.replace(AMBIG, '') : s);
    const sets = [];
    if (document.getElementById('pwUpper').checked) sets.push(clean(UPPER));
    if (document.getElementById('pwLower').checked) sets.push(clean(LOWER));
    if (document.getElementById('pwDigits').checked) sets.push(clean(DIGITS));
    if (document.getElementById('pwSymbols').checked) sets.push(SYMBOLS);

    const pw = sets.filter((s) => s.length).map((s) => s[secureRand(s.length)]);
    while (pw.length < len) pw.push(charset[secureRand(charset.length)]);

    for (let i = pw.length - 1; i > 0; i--) {
      const j = secureRand(i + 1);
      [pw[i], pw[j]] = [pw[j], pw[i]];
    }
    return pw.join('').slice(0, len);
  };

  const STRENGTH = [
    { label: 'Rất yếu', color: '#e53935', pct: 15 },
    { label: 'Yếu', color: '#f97316', pct: 32 },
    { label: 'Trung bình', color: '#eab308', pct: 55 },
    { label: 'Mạnh', color: '#22c55e', pct: 80 },
    { label: 'Rất mạnh', color: '#16a34a', pct: 100 },
  ];

  const getStrength = (entropy) => {
    if (entropy < 28) return STRENGTH[0];
    if (entropy < 36) return STRENGTH[1];
    if (entropy < 60) return STRENGTH[2];
    if (entropy < 80) return STRENGTH[3];
    return STRENGTH[4];
  };

  let generatedList = [];

  const run = () => {
    const len = parseInt(lengthSlider.value, 10);
    const charset = buildCharset();
    if (!charset) {
      outputEl.value = '';
      window.showToast('Chọn ít nhất một loại ký tự', 'error');
      return;
    }

    const n = Math.min(Math.max(1, parseInt(countInput.value, 10) || 1), 50);
    generatedList = Array.from({ length: n }, () => generate(len, charset));
    outputEl.value = generatedList[0];

    const ent = Number((len * Math.log2(new Set(charset).size || 1)).toFixed(1));
    const str = getStrength(ent);
    strBar.style.width = `${str.pct}%`;
    strBar.style.background = str.color;
    strLabel.textContent = str.label;
    entropyLabel.textContent = `~${ent} bits entropy`;

    if (n > 1) {
      listEl.innerHTML = generatedList
        .map(
          (_, i) => `
        <div class="d-flex align-center gap-2">
          <span class="text-muted text-sm mono" style="min-width:26px;">${i + 1}.</span>
          <code class="mono flex-1 pw-item-text" style="font-size:13px; word-break:break-all;"></code>
          <button type="button" class="copy-btn pw-copy-one" data-idx="${i}">Copy</button>
        </div>
      `,
        )
        .join('');
      listEl.querySelectorAll('.pw-item-text').forEach((el, i) => {
        el.textContent = generatedList[i];
      });
      listEl.querySelectorAll('.pw-copy-one').forEach((btn) => {
        btn.addEventListener('click', () => window.copyToClipboard(generatedList[Number(btn.dataset.idx)], btn));
      });
      listLabel.textContent = `${n} passwords`;
      listCard.style.display = '';
    } else {
      listCard.style.display = 'none';
    }
  };

  lengthSlider.addEventListener('input', () => {
    lenDisplay.textContent = lengthSlider.value;
    run();
  });

  document.querySelectorAll('.pw-len-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      lengthSlider.value = btn.dataset.len;
      lenDisplay.textContent = btn.dataset.len;
      run();
    });
  });

  genBtn.addEventListener('click', run);
  refreshBtn.addEventListener('click', run);
  copyBtn.addEventListener('click', () => window.copyToClipboard(outputEl.value, copyBtn));
  copyAllBtn.addEventListener('click', () => window.copyToClipboard(generatedList.join('\n'), copyAllBtn));

  ['pwUpper', 'pwLower', 'pwDigits', 'pwSymbols', 'pwNoAmb', 'pwCount'].forEach((id) => {
    document.getElementById(id).addEventListener('change', run);
  });
  document.getElementById('pwCustom').addEventListener('input', run);

  run();
}
