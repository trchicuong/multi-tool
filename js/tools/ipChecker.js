/**
 * IP Address Checker — shows public IP, geo info, ASN, no API key needed
 * Primary  : ipinfo.io      — accurate geo + ASN
 * Fallback1: freeipapi.com  — includes proxy detection
 * Fallback2: ipapi.co       — geo + ASN + org, 1 000 req/day free
 */

const APIS = [
  // ── Primary: ipinfo.io ──────────────────────────────────────────────
  {
    url: (ip) => (ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json'),
    map: (d) => {
      const [lat, lon] = (d.loc ?? '').split(',').map(Number);
      const asn = d.org ? d.org.split(' ')[0] : null;
      const org = d.org ? d.org.split(' ').slice(1).join(' ') : null;
      return {
        ip: d.ip,
        type: d.ip?.includes(':') ? 'IPv6' : 'IPv4',
        country: d.country ?? '',
        countryCode: d.country,
        region: d.region,
        city: d.city,
        lat: isNaN(lat) ? null : lat,
        lon: isNaN(lon) ? null : lon,
        timezone: d.timezone,
        utcOffset: null,
        isp: org,
        org: org,
        asn,
        isProxy: null,
        isVpn: null,
        isTor: null,
      };
    },
  },
  // ── Fallback 1: freeipapi.com — free HTTPS + proxy detection ────────
  {
    url: (ip) => (ip ? `https://freeipapi.com/api/json/${ip}` : 'https://freeipapi.com/api/json'),
    map: (d) => ({
      ip: d.ipAddress,
      type: d.ipVersion === 6 ? 'IPv6' : 'IPv4',
      country: d.countryName ?? '',
      countryCode: d.countryCode,
      region: d.regionName,
      city: d.cityName,
      lat: d.latitude ?? null,
      lon: d.longitude ?? null,
      timezone: Array.isArray(d.timeZones) ? d.timeZones[0] : (d.timeZone ?? null),
      utcOffset: null,
      isp: null,
      org: null,
      asn: null,
      isProxy: typeof d.isProxy === 'boolean' ? d.isProxy : null,
      isVpn: null,
      isTor: null,
    }),
  },
  // ── Fallback 2: ipapi.co — geo + ASN + org ───────────────────────────
  {
    url: (ip) => (ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'),
    map: (d) => ({
      ip: d.ip,
      type: d.version ?? (d.ip?.includes(':') ? 'IPv6' : 'IPv4'),
      country: d.country_name ?? '',
      countryCode: d.country_code,
      region: d.region,
      city: d.city,
      lat: d.latitude ?? null,
      lon: d.longitude ?? null,
      timezone: d.timezone,
      utcOffset: d.utc_offset,
      isp: d.org,
      org: d.org,
      asn: d.asn,
      isProxy: null,
      isVpn: null,
      isTor: null,
    }),
  },
];

export function getHtml() {
  return `
    <style>
      .ip-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 16px;
      }
      @media (max-width: 500px) {
        .ip-info-grid { grid-template-columns: 1fr; }
      }
      .ip-info-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 10px 12px;
      }
      .ip-info-key {
        font-size: 11px;
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        font-weight: 600;
      }
      .ip-info-val {
        font-size: 14px;
        color: var(--text-1);
        font-weight: 500;
        word-break: break-all;
      }
      .ip-hero {
        text-align: center;
        padding: 20px 0 8px;
      }
      .ip-hero-ip {
        font-size: 30px;
        font-weight: 700;
        font-family: var(--font-mono);
        color: var(--accent);
        letter-spacing: 0.04em;
      }
      .ip-hero-sub {
        font-size: 13px;
        color: var(--text-2);
        margin-top: 4px;
      }
      .ip-security-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 14px;
      }
      .ip-badge-ok   { background: #dcfce7; color: #166534; }
      .ip-badge-warn { background: #fee2e2; color: #991b1b; }
      .ip-badge-gray { background: var(--surface-2); color: var(--text-2); }
      body.dark .ip-badge-ok   { background: #14532d; color: #4ade80; }
      body.dark .ip-badge-warn { background: #450a0a; color: #f87171; }
    </style>

    <div class="tool-header">
      <h1>IP Address Checker</h1>
      <p>Kiểm tra địa chỉ IP công khai, thông tin địa lý, ISP và bảo mật.</p>
    </div>

    <div class="card">
      <!-- Custom IP lookup -->
      <div class="d-flex gap-1" style="margin-bottom:14px;">
        <input type="text" id="ipInput" placeholder="Nhập IP để kiểm tra (để trống = IP của bạn)"
          style="flex:1;" autocomplete="off" spellcheck="false" />
        <button class="btn btn-primary" id="ipLookupBtn">Kiểm tra</button>
      </div>

      <!-- Loading state -->
      <div id="ipLoading" style="text-align:center; padding:30px 0; display:none;">
        <div class="text-muted text-sm">Đang tải thông tin IP...</div>
      </div>

      <!-- Error -->
      <div id="ipError" style="display:none; color:var(--danger); font-size:13.5px; padding:8px 0;"></div>

      <!-- Result -->
      <div id="ipResult" style="display:none;">
        <!-- Hero IP -->
        <div class="ip-hero">
          <div class="ip-hero-ip" id="ipDisplay">--</div>
          <div class="ip-hero-sub" id="ipSubDisplay"></div>
          <div style="margin-top:8px; display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="ipCopyBtn">Copy IP</button>
            <a class="btn btn-ghost btn-sm" id="ipMapLink" target="_blank" rel="noopener noreferrer" style="display:none;">
              Xem bản đồ ↗
            </a>
          </div>
        </div>

        <!-- Info grid -->
        <div class="ip-info-grid">
          <div class="ip-info-row"><span class="ip-info-key">Quốc gia</span><span class="ip-info-val" id="ipCountry">--</span></div>
          <div class="ip-info-row"><span class="ip-info-key">Tỉnh / Vùng</span><span class="ip-info-val" id="ipRegion">--</span></div>
          <div class="ip-info-row"><span class="ip-info-key">Thành phố</span><span class="ip-info-val" id="ipCity">--</span></div>
          <div class="ip-info-row"><span class="ip-info-key">Múi giờ</span><span class="ip-info-val" id="ipTimezone">--</span></div>
          <div class="ip-info-row"><span class="ip-info-key">Tọa độ</span><span class="ip-info-val" id="ipLatLon">--</span></div>
          <div class="ip-info-row"><span class="ip-info-key">Loại IP</span><span class="ip-info-val" id="ipType">--</span></div>
          <div class="ip-info-row">
            <span class="ip-info-key">ISP / Tổ chức</span>
            <span class="ip-info-val" id="ipIsp">--</span>
          </div>
          <div class="ip-info-row"><span class="ip-info-key">ASN</span><span class="ip-info-val" id="ipAsn">--</span></div>
        </div>

        <!-- Security -->
        <div class="ip-security-row" id="ipSecurity"></div>
      </div>
    </div>
  `;
}

export function init() {
  const ipInput = document.getElementById('ipInput');
  const lookupBtn = document.getElementById('ipLookupBtn');
  const ipLoading = document.getElementById('ipLoading');
  const ipError = document.getElementById('ipError');
  const ipResult = document.getElementById('ipResult');
  const ipDisplay = document.getElementById('ipDisplay');
  const ipSubDisplay = document.getElementById('ipSubDisplay');
  const ipCopyBtn = document.getElementById('ipCopyBtn');
  const ipMapLink = document.getElementById('ipMapLink');

  const setField = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '--';
  };

  const showLoading = (on) => {
    ipLoading.style.display = on ? '' : 'none';
    ipResult.style.display = on ? 'none' : '';
    ipError.style.display = 'none';
  };

  const showError = (msg) => {
    ipLoading.style.display = 'none';
    ipResult.style.display = 'none';
    ipError.style.display = '';
    ipError.textContent = '⚠ ' + msg;
  };

  const secBadge = (label, warn) => {
    const cls = warn === null ? 'ip-badge-gray' : warn ? 'ip-badge-warn' : 'ip-badge-ok';
    return `<span class="badge ${cls}">${label}</span>`;
  };

  const lookup = async (ip) => {
    showLoading(true);
    let data = null;
    for (const api of APIS) {
      try {
        const res = await fetch(api.url(ip), { cache: 'no-store' });
        if (!res.ok) continue;
        const json = await res.json();
        // Map first, then validate — each API uses different field names
        const mapped = api.map(json);
        if (!mapped.ip) continue;
        data = mapped;
        break;
      } catch {
        /* try next */
      }
    }

    if (!data) {
      showError('Không thể lấy thông tin IP. Vui lòng thử lại sau.');
      return;
    }

    // Populate
    ipDisplay.textContent = data.ip;
    ipSubDisplay.textContent = [data.city, data.region, data.country].filter(Boolean).join(', ');

    setField('ipCountry', data.country || '--');
    setField('ipRegion', data.region || '--');
    setField('ipCity', data.city || '--');
    setField('ipTimezone', [data.timezone, data.utcOffset].filter(Boolean).join(' · ') || '--');
    setField('ipLatLon', data.lat != null && data.lon != null ? `${data.lat}, ${data.lon}` : '--');
    setField('ipType', data.type || '--');
    setField('ipIsp', data.isp || data.org || '--');
    setField('ipAsn', data.asn || '--');

    // Map link
    if (data.lat != null && data.lon != null) {
      ipMapLink.href = `https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}#map=10/${data.lat}/${data.lon}`;
      ipMapLink.style.display = '';
    } else {
      ipMapLink.style.display = 'none';
    }

    // Security badges
    const secEl = document.getElementById('ipSecurity');
    if (data.isProxy !== null || data.isVpn !== null || data.isTor !== null) {
      secEl.innerHTML =
        secBadge(data.isProxy ? '⚠ Proxy' : 'Proxy: No', data.isProxy) +
        secBadge(data.isVpn ? '⚠ VPN' : 'VPN: No', data.isVpn) +
        secBadge(data.isTor ? '⚠ Tor' : 'Tor: No', data.isTor);
    } else {
      secEl.innerHTML = '';
    }

    // Copy button
    ipCopyBtn.onclick = () => window.copyToClipboard(data.ip, ipCopyBtn);

    showLoading(false);
  };

  lookupBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    lookup(ip || '');
  });

  ipInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') lookupBtn.click();
  });

  // Auto-load own IP on open
  lookup('');
}
