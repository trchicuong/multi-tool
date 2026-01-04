import { showToast } from '../ui.js';

export function getDocGeneratorHtml() {
  return `
    <h3>AI Documentation Generator</h3>
    <p>Tự động tạo tài liệu (documentation) cho code của bạn theo các chuẩn phổ biến.</p>

    <div class="tool-section">
      <h4>1. Code cần tạo tài liệu</h4>
      <textarea id="code-input-doc" rows="12" placeholder="function getUser(id) {\n  if (!id) return null;\n  // ...fetch user from db\n  return { id, name: 'User' };\n}" style="font-family: var(--font-mono);"></textarea>
      
      <div class="row" style="margin-top: 16px;">
        <div class="col">
          <label for="code-lang-doc">Ngôn ngữ</label>
          <select id="code-lang-doc">
            <option value="JavaScript" selected>JavaScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="TypeScript">TypeScript</option>
            <option value="PHP">PHP</option>
          </select>
        </div>
        <div class="col">
          <label for="doc-style-select">Chuẩn tài liệu</label>
          <select id="doc-style-select">
            </select>
        </div>
      </div>

      <button id="generate-doc-btn" class="btn primary" style="margin-top: 16px;"><i class="ph-bold ph-scroll"></i> Tạo tài liệu</button>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <div class="row" style="justify-content: space-between; margin-top:0;">
        <h4>2. Kết quả</h4>
        <button id="copy-doc-btn" class="btn ghost" style="padding: 4px 8px;"><i class="ph-bold ph-copy"></i> Sao chép</button>
      </div>
      <div id="doc-output" class="result markdown-body">
        Chưa có kết quả.
      </div>
    </div>
  `;
}

export function initDocGenerator() {
  const codeInput = document.getElementById('code-input-doc');
  const langSelect = document.getElementById('code-lang-doc');
  const styleSelect = document.getElementById('doc-style-select');
  const generateBtn = document.getElementById('generate-doc-btn');
  const docOutput = document.getElementById('doc-output');
  const copyBtn = document.getElementById('copy-doc-btn');

  const styleMap = {
    JavaScript: ['JSDoc', 'TypeScript'],
    Python: ['reStructuredText', 'Google Style', 'NumPy Style'],
    Java: ['Javadoc'],
    TypeScript: ['TSDoc'],
    PHP: ['PHPDoc'],
  };

  function updateStyleOptions() {
    const selectedLang = langSelect.value;
    const styles = styleMap[selectedLang] || [];
    styleSelect.innerHTML = styles.map((s) => `<option value="${s}">${s}</option>`).join('');
  }

  langSelect.addEventListener('change', updateStyleOptions);
  updateStyleOptions();

  generateBtn.addEventListener('click', async () => {
    const code = codeInput.value;
    const language = langSelect.value;
    const style = styleSelect.value;

    if (!code.trim()) {
      showToast('Vui lòng nhập code để tạo tài liệu.', 'warning');
      return;
    }

    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang viết...';
    docOutput.innerHTML =
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích code...</div>';

    try {
      const result = await generateDocsWithAI(code, language, style);
      docOutput.innerHTML = parseMarkdown(result);
    } catch (error) {
      docOutput.textContent = `Lỗi: ${error.message}`;
      showToast('Tạo tài liệu thất bại.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  });

  copyBtn.addEventListener('click', () => {
    const codeBlock = docOutput.querySelector('code');
    if (codeBlock) {
      navigator.clipboard.writeText(codeBlock.textContent);
      showToast('Đã sao chép code!', 'success');
    } else {
      showToast('Không có code để sao chép.', 'warning');
    }
  });
}

async function generateDocsWithAI(code, language, style) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `
      Bạn là một lập trình viên senior chuyên viết tài liệu cho code một cách sạch sẽ, rõ ràng và toàn diện.
      Nhiệm vụ của bạn là thêm tài liệu vào đoạn code **${language}** sau đây.
      Tài liệu phải tuân thủ nghiêm ngặt theo chuẩn **${style}**.

      Hãy phân tích hàm/class, bao gồm các tham số, giá trị trả về, và mục đích của nó.
      Tạo ra một khối tài liệu giải thích rõ ràng:
      - Một bản tóm tắt ngắn gọn về chức năng của code.
      - Mô tả cho từng tham số, bao gồm kiểu dữ liệu của nó (ví dụ: @param {type} name - description).
      - Mô tả giá trị trả về (ví dụ: @returns {type} - description).
      - Đề cập đến bất kỳ lỗi nào có thể xảy ra (@throws {ErrorType} - description), nếu có.

      Hãy đặt khối tài liệu đã tạo ngay phía trên đoạn code mà nó mô tả.
      Chỉ trả về **toàn bộ code hoàn chỉnh** (khối tài liệu mới + code gốc) trong một khối mã Markdown duy nhất. Không thêm bất kỳ giải thích nào bên ngoài khối mã.

      --- CODE CẦN TẠO TÀI LIỆU ---
      \`\`\`${language.toLowerCase()}
      ${code}
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

  setTimeout(() => {
    if (typeof hljs !== 'undefined') {
      document.querySelectorAll('#doc-output pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }, 0);
  return cleanHtml;
}
