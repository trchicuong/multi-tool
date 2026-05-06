/**
 * Minify / Unminify — JS, CSS, HTML (client-side only, no Terser CDN)
 * JS: uses simple regex-based minify + js-beautify-like indent for unminify
 * CSS/HTML: regex-based
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Minify / Unminify</h1>
      <p>Nén hoặc định dạng lại code JavaScript, CSS, HTML.</p>
    </div>

    <div class="card">
      <div class="d-flex align-center gap-2 mb-2" style="flex-wrap:wrap; justify-content:space-between;">
        <div class="d-flex gap-1">
          <button class="btn btn-secondary btn-sm lang-btn active" data-lang="js">JS</button>
          <button class="btn btn-secondary btn-sm lang-btn" data-lang="css">CSS</button>
          <button class="btn btn-secondary btn-sm lang-btn" data-lang="html">HTML</button>
        </div>
        <div id="minifyStats" class="text-sm text-muted"></div>
      </div>

      <div class="split-editor">
        <div>
          <div class="field-label">Input</div>
          <textarea class="mono w-full" id="minifyInput" rows="16" placeholder="Dán code của bạn vào đây..." spellcheck="false" style="min-height:300px; resize:vertical;"></textarea>
        </div>
        <div style="position:relative;">
          <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
            <div class="field-label" style="margin:0;">Output</div>
            <button class="copy-btn" id="minifyCopyBtn">Copy</button>
          </div>
          <textarea class="mono w-full" id="minifyOutput" rows="16" readonly placeholder="Kết quả..." spellcheck="false" style="min-height:300px; resize:vertical; background:var(--code-bg);"></textarea>
        </div>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" id="minifyBtn">Minify</button>
        <button class="btn btn-secondary" id="unminifyBtn">Unminify / Prettify</button>
        <button class="btn btn-ghost" id="minifySwap">⇄ Swap</button>
        <button class="btn btn-ghost" id="minifyClear">Xóa</button>
      </div>
    </div>

    <style>
      .lang-btn.active { background:var(--accent); color:#fff; border-color:var(--accent); }
    </style>
  `;
}

export function init() {
  const inputEl = document.getElementById('minifyInput');
  const outputEl = document.getElementById('minifyOutput');
  const statsEl = document.getElementById('minifyStats');
  const copyBtn = document.getElementById('minifyCopyBtn');
  const minifyBtn = document.getElementById('minifyBtn');
  const unminifyBtn = document.getElementById('unminifyBtn');
  const swapBtn = document.getElementById('minifySwap');
  const clearBtn = document.getElementById('minifyClear');
  const langBtns = document.querySelectorAll('.lang-btn');

  let lang = 'js';

  langBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      langBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const showStats = (input, output) => {
    if (!input || !output) {
      statsEl.textContent = '';
      return;
    }
    const ratio = ((1 - output.length / input.length) * 100).toFixed(1);
    statsEl.textContent = `${input.length} → ${output.length} chars ${ratio > 0 ? `(−${ratio}%)` : ''}`;
  };

  // ── Minifiers ──────────────────────────────────────────────────────────

  const minifyCSS = (css) =>
    css
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
      .replace(/\s*([{};:,>~+])\s*/g, '$1') // remove space around operators
      .replace(/\s+/g, ' ') // collapse whitespace
      .replace(/;\}/g, '}') // remove last semicolon in block
      .trim();

  const minifyHTML = (html) =>
    html
      .replace(/<!--[\s\S]*?-->/g, '') // remove comments
      .replace(/\s+/g, ' ') // collapse whitespace
      .replace(/>\s+</g, '><') // remove whitespace between tags
      .trim();

  const minifyJS = (js) =>
    js
      .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
      .replace(/\/\/[^\n]*/g, '') // line comments
      .replace(/\n\s*/g, '\n') // leading whitespace
      .replace(/\n+/g, ' ') // newlines
      .replace(/\s{2,}/g, ' ') // multiple spaces
      .replace(/\s*([=+\-*/<>!&|,;:{}()\[\]])\s*/g, '$1') // spaces around operators
      .trim();

  // ── Unminifiers ────────────────────────────────────────────────────────

  const unminifyCSS = (css) => {
    return css
      .replace(/\{/g, ' {\n  ')
      .replace(/;/g, ';\n  ')
      .replace(/\}/g, '\n}\n')
      .replace(/,\s*/g, ',\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  const unminifyHTML = (html) => {
    let indent = 0;
    const voidTags = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]);
    return html
      .replace(/></g, '>\n<')
      .split('\n')
      .map((line) => {
        line = line.trim();
        if (!line) return '';
        if (line.match(/^<\/[^>]+>/)) indent = Math.max(0, indent - 1);
        const result = '  '.repeat(indent) + line;
        const tagMatch = line.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
        if (tagMatch && !voidTags.has(tagMatch[1].toLowerCase()) && !line.match(/\/>/)) {
          if (!line.startsWith('</')) indent++;
        }
        if (line.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>.*<\/\1>/)) indent = Math.max(0, indent - 1);
        return result;
      })
      .filter(Boolean)
      .join('\n');
  };

  const unminifyJS = (js) => {
    let result = '';
    let indent = 0;
    let i = 0;
    const pad = () => '  '.repeat(indent);

    while (i < js.length) {
      const ch = js[i];
      if (ch === '{' || ch === '[' || ch === '(') {
        result += ch + '\n';
        indent++;
        result += pad();
      } else if (ch === '}' || ch === ']' || ch === ')') {
        indent = Math.max(0, indent - 1);
        result += '\n' + pad() + ch;
        if (
          i + 1 < js.length &&
          js[i + 1] !== ';' &&
          js[i + 1] !== ')' &&
          js[i + 1] !== ',' &&
          js[i + 1] !== ']'
        ) {
          result += '\n' + pad();
        }
      } else if (ch === ';') {
        result += ch + '\n' + pad();
      } else if (ch === ',') {
        result += ch + '\n' + pad();
      } else {
        result += ch;
      }
      i++;
    }
    return result.replace(/\n\s*\n/g, '\n').trim();
  };

  // ── Actions ────────────────────────────────────────────────────────────

  const run = (mode) => {
    const input = inputEl.value;
    if (!input.trim()) {
      window.showToast('Nhập code trước.', 'error');
      return;
    }

    let output = '';
    try {
      if (mode === 'minify') {
        if (lang === 'css') output = minifyCSS(input);
        else if (lang === 'html') output = minifyHTML(input);
        else output = minifyJS(input);
      } else {
        if (lang === 'css') output = unminifyCSS(input);
        else if (lang === 'html') output = unminifyHTML(input);
        else output = unminifyJS(input);
      }
      outputEl.value = output;
      showStats(input, output);
    } catch (e) {
      window.showToast('Lỗi: ' + e.message, 'error');
    }
  };

  minifyBtn.addEventListener('click', () => run('minify'));
  unminifyBtn.addEventListener('click', () => run('unminify'));

  copyBtn.addEventListener('click', () => {
    if (outputEl.value.trim()) window.copyToClipboard(outputEl.value, copyBtn);
  });

  swapBtn.addEventListener('click', () => {
    const tmp = inputEl.value;
    inputEl.value = outputEl.value;
    outputEl.value = tmp;
    statsEl.textContent = '';
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    statsEl.textContent = '';
    inputEl.focus();
  });
}
