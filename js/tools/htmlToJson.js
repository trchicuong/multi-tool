/**
 * HTML / XML → JSON converter
 */

const SAMPLES = {
  'text/html': `<article class="post" data-id="42">\n  <h1>Example Title</h1>\n  <p>Sample paragraph content.</p>\n  <ul>\n    <li>Item One</li>\n    <li>Item Two</li>\n  </ul>\n</article>`,
  'application/xml': `<catalog>\n  <book id="bk101" lang="en">\n    <title>Example Book</title>\n    <author>Author Name</author>\n    <price currency="USD">29.99</price>\n  </book>\n</catalog>`,
};

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>HTML / XML → JSON</h1>
      <p>Chuyển đổi markup HTML hoặc XML sang cấu trúc cây JSON chuẩn hóa.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="seg-group" role="group" aria-label="Loại markup">
          <button type="button" class="btn btn-sm type-btn active" data-type="text/html">HTML</button>
          <button type="button" class="btn btn-sm type-btn" data-type="application/xml">XML</button>
        </div>
        <div class="d-flex align-center gap-1">
          <button type="button" class="btn btn-ghost btn-sm" id="hjSampleBtn">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="hjClearBtn">Xóa</button>
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="hj-input">Input Markup</label>
        <textarea
          id="hj-input"
          class="mono w-full"
          rows="10"
          placeholder="<div class='card'><h1>Title</h1><p>Body text</p></div>"
          spellcheck="false"
          style="min-height:200px; resize:vertical;"
        ></textarea>
      </div>
      <div class="btn-group">
        <button type="button" class="btn btn-primary" id="hjConvertBtn">Convert → JSON</button>
      </div>
      <div id="hjError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
    </div>

    <div id="hjResult" class="card" style="display:none;">
      <div class="card-header">
        <span class="field-label">JSON Output</span>
        <div class="d-flex align-center gap-1">
          <button type="button" class="copy-btn" id="hjCopyBtn">Copy</button>
          <button type="button" class="btn btn-secondary btn-sm" id="hjDownloadBtn">Download .json</button>
        </div>
      </div>
      <div class="output-box">
        <pre id="hjOutput" style="margin:0; max-height:380px; overflow:auto;"></pre>
      </div>
    </div>
  `;
}

export function init() {
  let mimeType = 'text/html';
  const typeBtns = document.querySelectorAll('.type-btn');
  const inputEl = document.getElementById('hj-input');
  const convertBtn = document.getElementById('hjConvertBtn');
  const sampleBtn = document.getElementById('hjSampleBtn');
  const clearBtn = document.getElementById('hjClearBtn');
  const errorEl = document.getElementById('hjError');
  const resultEl = document.getElementById('hjResult');
  const outputEl = document.getElementById('hjOutput');
  const copyBtn = document.getElementById('hjCopyBtn');
  const dlBtn = document.getElementById('hjDownloadBtn');

  typeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mimeType = btn.dataset.type;
      typeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
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

  const convert = () => {
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

      const root =
        mimeType === 'application/xml'
          ? doc.documentElement
          : doc.body.children.length === 1
            ? doc.body.children[0]
            : doc.body;
      const json = nodeToJson(root);
      const pretty = JSON.stringify(json, null, 2);

      outputEl.textContent = pretty;
      resultEl.style.display = '';
    } catch (e) {
      errorEl.textContent = e.message;
      resultEl.style.display = 'none';
    }
  };

  convertBtn.addEventListener('click', convert);

  sampleBtn.addEventListener('click', () => {
    inputEl.value = SAMPLES[mimeType];
    convert();
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
