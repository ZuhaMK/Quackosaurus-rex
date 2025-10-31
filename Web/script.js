const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = role === 'user' ? 'chat chat-end' : 'chat chat-start';
  div.innerHTML = `
    <div class="chat-bubble ${role === 'user' ? 'chat-bubble-primary' : ''}">
      ${text}
    </div>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage('user', message);
  userInput.value = '';

  try {
    const response = await fetch('/chat_api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    addMessage('bot', data.reply);
  } catch (error) {
    addMessage('bot', '⚠️ Error connecting to server.');
  }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
