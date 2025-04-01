// script6.js
      // Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, FieldValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
      // TODO: Add SDKs for Firebase products that you want to use
      // https://firebase.google.com/docs/web/setup#available-libraries

    
        
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatButton = document.getElementById('chat-button');
    const chatContainer = document.getElementById('chat-container');
    const closeButton = document.getElementById('close-chat-btn');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const infoButton = document.getElementById('info-button');
    const infoModal = document.getElementById('info-modal');
    const closeInfoBtn = document.querySelector('.close-info');
    const timerDisplay = document.getElementById('timer-display');

    // API Key
    const API_KEY = "AIzaSyD7xj6hW34Bdg9A2BuTVZR88M_vJac0CbU";

    // Chat State
    let messages = [];
    let timerInterval;
    let timerStarted = false;
    let awaitingResponse = false;
    let isTimerRunning = false; // Flag to track if the timer is actively running
    let systemPrompt = ""; // Variable to store the system prompt

    
      // Your web app's Firebase configuration
      // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: "AIzaSyBTJpZXsh5tLvOrgeTi_JWPLvTlcZjP-kI",
        authDomain: "kgmu-ai-chatbot.firebaseapp.com",
        projectId: "kgmu-ai-chatbot",
        storageBucket: "kgmu-ai-chatbot.firebasestorage.app",
        messagingSenderId: "1052783262438",
        appId: "1:1052783262438:web:1ebc1720b1dc6346921927",
        measurementId: "G-PK9K94MB8X"
      };
    
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const chatbotCollection = collection(db, "QA-CHATBOT");
    
        // Function to save Q&A to Firestore
    async function saveToFirestore(question, answer) {
         try {
                // Get today's date in YYYY-MM-DD format
                const today = new Date();
                const dateString = today.toISOString().split('T')[0];
                
                // Generate a random field name
                const randomField = generateRandomFieldName();
                
                // Create the data object with Q&A
                const qaData = {
                    question: question,
                    answer: answer,
                    timestamp: FieldValue.serverTimestamp()
                };
                
                // Reference to today's document
                const docRef = doc(db, chatbotCollection.path, dateString);
                
                // Use update with dot notation to add the new field
                // This creates the document if it doesn't exist or updates it if it does
                await setDoc(docRef, {
                    [randomField]: qaData
                }, { merge: true });
                
                console.log("Q&A saved to Firestore successfully");
            } catch (error) {
                console.error("Error saving Q&A to Firestore:", error);
            }
        }
    
        // Generate random field name
    function generateRandomFieldName() {
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 10);
            return `qa_${timestamp}_${randomString}`;
        }
    // Load system prompt from file
    fetch('system_prompt.txt')
        .then(response => response.text())
        .then(text => {
            systemPrompt = text;
            console.log("System prompt loaded successfully");
        })
        .catch(error => {
            console.error('Error loading system prompt:', error);
            systemPrompt = "You're an AI assistant for KGMU"; // Fallback prompt
        });

    // Premade responses
    const premadeResponses = {
        greetings: {
            "hi": "Hello! How can I assist you with KGMU information today? | नमस्ते! मैं आज KGMU की जानकारी में आपकी कैसे सहायता कर सकता हूँ?",
            "hello": "Hi there! Welcome to KGMU Assistant. What would you like to know about King George's Medical University? | \"नमस्कार! KGMU सहायक में आपका स्वागत है। आप किंग जॉर्ज मेडिकल यूनिवर्सिटी के बारे में क्या जानना चाहेंगे?\"",
            "hey": "Hey! I'm here to help with any KGMU-related questions. What can I do for you? | \"हे! मैं KGMU से संबंधित किसी भी प्रश्न में मदद करने के लिए यहाँ हूँ। मैं आपके लिए क्या कर सकता हूँ?\"",
            "good morning": "Good morning! How may I assist you with KGMU information today? | \"सुप्रभात! मैं आज KGMU की जानकारी में आपकी कैसे सहायता कर सकता हूँ?\"",
            "good afternoon": "Good afternoon! What information about KGMU can I help you with? | \"शुभ दोपहर! मैं KGMU के बारे में किस जानकारी में आपकी सहायता कर सकता हूँ?\"",
            "good evening": "Good evening! I'm here to answer your questions about KGMU. How can I help? | \"शुभ संध्या! मैं KGMU के बारे में आपके प्रश्नों का उत्तर देने के लिए यहाँ हूँ। मैं आपकी कैसे मदद कर सकता हूँ?\"",
        },
        farewells: {
            "bye": "Goodbye! Feel free to return if you have more questions about KGMU. | \"अलविदा! यदि आपके पास KGMU के बारे में और प्रश्न हैं तो बेझिझक वापस आएं।\"",
            "goodbye": "Thanks for chatting! If you need any more information about KGMU, I'll be here. | \"बातचीत के लिए धन्यवाद! यदि आपको KGMU के बारे में और जानकारी चाहिए, तो मैं यहाँ रहूँगा।\"",
            "ok": "See you later! Have a great day! | \"फिर मिलेंगे! आपका दिन शुभ हो!\"",
            "thank you": "You're welcome! If you have any more questions about KGMU, don't hesitate to ask. | \"आपका स्वागत है! यदि आपके पास KGMU के बारे में और प्रश्न हैं, तो पूछने में संकोच न करें।\"",
            "thanks": "You're welcome! I'm here anytime you need information about KGMU. | \"आपका स्वागत है! जब भी आपको KGMU के बारे में जानकारी चाहिए, मैं यहाँ हूँ।\""
        },
        basics: {
            "who are you": "I'm the KGMU Assistant, designed to help you find information about King George's Medical University, Lucknow. | \"मैं KGMU सहायक हूँ, जिसे किंग जॉर्ज मेडिकल यूनिवर्सिटी, लखनऊ के बारे में जानकारी खोजने में आपकी मदद करने के लिए डिज़ाइन किया गया है।\"",
            "what can you do": "I can provide information about KGMU's departments, programs, facilities, admission processes, contact details, and more. | \"मैं KGMU के विभागों, कार्यक्रमों, सुविधाओं, प्रवेश प्रक्रियाओं, संपर्क विवरण और बहुत कुछ के बारे में जानकारी प्रदान कर सकता हूँ।\"",
            "help": "I can help you find information about KGMU. You can ask about departments, courses, admissions, faculty, research, facilities, or any other university-related topics. | \"मैं KGMU के बारे में जानकारी खोजने में आपकी मदद कर सकता हूँ। आप विभागों, पाठ्यक्रमों, प्रवेश, संकाय, अनुसंधान, सुविधाओं या विश्वविद्यालय से संबंधित किसी भी अन्य विषय के बारे में पूछ सकते हैं।\""
        }
    };

    // Initialize autosize
    autosize(userInput);

    // --- Event Listeners ---
    infoButton.addEventListener('click', () => {
        infoModal.style.display = 'block';
    });

    closeInfoBtn.addEventListener('click', () => {
        infoModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === infoModal) {
            infoModal.style.display = 'none';
        }
    });

    chatButton.addEventListener('click', () => {
        chatContainer.classList.add('active');
        chatButton.style.display = 'none';
        userInput.focus();
    });

    closeButton.addEventListener('click', () => {
        chatContainer.classList.remove('active');
        chatButton.style.display = 'flex';
        stopTimer();
    });

    newChatButton.addEventListener('click', () => {
        resetChat();
    });

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!awaitingResponse && !isTimerRunning) { // Check BOTH flags
                sendMessage();
            }
        }
    });

    userInput.addEventListener('input', () => {
        updateSendButtonState(); // Call a function to update the button state
        autosize.update(userInput);
    });

    // --- Helper Functions ---
    function checkPremadeResponse(message) {
        const lowerMessage = message.toLowerCase().trim();
        for (const category in premadeResponses) {
            for (const key in premadeResponses[category]) {
                if (lowerMessage === key || lowerMessage === key + "!") {
                    return premadeResponses[category][key];
                }
            }
        }
        if (lowerMessage.includes("thank") && lowerMessage.includes("you")) {
            return premadeResponses.farewells["thank you"];
        }
        return null;
    }

    function resetChat() {
        messages = [];
        chatBody.innerHTML = '';
        addBotMessage("Hello! I'm KGMU Assistant. How can I help you today? | नमस्ते! मैं KGMU सहायक हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?");
        userInput.focus();
        stopTimer();          // Stop any running timer
        timerStarted = false;
        awaitingResponse = false;
        isTimerRunning = false; // Reset timer running flag
        updateSendButtonState(); // Update button state after reset
    }

    function updateSendButtonState() {
        // Disable if: awaiting response OR timer is running OR input is empty
        sendButton.disabled = awaitingResponse || isTimerRunning || userInput.value.trim() === '';
    }

    // --- Main Message Handling ---
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '' || awaitingResponse || isTimerRunning) return; // Check BOTH flags

        addUserMessage(message);
        messages.push({ role: "user", parts: [{ text: message }] });
        userInput.value = '';
        autosize.update(userInput);
        awaitingResponse = true;    // Set awaiting response flag
        updateSendButtonState();     // Update button *after* setting flags

        const premadeResponse = checkPremadeResponse(message);
        if (premadeResponse) {
            setTimeout(() => {
                addBotMessage(premadeResponse);
                messages.push({ role: "model", parts: [{ text: premadeResponse }] });
                awaitingResponse = false;
                
                // Save Q&A to Firestore
                saveToFirestore(message, premadeResponse);
                
                if (!timerStarted) {
                    startTimer();
                    timerStarted = true;
                } else {
                    resetTimer();
                }
                scrollToBottom();
                updateSendButtonState();
            }, 500);
        } else {
            showTypingIndicator();
            try {
                const response = await callGeminiAPI(message);
                removeTypingIndicator();
                addBotMessage(response);
                messages.push({ role: "model", parts: [{ text: response }] });
                
                // Save Q&A to Firestore
                saveToFirestore(message, response);
                
                awaitingResponse = false;
                if (!timerStarted) {
                    startTimer();
                    timerStarted = true;
                } else {
                    resetTimer();
                }
            } catch (error) {
                removeTypingIndicator();
                addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again after 1-2 minutes.");
                console.error('Error calling Gemini API:', error);
                awaitingResponse = false; // Reset even on error
            }
            scrollToBottom();
            updateSendButtonState();
        }
    }

    async function callGeminiAPI(userMessage) {
        try {
            const requestBody = {
                contents: [],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 1024
                }
            };

            // Add system prompt from loaded file
            requestBody.contents.push({
                role: "user",
                parts: [{ text: systemPrompt }]
            });

            requestBody.contents.push({
                role: "model",
                parts: [{ text: "I understand. I'll act as the KGMU virtual assistant and provide helpful information about the university." }]
            });

            if (messages.length > 0) {
                messages.forEach(msg => {
                    requestBody.contents.push(msg);
                });
            }

            requestBody.contents.push({
                role: "user",
                parts: [{ text: userMessage }]
            });

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;
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

            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Unexpected API response format');
            }
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

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

    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message bot';
        const processedMessage = parseMarkdown(message);
        messageDiv.innerHTML = `
            <div class="message-content">
                ${processedMessage}
            </div>
        `;
        chatBody.appendChild(messageDiv);
        scrollToBottom();
    }

    function parseMarkdown(text) {
        if (typeof text !== 'string') return '';
        let formattedText = text;
        formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        formattedText = formattedText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        formattedText = formattedText.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
        formattedText = formattedText.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        formattedText = formattedText.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        formattedText = formattedText.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        formattedText = formattedText.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        formattedText = formattedText.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formattedText = formattedText.replace(/^\s*[\-\*]\s+(.*)/gm, '<li>$1</li>');
        formattedText = formattedText.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        formattedText = formattedText.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
        formattedText = formattedText.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
        formattedText = formattedText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
        formattedText = formattedText.replace(/^\s*---\s*$/gm, '<hr>');
        const lines = formattedText.split('\n');
        let inList = false;
        let inCodeBlock = false;
        formattedText = lines.map(line => {
            if (line.trim() === '' ||
                line.match(/^<(h[1-6]|ul|ol|li|pre|hr)/) ||
                line.match(/<\/(h[1-6]|ul|ol|li|pre)>$/) ||
                inList || inCodeBlock) {
                if (line.includes('<ul>') || line.includes('<ol>')) inList = true;
                if (line.includes('</ul>') || line.includes('</ol>')) inList = false;
                if (line.includes('<pre>')) inCodeBlock = true;
                if (line.includes('</pre>')) inCodeBlock = false;
                return line;
            }
            return `<p>${line}</p>`;
        }).join('\n');
        return formattedText;
    }

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

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768 && chatContainer.classList.contains('active')) {
            chatContainer.style.width = '100%';
            chatContainer.style.height = '100%';
        } else {
            chatContainer.style.width = '';
            chatContainer.style.height = '';
        }
    });

    // --- Timer Functions ---
    function startTimer() {
        let timeLeft = 20;
        timerDisplay.textContent = `Time left: ${timeLeft}s`;
        timerDisplay.classList.add('active');
        isTimerRunning = true; // Set timer running flag
        updateSendButtonState(); // Update immediately

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Next reply in: ${timeLeft}s`;
            if (timeLeft <= 0) {
                stopTimer();
            }
        }, 1000);
    }

    function resetTimer() {
        stopTimer();
        startTimer();
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerDisplay.classList.remove('active');
        isTimerRunning = false; // Reset timer running flag
        updateSendButtonState(); // Update after stopping
    }

    if (window.innerWidth <= 768) {
        chatContainer.classList.add('mobile');
    }

    // Initialize chat
    resetChat();
});
