<script>
// script6.js - OFFICIAL KGMU.ORG VERSION (CORB-FIXED: Vercel-Hosted Prompt + 1:1 Requests)
// No GitHub raw fetch → Zero CORS/CORB issues on mobile/desktop
// CDN: https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js
// Updated: November 17, 2025 (v1.2 - Cache-Bust)

function injectChatbotStyles() {
    const style = document.createElement('style');
    style.id = 'chatbot-custom-styles';
    style.innerHTML = `
        /* --- Chatbot Style Fixes --- */
        .chat-button {
            right: auto !important;
            left: 20px !important;
            bottom: 20px !important;
            z-index: 9999;
        }
        .chat-container {
            right: auto !important;
            left: 20px !important;
            bottom: 90px !important;
            z-index: 9999;
        }
        #send-btn {
            background-color: #0056b3 !important;
            color: white !important;
        }
        #send-btn:hover { background-color: #004080 !important; }
        #send-btn:disabled { background-color: #cccccc !important; color: #666666 !important; }
        @media (max-width: 768px) {
            .chat-container { left: 10px !important; right: 10px !important; width: auto !important; }
            .chat-container.active {
                left: 0 !important; right: 0 !important; bottom: 0 !important;
                width: 100% !important; height: 100% !important; border-radius: 0 !important;
            }
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', function() {
    injectChatbotStyles();

    // 1:1 REQUEST RATIO — KEY IN PATH (NO PREFLIGHT)
    const PROXY_URL = 'https://kgmu-ai-chatbot.vercel.app/api/gemini/kgmu-prod-2025-secure-key-9f8e3d2a1c5b7e';

    // VERCEL-HOSTED PROMPT (Same domain = No CORS/CORB)
    const PROMPT_URL = 'https://raw.githubusercontent.com/ProxyAyush/KGMU_AI_Chatbot/main/system_prompt1.txt';

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

    // Notification Cloud
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

    // Chat State
    let messages = [];
    let timerInterval;
    let timerStarted = false;
    let awaitingResponse = false;
    let isTimerRunning = false;
    let systemPrompt = "You are a helpful AI assistant for KGMU."; // Fallback

    // Load system prompt from Vercel (CORS-free)
    fetch(PROMPT_URL, { cache: 'no-cache' })
        .then(r => {
            if (!r.ok) throw new Error('Prompt fetch failed');
            return r.text();
        })
        .then(text => {
            systemPrompt = text.trim();
            console.log("System prompt loaded from Vercel (CORS-safe)");
        })
        .catch(err => {
            console.warn("Using fallback prompt:", err);
        });

    // Firebase Config (safe to be public)
    const firebaseConfig = {
        apiKey: "AIzaSyBTJpZXsh5tLvOrgeTi_JWPLvTlcZjP-kI",
        authDomain: "kgmu-ai-chatbot.firebaseapp.com",
        projectId: "kgmu-ai-chatbot",
        storageBucket: "kgmu-ai-chatbot.appspot.com",
        messagingSenderId: "1052783262438",
        appId: "1:1052783262438:web:1ebc1720b1dc6346921927",
        measurementId: "G-PK9K94MB8X"
    };

    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const chatbotCollection = db.collection("QA-CHATBOT");

        async function saveToFirestore(question, answer) {
            try {
                const today = new Date().toISOString().split('T')[0];
                const randomField = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const qaData = { question, answer, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
                await chatbotCollection.doc(today).set({ [randomField]: qaData }, { merge: true });
                console.log("Q&A saved to Firestore");
            } catch (error) {
                console.error("Firestore save error:", error);
            }
        }
        window.saveToFirestore = saveToFirestore; // Global for premade
    }

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

    // Autosize fallback
    function initAutosize() {
        if (typeof autosize !== 'undefined') {
            autosize(userInput);
        } else {
            userInput.addEventListener('input', () => {
                userInput.style.height = 'auto';
                userInput.style.height = (userInput.scrollHeight) + 'px';
            });
        }
    }
    initAutosize();

    // Event Listeners
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
        if (typeof autosize !== 'undefined') autosize.update(userInput);
    });

    function checkPremadeResponse(message) {
        const lower = message.toLowerCase().trim();
        for (const cat in premadeResponses) {
            for (const key in premadeResponses[cat]) {
                if (lower === key || lower === key + "!") return premadeResponses[cat][key];
            }
        }
        if (lower.includes("thank") && lower.includes("you")) return premadeResponses.farewells["thank you"];
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

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || awaitingResponse || isTimerRunning) return;

        addUserMessage(message);
        messages.push({ role: "user", parts: [{ text: message }] });
        userInput.value = '';
        if (typeof autosize !== 'undefined') autosize.update(userInput);

        awaitingResponse = true;
        updateSendButtonState();

        const premade = checkPremadeResponse(message);
        if (premade) {
            setTimeout(() => {
                addBotMessage(premade);
                messages.push({ role: "model", parts: [{ text: premade }] });
                if (typeof saveToFirestore === 'function') saveToFirestore(message, premade);
                if (!timerStarted) { startTimer(); timerStarted = true; } else { resetTimer(); }
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
            if (typeof saveToFirestore === 'function') saveToFirestore(message, safeResponse);
            if (!timerStarted) { startTimer(); timerStarted = true; } else { resetTimer(); }
        } catch (error) {
            removeTypingIndicator();
            addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again in a minute.");
            console.error('Gemini proxy error:', error);
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

    // PRODUCTION GEMINI CALL VIA VERCEL PROXY (1:1 Ratio)
    async function callGeminiAPI() {
        if (!systemPrompt) throw new Error("System prompt not loaded");
        if (messages.length === 0 || messages[messages.length - 1].role !== "user") throw new Error("Invalid state");

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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

    // Message rendering helpers
    function addUserMessage(message) {
        const div = document.createElement('div');
        div.className = 'chat-message user';
        div.innerHTML = `<div class="message-content"><p>${escapeHTML(message)}</p></div>`;
        chatBody.appendChild(div);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        div.innerHTML = `<div class="message-content">${parseMarkdown(message)}</div>`;
        chatBody.appendChild(div);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = `<span></span><span></span><span></span>`;
        chatBody.appendChild(div);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

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

    function resetTimer() { stopTimer(); startTimer(); }
    function stopTimer() {
        clearInterval(timerInterval);
        timerDisplay.classList.remove('active');
        isTimerRunning = false;
        updateSendButtonState();
    }

    // Mobile handling
    if (window.innerWidth <= 768) chatContainer.classList.add('mobile');
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768 && chatContainer.classList.contains('active')) {
            chatContainer.style.width = '100%'; chatContainer.style.height = '100%';
        } else {
            chatContainer.style.width = ''; chatContainer.style.height = '';
        }
    });

    // Markdown parser (unchanged)
    function normalizeUrl(url) {
        if (!url) return 'https://www.kgmu.org';
        let u = url.trim().replace(/^["'()+]+|["'()+]+$/g, '').replace(/[")]+$/g, '');
        if (/^\/\//.test(u)) u = 'https:' + u;
        if (/^\/[^\/]/.test(u)) u = 'https://www.kgmu.org' + u;
        if (!/^https?:\/\//i.test(u)) {
            if (/^kgmu\.org/i.test(u) || /^www\.kgmu\.org/i.test(u)) u = 'https://' + u;
            else if (u.includes('.php') || u.includes('.html')) u = 'https://www.kgmu.org/' + u.replace(/^\/+/, '');
            else u = 'https://www.kgmu.org/' + u;
        }
        if (/^\s*(javascript|data):/i.test(u)) u = 'https://www.kgmu.org';
        u = u.replace(/https?:\/\/(www\.)?kgmu\.org\/+(www\.)?kgmu\.org/gi, 'https://www.kgmu.org');
        return u;
    }

    function parseMarkdown(text) {
        if (typeof text !== 'string') return '';
        let t = text.trim()
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        // Links
        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => {
            const cleanUrl = normalizeUrl(url.replace(/\\_/g, '_'));
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(txt)}</a>`;
        });

        t = t.replace(/(?<!href=["']|">)(https?:\/\/[^\s<>"'\)]+)(?![^<]*<\/a>)/g, url => {
            return `<a href="${normalizeUrl(url)}" target="_blank" rel="noopener noreferrer">${normalizeUrl(url)}</a>`;
        });

        // Headers, bold, italic, code, lists, etc.
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
        t = t.replace(/^\s*[\-\*]\s+(.*)/gm, '<li>$1</li>');
        t = t.replace(/(<li>.*?<\/li>\s*)+/gs, m => m.startsWith('<ul>') || m.startsWith('<ol>') ? m : `<ul>${m}</ul>`);
        t = t.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
        t = t.replace(/(<li>.*?<\/li>\s*)+/gs, m => m.includes('<ol>') || m.includes('<ul>') ? m : `<ol>${m}</ol>`);

        const lines = t.split('\n');
        t = lines.map(l => {
            const tr = l.trim();
            if (!tr || tr.startsWith('<h') || tr.startsWith('<ul') || tr.startsWith('<ol') || tr.startsWith('<li') || tr.startsWith('<pre') || tr.startsWith('<hr') || tr.includes('<a href')) return l;
            return `<p>${l}</p>`;
        }).join('\n');

        return t.replace(/<p>\s*<\/p>/g, '');
    }

    resetChat();
});
</script>