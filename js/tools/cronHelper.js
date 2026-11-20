/**
 * Cron Job Helper — supports 5-field cron, macros (@daily, @reboot...), aliases (SUN-SAT, JAN-DEC) & 2-way builder
 */

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DOW_ALIASES = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MON_ALIASES = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MACROS = {
  '@yearly': { expr: '0 0 1 1 *', desc: 'Chạy mỗi năm một lần vào 00:00 ngày 1 tháng 1' },
  '@annually': { expr: '0 0 1 1 *', desc: 'Chạy mỗi năm một lần vào 00:00 ngày 1 tháng 1' },
  '@monthly': { expr: '0 0 1 * *', desc: 'Chạy mỗi tháng một lần vào 00:00 ngày mùng 1' },
  '@weekly': { expr: '0 0 * * 0', desc: 'Chạy mỗi tuần một lần vào 00:00 Chủ nhật' },
  '@daily': { expr: '0 0 * * *', desc: 'Chạy mỗi ngày vào lúc 00:00' },
  '@midnight': { expr: '0 0 * * *', desc: 'Chạy mỗi ngày vào lúc 00:00' },
  '@hourly': { expr: '0 * * * *', desc: 'Chạy mỗi giờ vào phút thứ 0' },
  '@reboot': { expr: null, desc: 'Chạy một lần duy nhất khi hệ thống khởi động (không có lịch lặp)' },
};

function normalizeToken(token, aliases, isDow) {
  let out = token.toLowerCase();
  if (aliases) {
    for (const [name, num] of Object.entries(aliases)) {
      out = out.replace(new RegExp(`\\b${name}\\b`, 'g'), String(num));
    }
  }
  if (isDow) {
    out = out.replace(/\b7\b/g, '0');
  }
  return out;
}

function parseFieldSet(rawField, min, max, aliases = null, isDow = false) {
  const field = normalizeToken(rawField.trim(), aliases, isDow);
  if (!field) throw new Error('Trường cron không được để trống');

  const allowed = new Set();
  for (const part of field.split(',')) {
    if (!part) throw new Error(`Cú pháp không hợp lệ: "${rawField}"`);
    const [rangePart, stepPart] = part.split('/');
    if (part.split('/').length > 2) throw new Error(`Bước nhảy không hợp lệ: "${part}"`);

    const step = stepPart !== undefined ? Number(stepPart) : 1;
    if (!Number.isInteger(step) || step <= 0) {
      throw new Error(`Bước nhảy phải là số nguyên dương: "${part}"`);
    }

    let start = min;
    let end = max;

    if (rangePart === '*') {
      // keep [min, max]
    } else if (rangePart.includes('-')) {
      const segs = rangePart.split('-');
      if (segs.length !== 2) throw new Error(`Khoảng giá trị không hợp lệ: "${part}"`);
      start = Number(segs[0]);
      end = Number(segs[1]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
        throw new Error(`Khoảng giá trị không hợp lệ: "${part}"`);
      }
    } else {
      const val = Number(rangePart);
      if (!Number.isInteger(val)) throw new Error(`Giá trị không hợp lệ: "${part}"`);
      start = val;
      end = stepPart !== undefined ? max : val;
    }

    if (start < min || end > max) {
      throw new Error(`Giá trị "${part}" nằm ngoài giới hạn [${min}–${max}]`);
    }

    for (let v = start; v <= end; v += step) {
      allowed.add(v);
    }
  }

  return allowed;
}

function parseCron(rawExpr) {
  const trimmed = rawExpr.trim();
  const macro = MACROS[trimmed.toLowerCase()];
  if (macro) {
    if (!macro.expr) return { isReboot: true, desc: macro.desc, fields: null };
    const parsed = parseCron(macro.expr);
    return { ...parsed, macroDesc: macro.desc };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Cần đúng 5 trường (phút giờ ngày tháng thứ) hoặc macro (@daily, @hourly...)');
  }

  const [minE, hrE, domE, monE, dowE] = parts;
  return {
    isReboot: false,
    parts,
    minSet: parseFieldSet(minE, 0, 59),
    hrSet: parseFieldSet(hrE, 0, 23),
    domSet: parseFieldSet(domE, 1, 31),
    monSet: parseFieldSet(monE, 1, 12, MON_ALIASES),
    dowSet: parseFieldSet(dowE, 0, 6, DOW_ALIASES, true),
    domWild: domE === '*',
    dowWild: dowE === '*',
  };
}

