import { showToast } from '../ui.js';

export function getRegexGeneratorHtml() {
  return `
    <h3>Regex Helper</h3>
    <p>Tạo và giải thích các biểu thức Regex bằng ngôn ngữ tự nhiên.</p>

    <div class="tool-section">
      <h4>Tạo Regex từ mô tả</h4>
      <label for="description-input">Nhập mô tả của bạn (ví dụ: "một địa chỉ email gmail")</label>
      <textarea id="description-input" placeholder="Mô tả yêu cầu của bạn ở đây..." rows="3"></textarea>
      <button id="generate-regex-btn" class="btn primary"><i class="ph-bold ph-magic-wand"></i> Tạo Regex</button>
      <div class="result-container" style="margin-top: 10px;">
        <label>Biểu thức Regex được tạo ra</label>
        <div class="row">
            <input type="text" id="regex-output" placeholder="Kết quả Regex sẽ hiện ở đây..." readonly>
            <button id="copy-regex-btn" class="btn ghost" title="Sao chép"><i class="ph-bold ph-copy"></i></button>
        </div>
      </div>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <h4>Giải thích Regex</h4>
      <label for="regex-input">Dán một biểu thức Regex để được giải thích</label>
      <textarea id="regex-input" placeholder="/^\\d{3}-\\d{3}-\\d{4}$/g" rows="3"></textarea>
      <button id="explain-regex-btn" class="btn primary"><i class="ph-bold ph-question"></i> Giải thích</button>
      <div id="explanation-output" class="result markdown-body" style="margin-top: 10px;">
        Phần giải thích sẽ hiện ở đây.
      </div>
    </div>
  `;
}

export function initRegexGenerator() {
  const descriptionInput = document.getElementById('description-input');
  const generateBtn = document.getElementById('generate-regex-btn');
  const regexOutput = document.getElementById('regex-output');
  const copyBtn = document.getElementById('copy-regex-btn');

  const regexInput = document.getElementById('regex-input');
  const explainBtn = document.getElementById('explain-regex-btn');
  const explanationOutput = document.getElementById('explanation-output');

  generateBtn.addEventListener('click', async () => {
    const description = descriptionInput.value;
    if (!description.trim()) {
      showToast('Vui lòng nhập mô tả.', 'warning');
      return;
    }

    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang tạo...';
    regexOutput.value = 'AI đang xử lý...';

    try {
      const result = await generateRegexWithAI(description);
      regexOutput.value = result;
    } catch (error) {
      regexOutput.value = `Lỗi: ${error.message}`;
      showToast('Tạo Regex thất bại.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  });

  copyBtn.addEventListener('click', () => {
    if (regexOutput.value && !regexOutput.value.startsWith('Lỗi')) {
      navigator.clipboard.writeText(regexOutput.value);
      showToast('Đã sao chép Regex!', 'success');
    }
  });

  explainBtn.addEventListener('click', async () => {
    const regex = regexInput.value;
    if (!regex.trim()) {
      showToast('Vui lòng nhập Regex để giải thích.', 'warning');
      return;
    }

    const originalBtnHTML = explainBtn.innerHTML;
    explainBtn.disabled = true;
    explainBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang giải thích...';
    explanationOutput.innerHTML =
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích...</div>';

    try {
      const result = await explainRegexWithAI(regex);
      explanationOutput.innerHTML = parseMarkdown(result);
    } catch (error) {
      explanationOutput.textContent = `Lỗi: ${error.message}`;
      showToast('Giải thích Regex thất bại.', 'error');
    } finally {
      explainBtn.disabled = false;
      explainBtn.innerHTML = originalBtnHTML;
    }
  });
}

async function generateRegexWithAI(description) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `Bạn là một chuyên gia hàng đầu về Regular Expression (Regex).
    Dựa trên mô tả bằng ngôn ngữ tự nhiên sau đây, hãy tạo ra một biểu thức Regex chính xác và hiệu quả.
    Chỉ trả về duy nhất biểu thức Regex, không kèm theo bất kỳ giải thích, markdown, hay văn bản nào khác.
    
    Mô tả: "${description}"`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!response.ok) throw new Error(`Lỗi API: ${response.statusText}`);
  const result = await response.json();
  return result.candidates[0].content.parts[0].text.trim();
}

async function explainRegexWithAI(regex) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `Bạn là một chuyên gia hàng đầu về Regular Expression (Regex) và là một giáo viên có khả năng giải thích các khái niệm phức tạp một cách đơn giản.
    Hãy phân tích chi tiết biểu thức Regex sau đây.
    1.  Đưa ra mục đích tổng quát của Regex.
    2.  Giải thích từng thành phần và ký hiệu đặc biệt theo dạng danh sách.
    3.  Cung cấp một ví dụ về chuỗi sẽ khớp (match).
    4.  Cung cấp một ví dụ về chuỗi sẽ không khớp (no match).
    Sử dụng định dạng Markdown để trình bày câu trả lời một cách rõ ràng bằng tiếng Việt.

    Regex cần giải thích: \`${regex}\``;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!response.ok) throw new Error(`Lỗi API: ${response.statusText}`);
  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}

function parseMarkdown(markdown) {
  if (!markdown) return '';
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    return markdown.replace(/\\n/g, '<br>');
  }
  marked.setOptions({ breaks: true, gfm: true });
  const rawHtml = marked.parse(markdown);
  const cleanHtml = DOMPurify.sanitize(rawHtml);
  return cleanHtml;
}
