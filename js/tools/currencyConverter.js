/**
 * Currency Converter — live auto-convert, copy result & common currency pairs
 */

const API_URL = 'https://open.er-api.com/v6/latest/';

const COMMON_PAIRS = [
  ['USD', 'EUR'],
  ['USD', 'VND'],
  ['USD', 'GBP'],
  ['USD', 'JPY'],
  ['EUR', 'VND'],
  ['EUR', 'GBP'],
];

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'VND', 'CNY', 'KRW', 'AUD', 'CAD', 'CHF',
  'SGD', 'THB', 'MYR', 'IDR', 'PHP', 'TWD', 'HKD', 'INR', 'BRL', 'MXN',
  'ARS', 'TRY', 'RUB', 'PLN', 'SEK', 'NOK', 'DKK', 'NZD', 'ZAR', 'AED',
];

export function getHtml() {
  const opts = CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join('');
  return `
    <div class="tool-header">
      <h1>Currency Converter</h1>
      <p>Chuyển đổi tiền tệ tự động theo thời gian thực với tỉ giá thị trường cập nhật.</p>
    </div>

    <div class="card">
      <div style="display:grid; grid-template-columns:1fr auto 1fr; gap:10px; align-items:end; margin-bottom:14px;">
        <div>
          <label class="field-label" for="ccAmount">Số tiền</label>
          <input type="number" id="ccAmount" value="1" min="0" step="any" class="mono" style="font-size:16px; font-weight:600;" />
        </div>
        <div>
          <button type="button" class="btn btn-secondary" id="ccSwap" title="Đổi chiều tiền tệ" style="font-size:16px; padding:0 12px;">⇄</button>
        </div>
        <div>
          <label class="field-label" for="ccResult">Kết quả</label>
          <div class="d-flex align-center gap-1">
            <input type="text" id="ccResult" class="mono flex-1" readonly style="font-size:16px; font-weight:600; background:var(--code-bg);" />
            <button type="button" class="copy-btn" id="ccCopyBtn" style="min-height:38px;">Copy</button>
          </div>
        </div>
      </div>

      <div class="split-editor" style="margin-bottom:14px;">
        <div>
          <label class="field-label" for="ccFrom">Từ đơn vị</label>
          <select id="ccFrom">${opts.replace('<option value="USD">', '<option value="USD" selected>')}</select>
        </div>
        <div>
          <label class="field-label" for="ccTo">Sang đơn vị</label>
          <select id="ccTo">${opts.replace('<option value="VND">', '<option value="VND" selected>')}</select>
        </div>
      </div>

      <div class="d-flex align-center justify-between gap-2 flex-wrap">
        <div class="d-flex align-center gap-2">
          <button type="button" class="btn btn-primary btn-sm" id="ccConvert">Làm mới tỉ giá</button>
          <span id="ccRate" class="text-sm mono text-accent"></span>
        </div>
        <span id="ccUpdated" class="text-sm text-muted"></span>
      </div>
      <div id="ccError" class="text-sm text-danger mt-1" style="min-height:18px;"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Các cặp tiền tệ phổ biến</span>
      </div>
      <div id="ccPairs" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(185px,1fr)); gap:8px;">
        ${COMMON_PAIRS.map(
          ([f, t]) => `
          <button type="button" class="btn btn-secondary btn-sm cc-pair-btn" data-from="${f}" data-to="${t}" style="justify-content:space-between;">
            <span>${f} → ${t}</span>
            <span class="cc-pair-rate text-muted mono" style="font-size:11.5px;"></span>
          </button>
        `,
        ).join('')}
      </div>
    </div>
  `;
}

export function init() {
  const amountInput = document.getElementById('ccAmount');
  const fromSel = document.getElementById('ccFrom');
  const toSel = document.getElementById('ccTo');
  const resultInput = document.getElementById('ccResult');
  const convertBtn = document.getElementById('ccConvert');
  const swapBtn = document.getElementById('ccSwap');
  const copyBtn = document.getElementById('ccCopyBtn');
  const rateEl = document.getElementById('ccRate');
  const updatedEl = document.getElementById('ccUpdated');
  const errorEl = document.getElementById('ccError');

  const rateCache = {};
  const abortCtrl = new AbortController();

  const fetchRates = async (base) => {
    if (rateCache[base] && Date.now() - rateCache[base].time < 3600000) {
      return rateCache[base].rates;
    }
    const res = await fetch(`${API_URL}${base}`, { signal: abortCtrl.signal });
    if (!res.ok) throw new Error('Không thể lấy tỉ giá');
    const data = await res.json();
    if (data.result !== 'success') throw new Error(data['error-type'] || 'API error');
    rateCache[base] = { rates: data.rates, time: Date.now(), updated: data.time_last_update_utc };
    return data.rates;
  };

  const convert = async () => {
    errorEl.textContent = '';
    const amount = parseFloat(amountInput.value);
    if (Number.isNaN(amount) || amount < 0) {
      resultInput.value = '';
      errorEl.textContent = amountInput.value ? 'Số tiền không hợp lệ' : '';
      return;
    }
    const from = fromSel.value;
    const to = toSel.value;

    convertBtn.disabled = true;
    try {
      const rates = await fetchRates(from);
      const rate = rates[to];
      if (!rate) throw new Error(`Không có tỉ giá cho ${to}`);
      const result = amount * rate;
      resultInput.value = result.toLocaleString('en-US', { maximumFractionDigits: 4 });
      rateEl.textContent = `1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${to}`;
      if (rateCache[from]?.updated) {
        updatedEl.textContent = `Cập nhật: ${new Date(rateCache[from].updated).toLocaleDateString()}`;
      }
    } catch (e) {
      if (e.name !== 'AbortError') errorEl.textContent = e.message;
    } finally {
      convertBtn.disabled = false;
    }
  };

  amountInput.addEventListener('input', convert);
  fromSel.addEventListener('change', convert);
  toSel.addEventListener('change', convert);
  convertBtn.addEventListener('click', () => {
    delete rateCache[fromSel.value];
    convert();
  });

  swapBtn.addEventListener('click', () => {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    convert();
  });

  copyBtn.addEventListener('click', () => {
    if (resultInput.value) window.copyToClipboard(resultInput.value, copyBtn);
  });

  document.querySelectorAll('.cc-pair-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      fromSel.value = btn.dataset.from;
      toSel.value = btn.dataset.to;
      convert();
    });
  });

  (async () => {
    try {
      const rates = await fetchRates('USD');
      document.querySelectorAll('.cc-pair-btn').forEach((btn) => {
        if (btn.dataset.from === 'USD') {
          const r = rates[btn.dataset.to];
          const span = btn.querySelector('.cc-pair-rate');
          if (r && span) span.textContent = `≈ ${r.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        }
      });
    } catch {}
  })();

  convert();
  return () => abortCtrl.abort();
}
