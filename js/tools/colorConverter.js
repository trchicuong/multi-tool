/**
 * Color Converter — HEX / RGB / HSL / HSV with live picker
 */

// ── Conversions ────────────────────────────────────────────────────────────
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
};

const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
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
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
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
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const rgbToHsv = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0,
    s = max === 0 ? 0 : d / max,
    v = max;
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

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Color Converter</h1>
      <p>Chuyển đổi màu giữa HEX, RGB, HSL, HSV. Chỉnh sửa bất kỳ ô nào để cập nhật tất cả.</p>
    </div>

    <div class="card">
      <div class="row" style="flex-wrap:wrap; gap:16px; align-items:flex-start;">
        <!-- Color picker -->
        <div style="flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div id="ccPreview" style="width:100px; height:100px; border-radius:12px; border:1px solid var(--border); background:#2a78e4;"></div>
          <input type="color" id="ccPicker" value="#2a78e4" title="Color picker"
            style="width:100px; height:38px; border-radius:var(--radius); cursor:pointer; padding:2px; border:1px solid var(--border);" />
          <button class="copy-btn" id="ccCopyHexShort" style="position:static; font-size:11px;">Copy HEX</button>
        </div>

        <!-- Inputs -->
        <div class="flex-1" style="display:grid; gap:10px; min-width:260px;">
          <div>
            <label class="field-label">HEX</label>
            <div class="d-flex align-center gap-1">
              <input type="text" id="ccHex" class="mono flex-1" placeholder="#2a78e4" spellcheck="false" />
              <button class="btn btn-ghost btn-sm cc-copy" data-src="ccHex">Copy</button>
            </div>
          </div>
          <div>
            <label class="field-label">RGB</label>
            <div class="d-flex align-center gap-1">
              <input type="text" id="ccRgb" class="mono flex-1" placeholder="rgb(42, 120, 228)" spellcheck="false" />
              <button class="btn btn-ghost btn-sm cc-copy" data-src="ccRgb">Copy</button>
            </div>
          </div>
          <div>
            <label class="field-label">HSL</label>
            <div class="d-flex align-center gap-1">
              <input type="text" id="ccHsl" class="mono flex-1" placeholder="hsl(215, 76%, 53%)" spellcheck="false" />
              <button class="btn btn-ghost btn-sm cc-copy" data-src="ccHsl">Copy</button>
            </div>
          </div>
          <div>
            <label class="field-label">HSV</label>
            <div class="d-flex align-center gap-1">
              <input type="text" id="ccHsv" class="mono flex-1" placeholder="hsv(215, 82%, 89%)" spellcheck="false" />
              <button class="btn btn-ghost btn-sm cc-copy" data-src="ccHsv">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Color palette -->
    <div class="card mt-2">
      <div class="field-label">Tông màu</div>
      <div id="ccShades" style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px;"></div>
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
  const copyHexBtn = document.getElementById('ccCopyHexShort');

  let busy = false;

  const renderShades = (r, g, b) => {
    const { h, s } = rgbToHsl(r, g, b);
    shadesEl.innerHTML = [10, 20, 30, 40, 50, 60, 70, 80, 90]
      .map((l) => {
        const { r: rr, g: gg, b: bb } = hslToRgb(h, s, l);
        const hex = rgbToHex(rr, gg, bb);
        const textCol = l > 55 ? '#000' : '#fff';
        return `<div title="${hex}" style="flex:1; min-width:40px; height:40px; background:${hex}; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:10px; color:${textCol}; font-family:var(--font-mono);" data-hex="${hex}"></div>`;
      })
      .join('');
    shadesEl.querySelectorAll('[data-hex]').forEach((el) => {
      el.addEventListener('click', () => updateFromHex(el.dataset.hex));
    });
  };

  const updateAll = (r, g, b) => {
    if (busy) return;
    busy = true;
    const hex = rgbToHex(r, g, b);
    const { h: hs, s: ss, l: ls } = rgbToHsl(r, g, b);
    const { h: hv, s: sv, v: vv } = rgbToHsv(r, g, b);
    hexInput.value = hex;
    rgbInput.value = `rgb(${r}, ${g}, ${b})`;
    hslInput.value = `hsl(${hs}, ${ss}%, ${ls}%)`;
    hsvInput.value = `hsv(${hv}, ${sv}%, ${vv}%)`;
    preview.style.background = hex;
    picker.value = hex;
    renderShades(r, g, b);
    busy = false;
  };

  const updateFromHex = (raw) => {
    const clean = raw.trim().replace(/^#?/, '#');
    const rgb = hexToRgb(clean);
    if (rgb) updateAll(rgb.r, rgb.g, rgb.b);
  };

  const parseRgb = (s) => {
    const m = s.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
  };

  const parseHsl = (s) => {
    const m = s.match(/([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?/);
    return m ? hslToRgb(+m[1], +m[2], +m[3]) : null;
  };

  picker.addEventListener('input', () => updateFromHex(picker.value));
  hexInput.addEventListener('input', () => {
    const rgb = hexToRgb(hexInput.value.trim());
    if (rgb) updateAll(rgb.r, rgb.g, rgb.b);
  });
  rgbInput.addEventListener('input', () => {
    const rgb = parseRgb(rgbInput.value);
    if (rgb) updateAll(rgb.r, rgb.g, rgb.b);
  });
  hslInput.addEventListener('input', () => {
    const rgb = parseHsl(hslInput.value);
    if (rgb) updateAll(rgb.r, rgb.g, rgb.b);
  });

  document.querySelectorAll('.cc-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = document.getElementById(btn.dataset.src).value;
      window.copyToClipboard(val, btn);
    });
  });

  copyHexBtn.addEventListener('click', () => window.copyToClipboard(hexInput.value, copyHexBtn));

  // Init
  updateFromHex('#2a78e4');
}
