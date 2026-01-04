import cronstrue from 'cronstrue';
import { showToast } from '../ui.js';

export function getCronJobHelperHtml() {
  return `
    <h3>Cron Job Helper</h3>
    <p>Dễ dàng tạo và giải mã các biểu thức Cron Job bằng tay hoặc AI.</p>

    <div class="tool-section">
      <h4>Tạo bằng AI</h4>
      <label for="cron-ai-input">Mô tả lịch trình bằng ngôn ngữ tự nhiên</label>
      <textarea id="cron-ai-input" placeholder="Ví dụ: chạy vào lúc 5 giờ chiều thứ Sáu hàng tuần..." rows="3"></textarea>
      <button id="generate-cron-ai-btn" class="btn primary" style="margin-top: 16px;"><i class="ph-bold ph-magic-wand"></i> Tạo biểu thức</button>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <h4>Giải thích & Chỉnh sửa</h4>
      <label for="cron-input">Biểu thức Cron (ví dụ: <code>*/5 * * * *</code>)</label>
      <input type="text" id="cron-input" placeholder="* * * * *">
      <p id="cron-explanation" class="result-text" style="margin-top: 8px; font-weight: 500;">...</p>
    </div>
    
    <div class="tool-section" style="margin-top: 16px;">
      <div id="cron-builder">
        <div class="cron-field">
          <label>Phút</label>
          <input type="text" data-unit="minute" value="*">
          <span>(0-59)</span>
        </div>
        <div class="cron-field">
          <label>Giờ</label>
          <input type="text" data-unit="hour" value="*">
          <span>(0-23)</span>
        </div>
        <div class="cron-field">
          <label>Ngày (Tháng)</label>
          <input type="text" data-unit="dayOfMonth" value="*">
          <span>(1-31)</span>
        </div>
        <div class="cron-field">
          <label>Tháng</label>
          <input type="text" data-unit="month" value="*">
          <span>(1-12)</span>
        </div>
        <div class="cron-field">
          <label>Thứ (Tuần)</label>
          <input type="text" data-unit="dayOfWeek" value="*">
          <span>(0-7, 0 và 7 là CN)</span>
        </div>
      </div>
      <div class="result-container" style="margin-top: 16px;">
        <label>Kết quả biểu thức Cron</label>
        <div class="row">
            <input type="text" id="cron-builder-output" readonly>
            <button id="copy-cron-btn" class="btn ghost" title="Sao chép"><i class="ph-bold ph-copy"></i></button>
        </div>
      </div>
    </div>
    
    <style>
      .cron-field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .cron-field label { width: 100px; }
      .cron-field input { flex: 1; }
      .cron-field span { font-size: 0.8em; color: var(--text-color-secondary); }
      .result-text { color: var(--primary-color); }
    </style>
  `;
}

export function initCronJobHelper() {
  // === DOM Elements ===
  const aiInput = document.getElementById('cron-ai-input');
  const aiBtn = document.getElementById('generate-cron-ai-btn');
  const cronInput = document.getElementById('cron-input');
  const cronExplanation = document.getElementById('cron-explanation');
  const builderContainer = document.getElementById('cron-builder');
  const builderInputs = Array.from(builderContainer.querySelectorAll('input[type="text"]'));
  const builderOutput = document.getElementById('cron-builder-output');
  const copyBtn = document.getElementById('copy-cron-btn');

  function syncUiFromCronString(cronString) {
    cronInput.value = cronString;
    cronInput.dispatchEvent(new Event('input'));
  }

  aiBtn.addEventListener('click', async () => {
    const description = aiInput.value;
    if (!description.trim()) {
      showToast('Vui lòng nhập mô tả lịch trình.', 'warning');
      return;
    }

    const originalBtnHTML = aiBtn.innerHTML;
    aiBtn.disabled = true;
    aiBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang tạo...';

    try {
      const cronString = await generateCronWithAI(description);
      syncUiFromCronString(cronString);
      showToast('Tạo biểu thức Cron thành công!', 'success');
    } catch (error) {
      showToast(`Tạo Cron thất bại: ${error.message}`, 'error');
    } finally {
      aiBtn.disabled = false;
      aiBtn.innerHTML = originalBtnHTML;
    }
  });

  cronInput.addEventListener('input', () => {
    const expression = cronInput.value.trim();
    if (!expression) {
      cronExplanation.textContent = '...';
      builderInputs.forEach((input) => (input.value = '*'));
      updateCronStringFromBuilder();
      return;
    }
    try {
      cronExplanation.textContent = cronstrue.toString(expression, { locale: 'vi' });
      cronExplanation.style.color = 'var(--primary-color)';
      // Cập nhật các ô builder từ chuỗi cron
      const parts = expression.split(' ');
      if (parts.length === 5) {
        builderInputs.forEach((input, index) => (input.value = parts[index]));
        updateCronStringFromBuilder();
      }
    } catch (e) {
      cronExplanation.textContent = 'Biểu thức Cron không hợp lệ.';
      cronExplanation.style.color = 'var(--error-color)';
    }
  });

  const updateCronStringFromBuilder = () => {
    const values = builderInputs.map((input) => input.value.trim() || '*');
    const newCronString = values.join(' ');
    builderOutput.value = newCronString;

    if (cronInput.value !== newCronString) {
      cronInput.value = newCronString;
      cronInput.dispatchEvent(new Event('input'));
    }
  };

  builderInputs.forEach((input) => {
    input.addEventListener('input', updateCronStringFromBuilder);
  });

  copyBtn.addEventListener('click', () => {
    if (builderOutput.value) {
      navigator.clipboard.writeText(builderOutput.value);
      showToast('Đã sao chép biểu thức Cron!', 'success');
    }
  });

  syncUiFromCronString('* * * * *');
}

// Hàm gọi AI để tạo biểu thức Cron
async function generateCronWithAI(description) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `Convert the following natural language schedule description into a standard 5-field cron expression. 
    The current year is ${new Date().getFullYear()}.
    Return only the cron expression itself (e.g., "*/5 * * * *") and nothing else.

    Description: "${description}"`;

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
  const cronString = result.candidates[0].content.parts[0].text.trim().replace(/`/g, ''); // Xóa các dấu ` nếu có
  if (cronString.split(' ').length !== 5) {
    throw new Error('AI không trả về định dạng Cron hợp lệ.');
  }
  return cronString;
}
