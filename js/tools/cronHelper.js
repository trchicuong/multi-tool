/**
 * Cron Job Helper — parse and build cron expressions without external deps
 */

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Describe a cron expression in plain language (simplified 5-field: min hr dom mon dow)
 */
function describeCron(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression (need 5 fields)';
  const [min, hr, dom, mon, dow] = parts;

  const fmtField = (val, type) => {
    if (val === '*') return null;
    if (val.startsWith('*/')) return `every ${val.slice(2)} ${type}`;
    if (val.includes(',')) return val.split(',').join(', ');
    if (val.includes('-')) {
      const [a, b] = val.split('-');
      return `${a}–${b}`;
    }
    return val;
  };

  const parts2 = [];

  // Minute
  const m = fmtField(min, 'minute');
  if (min === '*') parts2.push('every minute');
  else if (min.startsWith('*/')) parts2.push(`every ${min.slice(2)} minute(s)`);
  else parts2.push(`at minute ${m || min}`);

  // Hour
  const h = fmtField(hr, 'hour');
  if (hr === '*' && min !== '*') {
  } // covered above
  else if (hr === '*') parts2.push('every hour');
  else if (hr.startsWith('*/')) parts2.push(`every ${hr.slice(2)} hour(s)`);
  else parts2.push(`at hour ${h || hr}`);

  // DOM
  if (dom !== '*') {
    const d = fmtField(dom, 'day');
    parts2.push(`on day(s) ${d} of the month`);
  }

  // Month
  if (mon !== '*') {
    const mo = fmtField(mon, 'month');
    // Try to map numbers to month names
    const val = mo.replace(/\d+/g, (n) => MONTHS[+n - 1] || n);
    parts2.push(`in ${val}`);
  }

  // DOW
  if (dow !== '*') {
    const dw = fmtField(dow, 'weekday');
    const val = String(dw).replace(/\d/g, (n) => DAYS_OF_WEEK[+n] || n);
    parts2.push(`on ${val}`);
  }

  return parts2.length ? parts2.join(', ') : 'every minute';
}

