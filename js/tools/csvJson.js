/**
 * CSV ↔ JSON converter using PapaParse
 */
import Papa from 'papaparse';

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>CSV ↔ JSON</h1>
      <p>Chuyển đổi giữa CSV và JSON, hỗ trợ tải file hoặc dán trực tiếp.</p>
    </div>

    <div class="d-flex gap-1 mb-2">
      <button class="btn btn-primary btn-sm mode-btn active" data-mode="csv2json">CSV → JSON</button>
      <button class="btn btn-secondary btn-sm mode-btn" data-mode="json2csv">JSON → CSV</button>
    </div>

    <!-- CSV → JSON -->
    <div id="csv2jsonPanel">
      <div class="card">
        <div class="field">
          <label class="field-label">CSV Input</label>
          <textarea id="csvInput" class="mono w-full" rows="10" placeholder="name,age,city&#10;Alice,30,Hanoi&#10;Bob,25,HCMC" spellcheck="false" style="min-height:200px; resize:vertical;"></textarea>
        </div>
        <div class="row">
          <div class="flex-1">
            <label class="field-label">Delimiter</label>
            <select id="csvDelimiter">
              <option value=",">, (comma)</option>
              <option value=";">; (semicolon)</option>
              <option value="&#9;">&#9; (tab)</option>
              <option value="|">| (pipe)</option>
            </select>
          </div>
          <div class="flex-1 d-flex align-center gap-1" style="align-self:flex-end; padding-bottom:1px;">
            <label class="checkbox-row">
              <input type="checkbox" id="csvHeader" checked />
              <span>First row is header</span>
            </label>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="csvConvertBtn">Convert</button>
          <button class="btn btn-ghost" id="csvClearBtn">Xóa</button>
        </div>
      </div>

      <div id="csv2jsonResult" style="display:none; margin-top:8px;">
        <div class="card">
          <div class="d-flex align-center gap-1 mb-2" style="justify-content:space-between;">
            <span class="field-label" style="margin:0;">JSON Output</span>
            <div class="d-flex gap-1">
              <span id="csvRowCount" class="badge badge-blue text-sm"></span>
              <button class="copy-btn" id="csvCopyBtn">Copy</button>
              <button class="btn btn-ghost btn-sm" id="csvDownloadBtn">Download .json</button>
            </div>
          </div>
          <div class="output-box">
            <pre id="csvJsonOutput" style="margin:0; max-height:300px;"></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- JSON → CSV -->
    <div id="json2csvPanel" style="display:none;">
      <div class="card">
        <div class="field">
          <label class="field-label">JSON Input (array of objects)</label>
          <textarea id="jsonInput" class="mono w-full" rows="10" placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]' spellcheck="false" style="min-height:200px; resize:vertical;"></textarea>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="jsonConvertBtn">Convert & Download CSV</button>
          <button class="btn btn-secondary" id="jsonPreviewBtn">Preview CSV</button>
        </div>
      </div>
      <div id="json2csvPreview" style="display:none; margin-top:8px;">
        <div class="card">
          <div class="d-flex align-center gap-1 mb-2" style="justify-content:space-between;">
            <span class="field-label" style="margin:0;">CSV Preview</span>
            <button class="copy-btn" id="json2csvCopyBtn">Copy</button>
          </div>
          <div class="output-box">
            <pre id="json2csvOutput" style="margin:0; max-height:280px;"></pre>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const modeBtns = document.querySelectorAll('.mode-btn');
  const panels = {
    csv2json: document.getElementById('csv2jsonPanel'),
    json2csv: document.getElementById('json2csvPanel'),
  };

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');
      Object.entries(panels).forEach(([key, el]) => {
        el.style.display = key === btn.dataset.mode ? '' : 'none';
      });
    });
  });

  // ── CSV → JSON ──────────────────────────────────────────────────────────
  const csvInput = document.getElementById('csvInput');
  const csvDelim = document.getElementById('csvDelimiter');
  const csvHeader = document.getElementById('csvHeader');
  const csvConvert = document.getElementById('csvConvertBtn');
  const csvClear = document.getElementById('csvClearBtn');
  const csv2jsonResult = document.getElementById('csv2jsonResult');
  const csvJsonOut = document.getElementById('csvJsonOutput');
  const csvRowCount = document.getElementById('csvRowCount');
  const csvCopyBtn = document.getElementById('csvCopyBtn');
  const csvDlBtn = document.getElementById('csvDownloadBtn');

  csvConvert.addEventListener('click', () => {
    const raw = csvInput.value.trim();
    if (!raw) {
      window.showToast('Nhập CSV trước.', 'error');
      return;
    }

    const result = Papa.parse(raw, {
      header: csvHeader.checked,
      delimiter: csvDelim.value === '\t' ? '\t' : csvDelim.value,
      skipEmptyLines: true,
    });

    const json = JSON.stringify(result.data, null, 2);
    csvJsonOut.textContent = json;
    csvRowCount.textContent = `${result.data.length} rows`;
    csv2jsonResult.style.display = '';
  });

  csvClear.addEventListener('click', () => {
    csvInput.value = '';
    csv2jsonResult.style.display = 'none';
  });

  csvCopyBtn.addEventListener('click', () => {
    window.copyToClipboard(csvJsonOut.textContent, csvCopyBtn);
  });

  csvDlBtn.addEventListener('click', () => {
    const blob = new Blob([csvJsonOut.textContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // ── JSON → CSV ──────────────────────────────────────────────────────────
  const jsonInput = document.getElementById('jsonInput');
  const jsonConvert = document.getElementById('jsonConvertBtn');
  const jsonPreview = document.getElementById('jsonPreviewBtn');
  const j2cPreview = document.getElementById('json2csvPreview');
  const j2cOutput = document.getElementById('json2csvOutput');
  const j2cCopyBtn = document.getElementById('json2csvCopyBtn');

  const parseToCsv = () => {
    const raw = jsonInput.value.trim();
    if (!raw) throw new Error('Nhập JSON trước.');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('JSON phải là một mảng (array).');
    return Papa.unparse(data);
  };

  jsonConvert.addEventListener('click', () => {
    try {
      const csv = parseToCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      a.click();
      URL.revokeObjectURL(url);
      window.showToast('Tải CSV thành công!', 'success');
    } catch (e) {
      window.showToast(e.message, 'error');
    }
  });

  jsonPreview.addEventListener('click', () => {
    try {
      const csv = parseToCsv();
      j2cOutput.textContent = csv;
      j2cPreview.style.display = '';
    } catch (e) {
      window.showToast(e.message, 'error');
    }
  });

  j2cCopyBtn.addEventListener('click', () => {
    window.copyToClipboard(j2cOutput.textContent, j2cCopyBtn);
  });
}
