/**
 * Color Converter — bidirectional HEX / RGB / HSL / HSV, Shades & WCAG Contrast Checker
 */

const hexToRgb = (hex) => {
  const h = hex.replace('#', '').trim();
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
};

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));

const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('');

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h, s, l) => {
  h = (((h % 360) + 360) % 360) / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  if (s === 0) {
    const v = clamp255(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: clamp255(hue2rgb(p, q, h + 1 / 3) * 255),
    g: clamp255(hue2rgb(p, q, h) * 255),
    b: clamp255(hue2rgb(p, q, h - 1 / 3) * 255),
  };
};

const rgbToHsv = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

const hsvToRgb = (h, s, v) => {
  h = (((h % 360) + 360) % 360) / 60;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;
  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const mods = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][i % 6];
  return {
    r: clamp255(mods[0] * 255),
    g: clamp255(mods[1] * 255),
    b: clamp255(mods[2] * 255),
  };
};

function relativeLuminance(r, g, b) {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Color Converter</h1>
      <p>Chuyển đổi màu 2 chiều giữa HEX, RGB, HSL, HSV, tạo bảng sắc độ và kiểm tra tương phản WCAG.</p>
    </div>

    <div class="card">
      <div class="row" style="gap:20px; align-items:stretch;">
        <div style="flex:0 0 130px; display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div id="ccPreview" style="width:120px; height:120px; border-radius:var(--radius-lg); border:1px solid var(--border); background:#0066ff;"></div>
          <input type="color" id="ccPicker" value="#0066ff" aria-label="Color picker" style="width:120px;" />
          <button type="button" class="btn btn-secondary btn-sm w-full" id="ccRandomBtn">Màu ngẫu nhiên</button>
        </div>

        <div class="flex-1" style="display:grid; grid-template-columns:1fr; gap:10px; min-width:240px;">
          ${[
            { id: 'ccHex', label: 'HEX', ph: '#0066ff' },
            { id: 'ccRgb', label: 'RGB', ph: 'rgb(0, 102, 255)' },
            { id: 'ccHsl', label: 'HSL', ph: 'hsl(216, 100%, 50%)' },
            { id: 'ccHsv', label: 'HSV', ph: 'hsv(216, 100%, 100%)' },
          ]
            .map(
              (f) => `
            <div>
              <label class="field-label" for="${f.id}">${f.label}</label>
              <div class="d-flex align-center gap-1">
                <input type="text" id="${f.id}" class="mono flex-1" placeholder="${f.ph}" spellcheck="false" />
                <button type="button" class="copy-btn cc-copy" data-src="${f.id}" style="min-height:38px;">Copy</button>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>

    <!-- WCAG Contrast -->
    <div class="card">
      <div class="card-header">
        <span class="field-label">Kiểm tra tương phản WCAG (Contrast Checker)</span>
      </div>
      <div class="split-editor" id="ccContrastGrid"></div>
    </div>

    <!-- Color palette -->
    <div class="card">
      <div class="card-header">
        <span class="field-label">Dải sắc độ (Click để chọn &amp; copy mã HEX)</span>
      </div>
      <div id="ccShades" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(72px, 1fr)); gap:6px;"></div>
    </div>
  `;
}

export function init() {
  const picker = document.getElementById('ccPicker');
  const preview = document.getElementById('ccPreview');
  const hexInput = document.getElementById('ccHex');
  const rgbInput = document.getElementById('ccRgb');
  const hslInput = document.getElementById('ccHsl');
  const hsvInput = document.getElementById('ccHsv');
  const shadesEl = document.getElementById('ccShades');
  const contrastGrid = document.getElementById('ccContrastGrid');
  const randomBtn = document.getElementById('ccRandomBtn');

  let busy = false;

  const renderContrast = (rgb, hex) => {
    const targets = [
      { name: 'Chữ Trắng (#FFFFFF)', fg: '#ffffff', rgb: { r: 255, g: 255, b: 255 } },
      { name: 'Chữ Đen (#0A0A0A)', fg: '#0a0a0a', rgb: { r: 10, g: 10, b: 10 } },
    ];
    contrastGrid.innerHTML = targets
      .map((t) => {
        const ratio = contrastRatio(rgb, t.rgb);
        const aa = ratio >= 4.5;
        const aaa = ratio >= 7.0;
        const aaLarge = ratio >= 3.0;
        return `
        <div style="border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
          <div style="background:${hex}; color:${t.fg}; padding:14px 16px; font-weight:600; display:flex; align-items:center; justify-content:space-between;">
            <span>${t.name}</span>
            <span class="mono">${ratio.toFixed(2)}:1</span>
          </div>
          <div style="padding:8px 12px; background:var(--surface-2); display:flex; gap:6px; flex-wrap:wrap; font-size:11.5px;">
            <span class="badge ${aa ? 'badge-green' : 'badge-red'}">${aa ? '✓' : '✗'} AA Normal</span>
            <span class="badge ${aaa ? 'badge-green' : 'badge-gray'}">${aaa ? '✓' : '✗'} AAA Normal</span>
            <span class="badge ${aaLarge ? 'badge-green' : 'badge-red'}">${aaLarge ? '✓' : '✗'} AA Large</span>
          </div>
        </div>
      `;
      })
      .join('');
  };

  const renderShades = (r, g, b) => {
    const { h, s } = rgbToHsl(r, g, b);
    shadesEl.innerHTML = [10, 20, 30, 40, 50, 60, 70, 80, 90]
      .map((l) => {
        const { r: rr, g: gg, b: bb } = hslToRgb(h, s, l);
        const hex = rgbToHex(rr, gg, bb);
        const ratioWhite = contrastRatio({ r: rr, g: gg, b: bb }, { r: 255, g: 255, b: 255 });
        const textCol = ratioWhite >= 4.5 ? '#ffffff' : '#0a0a0a';
        return `<button type="button" title="Click để chọn ${hex}" data-hex="${hex}" style="height:48px; background:${hex}; color:${textCol}; border:1px solid var(--border); border-radius:var(--radius); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; font-family:var(--font-mono); font-weight:500;">${hex}</button>`;
      })
      .join('');

    shadesEl.querySelectorAll('[data-hex]').forEach((el) => {
      el.addEventListener('click', () => {
        updateFromHex(el.dataset.hex);
        window.copyToClipboard(el.dataset.hex);
      });
    });
  };

  const updateAll = (r, g, b, skipSource = null) => {
    if (busy) return;
    busy = true;
    r = clamp255(r);
    g = clamp255(g);
    b = clamp255(b);
    const hex = rgbToHex(r, g, b);
    const { h: hs, s: ss, l: ls } = rgbToHsl(r, g, b);
    const { h: hv, s: sv, v: vv } = rgbToHsv(r, g, b);

    if (skipSource !== hexInput) hexInput.value = hex;
    if (skipSource !== rgbInput) rgbInput.value = `rgb(${r}, ${g}, ${b})`;
    if (skipSource !== hslInput) hslInput.value = `hsl(${hs}, ${ss}%, ${ls}%)`;
    if (skipSource !== hsvInput) hsvInput.value = `hsv(${hv}, ${sv}%, ${vv}%)`;

    preview.style.background = hex;
    picker.value = hex;
    renderShades(r, g, b);
    renderContrast({ r, g, b }, hex);
    busy = false;
  };

  const updateFromHex = (raw) => {
    const clean = raw.trim().replace(/^#?/, '#');
    const rgb = hexToRgb(clean);
    if (rgb) updateAll(rgb.r, rgb.g, rgb.b);
  };

  const parseTriplet = (s) => {
    const m = s.match(/(-?[\d.]+)[,\s]+(-?[\d.]+)%?[,\s]+(-?[\d.]+)%?/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  };

  picker.addEventListener('input', () => updateFromHex(picker.value));
  hexInput.addEventListener('input', () => {
    const rgb = hexToRgb(hexInput.value.trim());
    if (rgb) updateAll(rgb.r, rgb.g, rgb.b, hexInput);
  });
  rgbInput.addEventListener('input', () => {
    const t = parseTriplet(rgbInput.value);
    if (t) updateAll(t[0], t[1], t[2], rgbInput);
  });
  hslInput.addEventListener('input', () => {
    const t = parseTriplet(hslInput.value);
    if (t) {
      const rgb = hslToRgb(t[0], t[1], t[2]);
      updateAll(rgb.r, rgb.g, rgb.b, hslInput);
    }
  });
  hsvInput.addEventListener('input', () => {
    const t = parseTriplet(hsvInput.value);
    if (t) {
      const rgb = hsvToRgb(t[0], t[1], t[2]);
      updateAll(rgb.r, rgb.g, rgb.b, hsvInput);
    }
  });

  randomBtn.addEventListener('click', () => {
    const hex =
      '#' +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');
    updateFromHex(hex);
  });

  document.querySelectorAll('.cc-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = document.getElementById(btn.dataset.src)?.value;
      if (val) window.copyToClipboard(val, btn);
    });
  });

  updateFromHex('#0066ff');
}
