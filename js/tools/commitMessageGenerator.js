import { showToast } from '../ui.js';

export function getCommitMessageGeneratorHtml() {
  return `
    <h3>Commit Message Generator</h3>
    <p>Dán kết quả của lệnh <code>git diff --staged</code> vào đây để AI tạo ra một commit message đúng chuẩn.</p>

    <div class="tool-section">
      <h4>1. Kết quả từ <code>git diff</code></h4>
      <textarea id="diff-input" placeholder="Paste your git diff output here..." rows="12" style="font-family: var(--font-mono);"></textarea>
      
      <div class="row" style="margin-top: 16px; align-items: flex-end;">
        <div class="col" style="flex-grow: 1;">
          <label for="commit-style">Chọn kiểu commit</label>
          <select id="commit-style">
            <option value="Conventional Commits (viết bằng tiếng Việt)">Conventional Commits (Tiếng Việt)</option>
            <option value="Conventional Commits (written in English)">Conventional Commits (Tiếng Anh)</option>
            <option value="Simple past tense (written in English)">Simple past tense (Tiếng Anh)</option>
          </select>
        </div>
        <div class="col">
          <button id="generate-commit-btn" class="btn primary"><i class="ph-bold ph-magic-wand"></i> Tạo Commit</button>
        </div>
      </div>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <h4>2. Kết quả Commit Message</h4>
      <div class="row">
        <textarea id="commit-output" placeholder="Commit message sẽ được tạo ở đây..." rows="5"></textarea>
      </div>
      <button id="copy-commit-btn" class="btn ghost" style="margin-top: 8px;"><i class="ph-bold ph-copy"></i> Sao chép kết quả</button>
    </div>
  `;
}

export function initCommitMessageGenerator() {
  const diffInput = document.getElementById('diff-input');
  const commitStyleSelect = document.getElementById('commit-style');
  const generateBtn = document.getElementById('generate-commit-btn');
  const commitOutput = document.getElementById('commit-output');
  const copyBtn = document.getElementById('copy-commit-btn');

  generateBtn.addEventListener('click', async () => {
    const diff = diffInput.value;
    const style = commitStyleSelect.value;

    if (!diff.trim()) {
      showToast('Vui lòng dán nội dung git diff.', 'warning');
      return;
    }

    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang tạo...';
    commitOutput.value = 'AI đang phân tích các thay đổi...';

    try {
      const result = await generateCommitMessageWithAI(diff, style);
      commitOutput.value = result;
    } catch (error) {
      commitOutput.value = `Lỗi: ${error.message}`;
      showToast('Tạo commit message thất bại.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  });

  copyBtn.addEventListener('click', () => {
    if (commitOutput.value && !commitOutput.value.startsWith('Lỗi')) {
      navigator.clipboard.writeText(commitOutput.value);
      showToast('Đã sao chép commit message!', 'success');
    }
  });
}

async function generateCommitMessageWithAI(diff, style) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `
      Bạn là một expert Git và là một lập trình viên senior, chuyên viết các commit message rõ ràng, súc tích và tuân thủ các chuẩn mực.

      Dựa trên kết quả \`git diff\` sau đây:
      --- DIFF START ---
      ${diff}
      --- DIFF END ---

      Hãy tạo ra một commit message phù hợp theo chuẩn sau: "${style}".

      Chỉ trả về duy nhất commit message. Commit message có thể bao gồm một dòng tiêu đề (subject) và một phần thân (body) nếu cần thiết để giải thích thêm. Không thêm bất kỳ văn bản nào khác ngoài commit message.
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
