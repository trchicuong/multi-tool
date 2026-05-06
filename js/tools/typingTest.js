/**
 * Typing Speed Test — bilingual EN/VI, random word generation, auto-start
 */

const WORDS_EN = [
  'the',
  'be',
  'to',
  'of',
  'and',
  'a',
  'in',
  'that',
  'have',
  'it',
  'for',
  'not',
  'on',
  'with',
  'he',
  'as',
  'you',
  'do',
  'at',
  'this',
  'but',
  'his',
  'by',
  'from',
  'they',
  'we',
  'say',
  'her',
  'she',
  'or',
  'an',
  'will',
  'my',
  'one',
  'all',
  'would',
  'there',
  'their',
  'what',
  'so',
  'up',
  'out',
  'if',
  'about',
  'who',
  'get',
  'which',
  'go',
  'me',
  'when',
  'make',
  'can',
  'like',
  'time',
  'no',
  'just',
  'him',
  'know',
  'take',
  'people',
  'into',
  'year',
  'your',
  'good',
  'some',
  'could',
  'them',
  'see',
  'other',
  'than',
  'then',
  'now',
  'look',
  'only',
  'come',
  'its',
  'over',
  'think',
  'also',
  'back',
  'after',
  'use',
  'two',
  'how',
  'our',
  'work',
  'first',
  'well',
  'way',
  'even',
  'new',
  'want',
  'because',
  'any',
  'these',
  'give',
  'day',
  'most',
  'us',
  'great',
  'between',
  'need',
  'large',
  'often',
  'hand',
  'high',
  'place',
  'hold',
  'turn',
  'ask',
  'men',
  'change',
  'off',
  'play',
  'small',
  'number',
  'always',
  'move',
  'live',
  'try',
  'air',
  'away',
  'seem',
  'every',
  'next',
  'below',
  'add',
  'food',
  'keep',
  'children',
  'feet',
  'land',
  'side',
  'without',
  'boy',
  'once',
  'animal',
  'life',
  'few',
  'north',
  'open',
  'together',
  'white',
  'begin',
  'got',
  'walk',
  'example',
  'ease',
  'paper',
  'group',
  'music',
  'those',
  'both',
  'mark',
  'book',
  'letter',
  'until',
  'mile',
  'river',
  'car',
  'care',
  'second',
  'enough',
  'plain',
  'girl',
  'usual',
  'young',
  'ready',
  'above',
  'ever',
  'red',
  'list',
  'though',
  'feel',
  'talk',
  'bird',
  'soon',
  'body',
  'dog',
  'family',
  'direct',
  'leave',
  'song',
  'door',
  'product',
  'black',
  'short',
  'class',
  'wind',
  'question',
  'happen',
  'complete',
  'ship',
  'area',
  'half',
  'rock',
  'order',
  'fire',
  'south',
  'problem',
  'piece',
  'told',
  'knew',
  'pass',
  'since',
  'top',
  'whole',
  'king',
  'space',
  'heard',
  'best',
  'hour',
  'better',
  'true',
  'during',
  'hundred',
  'five',
  'remember',
  'step',
  'early',
  'hold',
  'west',
  'ground',
  'interest',
  'reach',
  'fast',
  'verb',
  'sing',
  'listen',
  'six',
  'table',
  'travel',
  'less',
  'morning',
  'ten',
  'simple',
  'several',
  'vowel',
  'toward',
  'word',
  'long',
  'between',
  'grow',
  'study',
  'still',
  'learn',
  'plant',
  'cover',
  'food',
  'sun',
  'four',
  'between',
  'state',
  'keep',
  'eye',
];

