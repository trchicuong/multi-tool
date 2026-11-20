/**
 * Markdown Editor — live preview with full-width single-pane expansion, formatting toolbar & word counter
 */

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseInline(text) {
  const tokens = [];
  const store = (html) => {
    const token = `\u0000${tokens.length}\u0000`;
    tokens.push(html);
    return token;
  };

  let out = text
    .replace(/`([^`]+)`/g, (_, c) => store(`<code>${escHtml(c)}</code>`))
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
      store(`<img src="${escHtml(src)}" alt="${escHtml(alt)}" style="max-width:100%;" />`),
    )
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
      store(`<a href="${escHtml(href)}" target="_blank" rel="noopener noreferrer">${escHtml(label)}</a>`),
    );

  out = out
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  return out.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)] ?? '');
}

function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(escHtml(lines[i]));
        i++;
      }
      out.push(`<pre><code${lang ? ` class="language-${escHtml(lang)}"` : ''}>${code.join('\n')}</code></pre>`);
      i++;
      continue;
    }

    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      out.push(`<h${lvl}>${parseInline(hm[2])}</h${lvl}>`);
      i++;
      continue;
    }

    if (/^(---+|___+|\*\*\*+)\s*$/.test(line)) {
      out.push('<hr />');
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const bq = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        bq.push(lines[i].slice(2));
        i++;
      }
      out.push(`<blockquote>${parseMarkdown(bq.join('\n'))}</blockquote>`);
      continue;
    }

    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|[-| :]+\|$/.test(lines[i + 1])) {
      const headers = line.split('|').slice(1, -1).map((s) => s.trim());
      const aligns = lines[i + 1]
        .split('|')
        .slice(1, -1)
        .map((s) => {
          if (/^:-+:$/.test(s.trim())) return 'center';
          if (/^-+:$/.test(s.trim())) return 'right';
          return 'left';
        });
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map((s) => s.trim()));
        i++;
      }
      let tbl = '<div class="table-wrap"><table><thead><tr>';
      headers.forEach((h, ci) => {
        tbl += `<th style="text-align:${aligns[ci] || 'left'}">${parseInline(h)}</th>`;
      });
      tbl += '</tr></thead><tbody>';
      rows.forEach((row) => {
        tbl += '<tr>';
        headers.forEach((_, ci) => {
          tbl += `<td style="text-align:${aligns[ci] || 'left'}">${parseInline(row[ci] || '')}</td>`;
        });
        tbl += '</tr>';
      });
      tbl += '</tbody></table></div>';
      out.push(tbl);
      continue;
    }

    if (/^(\s*[-*+]\s)/.test(line)) {
      const items = [];
      while (i < lines.length && /^(\s*[-*+]\s)/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^\s*[-*+]\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    if (!line.trim()) {
      out.push('');
      i++;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>|```|\s*[-*+]\s|\d+\.\s|---+|___+|\*\*\*+|\|)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) out.push(`<p>${parseInline(para.join('<br/>'))}</p>`);
  }

  return out.join('\n');
}

