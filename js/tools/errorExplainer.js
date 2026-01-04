import { showToast } from '../ui.js';

export function getErrorExplainerHtml() {
  return `
    <h3>Error Explainer & Debugger</h3>
    <p>Dán một thông báo lỗi hoặc stack trace khó hiểu vào đây, AI sẽ giải thích và gợi ý cách sửa lỗi.</p>

    <div class="tool-section">
      <h4>1. Thông báo lỗi</h4>
      <textarea id="error-input" rows="12" placeholder="Paste your full error message or stack trace here..." style="font-family: var(--font-mono);"></textarea>
      
      <div class="row" style="margin-top: 16px;">
        <div class="col">
          <label for="error-context">Ngôn ngữ / Môi trường (Tùy chọn)</label>
          <input type="text" id="error-context" placeholder="Ví dụ: JavaScript, Node.js, Python, Java...">
        </div>
      </div>

      <button id="analyze-error-btn" class="btn primary" style="margin-top: 16px;"><i class="ph-bold ph-lightning"></i> Phân tích lỗi</button>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <h4>2. Phân tích & Gợi ý từ AI</h4>
      <div id="error-output" class="result markdown-body">
        Chưa có phân tích.
      </div>
    </div>
  `;
}

export function initErrorExplainer() {
  const errorInput = document.getElementById('error-input');
  const contextInput = document.getElementById('error-context');
  const analyzeBtn = document.getElementById('analyze-error-btn');
  const errorOutput = document.getElementById('error-output');

  analyzeBtn.addEventListener('click', async () => {
    const errorText = errorInput.value;
    const context = contextInput.value;

    if (!errorText.trim()) {
      showToast('Vui lòng nhập thông báo lỗi để phân tích.', 'warning');
      return;
    }

    const originalBtnHTML = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang phân tích...';
    errorOutput.innerHTML =
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang tìm cách sửa lỗi...</div>';

    try {
      const result = await explainErrorWithAI(errorText, context);
      errorOutput.innerHTML = parseMarkdown(result);
    } catch (error) {
      errorOutput.textContent = `Lỗi: ${error.message}`;
      showToast('Phân tích lỗi thất bại.', 'error');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = originalBtnHTML;
    }
  });
}

async function explainErrorWithAI(errorText, context) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `
      Bạn là một Lập trình viên Senior và là một người hướng dẫn kiên nhẫn. Chuyên môn của bạn là gỡ lỗi các thông báo lỗi và stack trace phức tạp.
      Môi trường/ngôn ngữ lập trình là: ${context || 'không xác định'}.

      Nhiệm vụ của bạn là phân tích kỹ lưỡng thông báo lỗi và/hoặc stack trace sau đây.
      Hãy cung cấp một câu trả lời rõ ràng, từng bước bằng tiếng Việt, được cấu trúc bằng Markdown với các phần sau:

      ### 1. Tóm tắt vấn đề
      (Mô tả ngắn gọn bằng một câu về ý nghĩa của lỗi này một cách đơn giản.)

      ### 2. Nguyên nhân có thể xảy ra
      (Liệt kê các nguyên nhân gốc rễ có khả năng gây ra lỗi này nhất bằng gạch đầu dòng.)

      ### 3. Gợi ý sửa lỗi
      (Liệt kê các bước hoặc ví dụ code cụ thể để khắc phục sự cố theo thứ tự. Nếu bạn cung cấp code, hãy đặt nó trong khối mã dành riêng cho ngôn ngữ đó.)

      ### 4. Cách phòng tránh
      (Đưa ra lời khuyên ngắn gọn về cách tránh loại lỗi này trong tương lai.)

      --- LỖI CẦN PHÂN TÍCH ---
      \`\`\`
      ${errorText}
      \`\`\`
    `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Lỗi API: ${errorData.error.message}`);
  }
  const result = await response.json();
  if (!result.candidates || result.candidates.length === 0) {
    throw new Error('API không trả về kết quả hợp lệ.');
  }
  return result.candidates[0].content.parts[0].text;
}

function parseMarkdown(markdown) {
  if (!markdown) return '';
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    return markdown.replace(/\n/g, '<br>');
  }
  marked.setOptions({ breaks: true, gfm: true });
  const rawHtml = marked.parse(markdown);
  const cleanHtml = DOMPurify.sanitize(rawHtml);
  return cleanHtml;
}
