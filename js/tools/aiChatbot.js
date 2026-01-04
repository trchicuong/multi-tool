import { showToast } from '../ui.js';

export function getAiChatbotHtml() {
  return `
    <h3>AI Chatbot</h3>
    <p>Trò chuyện với AI Gemini Flash.</p>
    <div class="chat-container">
        <div id="chat-box" class="result markdown-body">
            <div class="ai-message">
                <p>Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</p>
            </div>
        </div>
        <div class="chat-input-area row">
            <textarea id="chat-input" placeholder="Nhập tin nhắn của bạn..." rows="1"></textarea>
            <button class="btn" id="send-chat-btn"><i class="ph-bold ph-paper-plane-right"></i></button>
        </div>
    </div>
  `;
}

export function initAiChatbot() {
  const chatBox = document.getElementById('chat-box');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-chat-btn');

  let chatHistory = [];

  const sendMessage = async () => {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    appendMessage(userMessage, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    appendMessage(
      '<div class="spinner-container"><i class="ph-bold ph-spinner ph-spin"></i></div>',
      'ai',
      true,
    );

    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
      const aiResponse = await callChatAPI(chatHistory);
      chatHistory.push({ role: 'model', parts: [{ text: aiResponse }] });
      updateLastMessage(aiResponse, 'ai-message');
    } catch (error) {
      updateLastMessage(`Lỗi: ${error.message}`, 'ai-error');
      showToast('Gặp lỗi khi gọi AI.', 'error');
    }
  };

  const appendMessage = (content, sender, isLoading = false) => {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `${sender}-message`;
    if (isLoading) {
      messageWrapper.id = 'thinking-message';
    }
    messageWrapper.innerHTML = parseMarkdown(content);
    chatBox.appendChild(messageWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  const updateLastMessage = (content, senderClass) => {
    const thinkingMessage = document.getElementById('thinking-message');
    if (thinkingMessage) {
      thinkingMessage.className = senderClass;
      thinkingMessage.innerHTML = parseMarkdown(content);
      thinkingMessage.id = '';
    }
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
  });
}

async function callChatAPI(history) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_AI_API_KEY chưa được thiết lập trong file .env.');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = { contents: history };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.candidates && result.candidates.length > 0) {
    return result.candidates[0].content.parts[0].text;
  } else {
    if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
      return 'Tôi không thể trả lời câu hỏi này vì lý do an toàn.';
    }
    throw new Error('Không nhận được phản hồi hợp lệ từ AI.');
  }
}

function parseMarkdown(markdown) {
  if (!markdown) return '';
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    return markdown;
  }
  marked.setOptions({ breaks: true, gfm: true });
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml);
}
