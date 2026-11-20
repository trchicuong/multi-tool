/**
 * Diff Checker — line, word & character diff inside minimalist cards
 */
import * as Diff from 'diff';

const SAMPLE_A = `function calculateTotal(items) {
  let total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`;

const SAMPLE_B = `function calculateTotal(items, taxRate = 0.1) {
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  return Number((subtotal * (1 + taxRate)).toFixed(2));
}`;

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Diff Checker</h1>
      <p>So sánh hai đoạn văn bản theo dòng, từ hoặc ký tự với chỉ số dòng rõ ràng.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="seg-group" role="group" aria-label="Chế độ so sánh">
          <button type="button" class="btn btn-sm diff-mode-btn active" data-mode="lines">Dòng (Lines)</button>
          <button type="button" class="btn btn-sm diff-mode-btn" data-mode="words">Từ (Words)</button>
          <button type="button" class="btn btn-sm diff-mode-btn" data-mode="chars">Ký tự (Chars)</button>
        </div>
        <div class="d-flex align-center gap-2 flex-wrap">
          <label class="checkbox-row">
            <input type="checkbox" id="diffIgnoreWs" />
            <span>Bỏ qua khoảng trắng</span>
          </label>
          <button type="button" class="btn btn-ghost btn-sm" id="diffSample">Sample</button>
          <button type="button" class="btn btn-ghost btn-sm" id="diffSwap">⇄ Swap</button>
          <button type="button" class="btn btn-ghost btn-sm" id="diffClear">Xóa</button>
        </div>
      </div>

      <div class="split-editor">
        <div>
          <label class="field-label" for="diffLeft">Văn bản gốc (A)</label>
          <textarea
            class="mono w-full"
            id="diffLeft"
            rows="12"
            placeholder="Dán văn bản gốc vào đây..."
            spellcheck="false"
            style="min-height:240px; resize:vertical;"
          ></textarea>
        </div>
        <div>
          <label class="field-label" for="diffRight">Văn bản mới (B)</label>
          <textarea
            class="mono w-full"
            id="diffRight"
            rows="12"
            placeholder="Dán văn bản mới vào đây..."
            spellcheck="false"
            style="min-height:240px; resize:vertical;"
          ></textarea>
        </div>
      </div>

      <div class="btn-group" style="justify-content:space-between;">
        <div class="d-flex align-center gap-2 flex-wrap">
          <button type="button" class="btn btn-primary" id="diffBtn">So sánh (Ctrl+Enter)</button>
          <span id="diffStats" class="d-flex align-center gap-1"></span>
        </div>
      </div>
    </div>

    <div class="card" id="diffOutputCard" style="display:none;">
      <div class="card-header">
        <span class="field-label">Kết quả so sánh</span>
      </div>
      <div id="diffOutput"></div>
    </div>

    <style>
      .diff-table { width:100%; border-collapse:collapse; font-family:var(--font-mono); font-size:12.5px; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
      .diff-table td.diff-ln { width:44px; min-width:44px; text-align:right; padding:3px 8px; color:var(--text-3); user-select:none; border-right:1px solid var(--border); font-size:11px; }
      .diff-table td.diff-sign { width:24px; min-width:24px; text-align:center; padding:3px 4px; user-select:none; font-weight:700; }
      .diff-table td.diff-code { padding:3px 12px; white-space:pre-wrap; word-break:break-word; line-height:1.6; }
      .diff-added { background:rgba(22,128,61,0.1); }
      .diff-removed { background:rgba(229,57,53,0.1); }
      .diff-added td.diff-sign { color:var(--success); }
      .diff-removed td.diff-sign { color:var(--danger); }
      .diff-added td.diff-code { border-left:3px solid var(--success); }
      .diff-removed td.diff-code { border-left:3px solid var(--danger); }
      body.dark .diff-added { background:rgba(74,222,128,0.09); }
      body.dark .diff-removed { background:rgba(248,113,113,0.09); }
      .diff-inline-box { font-family:var(--font-mono); font-size:13px; line-height:1.7; padding:14px 16px; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); white-space:pre-wrap; word-break:break-word; }
      .diff-ins { background:var(--success-bg); color:var(--success); border-radius:2px; padding:0 2px; }
      .diff-del { background:var(--danger-bg); color:var(--danger); text-decoration:line-through; border-radius:2px; padding:0 2px; }
    </style>
  `;
}

export function init() {
  const leftEl = document.getElementById('diffLeft');
  const rightEl = document.getElementById('diffRight');
  const outCard = document.getElementById('diffOutputCard');
  const outEl = document.getElementById('diffOutput');
  const statsEl = document.getElementById('diffStats');
  const ignoreWsEl = document.getElementById('diffIgnoreWs');
  const diffBtn = document.getElementById('diffBtn');
  const sampleBtn = document.getElementById('diffSample');
  const swapBtn = document.getElementById('diffSwap');
  const clearBtn = document.getElementById('diffClear');

  let mode = 'lines';

  document.querySelectorAll('.diff-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      if (leftEl.value || rightEl.value) run();
    });
  });

  const run = () => {
    const a = leftEl.value;
    const b = rightEl.value;

    if (!a && !b) {
      outCard.style.display = 'none';
      outEl.innerHTML = '';
      statsEl.innerHTML = '';
      return;
    }

    outCard.style.display = '';
    outEl.innerHTML = '';

    if (mode === 'lines') {
      const patches = Diff.diffLines(a, b, { ignoreWhitespace: ignoreWsEl.checked });
      const tableWrap = document.createElement('div');
      tableWrap.className = 'table-wrap';
      const table = document.createElement('table');
      table.className = 'diff-table';

      let addedCount = 0;
      let removedCount = 0;
      let lineA = 1;
      let lineB = 1;

      for (const part of patches) {
        const lines = part.value.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();

        for (const line of lines) {
          const tr = document.createElement('tr');
          const tdA = document.createElement('td');
          const tdB = document.createElement('td');
          const tdSign = document.createElement('td');
          const tdCode = document.createElement('td');

          tdA.className = 'diff-ln';
          tdB.className = 'diff-ln';
          tdSign.className = 'diff-sign';
          tdCode.className = 'diff-code';

          if (part.added) {
            tr.className = 'diff-added';
            tdA.textContent = '';
            tdB.textContent = String(lineB++);
            tdSign.textContent = '+';
            addedCount++;
          } else if (part.removed) {
            tr.className = 'diff-removed';
            tdA.textContent = String(lineA++);
            tdB.textContent = '';
            tdSign.textContent = '−';
            removedCount++;
          } else {
            tdA.textContent = String(lineA++);
            tdB.textContent = String(lineB++);
            tdSign.textContent = ' ';
          }

          tdCode.textContent = line;
          tr.append(tdA, tdB, tdSign, tdCode);
          table.appendChild(tr);
        }
      }

      if (addedCount === 0 && removedCount === 0) {
        outEl.innerHTML = '<span class="badge badge-green">Hai văn bản giống nhau hoàn toàn</span>';
        statsEl.innerHTML = '<span class="badge badge-gray">0 thay đổi</span>';
      } else {
        tableWrap.appendChild(table);
        outEl.appendChild(tableWrap);
        statsEl.innerHTML = `
          <span class="badge badge-green">+${addedCount} thêm</span>
          <span class="badge badge-red">−${removedCount} xóa</span>
        `;
      }
      return;
    }

    const patches =
      mode === 'words'
        ? ignoreWsEl.checked
          ? Diff.diffWords(a, b)
          : Diff.diffWordsWithSpace(a, b)
        : Diff.diffChars(a, b);

    const box = document.createElement('div');
    box.className = 'diff-inline-box';
    let added = 0;
    let removed = 0;

    for (const part of patches) {
      if (part.added) {
        added += part.value.length;
        const span = document.createElement('span');
        span.className = 'diff-ins';
        span.textContent = part.value;
        box.appendChild(span);
      } else if (part.removed) {
        removed += part.value.length;
        const span = document.createElement('span');
        span.className = 'diff-del';
        span.textContent = part.value;
        box.appendChild(span);
      } else {
        box.appendChild(document.createTextNode(part.value));
      }
    }

    if (added === 0 && removed === 0) {
      outEl.innerHTML = '<span class="badge badge-green">Hai văn bản giống nhau hoàn toàn</span>';
      statsEl.innerHTML = '<span class="badge badge-gray">0 thay đổi</span>';
    } else {
      outEl.appendChild(box);
      statsEl.innerHTML = `
        <span class="badge badge-green">+${added} ký tự thêm</span>
        <span class="badge badge-red">−${removed} ký tự xóa</span>
      `;
    }
  };

  diffBtn.addEventListener('click', run);
  ignoreWsEl.addEventListener('change', () => {
    if (leftEl.value || rightEl.value) run();
  });

  sampleBtn.addEventListener('click', () => {
    leftEl.value = SAMPLE_A;
    rightEl.value = SAMPLE_B;
    run();
  });

  swapBtn.addEventListener('click', () => {
    const tmp = leftEl.value;
    leftEl.value = rightEl.value;
    rightEl.value = tmp;
    if (leftEl.value || rightEl.value) run();
  });

  clearBtn.addEventListener('click', () => {
    leftEl.value = '';
    rightEl.value = '';
    outCard.style.display = 'none';
    outEl.innerHTML = '';
    statsEl.innerHTML = '';
  });

  [leftEl, rightEl].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
    });
  });
}
