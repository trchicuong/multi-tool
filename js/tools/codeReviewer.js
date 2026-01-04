import { showToast } from '../ui.js';

export function getCodeReviewerHtml() {
  return `
    <h3>Code Reviewer</h3>
    <p>Dán một đoạn code, chọn ngôn ngữ và để AI giúp bạn phân tích.</p>
    
    <div class="row">
        <div class="col">
            <label for="code-language">Ngôn ngữ lập trình</label>
            <select id="code-language">
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="C++">C++</option>
                <option value="CSharp">C#</option>
                <option value="HTML">HTML</option>
                <option value="CSS">CSS</option>
                <option value="SQL">SQL</option>
                <option value="TypeScript">TypeScript</option>
                <option value="auto">Tự động phát hiện</option>
            </select>
        </div>
    </div>

    <label for="code-input">Đoạn code cần phân tích</label>
    <textarea id="code-input" placeholder="Dán code của bạn vào đây..." style="height: 300px; font-family: 'Courier New', Courier, monospace;"></textarea>
    
    <div id="ai-actions" style="margin-top: 16px;">
        <label>Chọn hành động</label>
        <div class="row">
            <button class="btn ghost" data-prompt="Hãy phân tích đoạn code sau và chỉ ra các lỗi tiềm ẩn, các vấn đề về logic, và các rủi ro về bảo mật. Giải thích từng vấn đề một cách chi tiết."><i class="ph-bold ph-bug"></i> Tìm lỗi tiềm ẩn</button>
            <button class="btn ghost" data-prompt="Đề xuất các cách để tối ưu hiệu suất và làm cho code dễ đọc hơn (refactor). Trình bày code đã được tối ưu."><i class="ph-bold ph-rocket-launch"></i> Tối ưu & Refactor</button>
            <button class="btn ghost" data-prompt="Giải thích chi tiết cách hoạt động của đoạn code sau, bao gồm cả các thuật toán và logic chính."><i class="ph-bold ph-question"></i> Giải thích code</button>
            <button class="btn ghost" data-prompt="Viết các bình luận (comments) chi tiết cho đoạn code sau để làm rõ chức năng của từng khối lệnh."><i class="ph-bold ph-chat-text"></i> Thêm bình luận</button>
        </div>
    </div>

    <div id="ai-result-container" style="margin-top: 16px;">
        <label>Kết quả phân tích từ AI</label>
        <div id="ai-output" class="result markdown-body">Chưa có phân tích.</div>
    </div>
  `;
}

export function initCodeReviewer() {
  const codeInput = document.getElementById('code-input');
  const langSelect = document.getElementById('code-language');
  const aiActions = document.getElementById('ai-actions');
  const aiOutput = document.getElementById('ai-output');

  aiActions.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-prompt]');
    if (button) {
      const basePrompt = button.dataset.prompt;
      const code = codeInput.value;
      const language = langSelect.value;

      if (!code.trim()) {
        showToast('Vui lòng nhập code để phân tích.', 'warning');
        return;
      }

      const originalButtonHTML = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang xử lý...';
      aiOutput.innerHTML =
        '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích code...</div>';

      try {
        const analysis = await reviewCodeWithAI(basePrompt, code, language);
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

async function reviewCodeWithAI(basePrompt, code, language) {
  if (!import.meta.env) {
    throw new Error('Không tìm thấy biến môi trường.');
  }

  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_AI_API_KEY chưa được thiết lập trong file .env');
  }

  const fullPrompt = `
        Bạn là một chuyên gia review code và lập trình viên senior.
        Nhiệm vụ của bạn là thực hiện yêu cầu sau đây cho đoạn code được cung cấp.
        
        Ngôn ngữ lập trình là: ${language}.
        
        Yêu cầu:
        ---
        ${basePrompt}
        ---

        Code cần phân tích:
        \`\`\`${language}
        ${code}
        \`\`\`

        Hãy trình bày câu trả lời bằng tiếng Việt, sử dụng định dạng Markdown và các khối code để câu trả lời được rõ ràng, chuyên nghiệp.
    `;

  let chatHistory = [{ role: 'user', parts: [{ text: fullPrompt }] }];
  const payload = { contents: chatHistory };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Lỗi API: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.candidates && result.candidates[0]?.content.parts[0]?.text) {
    return result.candidates[0].content.parts[0].text;
  } else {
    if (result.candidates && result.candidates[0]?.finishReason === 'SAFETY') {
      return 'Nội dung không phù hợp hoặc vi phạm chính sách an toàn của AI.';
    }
    throw new Error('Không nhận được phản hồi hợp lệ từ AI.');
  }
}

function parseMarkdown(markdown) {
  if (!markdown) return '';
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    return markdown.replace(/\\n/g, '<br>');
  }
  marked.setOptions({ breaks: true, gfm: true });
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml);
}
