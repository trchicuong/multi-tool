/**
 * Diff Checker — line-by-line diff with unified view
 */
import * as Diff from 'diff';

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Diff Checker</h1>
      <p>So sánh hai đoạn văn bản và xem sự khác biệt từng dòng.</p>
    </div>

    <div class="split-editor">
      <div class="field">
        <label class="field-label">Văn bản gốc (A)</label>
        <textarea class="mono w-full" id="diffLeft" rows="14" placeholder="Dán văn bản gốc vào đây..." spellcheck="false" style="min-height:240px; resize:vertical;"></textarea>
      </div>
      <div class="field">
        <label class="field-label">Văn bản mới (B)</label>
        <textarea class="mono w-full" id="diffRight" rows="14" placeholder="Dán văn bản mới vào đây..." spellcheck="false" style="min-height:240px; resize:vertical;"></textarea>
      </div>
    </div>

    <div class="btn-group">
      <button class="btn btn-primary" id="diffBtn">So sánh</button>
      <button class="btn btn-ghost" id="diffClear">Xóa tất cả</button>
      <span id="diffStats" class="text-sm text-muted" style="align-self:center; margin-left:4px;"></span>
    </div>

    <div id="diffOutput" style="margin-top:16px;"></div>

    <style>
      .diff-table { width:100%; border-collapse:collapse; font-family:var(--font-mono); font-size:12.5px; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
      .diff-table tr td:first-child { width:36px; min-width:36px; text-align:right; padding:2px 8px; color:var(--text-3); user-select:none; border-right:1px solid var(--border); font-size:11px; }
      .diff-table tr td:last-child { padding:2px 12px; white-space:pre-wrap; word-break:break-all; line-height:1.65; }
      .diff-added   { background:rgba(26,138,74,0.1); }
      .diff-removed { background:rgba(229,57,53,0.1); }
      .diff-added   td:first-child { color:var(--success); }
      .diff-removed td:first-child { color:var(--danger); }
      .diff-added   td:last-child { border-left:3px solid var(--success); }
      .diff-removed td:last-child { border-left:3px solid var(--danger); }
      body.dark .diff-added   { background:rgba(74,222,128,0.08); }
      body.dark .diff-removed { background:rgba(248,113,113,0.08); }
    </style>
  `;
}

export function init() {
  const leftEl = document.getElementById('diffLeft');
  const rightEl = document.getElementById('diffRight');
  const outEl = document.getElementById('diffOutput');
  const statsEl = document.getElementById('diffStats');
  const diffBtn = document.getElementById('diffBtn');
  const clearBtn = document.getElementById('diffClear');

  const run = () => {
    const a = leftEl.value;
    const b = rightEl.value;

    if (!a.trim() && !b.trim()) {
      outEl.innerHTML = '';
      statsEl.textContent = '';
      return;
    }

    const patches = Diff.diffLines(a, b);
    const table = document.createElement('table');
    table.className = 'diff-table';

    let addedCount = 0;
    let removedCount = 0;
    let lineNum = 1;

    for (const part of patches) {
      const lines = part.value.split('\n');
      // Remove trailing empty string caused by trailing newline
      if (lines[lines.length - 1] === '') lines.pop();

      for (const line of lines) {
        const tr = document.createElement('tr');

        const numTd = document.createElement('td');
        const contentTd = document.createElement('td');

        if (part.added) {
          tr.className = 'diff-added';
          numTd.textContent = '+';
          addedCount++;
        } else if (part.removed) {
          tr.className = 'diff-removed';
          numTd.textContent = '−';
          removedCount++;
        } else {
          numTd.textContent = lineNum++;
        }

        contentTd.textContent = line;
        tr.append(numTd, contentTd);
        table.appendChild(tr);
      }
      if (!part.removed) lineNum += 0; // keep counter for added lines
    }

    outEl.innerHTML = '';
    if (patches.length === 1 && !patches[0].added && !patches[0].removed) {
      outEl.innerHTML = '<p class="text-sm text-muted">Không có sự khác biệt.</p>';
      statsEl.textContent = '';
    } else {
      outEl.appendChild(table);
      statsEl.textContent = `+${addedCount} dòng thêm  −${removedCount} dòng xóa`;
    }
  };

  diffBtn.addEventListener('click', run);

  clearBtn.addEventListener('click', () => {
    leftEl.value = '';
    rightEl.value = '';
    outEl.innerHTML = '';
    statsEl.textContent = '';
  });

  // Auto-diff on Ctrl+Enter
  [leftEl, rightEl].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
    });
  });
}
