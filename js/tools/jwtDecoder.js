/**
 * JWT Decoder — decode header, payload and check expiry
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>JWT Decoder</h1>
      <p>Giải mã JWT token để xem Header và Payload. Không validate chữ ký.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label">JWT Token</label>
        <textarea id="jwtInput" class="mono w-full" rows="4"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          spellcheck="false"
          style="resize:vertical;"
        ></textarea>
      </div>
      <div id="jwtStatus" style="min-height:18px;"></div>
    </div>

    <div id="jwtResult" style="display:none; margin-top:8px;">
      <!-- Visual token -->
      <div class="card">
        <div class="field-label">Token Structure</div>
        <div id="jwtVisual" style="font-family:var(--font-mono); font-size:12.5px; word-break:break-all; line-height:1.9;"></div>
      </div>

      <div class="row mt-2" style="align-items:flex-start;">
        <div class="card flex-1" style="min-width:220px;">
          <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
            <span class="field-label" style="margin:0;">Header</span>
            <button class="copy-btn" id="jwtCopyHeader">Copy</button>
          </div>
          <pre id="jwtHeader" class="mono" style="font-size:12.5px; white-space:pre-wrap; word-break:break-all;"></pre>
        </div>
        <div class="card flex-1" style="min-width:220px;">
          <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
            <span class="field-label" style="margin:0;">Payload</span>
            <button class="copy-btn" id="jwtCopyPayload">Copy</button>
          </div>
          <pre id="jwtPayload" class="mono" style="font-size:12.5px; white-space:pre-wrap; word-break:break-all;"></pre>
        </div>
      </div>

      <!-- Timestamp fields -->
      <div class="card mt-2" id="jwtTimesCard" style="display:none;">
        <div class="field-label">Time Claims</div>
        <div id="jwtTimes" style="margin-top:8px; display:grid; gap:8px;"></div>
      </div>
    </div>

    <style>
      .jwt-part-header  { color: #E34234; }
      .jwt-part-payload { color: #6A5ACD; }
      .jwt-part-sig     { color: #2E8B57; }
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
  const timesCard = document.getElementById('jwtTimesCard');
  const timesEl = document.getElementById('jwtTimes');
  const copyHeader = document.getElementById('jwtCopyHeader');
  const copyPayload = document.getElementById('jwtCopyPayload');

  const b64Decode = (str) => {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  };

  const fmtTime = (ts) => {
    const d = new Date(ts * 1000);
    const now = Date.now();
    const diff = ts * 1000 - now;
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    const hrs = Math.floor(abs / 3600000);
    const days = Math.floor(abs / 86400000);
    let rel = '';
    if (days > 0) rel = diff < 0 ? `${days}d ago` : `in ${days}d`;
    else if (hrs > 0) rel = diff < 0 ? `${hrs}h ago` : `in ${hrs}h`;
    else rel = diff < 0 ? `${mins}m ago` : `in ${mins}m`;
    return `${d.toUTCString()} <span class="text-muted text-sm">(${rel})</span>`;
  };

  const decode = () => {
    const token = inputEl.value.trim();
    statusEl.innerHTML = '';
    resultEl.style.display = 'none';
    if (!token) return;

    const parts = token.split('.');
    if (parts.length !== 3) {
      statusEl.innerHTML = '<span class="badge badge-red">Invalid JWT — phải có đúng 3 phần</span>';
      return;
    }

    try {
      const header = JSON.parse(b64Decode(parts[0]));
      const payload = JSON.parse(b64Decode(parts[1]));
      const headerStr = JSON.stringify(header, null, 2);
      const payloadStr = JSON.stringify(payload, null, 2);

      // Visual token
      visualEl.innerHTML = `
        <span class="jwt-part-header">${escHtml(parts[0])}</span>.<span class="jwt-part-payload">${escHtml(parts[1])}</span>.<span class="jwt-part-sig">${escHtml(parts[2])}</span>
      `;

      headerEl.textContent = headerStr;
      payloadEl.textContent = payloadStr;

      // Time claims
      const timeClaims = ['iat', 'exp', 'nbf'].filter((k) => payload[k]);
      if (timeClaims.length > 0) {
        timesEl.innerHTML = timeClaims
          .map((k) => {
            const label = k === 'iat' ? 'Issued At' : k === 'exp' ? 'Expires At' : 'Not Before';
            const expired = k === 'exp' && payload[k] * 1000 < Date.now();
            return `
            <div class="d-flex gap-2 align-center" style="flex-wrap:wrap;">
              <span class="badge ${expired ? 'badge-red' : 'badge-blue'}" style="min-width:90px; justify-content:center;">${label}</span>
              <span class="text-sm" style="font-family:var(--font-mono);">${fmtTime(payload[k])}</span>
            </div>`;
          })
          .join('');
        timesCard.style.display = '';
      } else {
        timesCard.style.display = 'none';
      }

      // Expiry status
      if (payload.exp) {
        const expired = payload.exp * 1000 < Date.now();
        statusEl.innerHTML = `<span class="badge ${expired ? 'badge-red' : 'badge-green'}">${expired ? 'Token đã hết hạn' : 'Token còn hiệu lực'}</span>`;
      }

      resultEl.style.display = '';

      copyHeader.onclick = () => window.copyToClipboard(headerStr, copyHeader);
      copyPayload.onclick = () => window.copyToClipboard(payloadStr, copyPayload);
    } catch (e) {
      statusEl.innerHTML = `<span class="badge badge-red">Lỗi: ${escHtml(e.message)}</span>`;
    }
  };

  inputEl.addEventListener('input', decode);
  inputEl.addEventListener('paste', () => setTimeout(decode, 0));
}

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
