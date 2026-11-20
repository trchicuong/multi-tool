/**
 * UUID Generator — v4 (Random), v7 (Time-ordered RFC 9562), Nil UUID & export
 */

function generateUuidV7() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const now = BigInt(Date.now());
  bytes[0] = Number((now >> 40n) & 0xffn);
  bytes[1] = Number((now >> 32n) & 0xffn);
  bytes[2] = Number((now >> 24n) & 0xffn);
  bytes[3] = Number((now >> 16n) & 0xffn);
  bytes[4] = Number((now >> 8n) & 0xffn);
  bytes[5] = Number(now & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>UUID Generator</h1>
      <p>Tạo UUID v4 (ngẫu nhiên), UUID v7 (sắp xếp theo thời gian RFC 9562) hoặc Nil UUID với nhiều định dạng.</p>
    </div>

    <div class="card">
      <div class="row" style="align-items:flex-end;">
        <div style="flex:0 0 150px;">
          <label class="field-label" for="uuidVersion">Phiên bản</label>
          <select id="uuidVersion">
            <option value="v4" selected>UUID v4 (Random)</option>
            <option value="v7">UUID v7 (Timestamp)</option>
            <option value="nil">Nil UUID (Zeros)</option>
          </select>
        </div>
        <div style="flex:0 0 110px;">
          <label class="field-label" for="uuidCount">Số lượng</label>
          <input type="number" id="uuidCount" value="1" min="1" max="100" />
        </div>
        <div style="flex:1 1 170px;">
          <label class="field-label" for="uuidFormat">Định dạng</label>
          <select id="uuidFormat">
            <option value="standard">Standard (lowercase)</option>
            <option value="upper">UPPERCASE</option>
            <option value="no-dash">No dashes</option>
            <option value="braces">{ Braces }</option>
            <option value="quotes">"Quotes"</option>
          </select>
        </div>
        <div class="d-flex align-center gap-1" style="flex:0 0 auto;">
          <button type="button" class="btn btn-primary" id="uuidGenBtn">Generate</button>
          <button type="button" class="btn btn-ghost" id="uuidClearBtn">Xóa</button>
        </div>
      </div>
    </div>

    <div class="card" id="uuidResultCard" style="display:none;">
      <div class="card-header">
        <span class="field-label" id="uuidResultLabel">1 UUID</span>
        <div class="d-flex align-center gap-1 flex-wrap">
          <button type="button" class="copy-btn" id="uuidCopyAll">Copy All</button>
          <button type="button" class="btn btn-secondary btn-sm" id="uuidDownloadBtn">Download .txt</button>
          <button type="button" class="btn btn-ghost btn-sm" id="uuidAddMore">+ 10 nữa</button>
        </div>
      </div>
      <div id="uuidList" style="display:flex; flex-direction:column; gap:6px; max-height:400px; overflow-y:auto;"></div>
    </div>
  `;
}

export function init() {
  const versionSel = document.getElementById('uuidVersion');
  const countInput = document.getElementById('uuidCount');
  const formatSel = document.getElementById('uuidFormat');
  const genBtn = document.getElementById('uuidGenBtn');
  const clearBtn = document.getElementById('uuidClearBtn');
  const resultCard = document.getElementById('uuidResultCard');
  const resultLabel = document.getElementById('uuidResultLabel');
  const listEl = document.getElementById('uuidList');
  const copyAllBtn = document.getElementById('uuidCopyAll');
  const dlBtn = document.getElementById('uuidDownloadBtn');
  const addMoreBtn = document.getElementById('uuidAddMore');

  const format = (uuid) => {
    switch (formatSel.value) {
      case 'upper':
        return uuid.toUpperCase();
      case 'no-dash':
        return uuid.replace(/-/g, '');
      case 'braces':
        return `{${uuid}}`;
      case 'quotes':
        return `"${uuid}"`;
      default:
        return uuid;
    }
  };

  const generateOne = () => {
    const v = versionSel.value;
    const raw =
      v === 'nil'
        ? '00000000-0000-0000-0000-000000000000'
        : v === 'v7'
          ? generateUuidV7()
          : crypto.randomUUID();
    return format(raw);
  };

  let uuids = [];

  const renderList = () => {
    listEl.innerHTML = uuids
      .map(
        (u, i) => `
      <div class="d-flex align-center gap-2">
        <span class="text-muted text-sm mono" style="min-width:28px;">${i + 1}.</span>
        <code class="mono flex-1" style="font-size:12.5px; word-break:break-all;">${u}</code>
        <button type="button" class="copy-btn uuid-copy-single" data-idx="${i}">Copy</button>
      </div>
    `,
      )
      .join('');
    listEl.querySelectorAll('.uuid-copy-single').forEach((btn) => {
      btn.addEventListener('click', () => window.copyToClipboard(uuids[Number(btn.dataset.idx)], btn));
    });
    resultLabel.textContent = `${uuids.length} UUID (${versionSel.value.toUpperCase()})`;
    resultCard.style.display = '';
  };

  const regenerate = () => {
    const n = Math.min(Math.max(1, parseInt(countInput.value, 10) || 1), 100);
    uuids = Array.from({ length: n }, generateOne);
    renderList();
  };

  genBtn.addEventListener('click', regenerate);
  versionSel.addEventListener('change', regenerate);
  formatSel.addEventListener('change', regenerate);

  clearBtn.addEventListener('click', () => {
    uuids = [];
    listEl.innerHTML = '';
    resultCard.style.display = 'none';
  });

  copyAllBtn.addEventListener('click', () => {
    window.copyToClipboard(uuids.join('\n'), copyAllBtn);
  });

  dlBtn.addEventListener('click', () => {
    if (!uuids.length) return;
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${versionSel.value}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  addMoreBtn.addEventListener('click', () => {
    uuids = [...uuids, ...Array.from({ length: 10 }, generateOne)];
    renderList();
  });

  regenerate();
}
