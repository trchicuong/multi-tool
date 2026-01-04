import { showToast } from '../ui.js';

export function getContentAnalyzerHtml() {
  return `
    <h3>Phân tích Nội dung</h3>
    <p>Dán một đoạn văn bản (bài báo, email, tài liệu...) vào ô dưới đây để phân tích bằng AI.</p>
    
    <label for="content-input">Nội dung cần phân tích</label>
    <textarea id="content-input" placeholder="Dán nội dung của bạn vào đây..." style="height: 250px;"></textarea>
    
    <div id="ai-actions" style="margin-top: 16px;">
        <label>Chọn hành động phân tích</label>
        <div class="row">
            <button class="btn ghost" data-prompt="Tóm tắt nội dung sau trong 3 câu chính:"><i class="ph-bold ph-text-t"></i> Tóm tắt</button>
            <button class="btn ghost" data-prompt="Liệt kê các ý chính của văn bản sau dưới dạng gạch đầu dòng:"><i class="ph-bold ph-list-bullets"></i> Tìm ý chính</button>
            <button class="btn ghost" data-prompt="Xác định các thực thể (tên người, địa điểm, tổ chức) được nhắc đến trong văn bản sau:"><i class="ph-bold ph-users-three"></i> Tìm thực thể</button>
            <button class="btn ghost" data-prompt="Dịch văn bản sau sang tiếng Anh:"><i class="ph-bold ph-translate"></i> Dịch sang tiếng Anh</button>
            <button class="btn ghost" data-prompt="Dịch văn bản sau sang tiếng Việt:"><i class="ph-bold ph-translate"></i> Dịch sang tiếng Việt</button>
        </div>
    </div>

    <div id="ai-result-container" style="margin-top: 16px;">
        <label>Kết quả phân tích AI</label>
        <div id="ai-output" class="result markdown-body" style="white-space: normal;">Chưa có phân tích.</div>
    </div>
  `;
}

export function initContentAnalyzer() {
  const contentInput = document.getElementById('content-input');
  const aiActions = document.getElementById('ai-actions');
  const aiOutput = document.getElementById('ai-output');

  aiActions.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-prompt]');
    if (button) {
      const prompt = button.dataset.prompt;
      const content = contentInput.value;

      if (!content.trim()) {
        showToast('Vui lòng nhập nội dung để phân tích.', 'warning');
        return;
      }

      const originalButtonHTML = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang xử lý...';
      aiOutput.innerHTML =
        '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích...</div>';

      try {
        const analysis = await analyzeWithAI(prompt, content);
        aiOutput.innerHTML = parseMarkdown(analysis);
      } catch (error) {
        aiOutput.textContent = `Lỗi phân tích: ${error.message}`;
        showToast('AI phân tích thất bại.', 'error');
      } finally {
        button.disabled = false;
        button.innerHTML = originalButtonHTML;
      }
    }
  });
}

async function analyzeWithAI(prompt, content) {
  if (!import.meta.env) {
    throw new Error(
      "Không tìm thấy biến môi trường. Hãy chắc chắn bạn đang chạy dự án bằng lệnh 'npm run dev'.",
    );
  }

  const apiKey = import.meta.env.VITE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_AI_API_KEY chưa được thiết lập trong file .env');
  }

  const fullPrompt = `${prompt}\n\n---\n${content}\n---`;

  let chatHistory = [{ role: 'user', parts: [{ text: fullPrompt }] }];
  const payload = { contents: chatHistory };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const result = await response.json();

  if (
    result.candidates &&
    result.candidates.length > 0 &&
    result.candidates[0].content.parts[0].text
  ) {
    return result.candidates[0].content.parts[0].text;
  } else {
    if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
      return 'Nội dung không phù hợp hoặc vi phạm chính sách an toàn của AI.';
    }
    throw new Error('Không nhận được phản hồi hợp lệ từ AI.');
  }
}

/**
 * @param {string} markdown
 * @returns {string}
 */
function parseMarkdown(markdown) {
  if (!markdown) return '';

  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    console.error('Thư viện Marked.js hoặc DOMPurify chưa được tải.');
    return markdown;
  }

  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const rawHtml = marked.parse(markdown);
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  return cleanHtml;
}
