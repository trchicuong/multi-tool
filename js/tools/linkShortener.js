/**
 * Link Shortener — uses is.gd API + local history
 */

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Link Shortener</h1>
      <p>Rút gọn URL dài bằng is.gd. Lịch sử lưu trong trình duyệt.</p>
    </div>

    <div class="card">
      <div class="field">
        <label class="field-label">URL cần rút gọn</label>
        <div class="d-flex gap-2" style="align-items:flex-end;">
          <input type="url" id="lsInput" class="flex-1"
            placeholder="https://example.com/very/long/url/here"
            spellcheck="false" autocomplete="off" />
          <button class="btn btn-primary" id="lsShorten">Rút gọn</button>
        </div>
        <div id="lsError" class="text-sm" style="color:var(--danger,#ef4444); min-height:18px; margin-top:4px;"></div>
      </div>

      <div id="lsResultWrap" style="display:none; margin-top:12px;">
        <label class="field-label">URL đã rút gọn</label>
        <div class="d-flex gap-2 align-center">
          <input type="text" id="lsResult" class="flex-1 mono" readonly />
          <button class="btn btn-secondary" id="lsCopyBtn">Copy</button>
          <a id="lsOpenBtn" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-ghost">Open</a>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="card mt-2" id="lsHistoryCard" style="display:none;">
      <div class="d-flex align-center gap-1 mb-2" style="justify-content:space-between;">
        <span class="field-label" style="margin:0;">Lịch sử</span>
        <button class="btn btn-ghost btn-sm" id="lsClearHistory">Xoá tất cả</button>
      </div>
      <div id="lsHistoryList"></div>
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
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
      <div class="d-flex align-center gap-2" style="padding:6px 0; border-bottom:1px solid var(--border); flex-wrap:wrap;">
        <div style="flex:1; min-width:0;">
          <div class="text-sm mono" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--accent);">${item.short}</div>
          <div class="text-sm text-muted" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.original}</div>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-ghost btn-sm ls-copy-hist" data-short="${item.short}">Copy</button>
          <button class="btn btn-ghost btn-sm ls-del" data-i="${i}">×</button>
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
        list.splice(+btn.dataset.i, 1);
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

    // Validate URL
    try {
      new URL(url);
    } catch {
      errorEl.textContent = 'URL không hợp lệ';
      return;
    }

    errorEl.textContent = '';
    shortenBtn.textContent = 'Đang rút gọn...';
    shortenBtn.disabled = true;

    try {
      const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.errorcode) throw new Error(data.errormessage || 'Lỗi API');

      const short = data.shorturl;
      resultInput.value = short;
      openBtn.href = short;
      resultWrap.style.display = '';

      // Save to history
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
    if (e.key === 'Enter') shorten();
  });
  copyBtn.addEventListener('click', () => window.copyToClipboard(resultInput.value, copyBtn));
  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });

  renderHistory();
}
