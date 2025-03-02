document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatButton = document.getElementById('chat-button');
    const chatContainer = document.getElementById('chat-container');
    const closeButton = document.getElementById('close-chat-btn');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');

    // API Key - In production, this should be secured
    const API_KEY = "AIzaSyD7xj6hW34Bdg9A2BuTVZR88M_vJac0CbU";
    
    // Chat History - Store messages for context
    let messages = [];
    
    // Initialize autosize for textarea
    autosize(userInput);

    // Toggle chat window
    chatButton.addEventListener('click', () => {
        chatContainer.classList.add('active');
        chatButton.style.display = 'none';
        userInput.focus();
    });

    closeButton.addEventListener('click', () => {
        chatContainer.classList.remove('active');
        chatButton.style.display = 'flex';
    });

    // New chat functionality
    newChatButton.addEventListener('click', () => {
        // Reset chat history
        messages = [];
        
        // Clear chat UI
        chatBody.innerHTML = '';
        
        // Add welcome message
        addBotMessage("Hello! I'm KGMU Assistant. How can I help you today?");
        
        // Focus on input
        userInput.focus();
    });

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key (but allow Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-disable send button when input is empty
    userInput.addEventListener('input', () => {
        sendButton.disabled = userInput.value.trim() === '';
        
        // Adjust textarea height
        autosize.update(userInput);
    });

    // Function to send user message
    async function sendMessage() {
        const message = userInput.value.trim();
        
        if (message === '') return;
        
        // Add user message to UI
        addUserMessage(message);
        
        // Add to messages array for context
        messages.push({
            role: "user",
            parts: [{ text: message }]
        });
        
        // Clear input field
        userInput.value = '';
        autosize.update(userInput);
        
        // Disable send button
        sendButton.disabled = true;
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Call the Gemini API
            const response = await callGeminiAPI(message);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response to UI
            addBotMessage(response);
            
            // Add response to messages array
            messages.push({
                role: "model",
                parts: [{ text: response }]
            });
            
        } catch (error) {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Show error message
            addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.");
            
            console.error('Error calling Gemini API:', error);
        }
        
        // Scroll to bottom
        scrollToBottom();
    }

    async function callGeminiAPI(userMessage) {
        try {
            // Create request with proper role structure
            const requestBody = {
                contents: [],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 1024
                }
            };
            
            // Add instruction as a user message
            requestBody.contents.push({
                role: "user",
                parts: [{ 
                    text: "You are the official virtual assistant for King George's Medical University in Lucknow, India. Your purpose is to provide helpful, accurate information about the university's programs, admissions, facilities, faculty, and student services. Respond professionally and courteously. Keep responses concise and relevant."
                }]
            });
            
            // Add a model response to acknowledge the instructions
            requestBody.contents.push({
                role: "model",
                parts: [{ 
                    text: "I understand. I'll act as the KGMU virtual assistant and provide helpful information about the university."
                }]
            });
            
            // Add conversation history if available
            if (messages.length > 0) {
                // Add each message with its proper role
                messages.forEach(msg => {
                    requestBody.contents.push(msg);
                });
            }
            
            // Add current user message
            requestBody.contents.push({
                role: "user",
                parts: [{ text: userMessage }]
            });
            
            // Direct call to Google's Generative AI API
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            console.log("Sending request:", JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Details:', errorData);
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("API Response:", data);
            
            // Extract text from the response
            if (data.candidates && data.candidates[0] && data.candidates[0].content && 
                data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Unexpected API response format');
            }
            
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }
    // Function to add user message to UI
    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${escapeHTML(message)}</p>
            </div>
        `;
        
        chatBody.appendChild(messageDiv);
        scrollToBottom();
    }

    // Function to add bot message to UI
    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message bot';
        
        // Process message to make links clickable
        const processedMessage = makeLinksClickable(message);
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${processedMessage}</p>
            </div>
        `;
        
        chatBody.appendChild(messageDiv);
        scrollToBottom();
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        
        chatBody.appendChild(typingDiv);
        scrollToBottom();
    }

    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Function to make links in text clickable
    function makeLinksClickable(text) {
        // URL regex pattern
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        
        // Replace URLs with clickable links
        return text.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }

    // Function to escape HTML to prevent XSS
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Function to scroll chat to bottom
    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Add resize event listener to handle mobile view
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768 && chatContainer.classList.contains('active')) {
            chatContainer.style.width = '100%';
            chatContainer.style.height = '100%';
        } else {
            chatContainer.style.width = '';
            chatContainer.style.height = '';
        }
    });

    // Check if we need to apply mobile styles on load
    if (window.innerWidth <= 768) {
        chatContainer.classList.add('mobile');
    }
});
