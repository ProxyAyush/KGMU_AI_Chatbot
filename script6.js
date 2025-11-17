<script>
// script7.js - 1:1 Request Ratio Version (No Preflight) - Production Ready
// CDN: https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script7.js
// Updated: November 17, 2025

function injectChatbotStyles() {
    const style = document.createElement('style');
    style.id = 'chatbot-custom-styles';
    style.innerHTML = `
        .chat-button { right: auto !important; left: 20px !important; bottom: 20px !important; }
        .chat-container { right: auto !important; left: 20px !important; bottom: 90px !important; }
        #send-btn { background-color: #0056b3 !important; color: white !important; }
        #send-btn:hover { background-color: #004080 !important; }
        #send-btn:disabled { background-color: #cccccc !important; color: #666666 !important; }
        @media (max-width: 768px) {
            .chat-container { left: 10px !important; right: 10px !important; width: auto !important; }
            .chat-container.active { left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; }
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', function() {
    injectChatbotStyles();

    // NEW 1:1 PROXY URL — KEY IS IN PATH (NO CUSTOM HEADER = NO PREFLIGHT)
    const PROXY_URL = 'https://kgmu-ai-chatbot.vercel.app/api/gemini/kgmu-prod-2025-secure-key-9f8e3d2a1c5b7e';

    // DOM Elements (unchanged)
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

    // Notification Cloud
    function createNotificationCloud() {
        const notification = document.createElement('div');
        notification.className = 'notification-cloud';
        notification.textContent = '1';
        chatButton.appendChild(notification);
        const hasVisited = localStorage.getItem('hasVisitedBefore');
        if (!hasVisited) {
            setTimeout(() => notification.classList.add('visible'), 2000);
            localStorage.setItem('hasVisitedBefore', 'true');
        }
        chatButton.addEventListener('click', () => notification.classList.remove('visible'));
        return notification;
    }
    const notificationCloud = createNotificationCloud();

    // Chat State
    let messages = [];
    let timerInterval;
    let timerStarted = false;
    let awaitingResponse = false;
    let isTimerRunning = false;
    let systemPrompt = "";

    // Firebase (safe to be public)
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
            const today = new Date().toISOString().split('T')[0];
            const randomField = `qa_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
            await chatbotCollection.doc(today).set({ [randomField]: { question, answer, timestamp: firebase.firestore.FieldValue.serverTimestamp() } }, { merge: true });
        } catch(e) { console.error("Firestore error:", e); }
    }

    // Load system prompt
    fetch('https://raw.githubusercontent.com/ProxyAyush/KGMU_AI_Chatbot/main/system_prompt1.txt')
        .then(r => r.text())
        .then(t => { systemPrompt = t; console.log("System prompt loaded"); })
        .catch(() => systemPrompt = "You are an AI assistant for KGMU.");

    // Premade responses (unchanged)
    const premadeResponses = { /* ... your full premadeResponses object exactly as before ... */ };

    autosize(userInput);

    // Event Listeners (unchanged)
    infoButton.addEventListener('click', () => infoModal.style.display = 'block');
    closeInfoBtn.addEventListener('click', () => infoModal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === infoModal) infoModal.style.display = 'none'; });

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
    userInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!awaitingResponse && !isTimerRunning) sendMessage();
        }
    });
    userInput.addEventListener('input', () => {
        updateSendButtonState();
        autosize.update(userInput);
    });

    function checkPremadeResponse(msg) {
        const lower = msg.toLowerCase().trim();
        // ... same logic as before ...
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

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || awaitingResponse || isTimerRunning) return;

        addUserMessage(message);
        messages.push({ role: "user", parts: [{ text: message }] });
        userInput.value = '';
        autosize.update(userInput);
        awaitingResponse = true;
        updateSendButtonState();

        const premade = checkPremadeResponse(message);
        if (premade) {
            setTimeout(() => {
                addBotMessage(premade);
                messages.push({ role: "model", parts: [{ text: premade }] });
                saveToFirestore(message, premade);
                if (!timerStarted) { startTimer(); timerStarted = true; } else resetTimer();
                awaitingResponse = false;
                scrollToBottom();
                updateSendButtonState();
            }, 500);
            return;
        }

        showTypingIndicator();
        try {
            const response = await callGeminiAPI();
            removeTypingIndicator();
            const safeResponse = sanitizeResponse(response);
            addBotMessage(safeResponse);
            messages.push({ role: "model", parts: [{ text: safeResponse }] });
            saveToFirestore(message, safeResponse);
            if (!timerStarted) { startTimer(); timerStarted = true; } else resetTimer();
        } catch (err) {
            removeTypingIndicator();
            addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again in a minute.");
            console.error('Gemini error:', err);
        } finally {
            awaitingResponse = false;
            scrollToBottom();
            updateSendButtonState();
        }
    }

    function sanitizeResponse(text) {
        return text
            .replace(/I am a large language model[^.]*\./gi, "")
            .replace(/trained by Google/gi, "created by KGMU developers")
            .replace(/Google/g, "KGMU")
            .trim();
    }

    // NEW 1:1 GEMINI CALL — NO X-Api-Key HEADER ANYMORE
    async function callGeminiAPI() {
        if (!systemPrompt) throw new Error("System prompt missing");
        if (messages[messages.length - 1].role !== "user") throw new Error("Invalid state");

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // NO CUSTOM HEADER → NO PREFLIGHT → 1:1 REQUESTS!
            },
            body: JSON.stringify({
                systemPrompt,
                messages,
                generationConfig: { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 1024 }
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Proxy error ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    }

    // Rest of your helper functions (addUserMessage, addBotMessage, typing indicator, timer, markdown parser, etc.)
    // → exactly the same as your previous script6.js

    // ... [paste all your existing helper functions here - unchanged] ...

    resetChat();
});
</script>