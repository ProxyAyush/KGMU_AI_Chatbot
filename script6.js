// script6.js (Fixed Version - Improved Link Parsing & CSS Fixes)
// NOTE: Replace API_KEY and firebase config values with your own as needed.

/**
 * Injects custom CSS to fix positioning and style issues.
 * This function is added to solve the user's requested fixes.
 */
function injectChatbotStyles() {
    const style = document.createElement('style');
    style.id = 'chatbot-custom-styles';
    style.innerHTML = `
        /* --- Chatbot Style Fixes --- */

        /* 1. Move Chat Button to Bottom Left */
        .chat-button {
            right: auto !important;
            left: 20px !important;
            bottom: 20px !important;
        }

        /* 2. Move Chat Container to open from Bottom Left */
        .chat-container {
            right: auto !important;
            left: 20px !important;
            bottom: 90px !important;
        }

        /* 3. Fix Send Button visibility */
        #send-btn {
            background-color: #0056b3 !important;
            color: white !important;
        }
        
        #send-btn:hover {
            background-color: #004080 !important;
        }
        
        #send-btn:disabled {
            background-color: #cccccc !important;
            color: #666666 !important;
        }

        /* 4. Improve mobile layout handling */
        @media (max-width: 768px) {
            .chat-container {
                left: 10px !important;
                right: 10px !important;
                width: auto !important;
            }

            .chat-container.active {
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                border-radius: 0 !important;
            }
        }
        /* --- End Chatbot Style Fixes --- */
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', function() {
    injectChatbotStyles();

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

    // Notification Cloud Element
    function createNotificationCloud() {
        const notification = document.createElement('div');
        notification.className = 'notification-cloud';
        notification.textContent = '1';
        chatButton.appendChild(notification);

        const hasVisited = localStorage.getItem('hasVisitedBefore');
        if (!hasVisited) {
            setTimeout(() => { notification.classList.add('visible'); }, 2000);
            localStorage.setItem('hasVisitedBefore', 'true');
        }

        chatButton.addEventListener('click', () => {
            notification.classList.remove('visible');
        });

        return notification;
    }

    const notificationCloud = createNotificationCloud();

    // API Key
    const API_KEY = "AIzaSyCxv_CrEK6FGhHMm7arCYJ3Gkty05qaLM8";

    // Chat State
    let messages = [];
    let timerInterval;
    let timerStarted = false;
    let awaitingResponse = false;
    let isTimerRunning = false;
    let systemPrompt = "";

    // Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyBTJpZXsh5tLvOrgeTi_JWPLvTlcZjP-kI",
        authDomain: "kgmu-ai-chatbot.firebaseapp.com",
        projectId: "kgmu-ai-chatbot",
        storageBucket: "kgmu-ai-chatbot.appspot.com",
        messagingSenderId: "1052783262438",
        appId: "1:1052783262438:web:1ebc1720b1dc6346921927",
        measurementId: "G-PK9K94MB8X"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const chatbotCollection = db.collection("QA-CHATBOT");

    async function saveToFirestore(question, answer) {
        try {
            const today = new Date();
            const dateString = today.toISOString().split('T')[0];
            const randomField = generateRandomFieldName();
            const qaData = {
                question: question,
                answer: answer,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = chatbotCollection.doc(dateString);
            const updateData = {};
            updateData[randomField] = qaData;
            await docRef.set(updateData, { merge: true });
            console.log("Q&A saved to Firestore successfully");
        } catch (error) {
            console.error("Error saving Q&A to Firestore:", error);
        }
    }

    function generateRandomFieldName() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        return `qa_${timestamp}_${randomString}`;
    }

    // Load system prompt from file
    fetch('https://raw.githubusercontent.com/ProxyAyush/KGMU_AI_Chatbot/main/system_prompt1.txt')
        .then(response => response.text())
        .then(text => {
            systemPrompt = text;
            console.log("System prompt loaded successfully");
        })
        .catch(error => {
            console.error('Error loading system prompt:', error);
            systemPrompt = "You're an AI assistant for KGMU";
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

    // Event Listeners
    infoButton.addEventListener('click', () => { infoModal.style.display = 'block'; });
    closeInfoBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target === infoModal) infoModal.style.display = 'none'; });

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

    newChatButton.addEventListener('click', resetChat);
    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!awaitingResponse && !isTimerRunning) sendMessage();
        }
    });

    userInput.addEventListener('input', () => {
        updateSendButtonState();
        autosize.update(userInput);
    });

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
        stopTimer();
        timerStarted = false;
        awaitingResponse = false;
        isTimerRunning = false;
        updateSendButtonState();
    }

    function updateSendButtonState() {
        sendButton.disabled = awaitingResponse || isTimerRunning || userInput.value.trim() === '';
    }

    // --- MAIN MESSAGE HANDLING ---
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '' || awaitingResponse || isTimerRunning) return;

        addUserMessage(message);
        messages.push({ role: "user", parts: [{ text: message }] });
        userInput.value = '';
        autosize.update(userInput);

        awaitingResponse = true;
        updateSendButtonState();

        const premadeResponse = checkPremadeResponse(message);
        if (premadeResponse) {
            setTimeout(() => {
                addBotMessage(premadeResponse);
                messages.push({ role: "model", parts: [{ text: premadeResponse }] });
                awaitingResponse = false;
                saveToFirestore(message, premadeResponse);
                if (!timerStarted) { startTimer(); timerStarted = true; } else { resetTimer(); }
                scrollToBottom();
                updateSendButtonState();
            }, 500);
            return;
        }

        showTypingIndicator();
        try {
            const response = await callGeminiAPI(message);
            removeTypingIndicator();

            // SANITIZE MODEL IDENTITY
            const safeResponse = sanitizeResponse(response);

            addBotMessage(safeResponse);
            messages.push({ role: "model", parts: [{ text: safeResponse }] });
            saveToFirestore(message, safeResponse);
            awaitingResponse = false;

            if (!timerStarted) { startTimer(); timerStarted = true; } else { resetTimer(); }
        } catch (error) {
            removeTypingIndicator();
            addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again after 1-2 minutes.");
            console.error('Error calling Gemini API:', error);
            awaitingResponse = false;
        }
        scrollToBottom();
        updateSendButtonState();
    }

    // --- SANITIZATION FIX ---
    function sanitizeResponse(text) {
        return text
            .replace(/I am a large language model[^.]*\./gi, "")
            .replace(/trained by Google/gi, "created by KGMU developers")
            .replace(/Google/g, "KGMU");
    }

    // --- FIXED GEMINI API CALL ---
    async function callGeminiAPI(userMessage) {
        try {
            const requestBody = {
    systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
    },
    contents: messages.concat([
        {
            role: "user",
            parts: [{ text: userMessage }]
        }
    ]),
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
    }
};

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
            console.log("Sending request:", JSON.stringify(requestBody, null, 2));

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    // --- Message rendering & parsing helpers ---
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

    // Helper function to normalize URLs
    function normalizeUrl(url) {
        if (!url) return 'https://www.kgmu.org';

        let u = url.trim();
        u = u.replace(/^["'()+]+|["'()+]+$/g, '');
        u = u.replace(/[")]+$/g, '');

        if (/^\/\//.test(u)) {
            u = 'https:' + u;
        }

        if (/^\/[^\/]/.test(u)) {
            u = 'https://www.kgmu.org' + u;
        }

        if (!/^https?:\/\//i.test(u)) {
            if (/^kgmu\.org/i.test(u)) {
                u = 'https://' + u;
            } else if (/^www\.kgmu\.org/i.test(u)) {
                u = 'https://' + u;
            } else if (u.includes('.php') || u.includes('.html')) {
                u = 'https://www.kgmu.org/' + u.replace(/^\/+/, '');
            } else {
                u = 'https://www.kgmu.org/' + u;
            }
        }

        if (/^\s*(javascript|data):/i.test(u)) {
            u = 'https://www.kgmu.org';
        }

        u = u.replace(/https?:\/\/(www\.)?kgmu\.org\/+(www\.)?kgmu\.org/gi, 'https://www.kgmu.org');
        u = u.replace(/(https?:\/\/(?:www\.)?kgmu\.org\/[^\/]+)\/+kgmu\.org/gi, '$1');

        return u;
    }

    function parseMarkdown(text) {
        if (typeof text !== 'string') return '';

        let t = text.trim();

        t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
            let cleanUrl = url.trim();
            cleanUrl = cleanUrl.replace(/\\_/g, '_');
            cleanUrl = normalizeUrl(cleanUrl);
            const safeLinkText = escapeHTML(linkText);
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${safeLinkText}</a>`;
        });

        t = t.replace(/\]\([^)]*$/g, '');
        t = t.replace(/\[[^\]]*$/g, '');

        t = t.replace(/<a\s+([^>]*)>(.*?)<\/a>/gi, (match, attributes, label) => {
            const hrefMatch = attributes.match(/href=["']?([^"'\s>]+)["']?/i);
            if (!hrefMatch) return escapeHTML(label);

            const cleanUrl = normalizeUrl(hrefMatch[1]);
            const cleanLabel = label.replace(/<\/?[^>]+(>|$)/g, '').trim() || cleanUrl;

            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(cleanLabel)}</a>`;
        });

        t = t.replace(/(?<!href=["']|">)(https?:\/\/[^\s<>"'\)]+)(?![^<]*<\/a>)/g, (url) => {
            const cleanUrl = normalizeUrl(url);
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>`;
        });

        t = t.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
        t = t.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        t = t.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        t = t.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        t = t.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        t = t.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');

        t = t.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        t = t.replace(/`([^`]+)`/g, '<code>$1</code>');

        t = t.replace(/^\s*---\s*$/gm, '<hr>');

        t = t.replace(/^\s*[\-\*]\s+(.*)/gm, '<li>$1</li>');
        t = t.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => `<ul>${match}</ul>`);

        t = t.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
        t = t.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
            if (!match.startsWith('<ul>') && !match.startsWith('<ol>')) {
                return `<ol>${match}</ol>`;
            }
            return match;
        });

        const lines = t.split('\n');
        t = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed === '' ||
                trimmed.startsWith('<h') ||
                trimmed.startsWith('<ul') ||
                trimmed.startsWith('<ol') ||
                trimmed.startsWith('<li') ||
                trimmed.startsWith('<pre') ||
                trimmed.startsWith('<hr') ||
                trimmed.startsWith('<p>') ||
                trimmed.includes('<a href')) {
                return line;
            }
            return `<p>${line}</p>`;
        }).join('\n');

        t = t.replace(/<p>\s*<\/p>/g, '');

        return t;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `<span></span><span></span><span></span>`;
        chatBody.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) typingIndicator.remove();
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

    // Timer functions
    function startTimer() {
        let timeLeft = 20;
        timerDisplay.textContent = `Time left: ${timeLeft}s`;
        timerDisplay.classList.add('active');
        isTimerRunning = true;
        updateSendButtonState();
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Next reply in: ${timeLeft}s`;
            if (timeLeft <= 0) stopTimer();
        }, 1000);
    }

    function resetTimer() {
        stopTimer();
        startTimer();
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerDisplay.classList.remove('active');
        isTimerRunning = false;
        updateSendButtonState();
    }

    if (window.innerWidth <= 768) chatContainer.classList.add('mobile');

    resetChat();
});