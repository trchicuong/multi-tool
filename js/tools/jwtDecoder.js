/**
 * JWT Decoder — decode header, payload, UTF-8 safe & explain standard claims
 */

const toBase64Url = (obj) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const SAMPLE_JWT = `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url({
  sub: '1234567890',
  name: 'John Doe',
  role: 'user',
  iss: 'auth.example.com',
  iat: 1700000000,
  exp: 1900000000,
})}.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`;

const CLAIM_DESCRIPTIONS = {
  iss: 'Issuer (Tổ chức phát hành)',
  sub: 'Subject (Chủ thể / User ID)',
  aud: 'Audience (Đối tượng nhận)',
  exp: 'Expiration Time (Hết hạn)',
  nbf: 'Not Before (Có hiệu lực từ)',
  iat: 'Issued At (Thời điểm tạo)',
  jti: 'JWT ID (Mã định danh duy nhất)',
};

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function decodeBase64UrlUtf8(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>JWT Decoder</h1>
      <p>Giải mã JSON Web Token (Header, Payload, Signature), kiểm tra thời hạn và giải thích standard claims.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <label class="field-label" for="jwtInput">JWT Token</label>
        <div class="d-flex gap-1">
          <button type="button" class="btn btn-ghost btn-sm" id="jwtSampleBtn">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="jwtClearBtn">Xóa</button>
        </div>
      </div>
      <div class="field">
        <textarea
          id="jwtInput"
          class="mono w-full"
          rows="4"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          spellcheck="false"
          style="resize:vertical;"
        ></textarea>
      </div>
      <div id="jwtStatus" style="min-height:22px;"></div>
    </div>

    <div id="jwtResult" style="display:none;">
      <div class="card">
        <div class="card-header">
          <span class="field-label">Cấu trúc Token (Header . Payload . Signature)</span>
          <button type="button" class="copy-btn" id="jwtCopySig">Copy Signature</button>
        </div>
        <div id="jwtVisual" style="font-family:var(--font-mono); font-size:12.5px; word-break:break-all; line-height:1.85;"></div>
      </div>

      <div class="split-editor mb-2">
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <span class="field-label">Header (Algorithm &amp; Token Type)</span>
            <button type="button" class="copy-btn" id="jwtCopyHeader">Copy</button>
          </div>
          <div class="output-box">
            <pre id="jwtHeader" style="margin:0;"></pre>
          </div>
        </div>

        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <span class="field-label">Payload (Data &amp; Claims)</span>
            <button type="button" class="copy-btn" id="jwtCopyPayload">Copy</button>
          </div>
          <div class="output-box">
            <pre id="jwtPayload" style="margin:0;"></pre>
          </div>
        </div>
      </div>

      <div class="card" id="jwtClaimsCard" style="display:none;">
        <div class="card-header">
          <span class="field-label">Chi tiết Standard Claims &amp; Thời hạn</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Ý nghĩa</th>
                <th>Giá trị</th>
              </tr>
            </thead>
            <tbody id="jwtClaimsBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <style>
      .jwt-part-header  { color: #e53935; }
      .jwt-part-payload { color: #7c3aed; }
      .jwt-part-sig     { color: #059669; }
      body.dark .jwt-part-header  { color: #f87171; }
      body.dark .jwt-part-payload { color: #a78bfa; }
      body.dark .jwt-part-sig     { color: #34d399; }
    </style>
  `;
}

export function init() {
  const inputEl = document.getElementById('jwtInput');
  const statusEl = document.getElementById('jwtStatus');
  const resultEl = document.getElementById('jwtResult');
  const visualEl = document.getElementById('jwtVisual');
  const headerEl = document.getElementById('jwtHeader');
  const payloadEl = document.getElementById('jwtPayload');
  const claimsCard = document.getElementById('jwtClaimsCard');
  const claimsBody = document.getElementById('jwtClaimsBody');
  const copyHeader = document.getElementById('jwtCopyHeader');
  const copyPayload = document.getElementById('jwtCopyPayload');
  const copySig = document.getElementById('jwtCopySig');
  const sampleBtn = document.getElementById('jwtSampleBtn');
  const clearBtn = document.getElementById('jwtClearBtn');

  let curHeader = '';
  let curPayload = '';
  let curSig = '';

  const fmtTime = (ts) => {
    const d = new Date(ts * 1000);
    if (Number.isNaN(d.getTime())) return String(ts);
    const diff = ts * 1000 - Date.now();
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    const hrs = Math.floor(abs / 3600000);
    const days = Math.floor(abs / 86400000);
    let rel = 'vừa xong';
    if (days > 0) rel = diff < 0 ? `${days} ngày trước` : `còn ${days} ngày`;
    else if (hrs > 0) rel = diff < 0 ? `${hrs} giờ trước` : `còn ${hrs} giờ`;
    else if (mins > 0) rel = diff < 0 ? `${mins} phút trước` : `còn ${mins} phút`;
    return `${d.toLocaleString('vi-VN')} <span class="text-muted text-sm">(${rel})</span>`;
  };

  const decode = () => {
    const token = inputEl.value.trim();
    statusEl.innerHTML = '';
    resultEl.style.display = 'none';
    if (!token) return;

    const parts = token.split('.');
    if (parts.length !== 3) {
      statusEl.innerHTML = '<span class="badge badge-red">Invalid JWT — phải có đúng 3 phần ngăn cách bởi dấu chấm</span>';
      return;
    }

    try {
      const header = JSON.parse(decodeBase64UrlUtf8(parts[0]));
      const payload = JSON.parse(decodeBase64UrlUtf8(parts[1]));
      curHeader = JSON.stringify(header, null, 2);
      curPayload = JSON.stringify(payload, null, 2);
      curSig = parts[2];

      visualEl.innerHTML = `<span class="jwt-part-header">${escHtml(parts[0])}</span>.<span class="jwt-part-payload">${escHtml(parts[1])}</span>.<span class="jwt-part-sig">${escHtml(parts[2])}</span>`;
      headerEl.textContent = curHeader;
      payloadEl.textContent = curPayload;

      // Claims explanation table
      const claimKeys = Object.keys(CLAIM_DESCRIPTIONS).filter((k) => payload[k] !== undefined);
      if (claimKeys.length > 0) {
        claimsBody.innerHTML = claimKeys
          .map((k) => {
            const isTime = k === 'iat' || k === 'exp' || k === 'nbf';
            const valHtml = isTime && typeof payload[k] === 'number'
              ? `${fmtTime(payload[k])}`
              : `<code>${escHtml(JSON.stringify(payload[k]))}</code>`;
            return `<tr><td><code>${k}</code></td><td>${CLAIM_DESCRIPTIONS[k]}</td><td class="mono">${valHtml}</td></tr>`;
          })
          .join('');
        claimsCard.style.display = '';
      } else {
        claimsCard.style.display = 'none';
      }

      if (typeof payload.exp === 'number') {
        const expired = payload.exp * 1000 < Date.now();
        statusEl.innerHTML = `<span class="badge ${expired ? 'badge-red' : 'badge-green'}">${expired ? '✗ Token đã hết hạn' : '✓ Token còn hiệu lực'}</span>`;
      } else {
        statusEl.innerHTML = '<span class="badge badge-blue">✓ Hợp lệ (không có exp claim)</span>';
      }

      resultEl.style.display = '';
    } catch (e) {
      statusEl.innerHTML = `<span class="badge badge-red">Lỗi giải mã: ${escHtml(e.message)}</span>`;
    }
  };

  copyHeader.addEventListener('click', () => window.copyToClipboard(curHeader, copyHeader));
  copyPayload.addEventListener('click', () => window.copyToClipboard(curPayload, copyPayload));
  copySig.addEventListener('click', () => window.copyToClipboard(curSig, copySig));

  sampleBtn.addEventListener('click', () => {
    inputEl.value = SAMPLE_JWT;
    decode();
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    decode();
    inputEl.focus();
  });

  inputEl.addEventListener('input', decode);
  inputEl.addEventListener('paste', () => setTimeout(decode, 0));
}
