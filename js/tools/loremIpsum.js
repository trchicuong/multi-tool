/**
 * Lorem Ipsum Generator
 */

const WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'praesent',
  'aliquam',
  'diam',
  'in',
  'nisl',
  'euismod',
  'at',
  'consequat',
  'urna',
  'auctor',
  'sed',
  'vitae',
  'nunc',
  'magna',
  'porta',
  'accumsan',
  'quisque',
  'vel',
  'libero',
  'nec',
  'lectus',
  'rhoncus',
  'elementum',
  'etiam',
  'tristique',
  'mauris',
  'ac',
  'sapien',
  'pellentesque',
  'vestibulum',
  'ante',
  'primis',
  'faucibus',
  'orci',
  'luctus',
  'ultrices',
  'posuere',
  'cubilia',
  'curae',
  'donec',
  'congue',
  'erat',
  'id',
  'varius',
  'commodo',
  'nulla',
  'facilisi',
  'phasellus',
  'eget',
  'tortor',
  'maximus',
  'tincidunt',
  'felis',
  'ut',
  'semper',
  'nibh',
  'maecenas',
  'efficitur',
  'metus',
  'non',
  'ex',
  'fringilla',
  'finibus',
  'vivamus',
  'sodales',
  'gravida',
  'mollis',
  'integer',
  'blandit',
  'arcu',
  'eu',
  'purus',
  'hendrerit',
  'interdum',
  'duis',
  'volutpat',
  'tellus',
  'tempus',
  'sollicitudin',
  'cras',
  'ornare',
  'eros',
  'fermentum',
  'curabitur',
  'proin',
  'nullam',
  'augue',
  'laoreet',
  'posuere',
  'justo',
  'lacus',
  'cursus',
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

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Lorem Ipsum Generator</h1>
      <p>Tạo văn bản placeholder dùng trong thiết kế và prototype.</p>
    </div>

    <div class="card">
      <div class="row" style="flex-wrap:wrap; gap:12px; align-items:flex-end;">
        <div>
          <label class="field-label">Loại</label>
          <div class="btn-group" style="margin:0;">
            <button class="btn btn-secondary li-type-btn active" data-type="paragraphs">Đoạn văn</button>
            <button class="btn btn-secondary li-type-btn" data-type="sentences">Câu</button>
            <button class="btn btn-secondary li-type-btn" data-type="words">Từ</button>
          </div>
        </div>
        <div style="flex:0 0 120px;">
          <label class="field-label">Số lượng</label>
          <input type="number" id="liCount" value="3" min="1" max="100" />
        </div>
        <label class="d-flex align-center gap-2" style="cursor:pointer; padding-top:20px;">
          <input type="checkbox" id="liClassic" checked /> Bắt đầu bằng "Lorem ipsum..."
        </label>
        <button class="btn btn-primary" id="liGenBtn" style="align-self:flex-end;">Generate</button>
      </div>
    </div>

    <div class="card mt-2" id="liResultCard" style="display:none;">
      <div class="d-flex align-center gap-1 mb-1" style="justify-content:space-between;">
        <span class="field-label" style="margin:0;" id="liStatLabel"></span>
        <button class="copy-btn" id="liCopyBtn" style="position:static;">Copy</button>
      </div>
      <div id="liOutput" style="line-height:1.75; font-size:14px;"></div>
    </div>
  `;
}

export function init() {
  const countInput = document.getElementById('liCount');
  const classicChk = document.getElementById('liClassic');
  const genBtn = document.getElementById('liGenBtn');
  const resultCard = document.getElementById('liResultCard');
  const statLabel = document.getElementById('liStatLabel');
  const outputEl = document.getElementById('liOutput');
  const copyBtn = document.getElementById('liCopyBtn');

  let selectedType = 'paragraphs';

  document.querySelectorAll('.li-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.li-type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
    });
  });

  const CLASSIC_START =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

  const generate = () => {
    const n = Math.min(Math.max(1, parseInt(countInput.value) || 3), 100);
    let text = '';
    if (selectedType === 'paragraphs') {
      const parts = Array.from({ length: n }, (_, i) => {
        if (i === 0 && classicChk.checked) return CLASSIC_START;
        return genParagraphs(1);
      });
      text = parts.join('\n\n');
      outputEl.innerHTML = parts.map((p) => `<p>${escHtml(p)}</p>`).join('');
    } else if (selectedType === 'sentences') {
      const parts = Array.from({ length: n }, (_, i) => {
        if (i === 0 && classicChk.checked)
          return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
        return genSentences(1);
      });
      text = parts.join(' ');
      outputEl.innerHTML = `<p>${escHtml(text)}</p>`;
    } else {
      const words = genWords(n).split(' ');
      if (classicChk.checked) words.splice(0, 2, 'Lorem', 'ipsum');
      text = words.join(' ');
      outputEl.innerHTML = `<p>${escHtml(text)}</p>`;
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const charCount = text.length;
    statLabel.textContent = `${wordCount} từ · ${charCount} ký tự`;
    resultCard.style.display = '';
    copyBtn._fullText = text;
  };

  genBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', () =>
    window.copyToClipboard(copyBtn._fullText || outputEl.innerText, copyBtn),
  );

  // Generate on load
  generate();
}

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
