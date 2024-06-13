async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    const chatbox = document.getElementById('chatbox');
  
    if (userInput.trim() === "") {
      return;
    }
  
    // Add user's message to the chatbox with emoji
    chatbox.innerHTML += `<p class="message user">👤 <strong>You:</strong> ${userInput}</p>`;
    document.getElementById('userInput').value = "";
  
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userInput })
    });
  
    const data = await response.json();
    // Add bot's message to the chatbox with emoji
    chatbox.innerHTML += `<p class="message bot">🤖 <strong>Bot:</strong> ${data.message}</p>`;
  
    // Scroll to the bottom of the chatbox
    chatbox.scrollTop = chatbox.scrollHeight;
  }
  