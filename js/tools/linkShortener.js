/**
 * Link Shortener — is.gd API + safe HTML-escaped local history
 */

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Link Shortener</h1>
      <p>Rút gọn URL dài qua is.gd và lưu lịch sử cục bộ ngay trên trình duyệt.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label" for="lsInput">URL cần rút gọn</label>
        <div class="d-flex gap-2 align-center flex-wrap">
          <input
            type="url"
            id="lsInput"
            class="flex-1 mono"
            style="min-width:220px;"
            placeholder="https://example.com/very/long/url/here"
            spellcheck="false"
            autocomplete="off"
          />
          <button type="button" class="btn btn-primary" id="lsShorten">Rút gọn</button>
        </div>
        <div id="lsError" class="text-sm text-danger mt-1" style="min-height:18px;"></div>
      </div>

      <div id="lsResultWrap" style="display:none; margin-top:12px;">
        <label class="field-label" for="lsResult">URL đã rút gọn</label>
        <div class="d-flex gap-2 align-center">
          <input type="text" id="lsResult" class="flex-1 mono" readonly style="background:var(--code-bg);" />
          <button type="button" class="copy-btn" id="lsCopyBtn" style="min-height:38px;">Copy</button>
          <a id="lsOpenBtn" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Mở ↗</a>
        </div>
      </div>
    </div>

    <div class="card" id="lsHistoryCard" style="display:none;">
      <div class="card-header">
        <span class="field-label">Lịch sử rút gọn</span>
        <button type="button" class="btn btn-ghost btn-sm" id="lsClearHistory">Xóa tất cả</button>
      </div>
      <div id="lsHistoryList" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>
  `;
}

export function init() {
  const input = document.getElementById('lsInput');
  const shortenBtn = document.getElementById('lsShorten');
  const errorEl = document.getElementById('lsError');
  const resultWrap = document.getElementById('lsResultWrap');
  const resultInput = document.getElementById('lsResult');
  const copyBtn = document.getElementById('lsCopyBtn');
  const openBtn = document.getElementById('lsOpenBtn');
  const historyCard = document.getElementById('lsHistoryCard');
  const historyList = document.getElementById('lsHistoryList');
  const clearHistoryBtn = document.getElementById('lsClearHistory');

  const STORAGE_KEY = 'ls_history';

  const getHistory = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveHistory = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)));
  };

  const renderHistory = () => {
    const items = getHistory();
    if (!items.length) {
      historyCard.style.display = 'none';
      return;
    }
    historyCard.style.display = '';
    historyList.innerHTML = items
      .map(
        (item, i) => `
      <div class="d-flex align-center gap-2" style="padding:8px 10px; background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); flex-wrap:wrap;">
        <div style="flex:1; min-width:0;">
          <div class="text-sm mono text-accent" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(item.short)}</div>
          <div class="text-sm text-muted" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(item.original)}</div>
        </div>
        <div class="d-flex gap-1">
          <button type="button" class="copy-btn ls-copy-hist" data-short="${escAttr(item.short)}">Copy</button>
          <button type="button" class="btn btn-ghost btn-sm ls-del" data-i="${i}" style="color:var(--text-3);">×</button>
        </div>
      </div>
    `,
      )
      .join('');

    historyList.querySelectorAll('.ls-copy-hist').forEach((btn) => {
      btn.addEventListener('click', () => window.copyToClipboard(btn.dataset.short, btn));
    });
    historyList.querySelectorAll('.ls-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        const list = getHistory();
        list.splice(Number(btn.dataset.i), 1);
        saveHistory(list);
        renderHistory();
      });
    });
  };

  const shorten = async () => {
    const url = input.value.trim();
    if (!url) {
      errorEl.textContent = 'Nhập URL cần rút gọn';
      return;
    }
    try {
      new URL(url);
    } catch {
      errorEl.textContent = 'URL không hợp lệ (cần có http:// hoặc https://)';
      return;
    }

    errorEl.textContent = '';
    shortenBtn.textContent = 'Đang xử lý...';
    shortenBtn.disabled = true;

    try {
      const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Lỗi kết nối dịch vụ rút gọn');
      const data = await res.json();
      if (data.errorcode) throw new Error(data.errormessage || 'Lỗi API');

      const short = data.shorturl;
      resultInput.value = short;
      openBtn.href = short;
      resultWrap.style.display = '';

      const list = getHistory();
      list.unshift({ short, original: url, ts: Date.now() });
      saveHistory(list);
      renderHistory();

      window.showToast('Rút gọn thành công!', 'success');
    } catch (e) {
      errorEl.textContent = e.message || 'Không thể rút gọn URL. Kiểm tra lại URL hoặc kết nối.';
    } finally {
      shortenBtn.textContent = 'Rút gọn';
      shortenBtn.disabled = false;
    }
  };

  shortenBtn.addEventListener('click', shorten);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) shorten();
  });
  copyBtn.addEventListener('click', () => {
    if (resultInput.value) window.copyToClipboard(resultInput.value, copyBtn);
  });
  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });

  renderHistory();
}
