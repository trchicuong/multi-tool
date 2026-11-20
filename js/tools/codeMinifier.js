/**
 * Minify / Unminify — String & comment-aware JS, CSS, HTML formatter/minifier
 */

const SAMPLES = {
  js: `// Fetch user profile safely\nasync function fetchUser(id) {\n  const url = "https://api.example.com/users/" + id;\n  const res = await fetch(url, { headers: { "Accept": "application/json" } });\n  if (!res.ok) {\n    throw new Error("HTTP " + res.status);\n  }\n  return res.json();\n}`,
  css: `/* Card component */\n.card {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  padding: 16px 20px;\n}\n.card:hover {\n  border-color: var(--accent);\n}`,
  html: `<!-- Header section -->\n<header class="topbar">\n  <h1>Example Title</h1>\n  <nav><a href="#home">Home</a><a href="#docs">Docs</a></nav>\n</header>`,
};

/**
 * Tokenizes JS so strings ("...", '...', `...`) and comments (//..., /*...*\/)
 * are never mangled by minification or pretty-printing.
 */
function tokenizeJS(code) {
  const tokens = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    const ch = code[i];

    // String or template literal
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let val = ch;
      i++;
      while (i < n) {
        const c = code[i];
        val += c;
        if (c === '\\' && i + 1 < n) {
          i++;
          val += code[i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', value: val });
      continue;
    }

    // Line comment
    if (ch === '/' && code[i + 1] === '/') {
      let val = '';
      while (i < n && code[i] !== '\n') val += code[i++];
      tokens.push({ type: 'comment', value: val });
      continue;
    }

    // Block comment
    if (ch === '/' && code[i + 1] === '*') {
      let val = '/*';
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) val += code[i++];
      if (i < n) {
        val += '*/';
        i += 2;
      }
      tokens.push({ type: 'comment', value: val });
      continue;
    }

    // Code run until next string or comment
    let val = '';
    while (
      i < n &&
      code[i] !== '"' &&
      code[i] !== "'" &&
      code[i] !== '`' &&
      !(code[i] === '/' && (code[i + 1] === '/' || code[i + 1] === '*'))
    ) {
      val += code[i++];
    }
    if (val) tokens.push({ type: 'code', value: val });
  }
  return tokens;
}

function minifyJS(js) {
  const tokens = tokenizeJS(js);
  const parts = [];
  for (const tok of tokens) {
    if (tok.type === 'comment') continue;
    if (tok.type === 'string') {
      parts.push(tok.value);
    } else {
      const compacted = tok.value
        .replace(/\s+/g, ' ')
        .replace(/\s*([=+\-*/<>!&|,;:{}()[\]?])\s*/g, '$1')
        .trim();
      if (compacted) parts.push(compacted);
    }
  }
  // Ensure identifiers adjacent to strings keep safe spacing if needed
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    const cur = parts[i];
    const prev = out.slice(-1);
    if (prev && /[a-zA-Z0-9_$]/.test(prev) && /^[a-zA-Z0-9_$]/.test(cur)) {
      out += ' ';
    }
    out += cur;
  }
  return out.trim();
}

function unminifyJS(js) {
  const tokens = tokenizeJS(js);
  let out = '';
  let indent = 0;
  let parenDepth = 0;
  const pad = () => '  '.repeat(indent);

  for (const tok of tokens) {
    if (tok.type === 'comment') {
      out += tok.value + '\n' + pad();
      continue;
    }
    if (tok.type === 'string') {
      out += tok.value;
      continue;
    }

    const code = tok.value.replace(/\s+/g, ' ');
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === '(') {
        parenDepth++;
        out += '(';
      } else if (ch === ')') {
        parenDepth = Math.max(0, parenDepth - 1);
        out += ')';
      } else if (ch === '{') {
        out = out.trimEnd() + ' {\n';
        indent++;
        out += pad();
      } else if (ch === '}') {
        indent = Math.max(0, indent - 1);
        out = out.trimEnd() + '\n' + pad() + '}';
        const next = code[i + 1];
        if (next && next !== ';' && next !== ',' && next !== ')' && next !== '}') {
          out += '\n' + pad();
        }
      } else if (ch === ';' && parenDepth === 0) {
        out += ';\n' + pad();
      } else if (ch === ',' && parenDepth > 0) {
        out += ', ';
      } else if (ch === ' ') {
        if (!out.endsWith(' ') && !out.endsWith('\n') && !out.endsWith('(')) {
          out += ' ';
        }
      } else {
        out += ch;
      }
    }
  }

  return out
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim();
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{};:,>~+])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/;\}/g, '}')
    .trim();
}

function unminifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, (m) => `${m}\n`)
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/\s*;\s*/g, ';\n  ')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/\n\s*\n/g, '\n')
    .replace(/  \n\}/g, '\n}')
    .trim();
}

function minifyHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

function unminifyHTML(html) {
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
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map((line) => {
      line = line.trim();
      if (!line) return '';
      if (/^<\/[^>]+>/.test(line)) indent = Math.max(0, indent - 1);
      const result = '  '.repeat(indent) + line;
      const tagMatch = line.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
      const isSelfClosing = /\/>$/.test(line) || /^<([a-zA-Z][a-zA-Z0-9-]*)[^>]*>.*<\/\1>$/.test(line);
      if (
        tagMatch &&
        !voidTags.has(tagMatch[1].toLowerCase()) &&
        !isSelfClosing &&
        !line.startsWith('</') &&
        !line.startsWith('<!')
      ) {
        indent++;
      }
      return result;
    })
    .filter(Boolean)
    .join('\n');
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Minify / Unminify</h1>
      <p>Nén hoặc định dạng lại code JavaScript, CSS, HTML an toàn (bảo toàn chuỗi và URL).</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="seg-group" role="group" aria-label="Ngôn ngữ">
          <button type="button" class="btn btn-sm lang-btn active" data-lang="js">JS</button>
          <button type="button" class="btn btn-sm lang-btn" data-lang="css">CSS</button>
          <button type="button" class="btn btn-sm lang-btn" data-lang="html">HTML</button>
        </div>
        <div class="d-flex align-center gap-2 flex-wrap">
          <span id="minifyStats" class="text-sm text-muted mono"></span>
          <button type="button" class="btn btn-ghost btn-sm" id="minifySample">Sample</button>
        </div>
      </div>

      <div class="split-editor">
        <div>
          <div class="card-header" style="margin-bottom:6px;">
            <span class="field-label">Input</span>
            <button type="button" class="btn btn-ghost btn-sm" id="minifyClear">Xóa</button>
          </div>
          <textarea
            class="mono w-full"
            id="minifyInput"
            rows="16"
            placeholder="Dán code của bạn vào đây..."
            spellcheck="false"
            style="min-height:320px; resize:vertical;"
          ></textarea>
        </div>
        <div>
          <div class="card-header" style="margin-bottom:6px;">
            <span class="field-label">Output</span>
            <div class="d-flex align-center gap-1">
              <button type="button" class="copy-btn" id="minifyCopyBtn">Copy</button>
              <button type="button" class="btn btn-secondary btn-sm" id="minifyDownloadBtn">Download</button>
            </div>
          </div>
          <textarea
            class="mono w-full"
            id="minifyOutput"
            rows="16"
            readonly
            placeholder="Kết quả..."
            spellcheck="false"
            style="min-height:320px; resize:vertical; background:var(--code-bg);"
          ></textarea>
        </div>
      </div>

      <div class="btn-group">
        <button type="button" class="btn btn-primary" id="minifyBtn">Minify</button>
        <button type="button" class="btn btn-secondary" id="unminifyBtn">Unminify / Prettify</button>
        <button type="button" class="btn btn-ghost" id="minifySwap">⇄ Swap</button>
      </div>
    </div>
  `;
}

export function init() {
  const inputEl = document.getElementById('minifyInput');
  const outputEl = document.getElementById('minifyOutput');
  const statsEl = document.getElementById('minifyStats');
  const copyBtn = document.getElementById('minifyCopyBtn');
  const dlBtn = document.getElementById('minifyDownloadBtn');
  const sampleBtn = document.getElementById('minifySample');
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
    const diffStr =
      Number(ratio) > 0 ? `(−${ratio}%)` : Number(ratio) < 0 ? `(+${Math.abs(Number(ratio))}%)` : '';
    statsEl.textContent = `${input.length} → ${output.length} chars ${diffStr}`;
  };

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

  sampleBtn.addEventListener('click', () => {
    inputEl.value = SAMPLES[lang];
    run('minify');
  });

  copyBtn.addEventListener('click', () => {
    if (outputEl.value.trim()) window.copyToClipboard(outputEl.value, copyBtn);
  });

  dlBtn.addEventListener('click', () => {
    if (!outputEl.value.trim()) {
      window.showToast('Chưa có kết quả để tải về', 'error');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output.${lang}`;
    a.click();
    URL.revokeObjectURL(url);
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
