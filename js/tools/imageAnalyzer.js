import { showToast, setupDragDrop } from '../ui.js';

export function getImageAnalyzerHtml() {
  return `
    <h3>Image Analyzer</h3>
    <p>Tải lên một bức ảnh để AI trích xuất văn bản (OCR) hoặc mô tả nội dung.</p>

    <div class="tool-section">
      <div class="drop-zone" id="image-drop-zone">
        <div class="column">
            <i class="ph-fill ph-upload-simple" style="font-size: 3rem"></i>
            <p>Kéo thả file ảnh vào đây, hoặc bấm để chọn file</p>
            <input type="file" id="image-file-input" accept="image/png, image/jpeg, image/webp" hidden>
        </div>
      </div>

      <div id="preview-container" class="hidden" style="margin-top: 16px;">
        <img id="image-preview" alt="Image preview" style="max-width: 100%; max-height: 300px; border-radius: var(--border-radius);"/>
        <div id="ai-actions" style="margin-top: 16px;">
            <label>Chọn hành động phân tích</label>
            <div class="row">
                <button class="btn ghost" data-prompt="Trích xuất toàn bộ văn bản có trong hình ảnh này dưới dạng text. Nếu không có văn bản, hãy cho biết điều đó."><i class="ph-bold ph-text-aa"></i> Đọc chữ trong ảnh (OCR)</button>
                <button class="btn ghost" data-prompt="Mô tả chi tiết nội dung của hình ảnh này bằng một đoạn văn ngắn gọn."><i class="ph-bold ph-eye"></i> Mô tả nội dung ảnh</button>
            </div>
        </div>
      </div>
    </div>

    <hr style="margin: 24px 0;">

    <div class="tool-section">
      <h4>Kết quả phân tích</h4>
      <div id="ai-output" class="result markdown-body">
        Chưa có kết quả.
      </div>
    </div>
  `;
}

export function initImageAnalyzer() {
  const MAX_IMAGE_SIZE_MB = 3;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const panel = document.getElementById('panel');
  const previewContainer = document.getElementById('preview-container');
  const imagePreview = document.getElementById('image-preview');
  const aiActions = document.getElementById('ai-actions');
  const aiOutput = document.getElementById('ai-output');

  let imageData = {
    base64: null,
    mimeType: null,
  };

  setupDragDrop(
    panel,
    'image-file-input',
    (file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn một file hình ảnh.', 'error');
        return;
      }

      imagePreview.src = URL.createObjectURL(file);
      previewContainer.classList.remove('hidden');
      aiOutput.innerHTML = 'Ảnh đã sẵn sàng, hãy chọn một hành động.';

      fileToBase64(file)
        .then((base64String) => {
          imageData.base64 = base64String.split(',')[1];
          imageData.mimeType = file.type;
        })
        .catch((err) => {
          showToast('Không thể đọc file ảnh.', 'error');
          console.error(err);
        });
    },
    MAX_IMAGE_SIZE_BYTES,
  );

  aiActions.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-prompt]');
    if (button) {
      if (!imageData.base64) {
        showToast('Dữ liệu ảnh chưa sẵn sàng, vui lòng chờ giây lát.', 'warning');
        return;
      }

      const prompt = button.dataset.prompt;
      const originalBtnHTML = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Đang xử lý...';
      aiOutput.innerHTML =
        '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang phân tích ảnh...</div>';

      try {
        const analysis = await analyzeImageWithAI(prompt, imageData.base64, imageData.mimeType);
        aiOutput.innerHTML = parseMarkdown(analysis);
      } catch (error) {
        aiOutput.textContent = `Lỗi phân tích: ${error.message}`;
        showToast('Phân tích ảnh thất bại.', 'error');
      } finally {
        button.disabled = false;
        button.innerHTML = originalBtnHTML;
      }
    }
  });
}

async function analyzeImageWithAI(prompt, base64ImageData, mimeType) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('API key không được tìm thấy.');

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64ImageData,
            },
          },
        ],
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

function parseMarkdown(markdown) {
  if (!markdown) return '';
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    return markdown.replace(/\n/g, '<br>');
  }
  marked.setOptions({ breaks: true, gfm: true });
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml);
}
