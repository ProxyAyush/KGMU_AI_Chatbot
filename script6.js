// script6.js (updated)
// NOTE: Replace API_KEY and firebase config values with your own as needed.

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

    // Firebase config (keep your config)
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
    fetch('system_prompt.txt')
        .then(response => response.text())
        .then(text => {
            systemPrompt = text;
            console.log("System prompt loaded successfully");
        })
        .catch(error => {
            console.error('Error loading system prompt:', error);
            systemPrompt = "You're an AI assistant for KGMU";
        });

    // Premade responses (unchanged)
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

    // Initialize autosize (assumes autosize library present)
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

    // --- Main Message Handling ---
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
            addBotMessage(response);
            messages.push({ role: "model", parts: [{ text: response }] });
            saveToFirestore(message, response);
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

            requestBody.contents.push({
                role: "user",
                parts: [{ text: systemPrompt }]
            });

            requestBody.contents.push({
                role: "model",
                parts: [{ text: "I understand. I'll act as the KGMU virtual assistant and provide helpful information about the university." }]
            });

            if (messages.length > 0) {
                messages.forEach(msg => { requestBody.contents.push(msg); });
            }

            requestBody.contents.push({
                role: "user",
                parts: [{ text: userMessage }]
            });

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;
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

        // parseMarkdown will sanitize and return safe HTML
        const processedMessage = parseMarkdown(message);

        messageDiv.innerHTML = `
            <div class="message-content">
                ${processedMessage}
            </div>
        `;
        chatBody.appendChild(messageDiv);
        scrollToBottom();
    }

    // --- NEW: sanitizer helpers ---

    // Remove tags that are not in the allowed whitelist
    function sanitizeHTML(html) {
        if (!html) return '';
        // Basic decode of common entities (just in case)
        html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        // 1) Normalize double-domain mistakes
        html = html.replace(/https?:\/\/(www\.)?kgmu\.org\/www\.kgmu\.org/gi, 'https://www.kgmu.org');

        // 2) Fix protocol-less URLs like //kgmu.org/...  -> https://www.kgmu.org/...
        html = html.replace(/href=["']\/\/(kgmu\.org[^"']*)["']/gi, (m, p1) => {
            return `href="https://www.${p1.replace(/^www\./,'')}"`;
        });

        // 3) Fix href="//..." or "//kgmu.org/..." that may appear in text (not attribute)
        html = html.replace(/(^|[^a-zA-Z0-9])\/\/kgmu\.org/gi, (m) => {
            return m.replace('//kgmu.org', 'https://www.kgmu.org');
        });

        // 4) Sanitize href attributes: convert relative to absolute and reject unsafe protocols
        html = html.replace(/href=(["'])(.*?)\1/gi, (match, quote, url) => {
            let fixed = url.trim();

            // remove extra surrounding quotes if present
            fixed = fixed.replace(/^"+|"+$/g, '');

            // some responses include stray '"' at end, remove them
            fixed = fixed.replace(/"$/, '');

            // If URL starts with // (protocol relative) -> add https:
            if (/^\/\//.test(fixed)) {
                fixed = 'https:' + fixed;
            }

            // If url starts with single slash (relative path) -> prefix domain
            if (/^\//.test(fixed)) {
                fixed = 'https://www.kgmu.org' + fixed;
            }

            // If it lacks protocol and doesn't start with http(s), prefix domain
            if (!/^https?:\/\//i.test(fixed)) {
                // If it's like kgmu.org/... -> add https://
                if (/^kgmu\.org/i.test(fixed)) {
                    fixed = 'https://' + fixed;
                } else {
                    // fallback to absolute on kgmu
                    fixed = 'https://www.kgmu.org/' + fixed;
                }
            }

            // Prevent javascript: and other unsafe protocols
            if (/^\s*javascript:/i.test(fixed) || /^\s*data:/i.test(fixed)) {
                // Replace with harmless link to kgmu home
                fixed = 'https://www.kgmu.org';
            }

            // collapse duplicates of domain
            fixed = fixed.replace(/(https?:\/\/(?:www\.)?kgmu\.org)\/+(www\.)?kgmu\.org/gi, '$1');

            return `href="${fixed}"`;
        });

        // 5) Allowlist of tags: a, p, h1-5, strong, em, code, pre, ul, ol, li, hr
        // Strip any other tag but keep their inner content
        html = html.replace(/<\/?(?!a\b|p\b|h[1-5]\b|strong\b|em\b|code\b|pre\b|ul\b|ol\b|li\b|hr\b)[^>]+>/gi, '');

        return html;
    }

    // --- Updated parseMarkdown: normalizes responses, builds links, sanitizes ---
    function parseMarkdown(text) {
        if (typeof text !== 'string') return '';

        // 0) Quick defensive trim
        let t = text.trim();

        // 1) Decode entities that sometimes appear
        t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        // 2) Remove repeated / stray surrounding quotes produced by model
        //    e.g. ...php"" target=... -> remove double quotes in text blocks
        t = t.replace(/""/g, '"').replace(/“|”/g, '"');

        // 3) Replace accidental repeated domain patterns
        t = t.replace(/https?:\/\/(www\.)?kgmu\.org\/www\.kgmu\.org/gi, 'https://www.kgmu.org');

        // 4) Fix obvious broken fragments like: //kgmu.org/path or //kgmu.org/path" target...
        t = t.replace(/\/\/kgmu\.org/gi, 'https://www.kgmu.org');

        // 5) Convert any raw <a ...>...<\/a> into normalized anchors
        t = t.replace(/<a[^>]*href=(["']?)([^"'>\s]+)\1[^>]*>(.*?)<\/a>/gi, (m, q, url, label) => {
            // normalize url
            let u = url.trim();
            if (/^\/\//.test(u)) u = 'https:' + u;
            if (/^\//.test(u)) u = 'https://www.kgmu.org' + u;
            if (!/^https?:\/\//i.test(u)) {
                if (/^kgmu\.org/i.test(u)) u = 'https://' + u;
                else u = 'https://www.kgmu.org/' + u;
            }
            // prevent javascript/data:
            if (/^\s*javascript:/i.test(u) || /^\s*data:/i.test(u)) u = 'https://www.kgmu.org';
            // collapse duplicate domains
            u = u.replace(/https?:\/\/(www\.)?kgmu\.org\/+(www\.)?kgmu\.org/gi, 'https://www.kgmu.org');
            // ensure label is plain text (no tags)
            const lbl = label.replace(/<\/?[^>]+(>|$)/g, '').trim();
            return `<a href="${u}" target="_blank" rel="noopener noreferrer">${escapeHTML(lbl)}</a>`;
        });

        // 6) Convert Markdown links [text](url)
        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
            let u = url.trim();
            if (/^\/\//.test(u)) u = 'https:' + u;
            if (/^\//.test(u)) u = 'https://www.kgmu.org' + u;
            if (!/^https?:\/\//i.test(u)) {
                if (/^kgmu\.org/i.test(u)) u = 'https://' + u;
                else u = 'https://www.kgmu.org/' + u;
            }
            if (/^\s*javascript:/i.test(u) || /^\s*data:/i.test(u)) u = 'https://www.kgmu.org';
            u = u.replace(/https?:\/\/(www\.)?kgmu\.org\/+(www\.)?kgmu\.org/gi, 'https://www.kgmu.org');
            return `<a href="${u}" target="_blank" rel="noopener noreferrer">${escapeHTML(linkText)}</a>`;
        });

        // 7) Auto-link standalone URLs (http/https)
        t = t.replace(/(https?:\/\/[^\s<>"']+)/g, (m) => {
            let u = m.trim();
            u = u.replace(/https?:\/\/(www\.)?kgmu\.org\/+(www\.)?kgmu\.org/gi, 'https://www.kgmu.org');
            return `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`;
        });

        // 8) Convert relative php paths that might appear as plain text
        t = t.replace(/(?<!["'=])\/([a-zA-Z0-9_\-\/]+\.php[^\s<>"']*)/gi, (m, p1) => {
            const u = 'https://www.kgmu.org/' + p1.replace(/^\/+/,'');
            return `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`;
        });

        // 9) Basic markdown -> HTML for styling (headings, bold, italic, code, lists)
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

        // Lists (simple)
        t = t.replace(/^\s*[\-\*]\s+(.*)/gm, '<li>$1</li>');
        t = t.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        t = t.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
        t = t.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');

        // Wrap remaining lines in paragraphs where appropriate
        const lines = t.split('\n');
        let inList = false;
        let inCode = false;
        t = lines.map(line => {
            if (line.includes('<ul>') || line.includes('<ol>')) inList = true;
            if (line.includes('</ul>') || line.includes('</ol>')) inList = false;
            if (line.includes('<pre>')) inCode = true;
            if (line.includes('</pre>')) inCode = false;

            if (line.trim() === '' ||
                line.match(/^<(h[1-6]|ul|ol|li|pre|hr|a|p|code)/) ||
                line.match(/<\/(h[1-6]|ul|ol|li|pre|a|p|code)>$/) ||
                inList || inCode) {
                return line;
            }
            return `<p>${line}</p>`;
        }).join('\n');

        // 10) Sanitize produced HTML (collapse duplicates, fix hrefs, remove disallowed tags)
        const safe = sanitizeHTML(t);

        return safe;
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

    // Timer functions (unchanged)
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

    // Initialize
    resetChat();
});