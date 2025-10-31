async function sendMessage() {
  const inputElement = document.getElementById("user-input");
  const message = inputElement.value.trim();

  if (message === "") {
    return;
  }

  inputElement.value = "";
  const chatbox = document.getElementById("chat-box");

  // Display user message
  chatbox.innerHTML += `<p class="user-message"><strong>You:</strong> ${message}</p>`;

  // Add temporary loading message
  const loadingMessageId = `loading-${Date.now()}`;
  chatbox.innerHTML += `<p id="${loadingMessageId}" class="ai-message meta"><strong>AI:</strong> Searching...</p>`;
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    // Fetch sends the user message to the Flask server's /chat route
    const response = await fetch("/chat", { // NOTE: The Flask route is /chat, not /chat_api in the provided code
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message: message })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Remove loading message
    document.getElementById(loadingMessageId)?.remove();

    // Display AI's formatted reply
    chatbox.innerHTML += `<p class="ai-message"><strong>AI:</strong> ${data.reply}</p>`;

  } catch (error) {
    console.error("Error communicating with the backend:", error);
    document.getElementById(loadingMessageId)?.remove();
    chatbox.innerHTML += `<p class="error-message"><strong>AI Error:</strong> Check console. (Is the Flask server running?)</p>`;
  }

  chatbox.scrollTop = chatbox.scrollHeight;
}

// Add event listener for the Send button and Enter key
document.addEventListener('DOMContentLoaded', () => {
  // Attach click listener to the Send button
  const sendButton = document.getElementById("send-btn");
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }

  // Correct ID for the input field and attach keypress listener
  const inputElement = document.getElementById("user-input");
  if (inputElement) {
    inputElement.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // Good practice to prevent default
        sendMessage();
      }
    });
  }
});
