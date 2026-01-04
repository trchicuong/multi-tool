import { showToast } from '../ui.js';

export function getUnitTestGeneratorHtml() {
  return `
    <h3>Unit Test Generator</h3>
    <p>Dán một hàm hoặc một class vào ô dưới đây, AI sẽ tự động viết các bài kiểm thử (unit test).</p>

    <div class="tool-section">
      <h4>1. Code cần kiểm thử</h4>
      <textarea id="code-to-test-input" rows="12" placeholder="function sum(a, b) {\n  return a + b;\n}" style="font-family: var(--font-mono);"></textarea>
      
      <div class="row" style="margin-top: 16px;">
        <div class="col">
          <label for="code-language-select">Ngôn ngữ</label>
          <select id="code-language-select">
            <option value="JavaScript" selected>JavaScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="TypeScript">TypeScript</option>
          </select>
        </div>
        <div class="col">
          <label for="framework-select">Framework / Thư viện Test</label>
          <select id="framework-select">
            </select>
        </div>
      </div>

      <button id="generate-tests-btn" class="btn primary" style="margin-top: 16px;"><i class="ph-bold ph-test-tube"></i> Tạo Unit Test</button>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <div class="row" style="justify-content: space-between; margin-top:0;">
        <h4>2. Kết quả Unit Test</h4>
        <button id="copy-test-btn" class="btn ghost" style="padding: 4px 8px;"><i class="ph-bold ph-copy"></i> Sao chép</button>
      </div>
      <div id="test-output" class="result markdown-body">
        Chưa có kết quả.
      </div>
    </div>
  `;
}

export function initUnitTestGenerator() {
  const codeInput = document.getElementById('code-to-test-input');
  const langSelect = document.getElementById('code-language-select');
  const frameworkSelect = document.getElementById('framework-select');
  const generateBtn = document.getElementById('generate-tests-btn');
  const testOutput = document.getElementById('test-output');
  const copyBtn = document.getElementById('copy-test-btn');

  const frameworkMap = {
    JavaScript: ['Jest', 'Mocha + Chai', 'Jasmine'],
    Python: ['PyTest', 'unittest'],
    Java: ['JUnit', 'TestNG'],
    TypeScript: ['Jest', 'Mocha + Chai'],
  };

  function updateFrameworkOptions() {
    const selectedLang = langSelect.value;
    const frameworks = frameworkMap[selectedLang] || [];
    frameworkSelect.innerHTML = frameworks
      .map((f) => `<option value="${f}">${f}</option>`)
      .join('');
  }

  langSelect.addEventListener('change', updateFrameworkOptions);
  updateFrameworkOptions();

  generateBtn.addEventListener('click', async () => {
    const code = codeInput.value;
    const language = langSelect.value;
    const framework = frameworkSelect.value;

    if (!code.trim()) {
      showToast('Vui lòng nhập code để kiểm thử.', 'warning');
      return;
    }

    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang tạo...';
    testOutput.innerHTML =
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích và viết test...</div>';

    try {
      const result = await generateTestsWithAI(code, language, framework);
      testOutput.innerHTML = parseMarkdown(result);
    } catch (error) {
      testOutput.textContent = `Lỗi: ${error.message}`;
      showToast('Tạo test thất bại.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  });

  copyBtn.addEventListener('click', () => {
    const codeBlock = testOutput.querySelector('code');
    if (codeBlock) {
      navigator.clipboard.writeText(codeBlock.textContent);
      showToast('Đã sao chép code test!', 'success');
    } else {
      showToast('Không có code để sao chép.', 'warning');
    }
  });
}

async function generateTestsWithAI(code, language, framework) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `
      Bạn là một Kỹ sư Đảm bảo Chất lượng (QA Engineer) cao cấp và là một lập trình viên tỉ mỉ.
      Nhiệm vụ của bạn là viết một bộ unit test hoàn chỉnh cho đoạn code **${language}** sau đây, sử dụng framework **${framework}**.

      Hãy phân tích kỹ code để hiểu chức năng, đầu vào, và đầu ra của nó.
      Tạo ra các test case bao gồm các kịch bản sau:
      - **Happy Path:** Kiểm tra với các đầu vào hợp lệ, điển hình để đảm bảo nó tạo ra kết quả đúng.
      - **Edge Cases:** Kiểm tra với các giá trị biên, đầu vào rỗng (chuỗi rỗng, mảng rỗng), null, undefined, số 0, số rất lớn nếu có thể.
      - **Error Handling:** Kiểm tra cách code xử lý các đầu vào không hợp lệ và đảm bảo nó báo lỗi hoặc thoát ra một cách đúng đắn như mong đợi.

      Đoạn code được tạo ra phải là một file test hoàn chỉnh, có thể chạy được.
      Chỉ trả về duy nhất code trong một khối mã Markdown dành riêng cho ngôn ngữ đó. Không thêm bất kỳ giải thích nào bên ngoài khối mã.

      --- CODE CẦN TEST ---
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
      document.querySelectorAll('#test-output pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }, 0);
  return cleanHtml;
}
