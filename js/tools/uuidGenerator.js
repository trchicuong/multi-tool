/**
 * UUID Generator — v4 using crypto.randomUUID()
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>UUID Generator</h1>
      <p>Tạo UUID v4 ngẫu nhiên dùng Web Crypto API (crypto.randomUUID).</p>
    </div>

    <div class="card">
      <div class="row">
        <div style="flex:0 0 130px;">
          <label class="field-label">Số lượng</label>
          <input type="number" id="uuidCount" value="1" min="1" max="100" />
        </div>
        <div style="flex:0 0 160px;">
          <label class="field-label">Định dạng</label>
          <select id="uuidFormat">
            <option value="standard">Standard (lowercase)</option>
            <option value="upper">UPPERCASE</option>
            <option value="no-dash">No dashes</option>
            <option value="braces">{ Braces }</option>
          </select>
        </div>
        <div class="d-flex align-center gap-1" style="padding-top:22px;">
          <button class="btn btn-primary" id="uuidGenBtn">Generate</button>
          <button class="btn btn-ghost" id="uuidClearBtn">Xóa</button>
        </div>
      </div>
    </div>

    <div class="card mt-2" id="uuidResultCard" style="display:none;">
      <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between; flex-wrap:wrap;">
        <span class="field-label" style="margin:0;" id="uuidResultLabel">1 UUID</span>
        <div class="btn-group" style="margin:0;">
          <button class="btn btn-secondary btn-sm" id="uuidCopyAll">Copy All</button>
          <button class="btn btn-ghost btn-sm" id="uuidAddMore">+ 10 nữa</button>
        </div>
      </div>
      <div id="uuidList" style="display:flex; flex-direction:column; gap:6px; max-height:400px; overflow-y:auto;"></div>
    </div>
  `;
}

export function init() {
  const countInput = document.getElementById('uuidCount');
  const formatSel = document.getElementById('uuidFormat');
  const genBtn = document.getElementById('uuidGenBtn');
  const clearBtn = document.getElementById('uuidClearBtn');
  const resultCard = document.getElementById('uuidResultCard');
  const resultLabel = document.getElementById('uuidResultLabel');
  const listEl = document.getElementById('uuidList');
  const copyAllBtn = document.getElementById('uuidCopyAll');
  const addMoreBtn = document.getElementById('uuidAddMore');

  const format = (uuid) => {
    const f = formatSel.value;
    if (f === 'upper') return uuid.toUpperCase();
    if (f === 'no-dash') return uuid.replace(/-/g, '');
    if (f === 'braces') return `{${uuid}}`;
    return uuid;
  };

  const generateOne = () => format(crypto.randomUUID());

  let uuids = [];

  const renderList = () => {
    listEl.innerHTML = uuids
      .map(
        (u, i) => `
      <div class="d-flex align-center gap-2">
        <span class="text-muted text-sm mono" style="min-width:28px;">${i + 1}.</span>
        <code class="mono flex-1" style="font-size:12.5px;">${u}</code>
        <button class="btn btn-ghost btn-sm uuid-copy-single" data-val="${u}">Copy</button>
      </div>
    `,
      )
      .join('');
    listEl.querySelectorAll('.uuid-copy-single').forEach((btn) => {
      btn.addEventListener('click', () => window.copyToClipboard(btn.dataset.val, btn));
    });
    resultLabel.textContent = `${uuids.length} UUID`;
    resultCard.style.display = '';
  };

  genBtn.addEventListener('click', () => {
    const n = Math.min(Math.max(1, parseInt(countInput.value) || 1), 100);
    uuids = Array.from({ length: n }, generateOne);
    renderList();
  });

  clearBtn.addEventListener('click', () => {
    uuids = [];
    listEl.innerHTML = '';
    resultCard.style.display = 'none';
  });

  copyAllBtn.addEventListener('click', () => {
    window.copyToClipboard(uuids.join('\n'), copyAllBtn);
  });

  addMoreBtn.addEventListener('click', () => {
    const extra = Array.from({ length: 10 }, generateOne);
    uuids = [...uuids, ...extra];
    renderList();
  });

  // Auto-generate 1 on load
  uuids = [generateOne()];
  renderList();
}