function describeCron(expr) {
  const parsed = parseCron(expr);
  if (parsed.isReboot) return parsed.desc;
  if (parsed.macroDesc) return parsed.macroDesc;

  const [min, hr, dom, mon, dow] = parsed.parts;
  const out = [];

  if (min === '*' && hr === '*') out.push('Chạy mỗi phút');
  else if (min.startsWith('*/')) out.push(`Mỗi ${min.slice(2)} phút`);
  else out.push(`Tại phút ${min}`);

  if (hr !== '*') {
    if (hr.startsWith('*/')) out.push(`mỗi ${hr.slice(2)} giờ`);
    else out.push(`lúc ${hr} giờ`);
  } else if (min !== '*') {
    out.push('mỗi giờ');
  }

  if (dom !== '*') out.push(`ngày ${dom} hàng tháng`);
  if (mon !== '*') {
    const val = mon.replace(/\d+/g, (n) => MONTHS[+n - 1] || n);
    out.push(`tháng ${val}`);
  }
  if (dow !== '*') {
    const val = dow.replace(/\d/g, (n) => DAYS_OF_WEEK[+n] || n);
    out.push(`vào ${val}`);
  }

  return out.join(', ');
}

function nextFireTimes(parsed, count = 5) {
  if (parsed.isReboot) return [];
  const results = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  const maxLimit = new Date(d.getTime() + 366 * 24 * 60 * 60 * 1000);
  while (results.length < count && d < maxLimit) {
    const mo = d.getMonth() + 1;
    const dom = d.getDate();
    const h = d.getHours();
    const mi = d.getMinutes();
    const dw = d.getDay();

    const domMatch = parsed.domSet.has(dom);
    const dowMatch = parsed.dowSet.has(dw);
    // Standard Vixie cron: if both DOM and DOW are restricted, either matching triggers
    const dayOk =
      parsed.domWild && parsed.dowWild
        ? true
        : parsed.domWild
          ? dowMatch
          : parsed.dowWild
            ? domMatch
            : domMatch || dowMatch;

    if (parsed.monSet.has(mo) && dayOk && parsed.hrSet.has(h) && parsed.minSet.has(mi)) {
      results.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return results;
}

const PRESETS = [
  { label: 'Mỗi phút', value: '* * * * *' },
  { label: 'Mỗi 5 phút', value: '*/5 * * * *' },
  { label: 'Mỗi 15 phút', value: '*/15 * * * *' },
  { label: 'Mỗi giờ', value: '0 * * * *' },
  { label: 'Mỗi 6 giờ', value: '0 */6 * * *' },
  { label: 'Nửa đêm hằng ngày', value: '0 0 * * *' },
  { label: '8:00 Thứ 2–6', value: '0 8 * * 1-5' },
  { label: '18:00 Thứ 6', value: '0 18 * * 5' },
  { label: 'Cuối tuần 12:00', value: '0 12 * * 0,6' },
  { label: 'Ngày 1 hằng tháng', value: '0 0 1 * *' },
  { label: 'Mỗi quý', value: '0 0 1 */3 *' },
  { label: '@daily', value: '@daily' },
  { label: '@weekly', value: '@weekly' },
  { label: '@reboot', value: '@reboot' },
];

export function getHtml() {
  const fields = [
    { id: 'bMin', label: 'Minute', hint: '0–59, *, */5' },
    { id: 'bHr', label: 'Hour', hint: '0–23, *, */2' },
    { id: 'bDom', label: 'Day (Month)', hint: '1–31, *' },
    { id: 'bMon', label: 'Month', hint: '1–12, JAN–DEC' },
    { id: 'bDow', label: 'Day (Week)', hint: '0–6, MON–FRI' },
  ];

  return `
    <div class="tool-header">
      <h1>Cron Job Helper</h1>
      <p>Phân tích, kiểm tra hợp lệ biểu thức Cron (kèm macro @daily, @reboot), xem lịch chạy tiếp theo và tạo nhanh bằng Visual Builder.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label" for="cronExpr">Cron Expression (5 fields hoặc Macro)</label>
        <div class="d-flex align-center gap-2 flex-wrap">
          <input
            type="text"
            id="cronExpr"
            value="*/5 * * * *"
            class="mono flex-1"
            style="min-width:200px; font-size:17px; font-weight:600; letter-spacing:1.5px;"
            spellcheck="false"
            placeholder="* * * * *"
          />
          <button type="button" class="btn btn-primary" id="cronAnalyze">Analyze</button>
          <button type="button" class="copy-btn" id="cronCopyExpr" style="min-height:38px;">Copy</button>
        </div>
        <div class="d-flex gap-2 mt-1 text-sm text-muted flex-wrap mono" style="font-size:11.5px;">
          <span>[minute]</span><span>[hour]</span><span>[day-of-month]</span><span>[month]</span><span>[day-of-week]</span>
        </div>
      </div>

      <div id="cronResult" class="output-box mt-2" style="display:none; padding:14px 16px;">
        <div id="cronDesc" style="font-weight:600; font-size:14px; margin-bottom:10px; color:var(--accent);"></div>
        <div class="field-label">5 lần chạy tiếp theo (giờ địa phương)</div>
        <ul id="cronNextTimes" style="margin:6px 0 0 18px; font-size:13px; line-height:1.8;" class="mono"></ul>
      </div>
      <div id="cronError" class="text-sm text-danger mt-1" style="display:none;"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Visual Builder (đồng bộ 2 chiều)</span>
        <button type="button" class="btn btn-ghost btn-sm" id="cronResetWild">Đặt tất cả về *</button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px;">
        ${fields
          .map(
            (f) => `
          <div>
            <label class="field-label" for="${f.id}">${f.label}</label>
            <input type="text" id="${f.id}" value="*" class="mono cron-field" placeholder="*" spellcheck="false" />
            <div class="text-muted mt-1" style="font-size:11px;">${f.hint}</div>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="field-label">Mẫu phổ biến (Quick Presets)</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:8px;">
        ${PRESETS.map(
          (p) => `
          <button
            type="button"
            class="btn btn-secondary btn-sm cron-preset"
            data-val="${p.value}"
            style="justify-content:flex-start; text-align:left;"
          >
            <span class="mono text-accent" style="min-width:86px; font-size:11.5px;">${p.value}</span>
            <span style="overflow:hidden; text-overflow:ellipsis;">${p.label}</span>
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
  const copyBtn = document.getElementById('cronCopyExpr');
  const resetWildBtn = document.getElementById('cronResetWild');
  const resultEl = document.getElementById('cronResult');
  const cronDesc = document.getElementById('cronDesc');
  const nextTimes = document.getElementById('cronNextTimes');
  const cronError = document.getElementById('cronError');

  const fieldIds = ['bMin', 'bHr', 'bDom', 'bMon', 'bDow'];
  const fieldEls = fieldIds.map((id) => document.getElementById(id));

  const syncBuilderFromExpr = (expr) => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length === 5) {
      fieldEls.forEach((el, idx) => {
        el.value = parts[idx];
      });
    }
  };

  const analyze = (syncBuilder = true) => {
    const expr = exprInput.value.trim();
    try {
      const parsed = parseCron(expr);
      const desc = describeCron(expr);
      cronDesc.textContent = desc;

      if (parsed.isReboot) {
        nextTimes.innerHTML = '<li>Chỉ chạy khi máy/container khởi động (@reboot)</li>';
      } else {
        const fires = nextFireTimes(parsed, 5);
        nextTimes.innerHTML =
          fires.map((d) => `<li>${d.toLocaleString('vi-VN')}</li>`).join('') ||
          '<li>Không tìm thấy mốc chạy trong 366 ngày tới (kiểm tra lại ngày/tháng)</li>';
      }

      if (syncBuilder) syncBuilderFromExpr(parsed.parts ? parsed.parts.join(' ') : expr);
      resultEl.style.display = '';
      cronError.style.display = 'none';
    } catch (e) {
      cronError.textContent = '⚠ ' + e.message;
      cronError.style.display = '';
      resultEl.style.display = 'none';
    }
  };

  analyzeBtn.addEventListener('click', () => analyze(true));
  exprInput.addEventListener('input', () => analyze(true));
  exprInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) analyze(true);
  });

  fieldEls.forEach((el) => {
    el.addEventListener('input', () => {
      const built = fieldEls.map((f) => f.value.trim() || '*').join(' ');
      exprInput.value = built;
      analyze(false);
    });
  });

  resetWildBtn.addEventListener('click', () => {
    fieldEls.forEach((f) => (f.value = '*'));
    exprInput.value = '* * * * *';
    analyze(false);
  });

  copyBtn.addEventListener('click', () => {
    if (exprInput.value.trim()) window.copyToClipboard(exprInput.value.trim(), copyBtn);
  });

  document.querySelectorAll('.cron-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      exprInput.value = btn.dataset.val;
      analyze(true);
    });
  });

  analyze(true);
}
