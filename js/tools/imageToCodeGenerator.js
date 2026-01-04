import { showToast, setupDragDrop } from '../ui.js';

export function getImageToCodeGeneratorHtml() {
  return `
    <style>
      .code-output-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        height: 60vh;
        margin-top: 16px;
      }
      .code-output-panel {
        display: flex;
        flex-direction: column;
      }
      .code-output-panel textarea {
        flex-grow: 1;
        resize: none;
        font-family: var(--font-mono);
      }
    </style>

    <h3>Image to Code Generator</h3>
    <p>Tải lên ảnh chụp màn hình của một component hoặc giao diện web đơn giản, AI sẽ viết code HTML và CSS để tái tạo lại nó.</p>

    <div class="tool-section">
      <h4>1. Tải lên ảnh giao diện</h4>
      <div class="drop-zone" id="itc-drop-zone">
        <div class="column">
            <i class="ph-fill ph-upload-simple" style="font-size: 3rem"></i>
            <p>Kéo thả file ảnh vào đây (JPG, PNG, WEBP)</p>
            <input type="file" id="itc-file-input" accept="image/png, image/jpeg, image/webp" hidden>
        </div>
      </div>
    </div>
    
    <div id="itc-preview-container" class="hidden" style="margin-top: 24px;">
        <div class="row" style="align-items: flex-start; gap: 20px;">
            <div class="col" style="flex: 1;">
                <label>Ảnh xem trước</label>
                <img id="itc-preview" alt="Image preview" style="max-width: 100%; border-radius: var(--border-radius); border: 1px solid var(--border-color);"/>
            </div>
            <div class="col" style="flex: 1;">
                 <label>Hành động</label>
                 <button id="generate-code-btn" class="btn primary"><i class="ph-bold ph-code"></i> Tạo Code</button>
            </div>
        </div>
    </div>

    <hr style="margin: 24px 0;">

    <div id="itc-output-container" class="tool-section hidden">
        <h4>2. Kết quả Code</h4>
        <div class="code-output-grid">
            <div class="code-output-panel">
                <div class="row" style="justify-content: space-between; margin-top:0;">
                    <label>HTML</label>
                    <button id="copy-html-btn" class="btn ghost" style="padding: 4px 8px;"><i class="ph-bold ph-copy"></i> Sao chép</button>
                </div>
                <textarea id="html-output" readonly placeholder="HTML code..."></textarea>
            </div>
            <div class="code-output-panel">
                 <div class="row" style="justify-content: space-between; margin-top:0;">
                    <label>CSS</label>
                    <button id="copy-css-btn" class="btn ghost" style="padding: 4px 8px;"><i class="ph-bold ph-copy"></i> Sao chép</button>
                </div>
                <textarea id="css-output" readonly placeholder="CSS code..."></textarea>
            </div>
        </div>
    </div>
  `;
}

export function initImageToCodeGenerator() {
  const MAX_IMAGE_SIZE_MB = 3;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const panel = document.getElementById('panel');
  const previewContainer = document.getElementById('itc-preview-container');
  const imagePreview = document.getElementById('itc-preview');
  const generateBtn = document.getElementById('generate-code-btn');
  const outputContainer = document.getElementById('itc-output-container');
  const htmlOutput = document.getElementById('html-output');
  const cssOutput = document.getElementById('css-output');
  const copyHtmlBtn = document.getElementById('copy-html-btn');
  const copyCssBtn = document.getElementById('copy-css-btn');

  let imageData = { base64: null, mimeType: null };

  setupDragDrop(
    panel,
    'itc-file-input',
    (file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn một file hình ảnh.', 'error');
        return;
      }
      imagePreview.src = URL.createObjectURL(file);
      previewContainer.classList.remove('hidden');
      outputContainer.classList.add('hidden');
      fileToBase64(file).then((base64String) => {
        imageData.base64 = base64String.split(',')[1];
        imageData.mimeType = file.type;
      });
    },
    MAX_IMAGE_SIZE_BYTES,
  );

  generateBtn.addEventListener('click', async () => {
    if (!imageData.base64) {
      showToast('Vui lòng tải lên một ảnh trước.', 'warning');
      return;
    }

    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang tạo...';
    outputContainer.classList.remove('hidden');
    htmlOutput.value = 'AI đang phân tích ảnh và viết HTML...';
    cssOutput.value = 'AI đang phân tích ảnh và viết CSS...';

    try {
      const rawResult = await generateCodeFromImageWithAI(imageData.base64, imageData.mimeType);
      const codes = parseCodeFromResponse(rawResult);
      htmlOutput.value = codes.html;
      cssOutput.value = codes.css;
      showToast('Tạo code thành công!', 'success');
    } catch (error) {
      htmlOutput.value = `Lỗi: ${error.message}`;
      cssOutput.value = '';
      showToast('Tạo code thất bại.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  });

  copyHtmlBtn.addEventListener('click', () => copyToClipboard(htmlOutput.value, 'HTML'));
  copyCssBtn.addEventListener('click', () => copyToClipboard(cssOutput.value, 'CSS'));
}

async function generateCodeFromImageWithAI(base64ImageData, mimeType) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const prompt = `You are an expert front-end developer. Analyze the provided image of a web component and generate the HTML and CSS code to build it.
    - Provide the HTML and CSS in separate, language-specific Markdown code blocks (\`\`\`html and \`\`\`css).
    - Do not use any external libraries or frameworks. Use only standard HTML5 and CSS3.
    - Use semantic HTML tags where appropriate.
    - Try to match the colors, fonts (use common web fonts), and spacing as closely as possible.
    - Do not add any explanations, just provide the raw code blocks.`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64ImageData } }],
      },
    ],
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) throw new Error(`Lỗi API: ${response.statusText}`);
  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}

function parseCodeFromResponse(responseText) {
  const htmlMatch = responseText.match(/```html\n([\s\S]*?)```/);
  const cssMatch = responseText.match(/```css\n([\s\S]*?)```/);

  return {
    html: htmlMatch ? htmlMatch[1].trim() : 'Không tìm thấy code HTML.',
    css: cssMatch ? cssMatch[1].trim() : 'Không tìm thấy code CSS.',
  };
}

function copyToClipboard(text, type) {
  if (text && !text.startsWith('Không tìm thấy') && !text.startsWith('Lỗi')) {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép code ${type}!`, 'success');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
