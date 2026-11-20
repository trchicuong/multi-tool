/**
 * Hash Generator — MD5 (raw Uint8Array binary-safe), SHA-1/256/512, HMAC & Verify Hash
 */

function md5Bytes(bytes) {
  const rotateLeft = (n, s) => (n << s) | (n >>> (32 - s));
  const addUnsigned = (x, y) => {
    const x8 = x & 0x80000000;
    const y8 = y & 0x80000000;
    const x4 = x & 0x40000000;
    const y4 = y & 0x40000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) return result & 0x40000000 ? result ^ 0xc0000000 ^ x8 ^ y8 : result ^ 0x40000000 ^ x8 ^ y8;
    return result ^ x8 ^ y8;
  };
  const F = (x, y, z) => (x & y) | (~x & z);
  const G = (x, y, z) => (x & z) | (y & ~z);
  const H = (x, y, z) => x ^ y ^ z;
  const I = (x, y, z) => y ^ (x | ~z);
  const FF = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, ac)), s), b);
  const GG = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b, c, d)), addUnsigned(x, ac)), s), b);
  const HH = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b, c, d)), addUnsigned(x, ac)), s), b);
  const II = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b, c, d)), addUnsigned(x, ac)), s), b);
  const wordToHex = (v) => {
    let r = '';
    for (let i = 0; i <= 3; i++) r += ('0' + ((v >>> (i * 8)) & 0xff).toString(16)).slice(-2);
    return r;
  };

  const len = bytes.length;
  const wordCount = ((len + 8) >>> 6) + 1;
  const words = new Uint32Array(wordCount * 16);
  for (let i = 0; i < len; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  const bitLen = len * 8;
  words[words.length - 2] = bitLen >>> 0;
  words[words.length - 1] = Math.floor(bitLen / 0x100000000);

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < words.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, words[k], S11, 0xd76aa478);
    d = FF(d, a, b, c, words[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, words[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, words[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, words[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, words[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, words[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, words[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, words[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, words[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, words[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, words[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, words[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, words[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, words[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, words[k + 15], S14, 0x49b40821);

    a = GG(a, b, c, d, words[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, words[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, words[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, words[k], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, words[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, words[k + 10], S22, 0x02441453);
    c = GG(c, d, a, b, words[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, words[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, words[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, words[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, words[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, words[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, words[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, words[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, words[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, words[k + 12], S24, 0x8d2a4c8a);

    a = HH(a, b, c, d, words[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, words[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, words[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, words[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, words[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, words[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, words[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, words[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, words[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, words[k], S32, 0xeaa127fa);
    c = HH(c, d, a, b, words[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, words[k + 6], S34, 0x04881d05);
    a = HH(a, b, c, d, words[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, words[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, words[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, words[k + 2], S34, 0xc4ac5665);

    a = II(a, b, c, d, words[k], S41, 0xf4292244);
    d = II(d, a, b, c, words[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, words[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, words[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, words[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, words[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, words[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, words[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, words[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, words[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, words[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, words[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, words[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, words[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, words[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, words[k + 9], S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function digestBuffer(algo, buffer, hmacKeyStr = '') {
  if (!hmacKeyStr) {
    const h = await crypto.subtle.digest(algo, buffer);
    return toHex(h);
  }
  const keyBytes = new TextEncoder().encode(hmacKeyStr);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: algo }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, buffer);
  return toHex(sig);
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Hash Generator</h1>
      <p>Tính hash MD5, SHA-1, SHA-256, SHA-512 cho văn bản hoặc file nhị phân (hỗ trợ HMAC &amp; Verify Hash).</p>
    </div>

    <div class="card">
      <div class="field">
        <div class="card-header" style="margin-bottom:6px;">
          <label class="field-label" for="hashInput">Nhập văn bản</label>
          <label class="checkbox-row">
            <input type="checkbox" id="hashUpper" />
            <span>CHỮ HOA (UPPERCASE)</span>
          </label>
        </div>
        <textarea id="hashInput" class="mono w-full" rows="4" placeholder="Nhập văn bản để tự động tính hash..."></textarea>
      </div>

      <div class="field">
        <label class="field-label" for="hashHmac">HMAC Secret Key (tuỳ chọn cho SHA-1 / SHA-256 / SHA-512)</label>
        <input type="text" id="hashHmac" class="mono" placeholder="Để trống nếu băm thông thường..." spellcheck="false" />
      </div>

      <div class="field">
        <span class="field-label">Hoặc chọn / kéo thả file (tính hash chính xác theo từng byte)</span>
        <div class="drop-zone" id="hashDropZone">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p class="text-muted text-sm mt-1" id="hashFileName">Kéo file vào đây hoặc click để chọn (tối đa 50MB)</p>
          <input type="file" id="hashFileInput" style="display:none;" />
        </div>
      </div>
    </div>

    <div id="hashResults" class="card" style="display:none;">
      <div class="card-header">
        <span class="field-label">Kết quả Hash</span>
      </div>
      <div id="hashResultGrid" style="display:flex; flex-direction:column; gap:10px;"></div>

      <div class="field mt-2" style="padding-top:12px; border-top:1px solid var(--border);">
        <div class="card-header" style="margin-bottom:6px;">
          <label class="field-label" for="hashVerify">Kiểm tra / Đối chiếu Hash (Verify Checksum)</label>
          <span id="hashVerifyBadge" class="badge badge-gray" style="display:none;"></span>
        </div>
        <input type="text" id="hashVerify" class="mono" placeholder="Dán mã hash cần đối chiếu vào đây..." spellcheck="false" />
      </div>
    </div>
  `;
}

export function init() {
  const inputEl = document.getElementById('hashInput');
  const hmacEl = document.getElementById('hashHmac');
  const upperChk = document.getElementById('hashUpper');
  const verifyEl = document.getElementById('hashVerify');
  const verifyBadge = document.getElementById('hashVerifyBadge');
  const dropZone = document.getElementById('hashDropZone');
  const fileInput = document.getElementById('hashFileInput');
  const fileNameEl = document.getElementById('hashFileName');
  const resultsEl = document.getElementById('hashResults');
  const gridEl = document.getElementById('hashResultGrid');

  const ALGOS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
  let currentHashes = {};
  let lastBytes = null;

  const updateVerify = () => {
    const expected = verifyEl.value.trim().toLowerCase();
    if (!expected || Object.keys(currentHashes).length === 0) {
      verifyBadge.style.display = 'none';
      return;
    }
    const matched = Object.entries(currentHashes).find(([, val]) => val && val.toLowerCase() === expected);
    verifyBadge.style.display = '';
    if (matched) {
      verifyBadge.className = 'badge badge-green';
      verifyBadge.textContent = `✓ Khớp với ${matched[0]}`;
    } else {
      verifyBadge.className = 'badge badge-red';
      verifyBadge.textContent = '✗ Không khớp';
    }
  };

  const renderGrid = (hashes) => {
    currentHashes = hashes;
    const isUpper = upperChk.checked;
    gridEl.innerHTML = ALGOS.map((name) => {
      const val = hashes[name] || '…';
      const displayVal = val === '…' ? val : isUpper ? val.toUpperCase() : val.toLowerCase();
      return `
        <div class="d-flex align-center gap-2 flex-wrap">
          <span class="badge badge-blue" style="min-width:74px; justify-content:center;">${name}</span>
          <code class="mono flex-1" style="font-size:12px; word-break:break-all; background:var(--code-bg); border:1px solid var(--border); padding:7px 10px; border-radius:var(--radius);">${displayVal}</code>
          <button type="button" class="copy-btn copy-hash" data-val="${displayVal}">Copy</button>
        </div>
      `;
    }).join('');
    gridEl.querySelectorAll('.copy-hash').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.val && btn.dataset.val !== '…') {
          window.copyToClipboard(btn.dataset.val, btn);
        }
      });
    });
    resultsEl.style.display = '';
    updateVerify();
  };

  const computeFromBytes = async (uint8) => {
    lastBytes = uint8;
    const hmacKey = hmacEl.value;
    const buffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);

    const [sha1, sha256, sha512] = await Promise.all([
      digestBuffer('SHA-1', buffer, hmacKey),
      digestBuffer('SHA-256', buffer, hmacKey),
      digestBuffer('SHA-512', buffer, hmacKey),
    ]);

    const md5Val = hmacKey ? '(MD5 không dùng HMAC)' : md5Bytes(uint8);
    renderGrid({ MD5: md5Val, 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-512': sha512 });
  };

  let debounceTimer;
  const triggerTextHash = () => {
    clearTimeout(debounceTimer);
    const text = inputEl.value;
    if (!text) {
      lastBytes = null;
      currentHashes = {};
      resultsEl.style.display = 'none';
      return;
    }
    renderGrid({ MD5: '…', 'SHA-1': '…', 'SHA-256': '…', 'SHA-512': '…' });
    debounceTimer = setTimeout(() => {
      computeFromBytes(new TextEncoder().encode(text));
    }, 180);
  };

  inputEl.addEventListener('input', triggerTextHash);
  hmacEl.addEventListener('input', () => {
    if (lastBytes) computeFromBytes(lastBytes);
  });
  upperChk.addEventListener('change', () => {
    if (Object.keys(currentHashes).length) renderGrid(currentHashes);
  });
  verifyEl.addEventListener('input', updateVerify);

  const hashFile = async (file) => {
    if (file.size > 50 * 1024 * 1024) {
      window.showToast('File quá lớn (tối đa 50MB)', 'error');
      return;
    }
    fileNameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    inputEl.value = '';
    renderGrid({ MD5: '…', 'SHA-1': '…', 'SHA-256': '…', 'SHA-512': '…' });
    const buf = await file.arrayBuffer();
    await computeFromBytes(new Uint8Array(buf));
    window.showToast('Tính hash file xong!', 'success');
  };

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) hashFile(fileInput.files[0]);
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) hashFile(e.dataTransfer.files[0]);
  });

  return () => clearTimeout(debounceTimer);
}
