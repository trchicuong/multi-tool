/**
 * JSON Tree Viewer — interactive collapsible tree with search & JSONPath copy
 */

const SAMPLE_TREE = {
  service: 'api-service',
  status: 'healthy',
  metrics: {
    uptimeSeconds: 86400,
    latencyMs: [12, 15, 11, 14],
  },
  users: [
    { id: 101, name: 'Alice Smith', role: 'admin', active: true },
    { id: 102, name: 'Bob Jones', role: 'editor', active: false },
  ],
  metadata: null,
};

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatJsonPath(path, key, isArrayItem) {
  if (isArrayItem) return `${path}[${key}]`;
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return `${path}.${key}`;
  return `${path}["${String(key).replace(/"/g, '\\"')}"]`;
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>JSON Tree Viewer</h1>
      <p>Xem JSON dưới dạng cây tương tác, tìm kiếm key/value và click vào key để copy JSONPath.</p>
    </div>

    <div class="split-editor" style="align-items:stretch;">
      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
        <div class="card-header">
          <span class="field-label">JSON Input</span>
          <div class="d-flex gap-1">
            <button type="button" class="btn btn-ghost btn-sm" id="jvSampleBtn">Sample</button>
            <button type="button" class="btn btn-ghost btn-sm" id="jvFormatBtn">Format</button>
            <button type="button" class="btn btn-ghost btn-sm" id="jvClearBtn">Xóa</button>
          </div>
        </div>
        <textarea
          class="mono w-full flex-1"
          id="jvInput"
          rows="18"
          placeholder='{ "name": "Alice", "scores": [10, 20, 30] }'
          style="height:440px; min-height:360px; resize:vertical;"
          spellcheck="false"
        ></textarea>
        <div class="btn-group">
          <button type="button" class="btn btn-primary" id="jvRenderBtn">Render Tree</button>
          <button type="button" class="btn btn-secondary btn-sm" id="jvExpandAll">Expand All</button>
          <button type="button" class="btn btn-secondary btn-sm" id="jvCollapseAll">Collapse All</button>
        </div>
        <div id="jvError" class="text-sm text-danger mt-1" style="min-height:18px;"></div>
      </div>

      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
        <div class="card-header">
          <span class="field-label">Tree View</span>
          <input
            type="search"
            id="jvSearch"
            placeholder="Tìm key hoặc value..."
            style="max-width:210px; min-height:30px; padding:4px 10px; font-size:12.5px;"
            spellcheck="false"
          />
        </div>
        <div
          id="jvPathBar"
          class="mono text-sm"
          style="padding:6px 10px; margin-bottom:10px; background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
        >
          Click vào key bất kỳ để copy JSONPath ($)
        </div>
        <div
          id="jvTree"
          style="font-family:var(--font-mono); font-size:12.5px; overflow:auto; height:440px; padding:10px 12px; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius);"
        >
          <span class="text-muted text-sm">Nhập JSON và nhấn Render Tree (hoặc Ctrl+Enter).</span>
        </div>
      </div>
    </div>

    <style>
      .jv-ul { list-style:none; padding-left:18px; margin:0; border-left:1px solid var(--border); }
      .jv-ul.root { padding-left:0; border-left:none; }
      .jv-li { padding:1px 0; line-height:1.7; }
      .jv-toggle { cursor:pointer; user-select:none; color:var(--text-3); font-size:11px; margin-right:4px; display:inline-block; width:14px; text-align:center; }
      .jv-toggle:hover { color:var(--text-1); }
      .jv-key { color:var(--accent); font-weight:500; cursor:pointer; border-radius:3px; padding:0 2px; }
      .jv-key:hover { background:var(--accent-bg); text-decoration:underline; }
      .jv-colon { color:var(--text-2); margin:0 4px 0 2px; }
      .jv-str { color:var(--success); }
      .jv-num { color:var(--warning); }
      .jv-bool { color:var(--danger); }
      .jv-null { color:var(--text-3); font-style:italic; }
      .jv-count { color:var(--text-3); font-size:11px; margin-left:4px; display:none; }
      .jv-collapsed > .jv-children,
      .jv-collapsed > .jv-close { display:none; }
      .jv-collapsed > .jv-count { display:inline; }
      .jv-match { background:rgba(217,119,6,0.22); border-radius:3px; outline:1px solid var(--warning); }
    </style>
  `;
}

export function init() {
  const inputEl = document.getElementById('jvInput');
  const searchEl = document.getElementById('jvSearch');
  const pathBar = document.getElementById('jvPathBar');
  const renderBtn = document.getElementById('jvRenderBtn');
  const sampleBtn = document.getElementById('jvSampleBtn');
  const formatBtn = document.getElementById('jvFormatBtn');
  const clearBtn = document.getElementById('jvClearBtn');
  const expandBtn = document.getElementById('jvExpandAll');
  const collapseBtn = document.getElementById('jvCollapseAll');
  const treeEl = document.getElementById('jvTree');
  const errEl = document.getElementById('jvError');

  const setExpandedState = (li, collapsed) => {
    li.classList.toggle('jv-collapsed', collapsed);
    const toggle = li.querySelector(':scope > .jv-toggle');
    if (toggle) toggle.textContent = collapsed ? '▸' : '▾';
  };

  const buildTree = (data, path = '$', isRoot = false) => {
    const ul = document.createElement('ul');
    ul.className = `jv-ul${isRoot ? ' root' : ''}`;

    const isParentArr = Array.isArray(data);
    const entries = isParentArr ? data.map((v, i) => [i, v]) : Object.entries(data);

    for (const [key, value] of entries) {
      const li = document.createElement('li');
      li.className = 'jv-li';

      const itemPath = formatJsonPath(path, key, isParentArr);
      const isObj = value !== null && typeof value === 'object';

      const toggle = document.createElement('span');
      toggle.className = 'jv-toggle';

      const keySpan = document.createElement('span');
      if (!isParentArr) {
        keySpan.innerHTML = `<span class="jv-key" data-path="${escHtml(itemPath)}" title="Click để copy path: ${escHtml(itemPath)}">"${escHtml(String(key))}"</span><span class="jv-colon">:</span>`;
      } else {
        keySpan.innerHTML = `<span class="jv-key" data-path="${escHtml(itemPath)}" style="color:var(--text-3);" title="Click để copy path: ${escHtml(itemPath)}">[${key}]</span><span class="jv-colon">:</span>`;
      }

      if (isObj) {
        const isArr = Array.isArray(value);
        const childCount = isArr ? value.length : Object.keys(value).length;
        const open = isArr ? '[' : '{';
        const close = isArr ? ']' : '}';

        toggle.textContent = '▾';

        const bracket = document.createElement('span');
        bracket.style.color = 'var(--text-2)';
        bracket.textContent = open;

        const count = document.createElement('span');
        count.className = 'jv-count';
        count.textContent = `... ${childCount} ${isArr ? 'items' : 'keys'} ${close}`;

        const children = buildTree(value, itemPath, false);
        children.className = 'jv-ul jv-children';

        const closingLine = document.createElement('div');
        closingLine.className = 'jv-close';
        closingLine.style.color = 'var(--text-2)';
        closingLine.textContent = close;

        toggle.addEventListener('click', () => {
          setExpandedState(li, !li.classList.contains('jv-collapsed'));
        });

        li.dataset.searchKey = String(key).toLowerCase();
        li.append(toggle, keySpan, bracket, count, children, closingLine);
      } else {
        toggle.style.visibility = 'hidden';

        const valSpan = document.createElement('span');
        if (value === null) {
          valSpan.className = 'jv-null';
          valSpan.textContent = 'null';
        } else if (typeof value === 'string') {
          valSpan.className = 'jv-str';
          valSpan.textContent = `"${value}"`;
        } else if (typeof value === 'number') {
          valSpan.className = 'jv-num';
          valSpan.textContent = String(value);
        } else if (typeof value === 'boolean') {
          valSpan.className = 'jv-bool';
          valSpan.textContent = String(value);
        }

        li.dataset.searchKey = `${String(key)} ${String(value)}`.toLowerCase();
        li.append(toggle, keySpan, valSpan);
      }

      ul.appendChild(li);
    }
    return ul;
  };

  const applySearch = () => {
    const q = searchEl.value.trim().toLowerCase();
    treeEl.querySelectorAll('.jv-match').forEach((el) => el.classList.remove('jv-match'));
    if (!q) return;

    treeEl.querySelectorAll('.jv-li').forEach((li) => {
      const hay = li.dataset.searchKey || '';
      if (hay.includes(q)) {
        const keyNode = li.querySelector(':scope > span > .jv-key');
        const valNode = li.querySelector(':scope > span:last-child');
        (keyNode || valNode || li).classList.add('jv-match');
        let parent = li.parentElement?.closest('.jv-li');
        while (parent) {
          setExpandedState(parent, false);
          parent = parent.parentElement?.closest('.jv-li');
        }
      }
    });
  };

  const render = () => {
    const raw = inputEl.value.trim();
    errEl.textContent = '';
    if (!raw) {
      treeEl.innerHTML =
        '<span class="text-muted text-sm">Nhập JSON và nhấn Render Tree (hoặc Ctrl+Enter).</span>';
      return;
    }

    try {
      const data = JSON.parse(raw);
      treeEl.innerHTML = '';
      if (data === null || typeof data !== 'object') {
        treeEl.textContent = JSON.stringify(data);
        return;
      }
      treeEl.appendChild(buildTree(data, '$', true));
      applySearch();
    } catch (e) {
      errEl.textContent = e.message;
    }
  };

  treeEl.addEventListener('click', (e) => {
    const keyEl = e.target.closest('.jv-key[data-path]');
    if (!keyEl) return;
    const p = keyEl.dataset.path;
    pathBar.textContent = `Path: ${p}`;
    window.copyToClipboard(p);
  });

  renderBtn.addEventListener('click', render);
  searchEl.addEventListener('input', applySearch);

  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') render();
  });

  sampleBtn.addEventListener('click', () => {
    inputEl.value = JSON.stringify(SAMPLE_TREE, null, 2);
    render();
  });

  formatBtn.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(inputEl.value.trim());
      inputEl.value = JSON.stringify(parsed, null, 2);
      render();
    } catch (e) {
      errEl.textContent = e.message;
    }
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    searchEl.value = '';
    errEl.textContent = '';
    pathBar.textContent = 'Click vào key bất kỳ để copy JSONPath ($)';
    render();
    inputEl.focus();
  });

  expandBtn.addEventListener('click', () => {
    treeEl.querySelectorAll('.jv-li.jv-collapsed').forEach((li) => setExpandedState(li, false));
  });

  collapseBtn.addEventListener('click', () => {
    treeEl.querySelectorAll('.jv-li:has(> .jv-children)').forEach((li) => setExpandedState(li, true));
  });
}
