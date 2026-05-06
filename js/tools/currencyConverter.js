/**
 * Currency Converter — uses open.er-api.com (free, no key required)
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
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'VND',
  'CNY',
  'KRW',
  'AUD',
  'CAD',
  'CHF',
  'SGD',
  'THB',
  'MYR',
  'IDR',
  'PHP',
  'TWD',
  'HKD',
  'INR',
  'BRL',
  'MXN',
  'ARS',
  'TRY',
  'RUB',
  'PLN',
  'SEK',
  'NOK',
  'DKK',
  'NZD',
  'ZAR',
  'AED',
];

export function getHtml() {
  const opts = CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join('');
  return `
    <div class="tool-header">
      <h1>Currency Converter</h1>
      <p>Chuyển đổi tiền tệ với tỉ giá thực tế.</p>
    </div>

    <div class="card">
      <div style="display:grid; grid-template-columns:1fr auto 1fr; gap:10px; align-items:flex-end; margin-bottom:12px;">
        <div>
          <label class="field-label">Số tiền</label>
          <input type="number" id="ccAmount" value="1" min="0" step="any" style="font-size:18px; font-weight:600;" />
        </div>
        <div style="padding-bottom:8px; text-align:center;">
          <button class="btn btn-secondary" id="ccSwap" title="Đổi chiều" style="font-size:18px; padding:8px 12px;">⇄</button>
        </div>
        <div>
          <label class="field-label">Kết quả</label>
          <input type="text" id="ccResult" class="mono" readonly style="font-size:18px; font-weight:600; background:var(--surface-2);" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div>
          <label class="field-label">Từ</label>
          <select id="ccFrom" style="width:100%;">${opts.replace('<option value="USD">', '<option value="USD" selected>')}</select>
        </div>
        <div>
          <label class="field-label">Sang</label>
          <select id="ccTo" style="width:100%;">${opts.replace('<option value="VND">', '<option value="VND" selected>')}</select>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <button class="btn btn-primary" id="ccConvert">Convert</button>
        <div id="ccRate" class="text-sm text-muted"></div>
        <div id="ccUpdated" class="text-sm text-muted" style="margin-left:auto;"></div>
      </div>
      <div id="ccError" style="color:var(--danger,#ef4444); font-size:13px; margin-top:6px; min-height:18px;"></div>
    </div>

    <!-- Common pairs -->
    <div class="card mt-2">
      <div class="field-label">Các cặp tiền tệ phổ biến</div>
      <div id="ccPairs" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:8px; margin-top:8px;">
        ${COMMON_PAIRS.map(
          ([f, t]) => `
          <button class="btn btn-ghost btn-sm cc-pair-btn" data-from="${f}" data-to="${t}">
            ${f} → ${t} <span class="cc-pair-rate text-muted" style="font-size:11px;"></span>
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
  const rateEl = document.getElementById('ccRate');
  const updatedEl = document.getElementById('ccUpdated');
  const errorEl = document.getElementById('ccError');

  // Cache: { base: { rates: {...}, time: ts } }
  const rateCache = {};

  const fetchRates = async (base) => {
    if (rateCache[base] && Date.now() - rateCache[base].time < 3600000) {
      return rateCache[base].rates;
    }
    const res = await fetch(`${API_URL}${base}`);
    if (!res.ok) throw new Error('Không thể lấy tỉ giá');
    const data = await res.json();
    if (data.result !== 'success') throw new Error(data['error-type'] || 'API error');
    rateCache[base] = { rates: data.rates, time: Date.now(), updated: data.time_last_update_utc };
    return data.rates;
  };

  const convert = async () => {
    errorEl.textContent = '';
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount < 0) {
      errorEl.textContent = 'Số tiền không hợp lệ';
      return;
    }
    const from = fromSel.value;
    const to = toSel.value;

    convertBtn.textContent = '...';
    convertBtn.disabled = true;
    try {
      const rates = await fetchRates(from);
      const rate = rates[to];
      if (!rate) throw new Error(`Không có tỉ giá cho ${to}`);
      const result = amount * rate;
      resultInput.value = result.toLocaleString('en-US', { maximumFractionDigits: 6 });
      rateEl.textContent = `1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${to}`;
      if (rateCache[from]?.updated) {
        updatedEl.textContent = `Cập nhật: ${new Date(rateCache[from].updated).toLocaleString()}`;
      }
    } catch (e) {
      errorEl.textContent = e.message;
    } finally {
      convertBtn.textContent = 'Convert';
      convertBtn.disabled = false;
    }
  };

  convertBtn.addEventListener('click', convert);
  amountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') convert();
  });

  swapBtn.addEventListener('click', () => {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    convert();
  });

  // Common pairs
  document.querySelectorAll('.cc-pair-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      fromSel.value = btn.dataset.from;
      toSel.value = btn.dataset.to;
      convert();
    });
  });

  // Pre-load common pair rates in background
  const prefetch = async () => {
    try {
      const rates = await fetchRates('USD');
      document.querySelectorAll('.cc-pair-btn').forEach((btn) => {
        if (btn.dataset.from === 'USD') {
          const r = rates[btn.dataset.to];
          const rateSpan = btn.querySelector('.cc-pair-rate');
          if (r && rateSpan)
            rateSpan.textContent = `≈ ${r.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
        }
      });
    } catch {
      /* silent */
    }
  };
  prefetch();

  // Initial conversion
  convert();
}
