/**
 * Password Generator — secure passwords using crypto.getRandomValues
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Password Generator</h1>
      <p>Tạo mật khẩu mạnh, ngẫu nhiên bằng Web Crypto API.</p>
    </div>

    <div class="card">
      <!-- Output -->
      <div style="position:relative;">
        <input type="text" id="pwOutput" class="mono w-full" readonly
          style="font-size:18px; font-weight:600; padding-right:90px; letter-spacing:.04em;"
          placeholder="Bấm Generate..." />
        <button class="btn btn-secondary btn-sm" id="pwCopyBtn"
          style="position:absolute; right:8px; top:50%; transform:translateY(-50%);">Copy</button>
      </div>

      <!-- Strength bar -->
      <div style="margin-top:8px; height:4px; border-radius:2px; background:var(--surface-2); overflow:hidden;">
        <div id="pwStrengthBar" style="height:100%; width:0; transition:width .3s, background .3s;"></div>
      </div>
      <div class="d-flex align-center gap-1 mt-1" style="justify-content:space-between;">
        <span class="text-sm text-muted" id="pwStrengthLabel"></span>
        <span class="text-sm text-muted" id="pwEntropyLabel"></span>
      </div>

      <!-- Length -->
      <div class="field mt-2">
        <label class="field-label">Độ dài: <strong id="pwLenDisplay">16</strong></label>
        <input type="range" id="pwLength" min="4" max="128" value="16" style="width:100%;" />
      </div>

      <!-- Options -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:8px; margin-top:8px;">
        <label class="d-flex align-center gap-2" style="cursor:pointer;">
          <input type="checkbox" id="pwUpper" checked /> Chữ hoa (A–Z)
        </label>
        <label class="d-flex align-center gap-2" style="cursor:pointer;">
          <input type="checkbox" id="pwLower" checked /> Chữ thường (a–z)
        </label>
        <label class="d-flex align-center gap-2" style="cursor:pointer;">
          <input type="checkbox" id="pwDigits" checked /> Số (0–9)
        </label>
        <label class="d-flex align-center gap-2" style="cursor:pointer;">
          <input type="checkbox" id="pwSymbols" /> Ký tự đặc biệt (!@#$)
        </label>
        <label class="d-flex align-center gap-2" style="cursor:pointer;">
          <input type="checkbox" id="pwNoAmb" /> Bỏ ký tự dễ nhầm (0,O,I,l,1)
        </label>
      </div>

      <!-- Custom charset -->
      <div class="field mt-2">
        <label class="field-label">Ký tự tùy chỉnh thêm (tùy chọn)</label>
        <input type="text" id="pwCustom" placeholder="ví dụ: @#!~" spellcheck="false" />
      </div>

      <!-- Quantity -->
      <div class="row mt-2">
        <div style="flex:0 0 130px;">
          <label class="field-label">Số lượng</label>
          <input type="number" id="pwCount" value="1" min="1" max="50" />
        </div>
        <div class="d-flex align-center gap-1" style="padding-top:22px;">
          <button class="btn btn-primary" id="pwGenBtn">Generate</button>
        </div>
      </div>
    </div>

    <div class="card mt-2" id="pwListCard" style="display:none;">
      <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
        <span class="field-label" style="margin:0;" id="pwListLabel"></span>
        <button class="btn btn-secondary btn-sm" id="pwCopyAllBtn">Copy All</button>
      </div>
      <div id="pwList" style="display:flex; flex-direction:column; gap:6px; max-height:400px; overflow-y:auto;"></div>
    </div>
  `;
}

export function init() {
  const outputEl = document.getElementById('pwOutput');
  const copyBtn = document.getElementById('pwCopyBtn');
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
    let val;
    const limit = Math.floor(4294967296 / max) * max;
    do {
      crypto.getRandomValues(arr);
      val = arr[0];
    } while (val >= limit);
    return val % max;
  };

  const generate = (len, charset) => {
    if (!charset.length) return '';
    // Ensure at least one from each selected group
    const sets = [];
    if (document.getElementById('pwUpper').checked) sets.push(UPPER.replace(AMBIG, ''));
    if (document.getElementById('pwLower').checked) sets.push(LOWER.replace(AMBIG, ''));
    if (document.getElementById('pwDigits').checked) sets.push(DIGITS.replace(AMBIG, ''));
    if (document.getElementById('pwSymbols').checked) sets.push(SYMBOLS);

    const pw = sets.filter((s) => s.length).map((s) => s[secureRand(s.length)]);
    while (pw.length < len) pw.push(charset[secureRand(charset.length)]);

    // Fisher-Yates shuffle
    for (let i = pw.length - 1; i > 0; i--) {
      const j = secureRand(i + 1);
      [pw[i], pw[j]] = [pw[j], pw[i]];
    }
    return pw.join('').slice(0, len);
  };

  const calcEntropy = (len, charsetSize) => (len * Math.log2(charsetSize)).toFixed(1);

  const STRENGTH = [
    { label: 'Rất yếu', color: '#e74c3c', pct: 15 },
    { label: 'Yếu', color: '#e67e22', pct: 30 },
    { label: 'Trung bình', color: '#f1c40f', pct: 55 },
    { label: 'Mạnh', color: '#2ecc71', pct: 80 },
    { label: 'Rất mạnh', color: '#27ae60', pct: 100 },
  ];

  const getStrength = (entropy) => {
    if (entropy < 28) return STRENGTH[0];
    if (entropy < 36) return STRENGTH[1];
    if (entropy < 60) return STRENGTH[2];
    if (entropy < 80) return STRENGTH[3];
    return STRENGTH[4];
  };

  const run = () => {
    const len = parseInt(lengthSlider.value);
    const charset = buildCharset();
    if (!charset) {
      outputEl.value = '';
      window.showToast('Chọn ít nhất một loại ký tự', 'error');
      return;
    }

    const n = Math.min(Math.max(1, parseInt(countInput.value) || 1), 50);
    const passwords = Array.from({ length: n }, () => generate(len, charset));

    outputEl.value = passwords[0];

    const ent = parseFloat(calcEntropy(len, charset.length));
    const str = getStrength(ent);
    strBar.style.width = str.pct + '%';
    strBar.style.background = str.color;
    strLabel.textContent = str.label;
    entropyLabel.textContent = `~${ent} bits entropy`;

    if (n > 1) {
      listEl.innerHTML = passwords
        .map(
          (p, i) => `
        <div class="d-flex align-center gap-2">
          <span class="text-muted text-sm" style="min-width:26px;">${i + 1}.</span>
          <code class="mono flex-1" style="font-size:13px;">${p}</code>
          <button class="btn btn-ghost btn-sm pw-copy-one" data-val="${p}">Copy</button>
        </div>
      `,
        )
        .join('');
      listEl.querySelectorAll('.pw-copy-one').forEach((btn) => {
        btn.addEventListener('click', () => window.copyToClipboard(btn.dataset.val, btn));
      });
      listLabel.textContent = `${n} passwords`;
      listCard.style.display = '';
    } else {
      listCard.style.display = 'none';
    }
  };

  lengthSlider.addEventListener('input', () => {
    lenDisplay.textContent = lengthSlider.value;
  });
  genBtn.addEventListener('click', run);
  copyBtn.addEventListener('click', () => window.copyToClipboard(outputEl.value, copyBtn));
  copyAllBtn.addEventListener('click', () => {
    const all = [...listEl.querySelectorAll('.pw-copy-one')].map((b) => b.dataset.val).join('\n');
    window.copyToClipboard(all, copyAllBtn);
  });

  // Generate on checkbox/slider change
  ['pwUpper', 'pwLower', 'pwDigits', 'pwSymbols', 'pwNoAmb'].forEach((id) => {
    document.getElementById(id).addEventListener('change', run);
  });
  document.getElementById('pwCustom').addEventListener('input', run);

  run();
}