/** Compute next N fire times from a cron expression */
function nextFireTimes(expr, count = 5) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const [minE, hrE, domE, monE, dowE] = parts;

  const match = (val, actual, min, max) => {
    if (val === '*') return true;
    if (val.startsWith('*/')) {
      const step = parseInt(val.slice(2));
      return (actual - min) % step === 0;
    }
    if (val.includes('-')) {
      const [a, b] = val.split('-').map(Number);
      return actual >= a && actual <= b;
    }
    if (val.includes(',')) return val.split(',').map(Number).includes(actual);
    return parseInt(val) === actual;
  };

  const results = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1); // start 1 min in future

  const limit = new Date(d.getTime() + 366 * 24 * 60 * 60 * 1000);
  while (results.length < count && d < limit) {
    const mo = d.getMonth() + 1,
      dom = d.getDate(),
      h = d.getHours(),
      mi = d.getMinutes(),
      dw = d.getDay();
    if (
      match(monE, mo, 1, 12) &&
      match(domE, dom, 1, 31) &&
      match(dowE, dw, 0, 6) &&
      match(hrE, h, 0, 23) &&
      match(minE, mi, 0, 59)
    ) {
      results.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return results;
}

// Common presets
const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 10 minutes', value: '*/10 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 2 hours', value: '0 */2 * * *' },
  { label: 'Every 4 hours', value: '0 */4 * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
  { label: 'Every day midnight', value: '0 0 * * *' },
  { label: 'Every day at 6am', value: '0 6 * * *' },
  { label: 'Every day at noon', value: '0 12 * * *' },
  { label: 'Every day at 3pm', value: '0 15 * * *' },
  { label: 'Every Monday 9am', value: '0 9 * * 1' },
  { label: 'Every Friday 6pm', value: '0 18 * * 5' },
  { label: 'Every weekday 8am', value: '0 8 * * 1-5' },
  { label: 'Every weekend noon', value: '0 12 * * 0,6' },
  { label: '1st of each month', value: '0 0 1 * *' },
  { label: 'Last day of month', value: '0 0 28-31 * *' },
  { label: 'Every quarter', value: '0 0 1 */3 *' },
  { label: 'Every year (Jan 1)', value: '0 0 1 1 *' },
  { label: 'Reboot (special)', value: '@reboot' },
];

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Cron Job Helper</h1>
      <p>Phân tích cron expression, tính toán thời gian chạy tiếp theo, và tạo biểu thức cron từ builder.</p>
    </div>

    <!-- Expression input -->
    <div class="card">
      <div class="field">
        <label class="field-label">Cron Expression (5 fields)</label>
        <div class="d-flex align-center gap-2" style="flex-wrap:wrap;">
          <input type="text" id="cronExpr" value="*/5 * * * *" class="mono flex-1"
            style="min-width:180px; font-size:18px; font-weight:600; letter-spacing:2px;"
            spellcheck="false" placeholder="* * * * *" />
          <button class="btn btn-primary" id="cronAnalyze">Analyze</button>
        </div>
        <div class="d-flex gap-2 mt-1 text-sm text-muted" style="flex-wrap:wrap;">
          <span>min</span><span>hour</span><span>day(month)</span><span>month</span><span>day(week)</span>
        </div>
      </div>

      <!-- Result -->
      <div id="cronResult" class="output-box mt-2" style="display:none; padding:14px 16px;">
        <div id="cronDesc" class="text-sm" style="font-weight:600; margin-bottom:8px;"></div>
        <div class="field-label">Next 5 fire times:</div>
        <ul id="cronNextTimes" style="margin:6px 0 0 16px; font-size:13px; line-height:1.8;" class="mono"></ul>
      </div>
      <div id="cronError" style="display:none; color:var(--danger, #ef4444); font-size:13px; margin-top:8px;"></div>
    </div>

    <!-- Builder -->
    <div class="card mt-2">
      <div class="field-label">Visual Builder</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:12px; margin-top:8px;">
        ${[
          { id: 'bMin', label: 'Minute (0–59)', type: 'number', min: 0, max: 59 },
          { id: 'bHr', label: 'Hour (0–23)', type: 'number', min: 0, max: 23 },
          { id: 'bDom', label: 'Day of Month (1–31)', type: 'number', min: 1, max: 31 },
          { id: 'bMon', label: 'Month (1–12)', type: 'number', min: 1, max: 12 },
          { id: 'bDow', label: 'Day of Week (0–6)', type: 'number', min: 0, max: 6 },
        ]
          .map(
            (f) => `
          <div>
            <label class="field-label">${f.label}</label>
            <div class="d-flex align-center gap-1">
              <label style="cursor:pointer; font-size:12px;"><input type="checkbox" class="bWild" data-target="${f.id}" checked /> *</label>
              <input type="text" id="${f.id}" value="*" class="mono flex-1" style="font-size:14px;" placeholder="*" />
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
      <div class="d-flex align-center gap-2 mt-2" style="flex-wrap:wrap;">
        <button class="btn btn-primary" id="cronBuild">Build Expression</button>
        <button class="btn btn-ghost" id="cronCopyBuilt">Copy</button>
        <code id="cronBuiltOut" class="mono text-sm" style="padding:4px 8px; background:var(--surface-2); border-radius:4px;"></code>
      </div>
    </div>

    <!-- Presets -->
    <div class="card mt-2">
      <div class="field-label">Common Presets</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:6px; margin-top:8px;">
        ${PRESETS.map(
          (p) => `
          <button class="btn btn-ghost btn-sm cron-preset" data-val="${p.value}"
            style="text-align:left; justify-content:flex-start;">
            <span class="mono" style="margin-right:8px; font-size:12px; opacity:0.7;">${p.value}</span>
            ${p.label}
          </button>
        `,
        ).join('')}
      </div>
    </div>
  `;
}

export function init() {
  const exprInput = document.getElementById('cronExpr');
  const analyzeBtn = document.getElementById('cronAnalyze');
  const resultEl = document.getElementById('cronResult');
  const cronDesc = document.getElementById('cronDesc');
  const nextTimes = document.getElementById('cronNextTimes');
  const cronError = document.getElementById('cronError');
  const builtOut = document.getElementById('cronBuiltOut');

  const analyze = () => {
    const expr = exprInput.value.trim();
    try {
      const desc = describeCron(expr);
      if (desc.startsWith('Invalid')) throw new Error(desc);
      cronDesc.textContent = '📋 ' + desc;
      const fires = nextFireTimes(expr, 5);
      nextTimes.innerHTML =
        fires.map((d) => `<li>${d.toLocaleString()}</li>`).join('') ||
        '<li>No upcoming fire times found</li>';
      resultEl.style.display = '';
      cronError.style.display = 'none';
    } catch (e) {
      cronError.textContent = e.message;
      cronError.style.display = '';
      resultEl.style.display = 'none';
    }
  };

  analyzeBtn.addEventListener('click', analyze);
  exprInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyze();
  });

  // Builder wildcard checkboxes
  document.querySelectorAll('.bWild').forEach((cb) => {
    cb.addEventListener('change', () => {
      const inp = document.getElementById(cb.dataset.target);
      if (cb.checked) {
        inp.value = '*';
        inp.disabled = true;
      } else {
        inp.value = '';
        inp.disabled = false;
        inp.focus();
      }
    });
    // Init disabled state
    const inp = document.getElementById(cb.dataset.target);
    inp.disabled = cb.checked;
  });

  document.getElementById('cronBuild').addEventListener('click', () => {
    const fields = ['bMin', 'bHr', 'bDom', 'bMon', 'bDow'].map((id) => {
      const inp = document.getElementById(id);
      return inp.value.trim() || '*';
    });
    const built = fields.join(' ');
    builtOut.textContent = built;
    exprInput.value = built;
    analyze();
  });

  document.getElementById('cronCopyBuilt').addEventListener('click', (e) => {
    window.copyToClipboard(builtOut.textContent || exprInput.value, e.currentTarget);
  });

  // Presets
  document.querySelectorAll('.cron-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      exprInput.value = btn.dataset.val;
      analyze();
    });
  });

  // Auto-analyze on load
  analyze();
}
