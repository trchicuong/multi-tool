/**
 * Regex Tester — real-time highlight, capture groups, presets & replace/substitution
 */

const PRESETS = [
  {
    label: 'Email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'gi',
    sample: 'Liên hệ: dev@example.com hoặc support.vn@company.io',
  },
  {
    label: 'URL',
    pattern: 'https?:\\/\\/[\\w.-]+(?:\\.[a-z]{2,})(?:[\\/\\w .-]*)*\\/?(?:\\?[^\\s]*)?',
    flags: 'gi',
    sample: 'Visit https://example.com/docs?page=1 or http://localhost:3000/api',
  },
  {
    label: 'Phone',
    pattern: '(?:\\+?\\d{1,3}[-.\\s]?)?(?:\\(?\\d{3}\\)?[-.\\s]?)?\\d{3}[-.\\s]?\\d{4}\\b',
    flags: 'g',
    sample: 'Support: +1-555-234-5678, Mobile: 0901234567, invalid: 123',
  },
  {
    label: 'IPv4',
    pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    sample: 'Server: 192.168.1.1, DNS: 8.8.8.8, Invalid: 999.10.0.1',
  },
  {
    label: 'Date YYYY-MM-DD',
    pattern: '(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    sample: 'Created: 2026-11-20, Updated: 2026-12-05',
  },
  {
    label: 'Hex Color',
    pattern: '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b',
    flags: 'gi',
    sample: 'Accent: #0066ff, Dark: #0c0c0c, Short: #fff',
  },
  {
    label: 'Slug',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    flags: 'gm',
    sample: 'example-item-slug\njson-formatter\nInvalid Slug!',
  },
];

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Regex Tester</h1>
      <p>Kiểm tra Regular Expression theo thời gian thực, hỗ trợ Replace ($1, $2), Preset và Capture Groups.</p>
    </div>

    <div class="card">
      <div class="field">
        <span class="field-label">Mẫu phổ biến (Quick Presets)</span>
        <div class="preset-strip">
          ${PRESETS.map(
            (p, idx) =>
              `<button type="button" class="btn btn-secondary btn-sm rx-preset" data-idx="${idx}">${p.label}</button>`,
          ).join('')}
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="rxPattern">Pattern &amp; Flags</label>
        <div class="d-flex gap-1 align-center">
          <div class="d-flex flex-1" style="align-items:stretch;">
            <span style="display:flex; align-items:center; padding:0 10px; background:var(--surface-2); border:1px solid var(--border); border-right:none; border-radius:var(--radius) 0 0 var(--radius); color:var(--text-3); font-family:var(--font-mono);">/</span>
            <input type="text" id="rxPattern" class="mono" placeholder="([a-z]+)\\d+" style="border-radius:0; flex:1;" spellcheck="false" autocomplete="off" />
            <span style="display:flex; align-items:center; padding:0 10px; background:var(--surface-2); border:1px solid var(--border); border-left:none; border-radius:0 var(--radius) var(--radius) 0; color:var(--text-3); font-family:var(--font-mono);">/</span>
          </div>
          <input type="text" id="rxFlags" class="mono" value="gi" placeholder="gi" maxlength="10" style="width:72px; text-align:center;" spellcheck="false" autocomplete="off" aria-label="Regex flags" />
          <button type="button" class="btn btn-ghost btn-sm" id="rxClearBtn">Xóa</button>
        </div>
        <div id="rxPatternErr" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
      </div>

      <div class="field">
        <div class="card-header" style="margin-bottom:6px;">
          <label class="field-label" for="rxText">Test String</label>
          <span id="rxMatchCount" class="badge badge-gray">0 matches</span>
        </div>
        <textarea id="rxText" rows="6" placeholder="Nhập đoạn văn bản để kiểm tra..." spellcheck="false" style="min-height:140px; resize:vertical;" class="mono"></textarea>
      </div>

      <div id="rxHighlightWrap" style="display:none; margin-top:12px;">
        <div class="field-label">Kết quả Highlight</div>
        <div id="rxHighlight" style="
          font-family:var(--font-mono);
          font-size:13px;
          line-height:1.7;
          padding:12px 14px;
          background:var(--code-bg);
          border:1px solid var(--border);
          border-radius:var(--radius);
          white-space:pre-wrap;
          word-break:break-word;
          max-height:240px;
          overflow:auto;
        "></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <label class="field-label" for="rxReplace">Replace / Substitution (tuỳ chọn)</label>
        <button type="button" class="copy-btn" id="rxCopyReplaced">Copy kết quả</button>
      </div>
      <div class="field">
        <input type="text" id="rxReplace" class="mono" placeholder="Ví dụ: [$1] hoặc $2/$1 (hỗ trợ $1, $2, $&)" spellcheck="false" />
      </div>
      <div class="output-box" id="rxReplaceBox" style="display:none;">
        <pre id="rxReplaceOut" style="margin:0; max-height:200px;"></pre>
      </div>
    </div>

    <div id="rxGroups"></div>

    <details class="card">
      <summary style="cursor:pointer; font-size:13px; font-weight:500; color:var(--text-2);">Quick Reference</summary>
      <div style="margin-top:12px; display:grid; grid-template-columns:repeat(auto-fill, minmax(210px,1fr)); gap:8px 20px; font-size:12.5px;">
        ${[
          ['.', 'Bất kỳ ký tự'],
          ['\\d', 'Chữ số [0-9]'],
          ['\\w', 'Ký tự từ [a-zA-Z0-9_]'],
          ['\\s', 'Khoảng trắng'],
          ['\\b', 'Ranh giới từ'],
          ['^', 'Đầu chuỗi'],
          ['$', 'Cuối chuỗi'],
          ['*', '0 hoặc nhiều'],
          ['+', '1 hoặc nhiều'],
          ['?', '0 hoặc 1'],
          ['{n,m}', 'Từ n đến m lần'],
          ['(abc)', 'Nhóm bắt (Capture Group)'],
          ['(?:abc)', 'Nhóm không bắt'],
          ['[abc]', 'Bộ ký tự'],
          ['[^abc]', 'Phủ định bộ'],
          ['a|b', 'a hoặc b'],
        ]
          .map(
            ([sym, desc]) =>
              `<div><code style="color:var(--accent); font-family:var(--font-mono);">${sym}</code> — ${desc}</div>`,
          )
          .join('')}
      </div>
    </details>

    <style>
      mark.rx-match {
        background: rgba(0,102,255,0.18);
        border-radius: 2px;
        outline: 1px solid rgba(0,102,255,0.4);
        color: inherit;
      }
      body.dark mark.rx-match {
        background: rgba(77,148,255,0.25);
        outline: 1px solid rgba(77,148,255,0.5);
      }
    </style>
  `;
}

export function init() {
  const patternEl = document.getElementById('rxPattern');
  const flagsEl = document.getElementById('rxFlags');
  const textEl = document.getElementById('rxText');
  const replaceEl = document.getElementById('rxReplace');
  const replaceBox = document.getElementById('rxReplaceBox');
  const replaceOut = document.getElementById('rxReplaceOut');
  const copyReplBtn = document.getElementById('rxCopyReplaced');
  const patErrEl = document.getElementById('rxPatternErr');
  const countEl = document.getElementById('rxMatchCount');
  const hlWrap = document.getElementById('rxHighlightWrap');
  const hlEl = document.getElementById('rxHighlight');
  const groupsEl = document.getElementById('rxGroups');
  const clearBtn = document.getElementById('rxClearBtn');

  const update = () => {
    const pattern = patternEl.value;
    const rawFlags = flagsEl.value;
    const text = textEl.value;

    patErrEl.textContent = '';
    hlWrap.style.display = 'none';
    groupsEl.innerHTML = '';
    replaceBox.style.display = 'none';
    countEl.textContent = '0 matches';
    countEl.className = 'badge badge-gray';

    if (!pattern) return;

    let iterRegex;
    let replaceRegex;
    try {
      const uniqueFlags = [...new Set(rawFlags.split(''))].join('');
      const iterFlags = uniqueFlags.includes('g') ? uniqueFlags : uniqueFlags + 'g';
      iterRegex = new RegExp(pattern, iterFlags);
      replaceRegex = new RegExp(pattern, uniqueFlags);
    } catch (e) {
      patErrEl.textContent = e.message;
      return;
    }

    const matches = [];
    for (const m of text.matchAll(iterRegex)) {
      matches.push(m);
      if (matches.length >= 500) break;
    }

    countEl.textContent = `${matches.length}${matches.length >= 500 ? '+' : ''} match${matches.length !== 1 ? 'es' : ''}`;
    countEl.className = `badge ${matches.length > 0 ? 'badge-blue' : 'badge-gray'}`;

    if (text.length === 0) return;

    let highlighted = '';
    let lastIdx = 0;
    for (const m of matches) {
      const start = m.index;
      const end = start + m[0].length;
      if (start < lastIdx) continue;
      highlighted += escHtml(text.slice(lastIdx, start));
      highlighted += m[0].length
        ? `<mark class="rx-match">${escHtml(m[0])}</mark>`
        : `<mark class="rx-match" title="Zero-length match">|</mark>`;
      lastIdx = end;
    }
    highlighted += escHtml(text.slice(lastIdx));
    hlEl.innerHTML = highlighted;
    hlWrap.style.display = '';

    // Replace output
    if (replaceEl.value !== '') {
      replaceOut.textContent = text.replace(replaceRegex, replaceEl.value);
      replaceBox.style.display = '';
    }

    // Capture groups
    if (matches.length > 0 && matches[0].length > 1) {
      const rows = matches
        .slice(0, 30)
        .map((m, i) => {
          const groups = Array.from(m)
            .slice(1)
            .map((g) => `<td>${g !== undefined ? escHtml(g) : '<span class="text-muted">—</span>'}</td>`)
            .join('');
          return `<tr><td class="text-muted">${i + 1}</td><td><code>${escHtml(m[0])}</code></td>${groups}</tr>`;
        })
        .join('');

      const headers = Array.from(matches[0])
        .slice(1)
        .map((_, i) => `<th>Group ${i + 1}</th>`)
        .join('');

      groupsEl.innerHTML = `
        <div class="card">
          <div class="card-header">
            <span class="field-label">Capture Groups (tối đa 30 match đầu)</span>
          </div>
          <div class="table-wrap">
            <table><thead><tr><th>#</th><th>Match</th>${headers}</tr></thead><tbody>${rows}</tbody></table>
          </div>
        </div>`;
    }
  };

  document.querySelectorAll('.rx-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = PRESETS[Number(btn.dataset.idx)];
      if (!p) return;
      patternEl.value = p.pattern;
      flagsEl.value = p.flags;
      textEl.value = p.sample;
      update();
    });
  });

  copyReplBtn.addEventListener('click', () => {
    if (replaceOut.textContent) window.copyToClipboard(replaceOut.textContent, copyReplBtn);
  });

  clearBtn.addEventListener('click', () => {
    patternEl.value = '';
    textEl.value = '';
    replaceEl.value = '';
    update();
    patternEl.focus();
  });

  [patternEl, flagsEl, textEl, replaceEl].forEach((el) => el.addEventListener('input', update));
}
