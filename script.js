// DOM Elements
const chatButton = document.getElementById('chat-button');
const chatContainer = document.getElementById('chat-container');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-btn');
const closeButton = document.getElementById('close-btn');
const minimizeButton = document.getElementById('minimize-btn');
const newChatButton = document.getElementById('new-chat-btn');

// Initialize the chat
let chatHistory = [];
let isOpen = false;

// Event Listeners
chatButton.addEventListener('click', toggleChat);
closeButton.addEventListener('click', closeChat);
minimizeButton.addEventListener('click', toggleChat);
sendButton.addEventListener('click', handleSendMessage);
newChatButton.addEventListener('click', startNewChat);

// Handle input field keypress (for Enter key)
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default to avoid new line
        handleSendMessage();
    }
});

// Auto-resize the textarea as user types
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.scrollHeight > 120) {
        this.style.overflowY = 'auto';
    } else {
        this.style.overflowY = 'hidden';
    }
});

// Toggle chat window
function toggleChat() {
    if (isOpen) {
        chatContainer.style.display = 'none';
    } else {
        chatContainer.style.display = 'flex';
        chatInput.focus();
    }
    isOpen = !isOpen;
}

// Close chat window
function closeChat() {
    chatContainer.style.display = 'none';
    isOpen = false;
}

// Send message function
function handleSendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    // Add user message to chat
    appendMessage('user', message);
    
    // Clear input field
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process message with AI
    processMessageWithAI(message);
}

// Add message to the chat
function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Convert links to clickable elements
    if (sender === 'bot') {
        content.innerHTML = linkify(message);
    } else {
        content.textContent = message;
    }
    
    messageDiv.appendChild(content);
    
    // Add timestamp
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = getTimeString();
    messageDiv.appendChild(timestamp);
    
    chatBody.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Update chat history
    chatHistory.push({
        role: sender === 'user' ? 'user' : 'model',
        parts: [{ text: message }]
    });
}

// Convert URLs to clickable links
function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

// Get current time string for messages
function getTimeString() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    
    typingContent.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    typingDiv.appendChild(typingContent);
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Start a new chat
function startNewChat() {
    // Clear chat history
    chatHistory = [];
    
    // Clear chat body
    chatBody.innerHTML = '';
    
    // Add welcome message
    appendMessage('bot', 'Hello! I\'m the KGMU Assistant. How can I help you today?');
}

// Process message with Gemini AI
async function processMessageWithAI(userMessage) {
    try {
        // This is where you would integrate with the Gemini API
        // For now, we'll use a mock response

        // In a real implementation, you would call your backend here
        // which would use the code template you provided for Gemini
        
        // Simulate API delay (remove in production)
        setTimeout(() => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Sample response (replace with actual API call)
            const aiResponse = generateMockResponse(userMessage);
            appendMessage('bot', aiResponse);
        }, 1500);
        
        // In production, your code would look more like:
        /*
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                history: chatHistory.slice(0, -1) // Exclude the just-added user message
            }),
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response to chat
        appendMessage('bot', data.response);
        */
        
    } catch (error) {
        console.error('Error processing message:', error);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Show error message
        appendMessage('bot', 'Sorry, I encountered an error. Please try again later.');
    }
}

// Mock response generator (remove in production)
function generateMockResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! How can I assist you with King George\'s Medical University information today?';
    } else if (lowerMessage.includes('admission') || lowerMessage.includes('apply')) {
        return 'For admissions at KGMU, you need to visit our admissions office or check the details at <a href="https://kgmu.org/admission" target="_blank">https://kgmu.org/admission</a>. Applications for the next academic year typically open in April.';
    } else if (lowerMessage.includes('course') || lowerMessage.includes('program')) {
        return 'KGMU offers various undergraduate and postgraduate medical courses including MBBS, MD, MS, and specialized courses. You can find the complete list at <a href="https://kgmu.org/courses" target="_blank">https://kgmu.org/courses</a>';
    } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
        return 'King George\'s Medical University is located in Lucknow, Uttar Pradesh, India. The full address is: King George\'s Medical University, Shah Mina Road, Chowk, Lucknow, Uttar Pradesh 226003.';
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone')) {
        return 'You can contact KGMU at the following numbers: +91-522-2257540, +91-522-2258543. Alternatively, you can email at registrar@kgmu.ac.in';
    } else if (lowerMessage.includes('faculty') || lowerMessage.includes('professor')) {
        return 'KGMU has highly qualified faculty members across various departments. You can view the faculty directory at <a href="https://kgmu.org/faculty" target="_blank">https://kgmu.org/faculty</a>';
    } else if (lowerMessage.includes('hostel') || lowerMessage.includes('accommodation')) {
        return 'KGMU provides hostel facilities for both undergraduate and postgraduate students. The allocation is usually done based on merit and availability. For more details, please contact the hostel warden office.';
    } else if (lowerMessage.includes('fee') || lowerMessage.includes('payment')) {
        return 'The fee structure varies based on the course you are applying for. You can find the detailed fee structure on our website under the admissions section. KGMU accepts payments online through the student portal.';
    } else if (lowerMessage.includes('history')) {
        return 'King George\'s Medical University was established in 1911 and has a rich history of medical education and research. It was originally named King George\'s Medical College and was later upgraded to a university in 2002.';
    } else {
        return 'Thank you for your question. As a KGMU assistant, I can help you with information about admissions, courses, facilities, faculty, and other aspects of King George\'s Medical University. Could you please provide more details about what you\'re looking for?';
    }
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    // Adjust textarea height on load
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
});
