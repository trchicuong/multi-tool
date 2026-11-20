/**
 * Lorem Ipsum Generator — Paragraphs, Sentences, Words & optional HTML <p> wrapping
 */

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'praesent',
  'aliquam', 'diam', 'in', 'nisl', 'euismod', 'at', 'consequat', 'urna', 'auctor', 'sed',
  'vitae', 'nunc', 'magna', 'porta', 'accumsan', 'quisque', 'vel', 'libero', 'nec', 'lectus',
  'rhoncus', 'elementum', 'etiam', 'tristique', 'mauris', 'ac', 'sapien', 'pellentesque',
  'vestibulum', 'ante', 'primis', 'faucibus', 'orci', 'luctus', 'ultrices', 'posuere',
  'cubilia', 'curae', 'donec', 'congue', 'erat', 'id', 'varius', 'commodo', 'nulla',
  'facilisi', 'phasellus', 'eget', 'tortor', 'maximus', 'tincidunt', 'felis', 'ut', 'semper',
  'nibh', 'maecenas', 'efficitur', 'metus', 'non', 'ex', 'fringilla', 'finibus', 'vivamus',
  'sodales', 'gravida', 'mollis', 'integer', 'blandit', 'arcu', 'eu', 'purus', 'hendrerit',
  'interdum', 'duis', 'volutpat', 'tellus', 'tempus', 'sollicitudin', 'cras', 'ornare',
  'eros', 'fermentum', 'curabitur', 'proin', 'nullam', 'augue', 'laoreet', 'justo', 'lacus', 'cursus',
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const genWords = (n) => Array.from({ length: n }, () => pick(WORDS)).join(' ');
const genSentences = (n) =>
  Array.from({ length: n }, () => {
    const w = genWords(rand(8, 16));
    return w.charAt(0).toUpperCase() + w.slice(1) + '.';
  }).join(' ');
const genParagraphs = (n) => Array.from({ length: n }, () => genSentences(rand(4, 7))).join('\n\n');
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Lorem Ipsum Generator</h1>
      <p>Tạo văn bản giả (paragraphs, sentences, words) kèm tùy chọn bọc thẻ HTML &lt;p&gt;.</p>
    </div>

    <div class="card">
      <div class="row" style="flex-wrap:wrap; gap:12px; align-items:flex-end;">
        <div style="flex:0 0 auto;">
          <span class="field-label">Loại</span>
          <div class="seg-group">
            <button type="button" class="btn li-type-btn active" data-type="paragraphs">Đoạn văn</button>
            <button type="button" class="btn li-type-btn" data-type="sentences">Câu</button>
            <button type="button" class="btn li-type-btn" data-type="words">Từ</button>
          </div>
        </div>
        <div style="flex:0 0 110px;">
          <label class="field-label" for="liCount">Số lượng</label>
          <input type="number" id="liCount" value="3" min="1" max="100" />
        </div>
        <div style="flex:1 1 auto; display:flex; align-items:center; gap:16px; min-height:38px; flex-wrap:wrap;">
          <label class="checkbox-row">
            <input type="checkbox" id="liClassic" checked />
            <span>Bắt đầu bằng "Lorem ipsum..."</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="liHtmlTags" />
            <span>Bọc thẻ HTML (<code>&lt;p&gt;</code>)</span>
          </label>
        </div>
        <div style="flex:0 0 auto;">
          <button type="button" class="btn btn-primary" id="liGenBtn">Generate</button>
        </div>
      </div>
    </div>

    <div class="card" id="liResultCard" style="display:none;">
      <div class="card-header">
        <span class="field-label" id="liStatLabel"></span>
        <button type="button" class="copy-btn" id="liCopyBtn">Copy</button>
      </div>
      <div id="liOutput" style="line-height:1.75; font-size:14px;"></div>
    </div>
  `;
}

export function init() {
  const countInput = document.getElementById('liCount');
  const classicChk = document.getElementById('liClassic');
  const htmlTagsChk = document.getElementById('liHtmlTags');
  const genBtn = document.getElementById('liGenBtn');
  const resultCard = document.getElementById('liResultCard');
  const statLabel = document.getElementById('liStatLabel');
  const outputEl = document.getElementById('liOutput');
  const copyBtn = document.getElementById('liCopyBtn');

  let selectedType = 'paragraphs';
  let currentParts = [];

  const CLASSIC_START =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

  const renderOutput = () => {
    const asHtml = htmlTagsChk.checked;
    let rawText = '';

    if (asHtml) {
      rawText = currentParts.map((p) => `<p>${p}</p>`).join('\n');
      outputEl.innerHTML = `<div class="output-box"><pre style="margin:0;">${escHtml(rawText)}</pre></div>`;
    } else {
      rawText = currentParts.join(selectedType === 'paragraphs' ? '\n\n' : ' ');
      outputEl.innerHTML = currentParts.map((p) => `<p style="margin-bottom:10px;">${escHtml(p)}</p>`).join('');
    }

    const plain = currentParts.join(' ');
    const wordCount = plain.split(/\s+/).filter(Boolean).length;
    statLabel.textContent = `${wordCount} từ · ${rawText.length} ký tự`;
    resultCard.style.display = '';
    copyBtn._fullText = rawText;
  };

  const generate = () => {
    const n = Math.min(Math.max(1, parseInt(countInput.value, 10) || 3), 100);
    if (selectedType === 'paragraphs') {
      currentParts = Array.from({ length: n }, (_, i) =>
        i === 0 && classicChk.checked ? CLASSIC_START : genParagraphs(1),
      );
    } else if (selectedType === 'sentences') {
      currentParts = [
        Array.from({ length: n }, (_, i) =>
          i === 0 && classicChk.checked
            ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
            : genSentences(1),
        ).join(' '),
      ];
    } else {
      const words = genWords(n).split(' ');
      if (classicChk.checked) words.splice(0, Math.min(2, words.length), 'Lorem', 'ipsum');
      currentParts = [words.join(' ')];
    }
    renderOutput();
  };

  document.querySelectorAll('.li-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.li-type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
      generate();
    });
  });

  htmlTagsChk.addEventListener('change', renderOutput);
  classicChk.addEventListener('change', generate);
  genBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', () => window.copyToClipboard(copyBtn._fullText || '', copyBtn));

  generate();
}
