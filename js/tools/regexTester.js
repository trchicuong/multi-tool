/**
 * Regex Tester — test regex patterns against text in real time
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Regex Tester</h1>
      <p>Kiểm tra Regular Expression với text, xem highlight match trực tiếp.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label">Pattern</label>
        <div class="d-flex gap-1" style="align-items:stretch;">
          <span style="display:flex; align-items:center; padding:0 10px; background:var(--surface-2); border:1px solid var(--border); border-right:none; border-radius:var(--radius) 0 0 var(--radius); color:var(--text-3); font-family:var(--font-mono);">/</span>
          <input type="text" id="rxPattern" class="mono" placeholder="([a-z]+)\\d+" style="border-radius:0; flex:1;" spellcheck="false" autocomplete="off" />
          <span style="display:flex; align-items:center; padding:0 10px; background:var(--surface-2); border:1px solid var(--border); border-left:none; border-radius:0 var(--radius) var(--radius) 0; color:var(--text-3); font-family:var(--font-mono);">/</span>
          <input type="text" id="rxFlags" class="mono" placeholder="gi" maxlength="10" style="width:64px; text-align:center;" spellcheck="false" autocomplete="off" />
        </div>
        <div id="rxPatternErr" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
      </div>

      <div class="field">
        <div class="d-flex align-center gap-2" style="justify-content:space-between;">
          <label class="field-label" style="margin:0;">Test String</label>
          <span id="rxMatchCount" class="badge badge-gray text-sm">0 matches</span>
        </div>
        <textarea id="rxText" rows="8" placeholder="Nhập đoạn văn bản để kiểm tra..." spellcheck="false" style="min-height:160px; resize:vertical;" class="mono"></textarea>
      </div>

      <!-- Highlighted output -->
      <div id="rxHighlight" style="
        display:none;
        font-family:var(--font-mono);
        font-size:13px;
        line-height:1.7;
        padding:12px 14px;
        background:var(--code-bg);
        border:1px solid var(--border);
        border-radius:var(--radius);
        white-space:pre-wrap;
        word-break:break-all;
        margin-top:10px;
        max-height:240px;
        overflow:auto;
      "></div>
    </div>

    <!-- Match groups -->
    <div id="rxGroups" style="margin-top:12px;"></div>

    <!-- Quick reference -->
    <details class="card" style="margin-top:12px;">
      <summary style="cursor:pointer; font-size:13px; font-weight:500; color:var(--text-2);">Quick Reference</summary>
      <div style="margin-top:12px; display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:6px 20px; font-size:12.5px;">
        ${[
          ['.', 'Bất kỳ ký tự'],
          ['\\\\d', 'Chữ số [0-9]'],
          ['\\\\w', 'Ký tự từ [a-zA-Z0-9_]'],
          ['\\\\s', 'Khoảng trắng'],
          ['\\\\b', 'Ranh giới từ'],
          ['^', 'Đầu chuỗi'],
          ['$', 'Cuối chuỗi'],
          ['*', '0 hoặc nhiều'],
          ['+', '1 hoặc nhiều'],
          ['?', '0 hoặc 1'],
          ['{n,m}', 'Từ n đến m lần'],
          ['(abc)', 'Nhóm bắt'],
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
  const patErrEl = document.getElementById('rxPatternErr');
  const countEl = document.getElementById('rxMatchCount');
  const hlEl = document.getElementById('rxHighlight');
  const groupsEl = document.getElementById('rxGroups');

  const update = () => {
    const pattern = patternEl.value;
    const flags = flagsEl.value || 'g';
    const text = textEl.value;

    patErrEl.textContent = '';
    hlEl.style.display = 'none';
    groupsEl.innerHTML = '';
    countEl.textContent = '0 matches';
    countEl.className = 'badge badge-gray text-sm';

    if (!pattern) return;

    let regex;
    try {
      // Ensure global flag for iteration
      const f = flags.includes('g') ? flags : flags + 'g';
      regex = new RegExp(pattern, f);
    } catch (e) {
      patErrEl.textContent = e.message;
      return;
    }

    const matches = [...text.matchAll(regex)];
    countEl.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;
    countEl.className = `badge ${matches.length > 0 ? 'badge-blue' : 'badge-gray'} text-sm`;

    if (text.length === 0) return;

    // Build highlighted output
    let highlighted = '';
    let lastIdx = 0;
    for (const m of matches) {
      const start = m.index;
      const end = start + m[0].length;
      highlighted += escHtml(text.slice(lastIdx, start));
      highlighted += `<mark class="rx-match">${escHtml(m[0])}</mark>`;
      lastIdx = end;
    }
    highlighted += escHtml(text.slice(lastIdx));
    hlEl.innerHTML = highlighted;
    hlEl.style.display = 'block';

    // Show groups
    if (matches.length > 0 && matches[0].length > 1) {
      const rows = matches
        .slice(0, 30)
        .map((m, i) => {
          const groups = Array.from(m)
            .slice(1)
            .map(
              (g, gi) =>
                `<td>${g !== undefined ? escHtml(g) : '<span class="text-muted">—</span>'}</td>`,
            )
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
          <div class="field-label">Capture Groups (first 30 matches)</div>
          <div class="table-wrap">
            <table><thead><tr><th>#</th><th>Match</th>${headers}</tr></thead><tbody>${rows}</tbody></table>
          </div>
        </div>`;
    }
  };

  patternEl.addEventListener('input', update);
  flagsEl.addEventListener('input', update);
  textEl.addEventListener('input', update);
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