const WORDS_VI = [
  'tôi',
  'bạn',
  'họ',
  'chúng',
  'ta',
  'là',
  'có',
  'và',
  'của',
  'cho',
  'với',
  'trong',
  'không',
  'được',
  'này',
  'đó',
  'một',
  'những',
  'các',
  'đã',
  'sẽ',
  'đang',
  'rất',
  'còn',
  'cũng',
  'như',
  'khi',
  'vì',
  'nên',
  'nhưng',
  'mà',
  'nếu',
  'thì',
  'hay',
  'hoặc',
  'để',
  'từ',
  'sau',
  'trước',
  'trên',
  'dưới',
  'về',
  'vào',
  'ra',
  'lên',
  'xuống',
  'qua',
  'lại',
  'nói',
  'đây',
  'đâu',
  'gì',
  'ai',
  'sao',
  'thế',
  'bao',
  'nhiêu',
  'mấy',
  'làm',
  'nơi',
  'thấy',
  'biết',
  'muốn',
  'cần',
  'phải',
  'mọi',
  'người',
  'thời',
  'gian',
  'việc',
  'nhà',
  'nước',
  'đất',
  'trời',
  'ngày',
  'năm',
  'tháng',
  'tuần',
  'giờ',
  'phút',
  'tiền',
  'công',
  'học',
  'sinh',
  'trường',
  'lớp',
  'sách',
  'bài',
  'tập',
  'kiểm',
  'tra',
  'thi',
  'kết',
  'quả',
  'điểm',
  'môn',
  'thầy',
  'cô',
  'bạn',
  'bè',
  'gia',
  'đình',
  'bố',
  'mẹ',
  'con',
  'anh',
  'chị',
  'em',
  'ông',
  'bà',
  'cháu',
  'vợ',
  'chồng',
  'yêu',
  'thương',
  'vui',
  'buồn',
  'khỏe',
  'mạnh',
  'đẹp',
  'tốt',
  'xấu',
  'lớn',
  'nhỏ',
  'dài',
  'ngắn',
  'cao',
  'thấp',
  'nhanh',
  'chậm',
  'mới',
  'cũ',
  'thật',
  'giả',
  'đúng',
  'sai',
  'đơn',
  'giản',
  'phức',
  'tạp',
  'quan',
  'trọng',
  'cần',
  'thiết',
  'hiểu',
  'nhớ',
  'quên',
  'thích',
  'ghét',
  'đồng',
  'ý',
  'phản',
  'đối',
  'bắt',
  'đầu',
  'kết',
  'thúc',
  'tiếp',
  'tục',
  'dừng',
  'chạy',
  'đi',
  'lại',
  'ngồi',
  'đứng',
  'nằm',
  'ngủ',
  'thức',
  'dậy',
  'ăn',
  'uống',
  'nấu',
  'cơm',
  'bánh',
  'hoa',
  'quả',
  'rau',
  'thịt',
  'cá',
  'trứng',
  'sữa',
  'cà',
  'phê',
  'trà',
  'nước',
  'lạnh',
  'nóng',
  'máy',
  'tính',
  'điện',
  'thoại',
  'mạng',
  'ứng',
  'dụng',
  'phần',
  'mềm',
  'dữ',
  'liệu',
  'chương',
  'trình',
  'lập',
  'hệ',
  'thống',
  'giao',
  'diện',
  'trang',
  'web',
  'thiết',
  'kế',
  'phát',
  'triển',
  'kinh',
  'nghiệm',
  'cuộc',
  'sống',
  'hạnh',
  'phúc',
  'tương',
  'lai',
  'hy',
  'vọng',
  'ước',
  'mơ',
  'khát',
  'thành',
  'công',
  'nội',
  'lực',
  'cố',
  'gắng',
  'kiên',
  'nhẫn',
  'sáng',
  'tạo',
  'độc',
  'lập',
  'tự',
  'do',
  'hòa',
  'bình',
  'tinh',
  'thần',
];

