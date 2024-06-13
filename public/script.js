async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    const chatbox = document.getElementById('chatbox');
  
    chatbox.innerHTML += `<p><strong>You:</strong> ${userInput}</p>`;
  
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userInput })
    });
  
    const data = await response.json();
    chatbox.innerHTML += `<p><strong>Bot:</strong> ${data.message}</p>`;
  }
  