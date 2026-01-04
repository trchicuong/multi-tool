import { showToast } from '../ui.js';
import { downloadBlob, dataURLtoBlob } from '../utils.js';

export function getImageGeneratorHtml() {
  return `
    <h3>Tạo ảnh AI</h3>
    <p>Nhập mô tả chi tiết ảnh để AI tạo ra hình ảnh độc đáo cho bạn.</p>
    
    <label for="image-prompt-input">Mô tả hình ảnh</label>
    <textarea id="image-prompt-input" placeholder="Ví dụ: a cat astronaut wearing a helmet, floating among the stars, oil painting style" style="height: 120px;"></textarea>
    
    <div class="row">
        <button class="btn" id="generate-image-btn"><i class="ph-bold ph-magic-wand"></i> Tạo ảnh</button>
    </div>

    <div id="image-result-container" class="result" style="margin-top: 24px; text-align: center; min-height: 256px; display: flex; align-items: center; justify-content: center;">
        <p id="image-placeholder-text">Chưa có ảnh nào được tạo.</p>
        <img id="generated-image" src="" alt="AI Generated Image" style="display: none; max-width: 100%; border-radius: var(--border-radius);">
    </div>
    
    <div class="row" id="download-actions" style="display: none;">
        <button class="btn ghost" id="download-image-btn"><i class="ph-bold ph-download"></i> Tải ảnh về (PNG)</button>
    </div>
  `;
}

export function initImageGenerator() {
  const promptInput = document.getElementById('image-prompt-input');
  const generateBtn = document.getElementById('generate-image-btn');
  const resultContainer = document.getElementById('image-result-container');
  const placeholderText = document.getElementById('image-placeholder-text');
  const generatedImage = document.getElementById('generated-image');
  const downloadActions = document.getElementById('download-actions');
  const downloadBtn = document.getElementById('download-image-btn');

  generateBtn.addEventListener('click', async () => {
    showToast('Chức năng hiện không khả dụng do giới hạn API.', 'info');
    return;

    const prompt = promptInput.value.trim();
    if (!prompt) {
      showToast('Vui lòng nhập mô tả cho hình ảnh.', 'warning');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> AI đang vẽ...';
    placeholderText.style.display = 'none';
    generatedImage.style.display = 'none';
    downloadActions.style.display = 'none';
    resultContainer.innerHTML =
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i> AI đang vẽ, vui lòng chờ...</div>';

    try {
      const imageUrl = await generateImageWithAI(prompt);
      generatedImage.src = imageUrl;
      generatedImage.style.display = 'block';
      resultContainer.innerHTML = '';
      resultContainer.appendChild(generatedImage);
      downloadActions.style.display = 'flex';
      showToast('Tạo ảnh thành công!', 'success');
    } catch (error) {
      resultContainer.innerHTML = `<p style="color: var(--error-color);">Lỗi: ${error.message}</p>`;
      showToast('Tạo ảnh thất bại.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="ph-bold ph-magic-wand"></i> Tạo ảnh';
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!generatedImage.src) return;
    const blob = dataURLtoBlob(generatedImage.src);
    downloadBlob(blob, 'ai-generated-image.png');
  });
}

async function generateImageWithAI(prompt) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'VITE_AI_API_KEY chưa được thiết lập trong file .env hoặc server chưa được khởi động lại.',
    );
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${errorData.error.message || response.statusText}`);
  }

  const result = await response.json();

  const base64Data = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData
    ?.data;
  if (base64Data) {
    return `data:image/png;base64,${base64Data}`;
  } else {
    throw new Error('Không nhận được dữ liệu hình ảnh hợp lệ từ AI.');
  }
}
