/**
 * CSV ↔ JSON converter using PapaParse — supports file upload, sample data, preview & download
 */
import Papa from 'papaparse';

const SAMPLE_CSV = `id,name,department,active
1,Alice,Engineering,true
2,Bob,Design,true
3,Carol,Product,false`;

const SAMPLE_JSON = `[
  { "id": 1, "name": "Alice", "department": "Engineering", "active": true },
  { "id": 2, "name": "Bob", "department": "Design", "active": true },
  { "id": 3, "name": "Carol", "department": "Product", "active": false }
]`;

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>CSV ↔ JSON</h1>
      <p>Chuyển đổi qua lại giữa CSV và JSON, hỗ trợ chọn file từ máy tính, tải mẫu và xuất file trực tiếp.</p>
    </div>

    <div class="seg-group mb-2" role="group" aria-label="Chế độ chuyển đổi">
      <button type="button" class="btn mode-btn active" data-mode="csv2json">CSV → JSON</button>
      <button type="button" class="btn mode-btn" data-mode="json2csv">JSON → CSV</button>
    </div>

    <!-- CSV → JSON -->
    <div id="csv2jsonPanel">
      <div class="card">
        <div class="card-header">
          <label class="field-label" for="csvInput">CSV Input</label>
          <div class="d-flex align-center gap-1 flex-wrap">
            <input type="file" id="csvFileInput" accept=".csv,.txt,text/csv" class="hidden" />
            <button type="button" class="btn btn-secondary btn-sm" id="csvUploadBtn">Tải file .csv</button>
            <button type="button" class="btn btn-ghost btn-sm" id="csvSampleBtn">Sample</button>
            <button type="button" class="btn btn-ghost btn-sm" id="csvClearBtn">Xóa</button>
          </div>
        </div>
        <textarea
          id="csvInput"
          class="mono w-full"
          rows="10"
          placeholder="name,age,department&#10;Alice,30,Engineering&#10;Bob,25,Design"
          spellcheck="false"
          style="min-height:200px; resize:vertical;"
        ></textarea>

        <div class="row mt-2" style="align-items:flex-end;">
          <div>
            <label class="field-label" for="csvDelimiter">Dấu phân cách (Delimiter)</label>
            <select id="csvDelimiter">
              <option value=",">, (Comma)</option>
              <option value=";">; (Semicolon)</option>
              <option value="&#9;">Tab (\t)</option>
              <option value="|">| (Pipe)</option>
            </select>
          </div>
          <div style="display:flex; align-items:center; min-height:38px;">
            <label class="checkbox-row">
              <input type="checkbox" id="csvHeader" checked />
              <span>Dòng đầu là tên cột (Header)</span>
            </label>
          </div>
        </div>

        <div class="btn-group">
          <button type="button" class="btn btn-primary" id="csvConvertBtn">Convert → JSON</button>
        </div>
      </div>

      <div id="csv2jsonResult" class="card" style="display:none;">
        <div class="card-header">
          <div class="d-flex align-center gap-2">
            <span class="field-label">JSON Output</span>
            <span id="csvRowCount" class="badge badge-blue"></span>
          </div>
          <div class="d-flex align-center gap-1">
            <button type="button" class="copy-btn" id="csvCopyBtn">Copy</button>
            <button type="button" class="btn btn-secondary btn-sm" id="csvDownloadBtn">Download .json</button>
          </div>
        </div>
        <div class="output-box">
          <pre id="csvJsonOutput" style="margin:0; max-height:340px; overflow:auto;"></pre>
        </div>
      </div>
    </div>

    <!-- JSON → CSV -->
    <div id="json2csvPanel" style="display:none;">
      <div class="card">
        <div class="card-header">
          <label class="field-label" for="jsonInput">JSON Input (Mảng các Object)</label>
          <div class="d-flex align-center gap-1 flex-wrap">
            <input type="file" id="jsonFileInput" accept=".json,application/json" class="hidden" />
            <button type="button" class="btn btn-secondary btn-sm" id="jsonUploadBtn">Tải file .json</button>
            <button type="button" class="btn btn-ghost btn-sm" id="jsonSampleBtn">Sample</button>
            <button type="button" class="btn btn-ghost btn-sm" id="jsonClearBtn">Xóa</button>
          </div>
        </div>
        <textarea
          id="jsonInput"
          class="mono w-full"
          rows="10"
          placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
          spellcheck="false"
          style="min-height:200px; resize:vertical;"
        ></textarea>
        <div class="btn-group">
          <button type="button" class="btn btn-primary" id="jsonPreviewBtn">Convert → CSV</button>
          <button type="button" class="btn btn-secondary" id="jsonConvertBtn">Download .csv</button>
        </div>
      </div>

      <div id="json2csvPreview" class="card" style="display:none;">
        <div class="card-header">
          <span class="field-label">CSV Preview</span>
          <div class="d-flex align-center gap-1">
            <button type="button" class="copy-btn" id="json2csvCopyBtn">Copy</button>
            <button type="button" class="btn btn-secondary btn-sm" id="json2csvDlBtn">Download .csv</button>
          </div>
        </div>
        <div class="output-box">
          <pre id="json2csvOutput" style="margin:0; max-height:320px; overflow:auto;"></pre>
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
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      Object.entries(panels).forEach(([key, el]) => {
        el.style.display = key === btn.dataset.mode ? '' : 'none';
      });
    });
  });

  // ── CSV → JSON ──────────────────────────────────────────────────────────
  const csvInput = document.getElementById('csvInput');
  const csvFileInput = document.getElementById('csvFileInput');
  const csvDelim = document.getElementById('csvDelimiter');
  const csvHeader = document.getElementById('csvHeader');
  const csvConvert = document.getElementById('csvConvertBtn');
  const csv2jsonResult = document.getElementById('csv2jsonResult');
  const csvJsonOut = document.getElementById('csvJsonOutput');
  const csvRowCount = document.getElementById('csvRowCount');
  const csvCopyBtn = document.getElementById('csvCopyBtn');
  const csvDlBtn = document.getElementById('csvDownloadBtn');

  const convertCsvToJson = () => {
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
    csvJsonOut.textContent = JSON.stringify(result.data, null, 2);
    csvRowCount.textContent = `${result.data.length} rows`;
    csv2jsonResult.style.display = '';
  };

  csvConvert.addEventListener('click', convertCsvToJson);
  document.getElementById('csvSampleBtn').addEventListener('click', () => {
    csvInput.value = SAMPLE_CSV;
    convertCsvToJson();
  });
  document.getElementById('csvClearBtn').addEventListener('click', () => {
    csvInput.value = '';
    csv2jsonResult.style.display = 'none';
  });
  document.getElementById('csvUploadBtn').addEventListener('click', () => csvFileInput.click());
  csvFileInput.addEventListener('change', async () => {
    const file = csvFileInput.files[0];
    if (!file) return;
    csvInput.value = await file.text();
    convertCsvToJson();
    csvFileInput.value = '';
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
  const jsonFileInput = document.getElementById('jsonFileInput');
  const jsonConvert = document.getElementById('jsonConvertBtn');
  const jsonPreview = document.getElementById('jsonPreviewBtn');
  const j2cPreview = document.getElementById('json2csvPreview');
  const j2cOutput = document.getElementById('json2csvOutput');
  const j2cCopyBtn = document.getElementById('json2csvCopyBtn');
  const j2cDlBtn = document.getElementById('json2csvDlBtn');

  const parseToCsv = () => {
    const raw = jsonInput.value.trim();
    if (!raw) throw new Error('Nhập JSON trước.');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('JSON phải là một mảng (array).');
    return Papa.unparse(data);
  };

  const downloadCsv = (csv) => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
    URL.revokeObjectURL(url);
    window.showToast('Tải CSV thành công!', 'success');
  };

  const previewJsonToCsv = () => {
    try {
      const csv = parseToCsv();
      j2cOutput.textContent = csv;
      j2cPreview.style.display = '';
    } catch (e) {
      window.showToast(e.message, 'error');
    }
  };

  jsonPreview.addEventListener('click', previewJsonToCsv);
  jsonConvert.addEventListener('click', () => {
    try {
      const csv = parseToCsv();
      j2cOutput.textContent = csv;
      j2cPreview.style.display = '';
      downloadCsv(csv);
    } catch (e) {
      window.showToast(e.message, 'error');
    }
  });
  j2cDlBtn.addEventListener('click', () => {
    if (j2cOutput.textContent) downloadCsv(j2cOutput.textContent);
  });

  document.getElementById('jsonSampleBtn').addEventListener('click', () => {
    jsonInput.value = SAMPLE_JSON;
    previewJsonToCsv();
  });
  document.getElementById('jsonClearBtn').addEventListener('click', () => {
    jsonInput.value = '';
    j2cPreview.style.display = 'none';
  });
  document.getElementById('jsonUploadBtn').addEventListener('click', () => jsonFileInput.click());
  jsonFileInput.addEventListener('change', async () => {
    const file = jsonFileInput.files[0];
    if (!file) return;
    jsonInput.value = await file.text();
    previewJsonToCsv();
    jsonFileInput.value = '';
  });

  j2cCopyBtn.addEventListener('click', () => {
    window.copyToClipboard(j2cOutput.textContent, j2cCopyBtn);
  });
}
