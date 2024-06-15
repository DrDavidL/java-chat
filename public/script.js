document.addEventListener("DOMContentLoaded", () => {
    const currentDateElement = document.getElementById('current-date');
    const currentDate = new Date().toLocaleDateString();
    currentDateElement.textContent = currentDate;

    document.querySelector('#chat-container').addEventListener('click', function (event) {
        if (event.target.classList.contains('copy-code')) {
            const codeBlock = event.target.previousElementSibling.textContent;
            navigator.clipboard.writeText(codeBlock).then(() => {
                alert('Code block copied to clipboard!');
            });
        }

        if (event.target.classList.contains('copy-response')) {
            const responseText = event.target.parentElement.querySelector('.message.bot').textContent;
            navigator.clipboard.writeText(responseText).then(() => {
                alert('Response copied to clipboard!');
            });
        }
    });

    // Add event listener for password form submission
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;

            // Send the password to the server for verification
            const response = await fetch('/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();
            if (result.success) {
                // Password is correct, redirect to chat app
                window.location.href = '/index.html';
            } else {
                alert('Incorrect password');
            }
        });
    }
});

async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    const chatbox = document.getElementById('chatbox');
    const customPrompt = document.getElementById('customPrompt').value;
    const systemPrompt = customPrompt ? `This system prompt overrides the prior system prompt for messages after this point: ${customPrompt}` : getSystemPrompt();

    if (userInput.trim() === "") {
        return;
    }

    // Add user's message to the chatbox with emoji
    chatbox.innerHTML += `<div class="message user"><div class="icon">👤</div><div class="content"><strong>You:</strong> ${userInput}</div></div>`;
    document.getElementById('userInput').value = "";

    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userInput, systemPrompt })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botMessage = '';
    const botMessageContainer = document.createElement('div');
    botMessageContainer.className = 'message bot';
    const botMessageElement = document.createElement('div');
    botMessageElement.className = 'content';
    botMessageContainer.innerHTML = '<div class="icon">🤖</div>';
    botMessageContainer.appendChild(botMessageElement);

    const copyCodeButton = document.createElement('button');
    copyCodeButton.textContent = 'Copy Code';
    copyCodeButton.className = 'copy-code';
    const copyResponseButton = document.createElement('button');
    copyResponseButton.textContent = 'Copy Response';
    copyResponseButton.className = 'copy-response';

    botMessageContainer.appendChild(copyCodeButton);
    botMessageContainer.appendChild(copyResponseButton);
    chatbox.appendChild(botMessageContainer);

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        botMessage += chunk;
        botMessageElement.innerHTML = formatMessage(botMessage);
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    // Scroll to the bottom of the chatbox
    chatbox.scrollTop = chatbox.scrollHeight;
}

function formatMessage(message) {
    // Replace backticks with <pre><code> tags for code blocks
    let formattedMessage = message.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

    // Handle inline code
    formattedMessage = formattedMessage.replace(/`(.*?)`/g, '<code>$1</code>');

    // Handle bold text
    formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Handle italic text
    formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Handle headers
    formattedMessage = formattedMessage.replace(/^### (.*?$)/gim, '<h3>$1</h3>');
    formattedMessage = formattedMessage.replace(/^## (.*?$)/gim, '<h2>$1</h2>');
    formattedMessage = formattedMessage.replace(/^# (.*?$)/gim, '<h1>$1</h1>');

    // Handle blockquotes
    formattedMessage = formattedMessage.replace(/^\> (.*?$)/gim, '<blockquote>$1</blockquote>');

    // Handle horizontal rule
    formattedMessage = formattedMessage.replace(/^\---$/gim, '<hr>');

    return formattedMessage;
}

function checkSubmit(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

function getSystemPrompt() {
    const selectedPrompt = document.getElementById('systemPrompt').value;
    if (selectedPrompt === "Enhanced Assistant Guidance for Physicians") {
        return `# Enhanced Assistant Guidance for Physicians

**Objective**: Provide precise, actionable information, prioritizing physicians' unique requirements and decision-making processes.

### Key Principles

- **Accuracy is paramount**: Lives and professional responsibilities depend on the reliability of provided information.
- **Clarity and Precision**: Employ medical terminology accurately, avoiding unnecessary elaboration.
- **Comprehensive Insight**: Offer in-depth analysis and guidance, including step-by-step explanations for complex inquiries.
- **Adaptability**: Tailor responses according to the physician's expertise and the context of the query.

### Structured Response Format

1. **Introduction**
   - **Domain > Expertise**: Specify the medical specialty and context.
   - **Key Terms**: Highlight up to six essential terms relevant to the query.
   - **Objective**: Define the goal and desired detail level (V=0 to V=5).
   - **Assumptions**: State any premises to refine the response's relevance.
   - **Approach**: Outline the methodologies employed for analysis.

2. **Main Response**
   - Utilize appropriate formatting (markdown, lists, tables) for clarity.
   - Incorporate inline Google search and Google Scholar links for evidence.
   - Provide a nuanced, evidence-based answer, incorporating step-by-step logic as necessary.

3. **Conclusion**
   - Offer related searches and additional resources for further exploration.
   - Suggest tangentially related topics of potential interest.

### Example Template

\`\`\`python
# Response to [Query Topic]

**Domain > Expertise**: Medicine > [Specialty]
**Keywords**: [Term1, Term2, Term3, Term4, Term5, Term6]
**Objective**: [Specific goal and detail level]
**Assumptions**: [Any specific assumptions]
**Approach**: [Methodology used]

## Analysis/Recommendation

[Provide detailed response here, following the outlined principles.]

## Further Reading

- _See also:_ [Related topics for deeper understanding]
  📚[Research articles](https://scholar.google.com/scholar?q=related+terms)
  🔍[General information](https://www.google.com/search?q=related+terms)

- _You may also enjoy:_ [Topics of tangential interest]
  🌟[Explore more](https://www.google.com/search?q=tangential+interest+terms)
\`\`\``;
    }
    return selectedPrompt;
}
