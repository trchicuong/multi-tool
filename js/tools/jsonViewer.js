/**
 * JSON Tree Viewer — interactive collapsible tree
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>JSON Tree Viewer</h1>
      <p>Xem JSON dưới dạng cây có thể thu gọn / mở rộng.</p>
    </div>

    <div class="row" style="align-items:flex-start; gap:16px;">
      <div class="card flex-1" style="min-width:260px;">
        <div class="field-label">JSON Input</div>
        <textarea
          class="mono w-full"
          id="jvInput"
          rows="16"
          placeholder='{ "name": "Alice", "scores": [10, 20, 30] }'
          style="min-height:280px; resize:vertical;"
          spellcheck="false"
        ></textarea>
        <div class="btn-group">
          <button class="btn btn-primary" id="jvRenderBtn">Render Tree</button>
          <button class="btn btn-ghost" id="jvExpandAll">Expand All</button>
          <button class="btn btn-ghost" id="jvCollapseAll">Collapse All</button>
        </div>
        <div id="jvError" class="text-sm text-danger mt-1" style="min-height:16px;"></div>
      </div>

      <div class="card flex-1" style="min-width:260px; overflow:auto; max-height:520px;">
        <div class="field-label">Tree View</div>
        <div id="jvTree" style="font-family:var(--font-mono); font-size:13px;">
          <span class="text-muted text-sm">Nhập JSON và nhấn Render Tree.</span>
        </div>
      </div>
    </div>

    <style>
      .jv-ul { list-style:none; padding-left:18px; margin:0; border-left:1px solid var(--border); }
      .jv-ul.root { padding-left:0; border-left:none; }
      .jv-li { padding:1px 0; line-height:1.7; }
      .jv-toggle { cursor:pointer; user-select:none; color:var(--text-3); font-size:10px; margin-right:4px; display:inline-block; width:12px; text-align:center; }
      .jv-toggle:hover { color:var(--text-1); }
      .jv-key { color:var(--accent); font-weight:500; }
      .jv-colon { color:var(--text-2); margin:0 3px; }
      .jv-str { color:var(--success); }
      .jv-num { color:var(--warning); }
      .jv-bool { color:var(--danger); }
      .jv-null { color:var(--text-3); font-style:italic; }
      .jv-count { color:var(--text-3); font-size:11px; margin-left:4px; }
      .jv-collapsed > .jv-children { display:none; }
    </style>
  `;
}

export function init() {
  const inputEl = document.getElementById('jvInput');
  const renderBtn = document.getElementById('jvRenderBtn');
  const expandBtn = document.getElementById('jvExpandAll');
  const collapseBtn = document.getElementById('jvCollapseAll');
  const treeEl = document.getElementById('jvTree');
  const errEl = document.getElementById('jvError');

  const buildTree = (data, isRoot = false) => {
    const ul = document.createElement('ul');
    ul.className = `jv-ul${isRoot ? ' root' : ''}`;

    const entries = Array.isArray(data) ? data.map((v, i) => [i, v]) : Object.entries(data);

    for (const [key, value] of entries) {
      const li = document.createElement('li');
      li.className = 'jv-li';

      const isObj = value !== null && typeof value === 'object';

      if (isObj) {
        const isArr = Array.isArray(value);
        const childCount = isArr ? value.length : Object.keys(value).length;
        const open = isArr ? '[' : '{';
        const close = isArr ? ']' : '}';

        const toggle = document.createElement('span');
        toggle.className = 'jv-toggle';
        toggle.textContent = '▾';

        const keySpan = document.createElement('span');
        if (!Array.isArray(data)) {
          keySpan.innerHTML = `<span class="jv-key">"${escHtml(String(key))}"</span><span class="jv-colon">:</span>`;
        }

        const bracket = document.createElement('span');
        bracket.style.color = 'var(--text-2)';
        bracket.textContent = open;

        const count = document.createElement('span');
        count.className = 'jv-count';
        count.textContent = `${childCount} ${isArr ? 'items' : 'keys'}`;

        const children = buildTree(value);
        children.className = `jv-ul jv-children`;

        const closingLine = document.createElement('div');
        closingLine.style.color = 'var(--text-2)';
        closingLine.textContent = close;

        toggle.addEventListener('click', () => {
          const collapsed = li.classList.toggle('jv-collapsed');
          toggle.textContent = collapsed ? '▸' : '▾';
          count.style.display = collapsed ? 'inline' : 'none';
        });

        li.append(toggle, keySpan, bracket, count, children, closingLine);
      } else {
        const toggle = document.createElement('span');
        toggle.className = 'jv-toggle';
        toggle.style.visibility = 'hidden';

        const keySpan = document.createElement('span');
        if (!Array.isArray(data)) {
          keySpan.innerHTML = `<span class="jv-key">"${escHtml(String(key))}"</span><span class="jv-colon">:</span>`;
        }

        const valSpan = document.createElement('span');
        if (value === null) {
          valSpan.className = 'jv-null';
          valSpan.textContent = 'null';
        } else if (typeof value === 'string') {
          valSpan.className = 'jv-str';
          valSpan.textContent = `"${escHtml(value)}"`;
        } else if (typeof value === 'number') {
          valSpan.className = 'jv-num';
          valSpan.textContent = value;
        } else if (typeof value === 'boolean') {
          valSpan.className = 'jv-bool';
          valSpan.textContent = value;
        }

        li.append(toggle, keySpan, valSpan);
      }

      ul.appendChild(li);
    }
    return ul;
  };

  const render = () => {
    const raw = inputEl.value.trim();
    errEl.textContent = '';
    if (!raw) {
      treeEl.innerHTML = '<span class="text-muted text-sm">Nhập JSON và nhấn Render Tree.</span>';
      return;
    }

    try {
      const data = JSON.parse(raw);
      treeEl.innerHTML = '';
      treeEl.appendChild(buildTree(data, true));
    } catch (e) {
      errEl.textContent = e.message;
    }
  };

  renderBtn.addEventListener('click', render);

  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') render();
  });

  expandBtn.addEventListener('click', () => {
    treeEl.querySelectorAll('.jv-collapsed').forEach((el) => {
      el.classList.remove('jv-collapsed');
      const t = el.querySelector('.jv-toggle');
      if (t) t.textContent = '▾';
      const c = el.querySelector('.jv-count');
      if (c) c.style.display = 'none';
    });
  });

  collapseBtn.addEventListener('click', () => {
    treeEl.querySelectorAll('.jv-li:has(.jv-children)').forEach((li) => {
      li.classList.add('jv-collapsed');
      const t = li.querySelector(':scope > .jv-toggle');
      if (t) t.textContent = '▸';
      const c = li.querySelector(':scope > .jv-count');
      if (c) c.style.display = 'inline';
    });
  });
}

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
