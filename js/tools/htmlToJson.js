/**
 * HTML / XML → JSON converter
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>HTML / XML → JSON</h1>
      <p>Chuyển đổi markup HTML hoặc XML sang cấu trúc JSON.</p>
    </div>

    <div class="card">
      <div class="d-flex gap-1 mb-2">
        <button class="btn btn-primary btn-sm type-btn active" data-type="text/html">HTML</button>
        <button class="btn btn-secondary btn-sm type-btn" data-type="application/xml">XML</button>
      </div>
      <div class="field">
        <label class="field-label">Input</label>
        <textarea id="hj-input" class="mono w-full" rows="10" placeholder="<root><item id='1'>Hello</item></root>" spellcheck="false" style="min-height:200px; resize:vertical;"></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" id="hjConvertBtn">Convert</button>
        <button class="btn btn-ghost" id="hjClearBtn">Xóa</button>
      </div>
      <div id="hjError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>

    <div id="hjResult" style="display:none; margin-top:8px;">
      <div class="card">
        <div class="d-flex align-center gap-1 mb-2" style="justify-content:space-between;">
          <span class="field-label" style="margin:0;">JSON Output</span>
          <div class="d-flex gap-1">
            <button class="copy-btn" id="hjCopyBtn">Copy</button>
            <button class="btn btn-ghost btn-sm" id="hjDownloadBtn">Download .json</button>
          </div>
        </div>
        <div class="output-box">
          <pre id="hjOutput" style="margin:0; max-height:360px;"></pre>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  let mimeType = 'text/html';
  const typeBtns = document.querySelectorAll('.type-btn');
  const inputEl = document.getElementById('hj-input');
  const convertBtn = document.getElementById('hjConvertBtn');
  const clearBtn = document.getElementById('hjClearBtn');
  const errorEl = document.getElementById('hjError');
  const resultEl = document.getElementById('hjResult');
  const outputEl = document.getElementById('hjOutput');
  const copyBtn = document.getElementById('hjCopyBtn');
  const dlBtn = document.getElementById('hjDownloadBtn');

  typeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mimeType = btn.dataset.type;
      typeBtns.forEach((b) => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');
      inputEl.placeholder =
        mimeType === 'application/xml'
          ? '<root><item id="1">Hello</item></root>'
          : '<div class="card"><h1>Title</h1><p>Body text</p></div>';
    });
  });

  const nodeToJson = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      return text ? text : null;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const obj = { tag: node.tagName.toLowerCase() };

    if (node.attributes.length > 0) {
      obj.attrs = {};
      for (const attr of node.attributes) obj.attrs[attr.name] = attr.value;
    }

    const children = [];
    for (const child of node.childNodes) {
      const c = nodeToJson(child);
      if (c !== null) children.push(c);
    }

    if (children.length === 1 && typeof children[0] === 'string') {
      obj.text = children[0];
    } else if (children.length > 0) {
      obj.children = children;
    }

    return obj;
  };

  convertBtn.addEventListener('click', () => {
    errorEl.textContent = '';
    const src = inputEl.value.trim();
    if (!src) {
      window.showToast('Nhập markup trước.', 'error');
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(src, mimeType);

      const parseErr = doc.querySelector('parsererror');
      if (parseErr) throw new Error(parseErr.textContent.split('\n')[0]);

      const root = mimeType === 'application/xml' ? doc.documentElement : doc.body;
      const json = nodeToJson(root);
      const pretty = JSON.stringify(json, null, 2);

      outputEl.textContent = pretty;
      resultEl.style.display = '';
    } catch (e) {
      errorEl.textContent = e.message;
      resultEl.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    resultEl.style.display = 'none';
    errorEl.textContent = '';
  });

  copyBtn.addEventListener('click', () => {
    window.copyToClipboard(outputEl.textContent, copyBtn);
  });

  dlBtn.addEventListener('click', () => {
    const blob = new Blob([outputEl.textContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}
