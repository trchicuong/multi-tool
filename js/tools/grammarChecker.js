import { showToast } from '../ui.js';

export function getGrammarCheckerHtml() {
  return `
    <h3>Kiểm tra ngữ pháp Tiếng Anh</h3>
    <p>Dán đoạn văn bản Tiếng Anh cần kiểm tra vào ô bên dưới.</p>
    
    <label for="grammar-input">Nội dung cần kiểm tra</label>
    <textarea id="grammar-input" placeholder="Dán văn bản tiếng Anh của bạn vào đây..." style="height: 250px;"></textarea>
    
    <div class="row" style="margin-top: 16px;">
        <button id="check-grammar-btn" class="btn primary"><i class="ph-bold ph-check-circle"></i> Kiểm tra và Sửa lỗi</button>
    </div>

    <div id="ai-result-container" style="margin-top: 16px;">
        <label>Kết quả đã sửa lỗi</label>
        <div id="ai-output" class="result markdown-body" style="white-space: normal;">Chưa có kết quả.</div>
    </div>
  `;
}

// Hàm khởi tạo logic và sự kiện
export function initGrammarChecker() {
  const grammarInput = document.getElementById('grammar-input');
  const checkButton = document.getElementById('check-grammar-btn');
  const aiOutput = document.getElementById('ai-output');

  checkButton.addEventListener('click', async () => {
    const content = grammarInput.value;

    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung để kiểm tra.', 'warning');
      return;
    }

    const originalButtonHTML = checkButton.innerHTML;
    checkButton.disabled = true;
    checkButton.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang kiểm tra...';
    aiOutput.innerHTML =
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích...</div>';

    try {
      const analysis = await checkGrammarWithAI(content);
      aiOutput.innerHTML = parseMarkdown(analysis);
    } catch (error) {
      aiOutput.textContent = `Lỗi: ${error.message}`;
      showToast('Kiểm tra ngữ pháp thất bại.', 'error');
    } finally {
      checkButton.disabled = false;
      checkButton.innerHTML = originalButtonHTML;
    }
  });
}

async function checkGrammarWithAI(content) {
  if (!import.meta.env) {
    throw new Error(
      "Không tìm thấy biến môi trường. Hãy chắc chắn bạn đang chạy dự án bằng lệnh 'npm run dev'.",
    );
  }

  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_AI_API_KEY chưa được thiết lập trong file .env');
  }

  const prompt = `
        Bạn là một chuyên gia biên tập tiếng Anh và gia sư ngôn ngữ. Nhiệm vụ của bạn là phân tích, sửa lỗi và đưa ra phản hồi chi tiết về đoạn văn bản tiếng Anh được cung cấp.

        Hãy thực hiện theo các bước sau:

        1.  **Văn bản đã sửa lỗi:** Đầu tiên, hãy trình bày toàn bộ văn bản đã được sửa lỗi hoàn chỉnh, in đậm những phần đã thay đổi.
        2.  **Nhận xét tổng quan:** Tiếp theo, đưa ra một nhận xét tổng quan ngắn gọn (bằng tiếng Việt) về các loại lỗi chính được tìm thấy.
        3.  **Bảng phân tích chi tiết:** Sau đó, tạo một bảng phân tích chi tiết các lỗi theo định dạng Markdown với các cột sau: "| Lỗi sai | Sửa thành | Phân loại & Giải thích (bằng tiếng Việt) |".
            - Trong cột "Phân loại & Giải thích", hãy nêu rõ loại lỗi (ví dụ: *Chính tả, Ngữ pháp - Thì động từ, Ngữ pháp - Mạo từ, Dùng từ, Cấu trúc câu*) và giải thích lý do sửa lỗi một cách rõ ràng, chuyên nghiệp.

        Nếu văn bản gốc hoàn toàn chính xác, chỉ cần trả lời: "Văn bản không có lỗi nào cần sửa. Xin chúc mừng!"

        ---
        Văn bản gốc:
        "${content}"
        ---
    `;

  let chatHistory = [{ role: 'user', parts: [{ text: prompt }] }];
  const payload = { contents: chatHistory };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Lỗi API: ${response.statusText} - ${errorData.error?.message || 'Lỗi không xác định'}`,
    );
  }

  const result = await response.json();

  if (result.candidates && result.candidates[0]?.content.parts[0]?.text) {
    return result.candidates[0].content.parts[0].text;
  } else {
    if (result.candidates && result.candidates[0]?.finishReason === 'SAFETY') {
      return 'AI xác định nội dung không phù hợp hoặc vi phạm chính sách an toàn.';
    }
    throw new Error('Không nhận được phản hồi hợp lệ từ AI.');
  }
}

function parseMarkdown(markdown) {
  if (!markdown) return '';

  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    console.error('Thư viện Marked.js hoặc DOMPurify chưa được tải.');
    return markdown.replace(/\\n/g, '<br>');
  }

  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml);
}
