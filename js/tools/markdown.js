/**
 * Markdown Editor — live preview, no external deps
 */

// ─── Tiny Markdown → HTML parser ─────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseInline(text) {
  return (
    text
      // code (inline) — must come before bold/italic
      .replace(/`([^`]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`)
      // bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // strikethrough
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      // image before link (order matters)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;" />')
      // link
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      )
      // auto-link
      .replace(
        /(https?:\/\/[^\s<>"]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
      )
  );
}

function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(escHtml(lines[i]));
        i++;
      }
      out.push(
        `<pre><code${lang ? ` class="language-${lang}"` : ''}>${code.join('\n')}</code></pre>`,
      );
      i++;
      continue;
    }

    // Heading
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      out.push(`<h${lvl}>${parseInline(hm[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---+|___+|\*\*\*+)\s*$/.test(line)) {
      out.push('<hr />');
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const bq = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        bq.push(lines[i].slice(2));
        i++;
      }
      out.push(`<blockquote>${parseMarkdown(bq.join('\n'))}</blockquote>`);
      continue;
    }

    // Table (simple: | header | header |)
    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|[-| :]+\|$/.test(lines[i + 1])) {
      const headers = line
        .split('|')
        .slice(1, -1)
        .map((s) => s.trim());
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
        rows.push(
          lines[i]
            .split('|')
            .slice(1, -1)
            .map((s) => s.trim()),
        );
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

    // Unordered list
    if (/^(\s*[-*+]\s)/.test(line)) {
      const items = [];
      while (i < lines.length && /^(\s*[-*+]\s)/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^\s*[-*+]\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Empty line → paragraph break
    if (!line.trim()) {
      out.push('');
      i++;
      continue;
    }

    // Paragraph — gather until blank or block-level
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

// ─── Default sample ────────────────────────────────────────────────────────

const SAMPLE = `# Markdown Editor

## Features

- **Live preview** as you type
- Supports *italic*, **bold**, ~~strikethrough~~
- \`inline code\` and fenced code blocks
- Tables, blockquotes, lists
- [Links](https://example.com) and images

## Code Example

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Table

| Name       | Language   | Stars |
|:-----------|:----------:|------:|
| React      | JavaScript | 200k  |
| Vue        | JavaScript | 220k  |
| Svelte     | JavaScript | 80k   |

> Markdown makes writing rich content easy and readable.
`;

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Markdown Editor</h1>
      <p>Soạn thảo Markdown với live preview. Hỗ trợ đầy đủ cú pháp phổ biến, không cần thư viện ngoài.</p>
    </div>

    <!-- Toolbar -->
    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px;
                padding:8px 10px; background:var(--surface-2); border:1px solid var(--border);
                border-radius:var(--radius);">
      <div class="btn-group" style="margin:0;">
        <button class="btn btn-ghost btn-sm md-view-btn active" data-view="split">Split</button>
        <button class="btn btn-ghost btn-sm md-view-btn" data-view="editor">Editor</button>
        <button class="btn btn-ghost btn-sm md-view-btn" data-view="preview">Preview</button>
      </div>
      <div style="width:1px; height:22px; background:var(--border);"></div>
      <button class="btn btn-ghost btn-sm" id="mdCopy" title="Copy Markdown">⎘ Copy MD</button>
      <button class="btn btn-ghost btn-sm" id="mdCopyHtml" title="Copy HTML">⎘ Copy HTML</button>
      <button class="btn btn-ghost btn-sm" id="mdClear" title="Clear editor" style="margin-left:auto; color:var(--danger,#ef4444);">Clear</button>
    </div>

    <div id="mdSplit" class="split-editor" style="min-height:540px; align-items:stretch;">
      <div id="mdEditorPane" style="flex:1; display:flex; flex-direction:column;">
        <div class="field-label" style="margin-bottom:4px; font-size:11px; text-transform:uppercase; letter-spacing:.06em;">Markdown</div>
        <textarea id="mdEditor" class="mono flex-1"
          style="resize:none; font-size:14px; line-height:1.7; min-height:500px; padding:12px;"
          spellcheck="false" autocomplete="off"></textarea>
      </div>
      <div id="mdPreviewPane" style="flex:1; overflow:auto; min-height:500px;">
        <div class="field-label" style="margin-bottom:4px; font-size:11px; text-transform:uppercase; letter-spacing:.06em;">Preview</div>
        <div id="mdPreview" class="md-preview"
          style="min-height:500px; font-size:15px; line-height:1.8; padding:16px 20px;
                 background:var(--surface); border:1px solid var(--border); border-radius:var(--radius);
                 overflow:auto;"></div>
      </div>
    </div>
  `;
}

export function init() {
  const editor = document.getElementById('mdEditor');
  const preview = document.getElementById('mdPreview');
  const splitEl = document.getElementById('mdSplit');
  const editorPane = document.getElementById('mdEditorPane');
  const previewPane = document.getElementById('mdPreviewPane');

  // View mode
  document.querySelectorAll('.md-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.md-view-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      editorPane.style.display = view === 'preview' ? 'none' : '';
      previewPane.style.display = view === 'editor' ? 'none' : '';
    });
  });

  // Live render
  const render = () => {
    preview.innerHTML = parseMarkdown(editor.value);
  };

  editor.addEventListener('input', render);

  // Tab key → insert 2 spaces
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart,
        end = editor.selectionEnd;
      editor.value = editor.value.slice(0, start) + '  ' + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      render();
    }
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
  });

  // Inject preview styles
  if (!document.getElementById('md-preview-styles')) {
    const style = document.createElement('style');
    style.id = 'md-preview-styles';
    style.textContent = `
      .md-preview h1,.md-preview h2,.md-preview h3,.md-preview h4,.md-preview h5,.md-preview h6{
        margin:16px 0 8px; font-weight:700; line-height:1.3; color:var(--text-1);
      }
      .md-preview h1{font-size:1.7em; border-bottom:2px solid var(--border); padding-bottom:6px;}
      .md-preview h2{font-size:1.4em; border-bottom:1px solid var(--border); padding-bottom:4px;}
      .md-preview h3{font-size:1.2em;}
      .md-preview p{margin:8px 0; color:var(--text-1);}
      .md-preview a{color:var(--accent); text-decoration:underline;}
      .md-preview code{background:var(--surface-2); padding:1px 6px; border-radius:4px; font-size:0.9em;}
      .md-preview pre{background:var(--surface-2); padding:14px; border-radius:6px; overflow:auto; margin:10px 0;}
      .md-preview pre code{background:none; padding:0; font-size:13px;}
      .md-preview blockquote{border-left:3px solid var(--accent); margin:10px 0; padding:6px 12px;
        color:var(--text-2); background:var(--surface-2); border-radius:0 4px 4px 0;}
      .md-preview ul,.md-preview ol{margin:8px 0 8px 24px; color:var(--text-1);}
      .md-preview li{margin:3px 0;}
      .md-preview hr{border:none; border-top:1px solid var(--border); margin:16px 0;}
      .md-preview table{border-collapse:collapse; width:100%; margin:10px 0;}
      .md-preview th,.md-preview td{border:1px solid var(--border); padding:7px 12px;}
      .md-preview th{background:var(--surface-2); font-weight:600;}
      .md-preview del{opacity:0.6; text-decoration:line-through;}
      .md-preview img{max-width:100%; border-radius:4px;}
    `;
    document.head.appendChild(style);
  }

  // Load sample
  editor.value = SAMPLE;
  render();
}
