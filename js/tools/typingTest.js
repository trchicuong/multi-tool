/**
 * Typing Speed Test — EN / VI / Dev Code modes, auto-scrolling prompt & full interval cleanup
 */

const WORDS_EN = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'great', 'between', 'need',
  'large', 'often', 'hand', 'high', 'place', 'turn', 'ask', 'change', 'play', 'small', 'number',
  'always', 'move', 'live', 'try', 'seem', 'every', 'next', 'open', 'together', 'begin', 'walk',
  'example', 'paper', 'group', 'music', 'book', 'letter', 'until', 'river', 'second', 'enough',
  'ready', 'above', 'feel', 'talk', 'soon', 'family', 'direct', 'leave', 'door', 'product',
  'short', 'class', 'question', 'happen', 'complete', 'area', 'order', 'problem', 'piece',
  'since', 'space', 'best', 'hour', 'better', 'true', 'during', 'remember', 'step', 'early',
  'ground', 'interest', 'reach', 'fast', 'listen', 'table', 'travel', 'morning', 'simple',
  'several', 'word', 'long', 'grow', 'study', 'still', 'learn', 'cover', 'state', 'keep',
];

const WORDS_VI = [
  'tôi', 'bạn', 'chúng', 'ta', 'là', 'có', 'và', 'của', 'cho', 'với', 'trong', 'không', 'được',
  'này', 'đó', 'một', 'những', 'các', 'đã', 'sẽ', 'đang', 'rất', 'còn', 'cũng', 'như', 'khi',
  'vì', 'nên', 'nhưng', 'nếu', 'thì', 'hay', 'hoặc', 'để', 'từ', 'sau', 'trước', 'trên', 'dưới',
  'về', 'vào', 'qua', 'nói', 'đây', 'làm', 'nơi', 'thấy', 'biết', 'muốn', 'cần', 'phải', 'mọi',
  'người', 'thời', 'gian', 'việc', 'nhà', 'nước', 'ngày', 'năm', 'tháng', 'tuần', 'giờ', 'phút',
  'công', 'học', 'sinh', 'trường', 'sách', 'bài', 'tập', 'kiểm', 'tra', 'kết', 'quả', 'gia',
  'đình', 'anh', 'em', 'vui', 'khỏe', 'mạnh', 'đẹp', 'tốt', 'lớn', 'nhỏ', 'dài', 'ngắn', 'nhanh',
  'chậm', 'mới', 'cũ', 'đúng', 'đơn', 'giản', 'quan', 'trọng', 'thiết', 'hiểu', 'nhớ', 'thích',
  'bắt', 'đầu', 'tiếp', 'tục', 'chạy', 'máy', 'tính', 'điện', 'thoại', 'mạng', 'ứng', 'dụng',
  'phần', 'mềm', 'dữ', 'liệu', 'chương', 'trình', 'lập', 'hệ', 'thống', 'giao', 'diện', 'trang',
  'thiết', 'kế', 'phát', 'triển', 'kinh', 'nghiệm', 'tương', 'lai', 'thành', 'công', 'sáng', 'tạo',
];

const WORDS_DEV = [
  'const', 'let', 'function', 'return', 'async', 'await', 'import', 'export', 'default', 'class',
  'extends', 'interface', 'type', 'promise', 'fetch', 'json', 'parse', 'stringify', 'array',
  'object', 'map', 'filter', 'reduce', 'forEach', 'length', 'value', 'index', 'error', 'catch',
  'throw', 'finally', 'switch', 'case', 'break', 'continue', 'while', 'true', 'false', 'null',
  'undefined', 'window', 'document', 'element', 'query', 'selector', 'event', 'target', 'prevent',
  'module', 'bundle', 'build', 'config', 'server', 'client', 'request', 'response', 'status',
  'header', 'token', 'bearer', 'cookie', 'session', 'storage', 'cache', 'worker', 'thread',
  'stream', 'buffer', 'encode', 'decode', 'regex', 'pattern', 'match', 'replace', 'split',
];

