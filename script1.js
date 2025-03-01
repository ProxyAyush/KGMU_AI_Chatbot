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
// Move this to a secure location for production
const API_KEY = "AIzaSyD7xj6hW34Bdg9A2BuTVZR88M_vJac0CbU"; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// System message for context
const systemMessage = {
    role: "system",
    parts: [{
        text: `You are KGMU Assistant, the official chatbot for King George's Medical University in Lucknow, India. 
        
Provide helpful, accurate, and concise information about:
- Admissions process and requirements
- Course offerings (MBBS, MD, MS, etc.)
- Faculty information
- Campus facilities
- Research opportunities
- Hospital services
- Contact information
- University history and achievements

Be polite, professional, and helpful. Respond as an official representative of the university.
Keep responses concise but informative. When mentioning URLs, use format: https://kgmu.org/[relevant-page]
For complex inquiries, suggest contacting relevant departments directly with their contact information.

When uncertain about specific details, acknowledge limitations and suggest official resources rather than providing potentially incorrect information.`
    }]
};

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
    const maxHeight = 120;
    if (this.scrollHeight > maxHeight) {
        this.style.height = maxHeight + 'px';
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
    processMessageWithGemini(message);
}

// Add message to the chat
function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Safer approach for links
    if (sender === 'bot') {
        // Split by URLs and create elements
        const parts = message.split(/(https?:\/\/[^\s]+)/g);
        parts.forEach(part => {
            if (part.match(/^https?:\/\//)) {
                const link = document.createElement('a');
                link.href = part;
                link.textContent = part;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                content.appendChild(link);
            } else if (part) {
                content.appendChild(document.createTextNode(part));
            }
        });
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
    
    // Store message in chat history
    if (sender === 'user') {
        chatHistory.push({
            role: "user",
            parts: [{ text: message }]
        });
    } else if (sender === 'bot') {
        chatHistory.push({
            role: "model",
            parts: [{ text: message }]
        });
    }
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
    
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        typingContent.appendChild(span);
    }
    
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

// Process message with Gemini API
async function processMessageWithGemini(userMessage) {
    try {
        // Create a deep copy of contents array
        const contents = [
            systemMessage,
            ...chatHistory.slice(0, chatHistory.length - 1) // Exclude the last user message to avoid duplication
        ];
        
        // Make request to Gemini API
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 2048,
                }
            }),
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            // Extract the AI response text
            const aiResponseText = data.candidates[0].content.parts[0].text;
            
            // Add AI response to chat
            appendMessage('bot', aiResponseText);
        } else {
            // Handle error case
            console.error('Unexpected API response format:', data);
            appendMessage('bot', 'Sorry, I encountered an error processing your request. Please try again later.');
        }
        
    } catch (error) {
        console.error('Error processing message with Gemini API:', error);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Show error message
        appendMessage('bot', 'Sorry, I encountered an error connecting to my knowledge base. Please try again later.');
    }
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    // Adjust textarea height on load
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
});
