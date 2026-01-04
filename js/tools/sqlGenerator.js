import { showToast } from '../ui.js';

export function getSqlGeneratorHtml() {
  return `
    <h3>SQL Query Generator</h3>
    <p>Mô tả cấu trúc bảng và đưa ra yêu cầu bằng ngôn ngữ tự nhiên để tạo câu lệnh SQL.</p>

    <div class="tool-section">
      <h4>1. Cấu trúc Database (Schema)</h4>
      <label for="schema-input">Dán lệnh CREATE TABLE hoặc mô tả các bảng của bạn ở đây.</label>
      <textarea id="schema-input" placeholder="VÍ DỤ:\n\nCREATE TABLE Users (\n  id INT PRIMARY KEY,\n  name VARCHAR(255),\n  email VARCHAR(255),\n  signup_date DATE\n);\n\nCREATE TABLE Orders (\n  order_id INT PRIMARY KEY,\n  user_id INT,\n  amount DECIMAL(10, 2),\n  order_date DATE\n);" rows="8"></textarea>
      
      <h4 style="margin-top: 16px;">2. Yêu cầu của bạn</h4>
      <label for="query-description-input">Mô tả truy vấn bạn muốn thực hiện.</label>
      <textarea id="query-description-input" placeholder="VÍ DỤ: Lấy tên và email của 5 người dùng đăng ký gần đây nhất và có tổng số tiền đặt hàng trên 1000." rows="4"></textarea>

      <button id="generate-sql-btn" class="btn primary" style="margin-top: 16px;"><i class="ph-bold ph-magic-wand"></i> Tạo câu lệnh SQL</button>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <h4>Kết quả SQL</h4>
      <div id="sql-output" class="result markdown-body">
        Câu lệnh SQL sẽ được tạo ở đây.
      </div>
    </div>
  `;
}

export function initSqlGenerator() {
  const schemaInput = document.getElementById('schema-input');
  const descriptionInput = document.getElementById('query-description-input');
  const generateBtn = document.getElementById('generate-sql-btn');
  const sqlOutput = document.getElementById('sql-output');

  generateBtn.addEventListener('click', async () => {
    const schema = schemaInput.value;
    const description = descriptionInput.value;

    if (!schema.trim() || !description.trim()) {
      showToast('Vui lòng nhập đủ cả cấu trúc database và yêu cầu.', 'warning');
      return;
    }

    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang tạo...';
    sqlOutput.innerHTML =
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích...</div>';

    try {
      const result = await generateSqlWithAI(schema, description);
      sqlOutput.innerHTML = parseMarkdown(result);
    } catch (error) {
      sqlOutput.textContent = `Lỗi: ${error.message}`;
      showToast('Tạo SQL thất bại.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  });
}

async function generateSqlWithAI(schema, description) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `
      Bạn là một chuyên gia về cơ sở dữ liệu và là một nhà phân tích dữ liệu senior, có khả năng viết các câu lệnh SQL tối ưu và chính xác.

      Dựa trên cấu trúc database (schema) sau đây:
      --- SCHEMA START ---
      ${schema}
      --- SCHEMA END ---

      Và yêu cầu bằng ngôn ngữ tự nhiên sau đây:
      --- REQUEST START ---
      ${description}
      --- REQUEST END ---

      Hãy viết một câu lệnh SQL để đáp ứng yêu cầu đó. Nếu không có chỉ định cụ thể, hãy ưu tiên sử dụng cú pháp PostgreSQL.
      Chỉ trả về duy nhất câu lệnh SQL trong một khối mã Markdown. Không thêm bất kỳ giải thích hay văn bản nào khác.
    `;

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