const randWords = (list, count) =>
  Array.from({ length: count }, () => list[Math.floor(Math.random() * list.length)]);

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Typing Speed Test</h1>
      <p>Đo tốc độ gõ phím (WPM) và độ chính xác theo 3 bộ từ vựng: English, Tiếng Việt và Developer Code.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="d-flex align-center gap-2 flex-wrap">
          <div class="seg-group" role="group" aria-label="Thời gian">
            <button type="button" class="btn tt-dur-btn" data-val="15">15s</button>
            <button type="button" class="btn tt-dur-btn active" data-val="30">30s</button>
            <button type="button" class="btn tt-dur-btn" data-val="60">60s</button>
            <button type="button" class="btn tt-dur-btn" data-val="120">120s</button>
          </div>
          <div class="seg-group" role="group" aria-label="Ngôn ngữ">
            <button type="button" class="btn tt-lang-btn active" data-lang="en">English</button>
            <button type="button" class="btn tt-lang-btn" data-lang="vi">Tiếng Việt</button>
            <button type="button" class="btn tt-lang-btn" data-lang="dev">Dev Code</button>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="ttReset">Reset</button>
      </div>

      <!-- Stats bar -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:10px; margin-bottom:14px;">
        <div class="ts-stat-card">
          <div id="ttTimer" class="ts-stat-num" style="color:var(--accent);">30</div>
          <div class="text-muted text-sm">Giây</div>
        </div>
        <div class="ts-stat-card">
          <div id="ttWpm" class="ts-stat-num">0</div>
          <div class="text-muted text-sm">WPM</div>
        </div>
        <div class="ts-stat-card">
          <div id="ttRaw" class="ts-stat-num">0</div>
          <div class="text-muted text-sm">Raw</div>
        </div>
        <div class="ts-stat-card">
          <div id="ttAcc" class="ts-stat-num">--</div>
          <div class="text-muted text-sm">Chính xác</div>
        </div>
        <div class="ts-stat-card">
          <div id="ttErrors" class="ts-stat-num">0</div>
          <div class="text-muted text-sm">Lỗi</div>
        </div>
      </div>

      <!-- Word display -->
      <div
        id="ttTextDisplay"
        style="font-size:18px; line-height:2; letter-spacing:0.2px; height:128px; overflow-y:auto; padding:12px 14px; background:var(--surface-2); border-radius:var(--radius); border:1px solid var(--border); cursor:text; word-break:break-word; user-select:none; margin-bottom:12px;"
      ></div>

      <!-- Typing input -->
      <input
        type="text"
        id="ttInput"
        style="width:100%; font-size:17px; letter-spacing:0.3px; font-family:var(--font-mono);"
        placeholder="Bắt đầu gõ để khởi động test..."
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />

      <!-- Results panel -->
      <div id="ttResults" style="display:none;" class="mt-2">
        <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:20px; text-align:center;">
          <div style="font-size:16px; font-weight:650; margin-bottom:12px; color:var(--accent);">Kết quả hoàn thành</div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:12px;">
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalWpm">--</div><div class="text-muted text-sm">WPM</div></div>
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalAcc">--</div><div class="text-muted text-sm">Accuracy</div></div>
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalRaw">--</div><div class="text-muted text-sm">Raw WPM</div></div>
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalErrors">--</div><div class="text-muted text-sm">Lỗi</div></div>
          </div>
          <button type="button" class="btn btn-primary mt-2" id="ttRetry">Thử lại</button>
        </div>
      </div>
    </div>

    <style>
      .ts-stat-card { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); text-align:center; padding:10px 6px; }
      .ts-stat-num { font-size:24px; font-weight:700; font-family:var(--font-mono); line-height:1.15; }
      .tt-correct { color: var(--accent); }
      .tt-wrong   { color: var(--danger); background: var(--danger-bg); border-radius:2px; }
      .tt-pending { color: var(--text-2); }
      .tt-caret   { border-left: 2px solid var(--accent); margin-left:-1px; }
      .tt-word    { margin-right: 7px; display:inline-block; }
    </style>
  `;
}

export function init() {
  const timerEl = document.getElementById('ttTimer');
  const wpmEl = document.getElementById('ttWpm');
  const rawEl = document.getElementById('ttRaw');
  const accEl = document.getElementById('ttAcc');
  const errorsEl = document.getElementById('ttErrors');
  const textDisplay = document.getElementById('ttTextDisplay');
  const input = document.getElementById('ttInput');
  const resultsEl = document.getElementById('ttResults');
  const resetBtn = document.getElementById('ttReset');
  const retryBtn = document.getElementById('ttRetry');

  let lang = 'en';
  let duration = 30;
  let timeLeft = 30;
  let intervalId = null;
  let started = false;
  let finished = false;
  let words = [];
  let startTime = null;

  document.querySelectorAll('.tt-dur-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tt-dur-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      duration = Number(btn.dataset.val);
      reset();
    });
  });

  document.querySelectorAll('.tt-lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tt-lang-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      lang = btn.dataset.lang;
      reset();
    });
  });

  const genWords = () => {
    const list = lang === 'vi' ? WORDS_VI : lang === 'dev' ? WORDS_DEV : WORDS_EN;
    return randWords(list, 100);
  };

  const renderDisplay = (typedVal) => {
    const typedWords = typedVal ? typedVal.split(' ') : [];
    const currentWordIdx = typedWords.length - 1;

    let html = '';
    words.forEach((word, wi) => {
      const tw = typedWords[wi] ?? '';
      if (wi < currentWordIdx) {
        let wordHtml = '';
        const maxLen = Math.max(word.length, tw.length);
        for (let ci = 0; ci < maxLen; ci++) {
          const ch = word[ci] ?? '';
          const td = tw[ci] ?? '';
          if (!ch) wordHtml += `<span class="tt-wrong">${td}</span>`;
          else if (td === ch) wordHtml += `<span class="tt-correct">${ch}</span>`;
          else wordHtml += `<span class="tt-wrong">${ch}</span>`;
        }
        html += `<span class="tt-word">${wordHtml}</span>`;
      } else if (wi === currentWordIdx) {
        let wordHtml = '';
        const maxLen = Math.max(word.length, tw.length);
        for (let ci = 0; ci < maxLen; ci++) {
          const ch = word[ci] ?? '';
          const td = tw[ci] ?? '';
          const isCaret = ci === tw.length && !typedVal.endsWith(' ');
          const caretCls = isCaret ? ' tt-caret' : '';
          if (!ch) wordHtml += `<span class="tt-wrong${caretCls}">${td}</span>`;
          else if (ci >= tw.length) wordHtml += `<span class="tt-pending${caretCls}">${ch}</span>`;
          else if (td === ch) wordHtml += `<span class="tt-correct${caretCls}">${ch}</span>`;
          else wordHtml += `<span class="tt-wrong${caretCls}">${ch}</span>`;
        }
        if (tw.length >= word.length && !typedVal.endsWith(' ')) wordHtml += '<span class="tt-caret"></span>';
        html += `<span class="tt-word" id="ttActiveWord">${wordHtml}</span>`;
      } else {
        html += `<span class="tt-word tt-pending">${word}</span>`;
      }
    });
    textDisplay.innerHTML = html;

    const activeEl = document.getElementById('ttActiveWord');
    if (activeEl) {
      const top = activeEl.offsetTop - textDisplay.offsetTop;
      if (top > textDisplay.scrollTop + textDisplay.clientHeight - 44 || top < textDisplay.scrollTop) {
        textDisplay.scrollTop = Math.max(0, top - 36);
      }
    }
  };

  const computeStats = () => {
    const typed = input.value;
    const elapsed = startTime ? Math.max((Date.now() - startTime) / 60000, 0.001) : 0.001;
    const typedWords = typed.split(' ');
    let correct = 0;
    let errors = 0;
    words.slice(0, typedWords.length).forEach((word, i) => {
      const tw = typedWords[i] ?? '';
      if (tw === word) correct++;
      else if (i < typedWords.length - 1) errors++;
    });
    const rawWpm = Math.round(typed.replace(/ /g, '').length / 5 / elapsed);
    const wpm = Math.round(correct / elapsed);
    const acc = typedWords.length > 1 ? Math.round((correct / (typedWords.length - 1)) * 100) : 100;
    wpmEl.textContent = String(wpm);
    rawEl.textContent = String(rawWpm);
    accEl.textContent = started ? `${acc}%` : '--';
    errorsEl.textContent = String(errors);
    return { wpm, rawWpm, acc, errors };
  };

  const endTest = () => {
    finished = true;
    clearInterval(intervalId);
    intervalId = null;
    input.disabled = true;
    const stats = computeStats();
    document.getElementById('ttFinalWpm').textContent = String(stats.wpm);
    document.getElementById('ttFinalAcc').textContent = `${stats.acc}%`;
    document.getElementById('ttFinalRaw').textContent = String(stats.rawWpm);
    document.getElementById('ttFinalErrors').textContent = String(stats.errors);
    resultsEl.style.display = '';
  };

  const reset = () => {
    clearInterval(intervalId);
    intervalId = null;
    finished = false;
    started = false;
    startTime = null;
    timeLeft = duration;
    timerEl.textContent = String(duration);
    timerEl.style.color = 'var(--accent)';
    wpmEl.textContent = '0';
    rawEl.textContent = '0';
    accEl.textContent = '--';
    errorsEl.textContent = '0';
    input.value = '';
    input.disabled = false;
    resultsEl.style.display = 'none';
    words = genWords();
    textDisplay.scrollTop = 0;
    renderDisplay('');
    input.placeholder = 'Bắt đầu gõ để khởi động test...';
    input.focus();
  };

  textDisplay.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (finished) return;
    if (!started && (e.key.length === 1 || e.isComposing)) {
      started = true;
      startTime = Date.now();
      input.placeholder = '';
      intervalId = setInterval(() => {
        timeLeft--;
        timerEl.textContent = String(timeLeft);
        if (timeLeft <= 10) timerEl.style.color = 'var(--danger)';
        computeStats();
        if (timeLeft <= 0) endTest();
      }, 1000);
    }
  });

  input.addEventListener('input', () => {
    if (finished) return;
    const val = input.value;
    if (val.split(' ').length > words.length) {
      endTest();
      return;
    }
    renderDisplay(val);
    computeStats();
  });

  input.addEventListener('paste', (e) => e.preventDefault());
  resetBtn.addEventListener('click', reset);
  retryBtn.addEventListener('click', reset);

  reset();

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}