const SAMPLE = `# Example Document

## Features Overview

- **Live preview** as you type
- Supports *italic*, **bold**, ~~strikethrough~~, \`inline code\`
- Tables, lists, blockquotes and [links](https://example.com)

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

| Item | Status | Note |
|:-----|:------:|-----:|
| Split View | ✓ | 50 / 50 layout |
| Full Width | ✓ | 100% expanded |

> Clean minimalist formatting helps keep focus on the content.
`;

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Markdown Preview</h1>
      <p>Soạn thảo Markdown với thanh định dạng nhanh, bộ đếm từ và chế độ xem Split / Toàn khung.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="d-flex align-center gap-2 flex-wrap">
          <div class="seg-group" role="group" aria-label="Chế độ hiển thị">
            <button type="button" class="btn md-view-btn active" data-view="split">Split</button>
            <button type="button" class="btn md-view-btn" data-view="editor">Editor</button>
            <button type="button" class="btn md-view-btn" data-view="preview">Preview</button>
          </div>
          <div class="d-flex align-center gap-1 flex-wrap">
            <button type="button" class="btn btn-ghost btn-sm md-fmt" data-wrap="**" title="In đậm"><strong>B</strong></button>
            <button type="button" class="btn btn-ghost btn-sm md-fmt" data-wrap="*" title="In nghiêng"><em>I</em></button>
            <button type="button" class="btn btn-ghost btn-sm md-fmt" data-wrap="\`" title="Inline code"><code>&lt;/&gt;</code></button>
            <button type="button" class="btn btn-ghost btn-sm md-fmt" data-insert="[text](https://)" title="Liên kết">Link</button>
            <button type="button" class="btn btn-ghost btn-sm md-fmt" data-insert="\n- Mục mới" title="Danh sách">List</button>
            <button type="button" class="btn btn-ghost btn-sm md-fmt" data-insert="\n| Cột 1 | Cột 2 |\n| :--- | :--- |\n| Giá trị | Giá trị |\n" title="Bảng">Table</button>
          </div>
        </div>

        <div class="d-flex align-center gap-1 flex-wrap">
          <span id="mdStats" class="text-sm text-muted mono"></span>
          <button type="button" class="copy-btn" id="mdCopy">Copy MD</button>
          <button type="button" class="copy-btn" id="mdCopyHtml">Copy HTML</button>
          <button type="button" class="btn btn-ghost btn-sm" id="mdClear" style="color:var(--danger);">Xóa</button>
        </div>
      </div>

      <div id="mdSplit" class="split-editor" style="align-items:stretch;">
        <div id="mdEditorPane" style="display:flex; flex-direction:column;">
          <label class="field-label" for="mdEditor">Markdown</label>
          <textarea
            id="mdEditor"
            class="mono w-full flex-1"
            style="resize:vertical; font-size:13.5px; line-height:1.7; height:500px; min-height:420px; padding:12px;"
            spellcheck="false"
            autocomplete="off"
          ></textarea>
        </div>
        <div id="mdPreviewPane" style="display:flex; flex-direction:column;">
          <span class="field-label">Preview</span>
          <div
            id="mdPreview"
            class="md-preview"
            style="height:500px; min-height:420px; font-size:14.5px; line-height:1.75; padding:16px 20px; background:var(--code-bg); border:1px solid var(--border); border-radius:var(--radius); overflow:auto;"
          ></div>
        </div>
      </div>
    </div>

    <style>
      .md-preview h1,.md-preview h2,.md-preview h3,.md-preview h4,.md-preview h5,.md-preview h6 { margin:14px 0 8px; font-weight:700; line-height:1.3; color:var(--text-1); }
      .md-preview h1:first-child,.md-preview h2:first-child { margin-top:0; }
      .md-preview h1 { font-size:1.65em; border-bottom:1px solid var(--border); padding-bottom:6px; }
      .md-preview h2 { font-size:1.35em; border-bottom:1px solid var(--border); padding-bottom:4px; }
      .md-preview h3 { font-size:1.15em; }
      .md-preview p { margin:8px 0; color:var(--text-1); }
      .md-preview a { color:var(--accent); text-decoration:underline; }
      .md-preview code { background:var(--surface-2); padding:1px 6px; border-radius:4px; font-size:0.9em; font-family:var(--font-mono); }
      .md-preview pre { background:var(--surface); border:1px solid var(--border); padding:12px 14px; border-radius:var(--radius); overflow:auto; margin:10px 0; }
      .md-preview pre code { background:none; padding:0; font-size:12.5px; }
      .md-preview blockquote { border-left:3px solid var(--accent); margin:10px 0; padding:6px 12px; color:var(--text-2); background:var(--surface); border-radius:0 4px 4px 0; }
      .md-preview ul,.md-preview ol { margin:8px 0 8px 22px; color:var(--text-1); }
      .md-preview li { margin:3px 0; }
      .md-preview hr { border:none; border-top:1px solid var(--border); margin:16px 0; }
      .md-preview table { border-collapse:collapse; width:100%; margin:10px 0; }
      .md-preview th,.md-preview td { border:1px solid var(--border); padding:7px 12px; }
      .md-preview th { background:var(--surface-2); font-weight:600; }
      .md-preview del { opacity:0.6; text-decoration:line-through; }
      .md-preview img { max-width:100%; border-radius:4px; }
    </style>
  `;
}

export function init() {
  const editor = document.getElementById('mdEditor');
  const preview = document.getElementById('mdPreview');
  const splitEl = document.getElementById('mdSplit');
  const editorPane = document.getElementById('mdEditorPane');
  const previewPane = document.getElementById('mdPreviewPane');
  const statsEl = document.getElementById('mdStats');

  document.querySelectorAll('.md-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.md-view-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      editorPane.style.display = view === 'preview' ? 'none' : 'flex';
      previewPane.style.display = view === 'editor' ? 'none' : 'flex';
      splitEl.classList.toggle('single-pane', view !== 'split');
    });
  });

  const render = () => {
    const val = editor.value;
    preview.innerHTML = parseMarkdown(val);
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    statsEl.textContent = `${words} từ · ${val.length} ký tự`;
  };

  editor.addEventListener('input', render);

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.slice(0, start) + '  ' + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      render();
    }
  });

  document.querySelectorAll('.md-fmt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const sel = editor.value.slice(start, end);
      if (btn.dataset.wrap) {
        const w = btn.dataset.wrap;
        const text = sel || 'text';
        editor.value = editor.value.slice(0, start) + w + text + w + editor.value.slice(end);
        editor.focus();
        editor.selectionStart = start + w.length;
        editor.selectionEnd = start + w.length + text.length;
      } else if (btn.dataset.insert) {
        const ins = btn.dataset.insert;
        editor.value = editor.value.slice(0, start) + ins + editor.value.slice(end);
        editor.focus();
        editor.selectionStart = editor.selectionEnd = start + ins.length;
      }
      render();
    });
  });

  document.getElementById('mdCopy').addEventListener('click', (e) => {
    window.copyToClipboard(editor.value, e.currentTarget);
  });
  document.getElementById('mdCopyHtml').addEventListener('click', (e) => {
    window.copyToClipboard(preview.innerHTML, e.currentTarget);
  });
  document.getElementById('mdClear').addEventListener('click', () => {
    editor.value = '';
    render();
    editor.focus();
  });

  editor.value = SAMPLE;
  render();
}
