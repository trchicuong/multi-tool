/**
 * Fake Data Generator — using @faker-js/faker
 */

import { faker } from '@faker-js/faker';

const FIELDS = [
  { key: 'fullName', label: 'Full Name', fn: () => faker.person.fullName() },
  { key: 'firstName', label: 'First Name', fn: () => faker.person.firstName() },
  { key: 'lastName', label: 'Last Name', fn: () => faker.person.lastName() },
  { key: 'email', label: 'Email', fn: () => faker.internet.email() },
  { key: 'username', label: 'Username', fn: () => faker.internet.username() },
  { key: 'password', label: 'Password', fn: () => faker.internet.password({ length: 14 }) },
  { key: 'phone', label: 'Phone', fn: () => faker.phone.number() },
  {
    key: 'birthday',
    label: 'Birthday',
    fn: () => faker.date.birthdate().toISOString().slice(0, 10),
  },
  { key: 'gender', label: 'Gender', fn: () => faker.person.sex() },
  { key: 'jobTitle', label: 'Job Title', fn: () => faker.person.jobTitle() },
  { key: 'company', label: 'Company', fn: () => faker.company.name() },
  { key: 'address', label: 'Address', fn: () => faker.location.streetAddress(true) },
  { key: 'city', label: 'City', fn: () => faker.location.city() },
  { key: 'country', label: 'Country', fn: () => faker.location.country() },
  { key: 'zipCode', label: 'Zip Code', fn: () => faker.location.zipCode() },
  { key: 'lat', label: 'Latitude', fn: () => faker.location.latitude().toFixed(6) },
  { key: 'lng', label: 'Longitude', fn: () => faker.location.longitude().toFixed(6) },
  { key: 'url', label: 'URL', fn: () => faker.internet.url() },
  { key: 'ip', label: 'IP Address', fn: () => faker.internet.ip() },
  { key: 'ipv6', label: 'IPv6', fn: () => faker.internet.ipv6() },
  { key: 'mac', label: 'MAC Address', fn: () => faker.internet.mac() },
  { key: 'uuid', label: 'UUID', fn: () => faker.string.uuid() },
  { key: 'color', label: 'Hex Color', fn: () => faker.color.rgb({ format: 'hex' }) },
  { key: 'creditCard', label: 'Credit Card', fn: () => faker.finance.creditCardNumber() },
  { key: 'iban', label: 'IBAN', fn: () => faker.finance.iban() },
  { key: 'amount', label: 'Amount', fn: () => faker.finance.amount() },
  { key: 'currency', label: 'Currency', fn: () => faker.finance.currencyCode() },
  { key: 'sentence', label: 'Sentence', fn: () => faker.lorem.sentence() },
  { key: 'paragraph', label: 'Paragraph', fn: () => faker.lorem.paragraph() },
  { key: 'word', label: 'Word', fn: () => faker.lorem.word() },
  { key: 'productName', label: 'Product Name', fn: () => faker.commerce.productName() },
  { key: 'price', label: 'Price', fn: () => faker.commerce.price() },
  { key: 'department', label: 'Department', fn: () => faker.commerce.department() },
  { key: 'image', label: 'Image URL', fn: () => faker.image.url() },
];

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Fake Data Generator</h1>
      <p>Tạo dữ liệu giả ngẫu nhiên (tên, email, địa chỉ, v.v.)</p>
    </div>

    <div class="card">
      <div class="row" style="align-items:flex-end; flex-wrap:wrap; gap:10px;">
        <div style="flex:0 0 130px;">
          <label class="field-label">Số dòng</label>
          <input type="number" id="fdRows" value="5" min="1" max="200" />
        </div>
        <div style="flex:0 0 160px;">
          <label class="field-label">Xuất định dạng</label>
          <select id="fdFormat">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="table">Table (HTML)</option>
          </select>
        </div>
        <div class="d-flex align-center gap-1" style="padding-top:22px;">
          <button class="btn btn-primary" id="fdGenBtn">Generate</button>
          <button class="btn btn-ghost" id="fdClearBtn">Xóa</button>
        </div>
      </div>

      <!-- Field selector -->
      <div class="mt-2">
        <div class="d-flex align-center gap-2 mb-1" style="justify-content:space-between; flex-wrap:wrap;">
          <span class="field-label" style="margin:0;">Chọn trường dữ liệu</span>
          <div class="btn-group" style="margin:0;">
            <button class="btn btn-ghost btn-sm" id="fdSelAll">Tất cả</button>
            <button class="btn btn-ghost btn-sm" id="fdSelNone">Bỏ chọn</button>
            <button class="btn btn-ghost btn-sm" id="fdSelBasic">Cơ bản</button>
          </div>
        </div>
        <div id="fdFields" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(170px,1fr)); gap:6px;"></div>
      </div>
    </div>

    <div class="card mt-2" id="fdResultCard" style="display:none;">
      <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between; flex-wrap:wrap;">
        <span class="field-label" style="margin:0;" id="fdResultLabel"></span>
        <div class="btn-group" style="margin:0;">
          <button class="btn btn-secondary btn-sm" id="fdCopyBtn">Copy</button>
          <button class="btn btn-secondary btn-sm" id="fdDownloadBtn">Download</button>
        </div>
      </div>
      <!-- Table view -->
      <div id="fdTableWrap" class="table-wrap" style="display:none; max-height:400px; overflow:auto;"></div>
      <!-- Raw output -->
      <div class="output-box" id="fdOutputBox" style="display:none;">
        <pre id="fdPre" style="margin:0; max-height:400px; overflow:auto;"></pre>
      </div>
    </div>
  `;
}

export function init() {
  const BASIC = ['fullName', 'email', 'phone', 'company', 'address', 'city', 'country'];
  const fieldsEl = document.getElementById('fdFields');
  const genBtn = document.getElementById('fdGenBtn');
  const clearBtn = document.getElementById('fdClearBtn');
  const selAll = document.getElementById('fdSelAll');
  const selNone = document.getElementById('fdSelNone');
  const selBasic = document.getElementById('fdSelBasic');
  const resultCard = document.getElementById('fdResultCard');
  const resultLabel = document.getElementById('fdResultLabel');
  const tableWrap = document.getElementById('fdTableWrap');
  const outputBox = document.getElementById('fdOutputBox');
  const pre = document.getElementById('fdPre');
  const copyBtn = document.getElementById('fdCopyBtn');
  const dlBtn = document.getElementById('fdDownloadBtn');
  const rowsInput = document.getElementById('fdRows');
  const formatSel = document.getElementById('fdFormat');

  // Render checkboxes
  fieldsEl.innerHTML = FIELDS.map(
    (f) => `
    <label class="d-flex align-center gap-2" style="cursor:pointer; font-size:13px;">
      <input type="checkbox" class="fd-chk" data-key="${f.key}" ${BASIC.includes(f.key) ? 'checked' : ''} />
      ${f.label}
    </label>
  `,
  ).join('');

  const getSelected = () =>
    [...fieldsEl.querySelectorAll('.fd-chk:checked')].map((c) => c.dataset.key);

  selAll.addEventListener('click', () =>
    fieldsEl.querySelectorAll('.fd-chk').forEach((c) => (c.checked = true)),
  );
  selNone.addEventListener('click', () =>
    fieldsEl.querySelectorAll('.fd-chk').forEach((c) => (c.checked = false)),
  );
  selBasic.addEventListener('click', () =>
    fieldsEl
      .querySelectorAll('.fd-chk')
      .forEach((c) => (c.checked = BASIC.includes(c.dataset.key))),
  );

  let lastData = '',
    lastExt = 'json';

  genBtn.addEventListener('click', () => {
    const keys = getSelected();
    if (!keys.length) {
      window.showToast('Chọn ít nhất một trường', 'error');
      return;
    }
    const rows = Math.min(Math.max(1, parseInt(rowsInput.value) || 5), 200);
    const fieldMap = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
    const data = Array.from({ length: rows }, () =>
      Object.fromEntries(keys.map((k) => [fieldMap[k].label, fieldMap[k].fn()])),
    );

    const fmt = formatSel.value;
    if (fmt === 'json') {
      lastData = JSON.stringify(data, null, 2);
      lastExt = 'json';
      pre.textContent = lastData;
      outputBox.style.display = '';
      tableWrap.style.display = 'none';
    } else if (fmt === 'csv') {
      const header = keys.map((k) => fieldMap[k].label).join(',');
      const rows2 = data.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      lastData = [header, ...rows2].join('\n');
      lastExt = 'csv';
      pre.textContent = lastData;
      outputBox.style.display = '';
      tableWrap.style.display = 'none';
    } else {
      // table
      const cols = keys.map((k) => fieldMap[k].label);
      tableWrap.innerHTML = `
        <table>
          <thead><tr>${cols.map((c) => `<th>${escHtml(c)}</th>`).join('')}</tr></thead>
          <tbody>${data
            .map(
              (r) =>
                `<tr>${Object.values(r)
                  .map((v) => `<td>${escHtml(String(v))}</td>`)
                  .join('')}</tr>`,
            )
            .join('')}</tbody>
        </table>`;
      tableWrap.style.display = '';
      outputBox.style.display = 'none';
      lastData = tableWrap.innerHTML;
      lastExt = 'html';
    }

    resultLabel.textContent = `${rows} dòng × ${keys.length} trường`;
    resultCard.style.display = '';
  });

  clearBtn.addEventListener('click', () => {
    pre.textContent = '';
    tableWrap.innerHTML = '';
    resultCard.style.display = 'none';
  });

  copyBtn.addEventListener('click', () => window.copyToClipboard(lastData, copyBtn));
  dlBtn.addEventListener('click', () => {
    const blob = new Blob([lastData], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fake-data.${lastExt}`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