const randWords = (list, count) => {
  const out = [];
  for (let i = 0; i < count; i++) out.push(list[Math.floor(Math.random() * list.length)]);
  return out;
};

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Typing Speed Test</h1>
      <p>Đo tốc độ gõ phím (WPM) và độ chính xác. Bắt đầu gõ để khởi động test tự động.</p>
    </div>

    <div class="card">
      <!-- Settings row -->
      <div class="d-flex align-center gap-2" style="flex-wrap:wrap; margin-bottom:14px;">
        <div style="flex:0 0 auto;">
          <label class="field-label">Thời gian</label>
          <div class="btn-group" style="margin:0;">
            <button class="btn btn-secondary btn-sm tt-dur-btn" data-val="15">15s</button>
            <button class="btn btn-secondary btn-sm tt-dur-btn active" data-val="30">30s</button>
            <button class="btn btn-secondary btn-sm tt-dur-btn" data-val="60">60s</button>
            <button class="btn btn-secondary btn-sm tt-dur-btn" data-val="120">120s</button>
          </div>
        </div>
        <div style="flex:0 0 auto;">
          <label class="field-label">Ngôn ngữ</label>
          <div class="btn-group" style="margin:0;">
            <button class="btn btn-secondary btn-sm tt-lang-btn active" data-lang="en">English</button>
            <button class="btn btn-secondary btn-sm tt-lang-btn" data-lang="vi">Tiếng Việt</button>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="ttReset" style="align-self:flex-end; margin-left:auto;">Reset</button>
      </div>

      <!-- Stats bar -->
      <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:14px;">
        <div class="card" style="text-align:center; padding:10px 4px;">
          <div id="ttTimer" style="font-size:26px; font-weight:700; font-family:monospace; color:var(--accent);">30</div>
          <div class="text-muted text-sm">Giây</div>
        </div>
        <div class="card" style="text-align:center; padding:10px 4px;">
          <div id="ttWpm" style="font-size:26px; font-weight:700; font-family:monospace;">0</div>
          <div class="text-muted text-sm">WPM</div>
        </div>
        <div class="card" style="text-align:center; padding:10px 4px;">
          <div id="ttRaw" style="font-size:26px; font-weight:700; font-family:monospace;">0</div>
          <div class="text-muted text-sm">Raw</div>
        </div>
        <div class="card" style="text-align:center; padding:10px 4px;">
          <div id="ttAcc" style="font-size:26px; font-weight:700; font-family:monospace;">--</div>
          <div class="text-muted text-sm">Accuracy</div>
        </div>
        <div class="card" style="text-align:center; padding:10px 4px;">
          <div id="ttErrors" style="font-size:26px; font-weight:700; font-family:monospace;">0</div>
          <div class="text-muted text-sm">Lỗi</div>
        </div>
      </div>

      <!-- Word display -->
      <div id="ttTextDisplay"
        style="font-size:18px; line-height:2; letter-spacing:0.3px; min-height:88px;
               padding:12px 14px; background:var(--surface-2); border-radius:var(--radius);
               border:1px solid var(--border); cursor:text; word-break:break-word;
               user-select:none; margin-bottom:10px;"></div>

      <!-- Typing input -->
      <input type="text" id="ttInput"
        style="width:100%; font-size:17px; letter-spacing:0.4px; font-family:var(--font-mono);"
        placeholder="Bắt đầu gõ để khởi động test..."
        spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" />

      <!-- Results panel -->
      <div id="ttResults" style="display:none;" class="mt-2">
        <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:20px; text-align:center;">
          <div style="font-size:18px; font-weight:700; margin-bottom:12px; color:var(--accent);">Kết quả</div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:12px;">
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalWpm">--</div><div class="text-muted text-sm">WPM</div></div>
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalAcc">--</div><div class="text-muted text-sm">Accuracy</div></div>
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalRaw">--</div><div class="text-muted text-sm">Raw WPM</div></div>
            <div><div style="font-size:28px; font-weight:700;" id="ttFinalErrors">--</div><div class="text-muted text-sm">Lỗi</div></div>
          </div>
          <button class="btn btn-primary mt-2" id="ttRetry">Thử lại</button>
        </div>
      </div>
    </div>
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

  // Inject styles
  if (!document.getElementById('tt-styles')) {
    const s = document.createElement('style');
    s.id = 'tt-styles';
    s.textContent = `
      .tt-correct { color: var(--accent); }
      .tt-wrong   { color: #ef4444; background: rgba(239,68,68,.12); border-radius:2px; }
      .tt-pending { color: var(--text-2); }
      .tt-caret   { border-left: 2px solid var(--accent); margin-left:-1px; }
      .tt-word    { margin-right: 6px; display:inline-block; }
    `;
    document.head.appendChild(s);
  }

  // Duration buttons
  document.querySelectorAll('.tt-dur-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tt-dur-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      duration = +btn.dataset.val;
      reset();
    });
  });

  // Language buttons
  document.querySelectorAll('.tt-lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tt-lang-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      lang = btn.dataset.lang;
      reset();
    });
  });

  const genWords = () => {
    const list = lang === 'vi' ? WORDS_VI : WORDS_EN;
    return randWords(list, 80);
  };

  const renderDisplay = (typedVal) => {
    const typedWords = typedVal ? typedVal.split(' ') : [];
    const currentWordIdx = typedWords.length - 1;

    let html = '';
    words.forEach((word, wi) => {
      const tw = typedWords[wi] ?? '';

      if (wi < typedWords.length - 1) {
        let wordHtml = '';
        const maxLen = Math.max(word.length, tw.length);
        for (let ci = 0; ci < maxLen; ci++) {
          const ch = word[ci] ?? '';
          const td = tw[ci] ?? '';
          if (!ch) wordHtml += '<span class="tt-wrong">' + td + '</span>';
          else if (td === ch) wordHtml += '<span class="tt-correct">' + ch + '</span>';
          else wordHtml += '<span class="tt-wrong">' + ch + '</span>';
        }
        html += '<span class="tt-word">' + wordHtml + '</span>';
      } else if (wi === currentWordIdx) {
        let wordHtml = '';
        const maxLen = Math.max(word.length, tw.length);
        for (let ci = 0; ci < maxLen; ci++) {
          const ch = word[ci] ?? '';
          const td = tw[ci] ?? '';
          const isCaret = ci === tw.length && !typedVal.endsWith(' ');
          const caretCls = isCaret ? ' tt-caret' : '';
          if (!ch) wordHtml += '<span class="tt-wrong' + caretCls + '">' + td + '</span>';
          else if (ci >= tw.length)
            wordHtml += '<span class="tt-pending' + caretCls + '">' + ch + '</span>';
          else if (td === ch)
            wordHtml += '<span class="tt-correct' + caretCls + '">' + ch + '</span>';
          else wordHtml += '<span class="tt-wrong' + caretCls + '">' + ch + '</span>';
        }
        if (tw.length >= word.length && !typedVal.endsWith(' '))
          wordHtml += '<span class="tt-caret"></span>';
        html += '<span class="tt-word">' + wordHtml + '</span>';
      } else {
        html += '<span class="tt-word tt-pending">' + word + '</span>';
      }
    });
    textDisplay.innerHTML = html;
  };

  const computeStats = () => {
    const typed = input.value;
    const elapsed = startTime ? Math.max((Date.now() - startTime) / 60000, 0.001) : 0.001;
    const typedWords = typed.split(' ');
    let correct = 0,
      errors = 0;
    words.slice(0, typedWords.length).forEach((word, i) => {
      const tw = typedWords[i] ?? '';
      if (tw === word) correct++;
      else if (i < typedWords.length - 1) errors++;
    });
    const rawWpm = Math.round(typed.replace(/ /g, '').length / 5 / elapsed);
    const wpm = Math.round(correct / elapsed);
    const acc = typedWords.length > 1 ? Math.round((correct / (typedWords.length - 1)) * 100) : 100;
    wpmEl.textContent = wpm;
    rawEl.textContent = rawWpm;
    accEl.textContent = started ? acc + '%' : '--';
    errorsEl.textContent = errors;
    return { wpm, rawWpm, acc, errors };
  };

  const endTest = () => {
    finished = true;
    clearInterval(intervalId);
    input.disabled = true;
    const stats = computeStats();
    document.getElementById('ttFinalWpm').textContent = stats.wpm;
    document.getElementById('ttFinalAcc').textContent = stats.acc + '%';
    document.getElementById('ttFinalRaw').textContent = stats.rawWpm;
    document.getElementById('ttFinalErrors').textContent = stats.errors;
    resultsEl.style.display = '';
  };

  const reset = () => {
    clearInterval(intervalId);
    finished = false;
    started = false;
    startTime = null;
    timeLeft = duration;
    timerEl.textContent = duration;
    timerEl.style.color = 'var(--accent)';
    wpmEl.textContent = '0';
    rawEl.textContent = '0';
    accEl.textContent = '--';
    errorsEl.textContent = '0';
    input.value = '';
    input.disabled = false;
    resultsEl.style.display = 'none';
    words = genWords();
    renderDisplay('');
    input.placeholder = 'Bắt đầu gõ để khởi động test...';
  };

  input.addEventListener('keydown', (e) => {
    if (finished) return;
    if (!started && e.key.length === 1) {
      started = true;
      startTime = Date.now();
      input.placeholder = '';
      intervalId = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 10) timerEl.style.color = '#ef4444';
        computeStats();
        if (timeLeft <= 0) endTest();
      }, 1000);
    }
  });

  input.addEventListener('input', () => {
    if (finished) return;
    const val = input.value;
    const typedWordCount = val.split(' ').length;
    if (typedWordCount > words.length) {
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
  input.focus();
}
