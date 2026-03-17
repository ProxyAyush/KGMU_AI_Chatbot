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
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;
        }

        /* 3. Fix Send Button visibility */
        #send-btn {
            background-color: #0056b3 !important;
            color: white !important;
            transition: all 0.2s ease !important;
        }

        #send-btn:hover {
            background-color: #004080 !important;
            transform: scale(1.05);
        }

        #send-btn:disabled {
            background-color: #cccccc !important;
            color: #666666 !important;
            transform: none !important;
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

        /* --- Consent Banner (blocking checkbox) --- */
        .consent-banner {
            background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%);
            border-top: 2px solid #ffc107;
            padding: 8px 14px;
            font-size: 12px;
            color: #555;
            text-align: center;
            line-height: 1.5;
            flex-shrink: 0;
            transition: all 0.3s ease;
        }
        .consent-banner.consented {
            background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
            border-top-color: #4caf50;
            padding: 5px 14px;
        }
        .consent-banner.flash-required {
            background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%) !important;
            border-top-color: #f44336 !important;
            animation: consentShake 0.5s ease;
        }
        @keyframes consentShake {
            0%, 100% { transform: translateX(0); }
            10% { transform: translateX(-6px); }
            20% { transform: translateX(6px); }
            30% { transform: translateX(-5px); }
            40% { transform: translateX(5px); }
            50% { transform: translateX(-3px); }
            60% { transform: translateX(3px); }
            70% { transform: translateX(-2px); }
            80% { transform: translateX(2px); }
            90% { transform: translateX(-1px); }
        }
        .consent-checkbox-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-size: 12px;
            color: #333;
            user-select: none;
        }
        .consent-checkbox-label input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #0056b3;
            cursor: pointer;
            flex-shrink: 0;
        }
        .consent-banner a {
            color: #0056b3;
            text-decoration: underline;
            font-weight: 600;
            cursor: pointer;
        }
        .consent-banner a:hover {
            color: #003d82;
        }
        .consent-banner .consent-hindi {
            display: block;
            font-size: 10px;
            color: #777;
            margin-top: 3px;
        }
        .consent-banner.consented .consent-hindi {
            display: none;
        }

        /* --- Privacy/Terms Modal --- */
        .privacy-modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .privacy-modal-overlay.active {
            display: flex;
        }
        .privacy-modal {
            background: white;
            border-radius: 14px;
            max-width: 520px;
            width: 100%;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
            animation: privacySlideIn 0.3s ease;
        }
        @keyframes privacySlideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .privacy-modal-header {
            padding: 18px 20px;
            border-bottom: 2px solid #0056b3;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        .privacy-modal-header h3 {
            font-size: 16px;
            color: #003d82;
            margin: 0;
        }
        .privacy-modal-header h3 small {
            display: block;
            font-size: 12px;
            color: #666;
            font-weight: normal;
            margin-top: 2px;
        }
        .privacy-modal-close {
            background: none;
            border: none;
            font-size: 22px;
            cursor: pointer;
            color: #999;
            padding: 0 4px;
            line-height: 1;
        }
        .privacy-modal-close:hover {
            color: #333;
        }
        .privacy-modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            font-size: 13px;
            line-height: 1.7;
            color: #444;
        }
        .privacy-modal-body h4 {
            color: #003d82;
            font-size: 14px;
            margin: 18px 0 8px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid #e8f0fe;
        }
        .privacy-modal-body h4:first-child {
            margin-top: 0;
        }
        .privacy-modal-body p {
            margin-bottom: 8px;
        }
        .privacy-modal-body .hindi {
            color: #777;
            font-size: 12px;
            font-style: italic;
            margin-bottom: 12px;
        }
        .privacy-modal-body ul {
            padding-left: 18px;
            margin-bottom: 10px;
        }
        .privacy-modal-body li {
            margin-bottom: 4px;
        }
        .privacy-modal-body strong {
            color: #333;
        }
        .privacy-modal-footer {
            padding: 14px 20px;
            border-top: 1px solid #eee;
            text-align: center;
            flex-shrink: 0;
        }
        .privacy-modal-footer button {
            background: #0056b3;
            color: white;
            border: none;
            padding: 10px 32px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .privacy-modal-footer button:hover {
            background: #003d82;
        }

        /* --- Dynamic Typing Indicator --- */
        .typing-indicator {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0;
            background: none !important;
            border-radius: 0 !important;
            max-width: 85% !important;
            margin-bottom: 15px;
        }
        .typing-dots {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            background-color: #f0f7ff;
            border-radius: 18px;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .typing-dots span {
            height: 8px;
            width: 8px;
            margin: 0 2px;
            background-color: #999;
            border-radius: 50%;
            display: inline-block;
            animation: typingBounce 1.4s infinite ease-in-out both;
        }
        .typing-dots span:nth-child(1) { animation-delay: 0s; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
            0%, 80%, 100% { transform: scale(1); opacity: 0.6; }
            40% { transform: scale(1.3); opacity: 1; }
        }
        .typing-status-text {
            font-size: 11px;
            color: #888;
            margin-top: 6px;
            padding-left: 4px;
            transition: opacity 0.3s ease;
            animation: typingFadeIn 0.4s ease;
        }
        @keyframes typingFadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* --- UI Enhancements --- */
        .chat-header {
            background: linear-gradient(135deg, #0056b3 0%, #003d82 100%) !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .chat-body {
            background-color: #fafbfd !important;
        }
        .bot .message-content {
            background-color: #f0f7ff !important;
            border-left: 3px solid #0056b3;
        }
        .user .message-content {
            background: linear-gradient(135deg, #0056b3 0%, #0069d9 100%) !important;
        }
        .chat-footer {
            box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05) !important;
        }
        #user-input:focus {
            border-color: #0056b3 !important;
            box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.1);
        }

        /* --- Privacy link in footer --- */
        .chat-privacy-footer {
            text-align: center;
            padding: 3px 0;
            background: #f5f7fa;
            border-top: 1px solid #eee;
            flex-shrink: 0;
        }
        .chat-privacy-footer a {
            font-size: 10px;
            color: #999;
            text-decoration: none;
        }
        .chat-privacy-footer a:hover {
            color: #0056b3;
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .privacy-modal {
                max-height: 95vh;
                border-radius: 10px;
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

    // --- Create Consent Banner (blocking — must tick checkbox to chat) ---
    function createConsentBanner() {
        const banner = document.createElement('div');
        banner.className = 'consent-banner';
        banner.id = 'consent-banner';
        banner.innerHTML = `
            <label class="consent-checkbox-label" id="consent-checkbox-label">
                <input type="checkbox" id="consent-checkbox">
                <span>I agree to the <a id="terms-link">Terms & Privacy Policy</a></span>
            </label>
            <span class="consent-hindi">मैं <a id="terms-link-hi">शर्तों और गोपनीयता नीति</a> से सहमत हूँ</span>
        `;
        return banner;
    }

    // Consent state management
    function hasUserConsented() {
        return localStorage.getItem('kgmuConsent') === 'true';
    }

    function recordConsent() {
        localStorage.setItem('kgmuConsent', 'true');
        localStorage.setItem('kgmuConsentTime', new Date().toISOString());
    }

    // --- Create Privacy/Terms Modal ---
    function createPrivacyModal() {
        const overlay = document.createElement('div');
        overlay.className = 'privacy-modal-overlay';
        overlay.id = 'privacy-modal-overlay';
        overlay.innerHTML = `
            <div class="privacy-modal">
                <div class="privacy-modal-header">
                    <h3>Terms of Use & Privacy Policy<small>उपयोग की शर्तें और गोपनीयता नीति</small></h3>
                    <button class="privacy-modal-close" id="privacy-modal-close">&times;</button>
                </div>
                <div class="privacy-modal-body">
                    <h4>1. AI Disclaimer / AI अस्वीकरण</h4>
                    <p>This chatbot provides <strong>AI-generated responses</strong> based on publicly available information from the KGMU website (<a href="https://www.kgmu.org" target="_blank">www.kgmu.org</a>). Responses may contain errors or outdated information. This is <strong>NOT</strong> official communication from King George's Medical University.</p>
                    <p class="hindi">यह चैटबॉट KGMU वेबसाइट (www.kgmu.org) पर सार्वजनिक रूप से उपलब्ध जानकारी के आधार पर AI-जनित उत्तर प्रदान करता है। उत्तरों में त्रुटियाँ या पुरानी जानकारी हो सकती है। यह किंग जॉर्ज मेडिकल यूनिवर्सिटी का आधिकारिक संचार नहीं है।</p>

                    <h4>2. No Medical Advice / कोई चिकित्सा सलाह नहीं</h4>
                    <p>This chatbot does <strong>NOT</strong> provide medical advice, diagnosis, or treatment recommendations. For any medical concerns, please consult a qualified healthcare professional. <strong>Do NOT share personal health information, symptoms, or medical records</strong> in this chat.</p>
                    <p class="hindi">यह चैटबॉट चिकित्सा सलाह, निदान या उपचार की सिफारिशें प्रदान नहीं करता। किसी भी चिकित्सा चिंता के लिए, कृपया योग्य स्वास्थ्य पेशेवर से परामर्श करें। इस चैट में व्यक्तिगत स्वास्थ्य जानकारी, लक्षण या मेडिकल रिकॉर्ड साझा न करें।</p>

                    <h4>3. Data Collection Notice / डेटा संग्रहण सूचना</h4>
                    <p><em>In compliance with the Digital Personal Data Protection Act, 2023</em></p>
                    <ul>
                        <li><strong>What we collect:</strong> Your questions and the chatbot's responses are stored with timestamps for quality improvement.</li>
                        <li><strong>What we do NOT collect:</strong> Your name, email, IP address, phone number, location, or any identifying information. No login is required.</li>
                        <li><strong>Storage:</strong> Data is stored on secure Google Firebase servers.</li>
                        <li><strong>Purpose:</strong> Improving chatbot accuracy and understanding user needs.</li>
                        <li><strong>Research Use:</strong> Anonymized conversation data (questions and AI responses only — no personal identifiers) may be published as an open research dataset for academic and public interest purposes.</li>
                    </ul>
                    <p><strong>Important:</strong> Do NOT enter any personal information (name, phone number, Aadhaar, medical details) in your messages. Any personal data voluntarily shared is your responsibility.</p>
                    <p class="hindi">हम क्या एकत्र करते हैं: आपके प्रश्न और चैटबॉट के उत्तर समय-मुद्रांक के साथ गुणवत्ता सुधार के लिए संग्रहीत किए जाते हैं। हम क्या एकत्र नहीं करते: आपका नाम, ईमेल, IP पता, फोन नंबर, स्थान या कोई पहचान संबंधी जानकारी। कोई लॉगिन आवश्यक नहीं है। अनुसंधान उपयोग: गुमनाम वार्तालाप डेटा शैक्षणिक और सार्वजनिक हित के लिए एक खुले अनुसंधान डेटासेट के रूप में प्रकाशित किया जा सकता है। कृपया अपने संदेशों में कोई व्यक्तिगत जानकारी (नाम, फोन नंबर, आधार, चिकित्सा विवरण) दर्ज न करें।</p>

                    <h4>4. Source of Information / जानकारी का स्रोत</h4>
                    <p>All information provided by this chatbot is sourced exclusively from the <strong>publicly available KGMU website</strong> (www.kgmu.org). No private, confidential, or proprietary data is used.</p>
                    <p class="hindi">इस चैटबॉट द्वारा प्रदान की गई सभी जानकारी विशेष रूप से सार्वजनिक रूप से उपलब्ध KGMU वेबसाइट (www.kgmu.org) से ली गई है। कोई निजी, गोपनीय या स्वामित्व वाला डेटा उपयोग नहीं किया गया है।</p>

                    <h4>5. Limitation of Liability / दायित्व की सीमा</h4>
                    <p>The developers of this chatbot shall not be held liable for any decisions made based on information provided by this chatbot. Always verify important information from official KGMU sources (<a href="https://www.kgmu.org" target="_blank">www.kgmu.org</a>).</p>
                    <p class="hindi">इस चैटबॉट के विकासकर्ता इस चैटबॉट द्वारा दी गई जानकारी के आधार पर किए गए किसी भी निर्णय के लिए उत्तरदायी नहीं होंगे। महत्वपूर्ण जानकारी हमेशा आधिकारिक KGMU स्रोतों से सत्यापित करें।</p>

                    <h4>6. Contact / संपर्क</h4>
                    <p>For any data-related concerns or requests under the <strong>Digital Personal Data Protection Act, 2023</strong>, contact: <a href="mailto:akaakayeye@gmail.com">akaakayeye@gmail.com</a></p>
                    <p class="hindi">डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के तहत किसी भी डेटा संबंधी चिंता के लिए संपर्क करें: akaakayeye@gmail.com</p>
                </div>
                <div class="privacy-modal-footer">
                    <button id="privacy-modal-accept">I Understand / मैं समझता/समझती हूँ</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // --- Create Privacy Footer Link ---
    function createPrivacyFooterLink() {
        const footer = document.createElement('div');
        footer.className = 'chat-privacy-footer';
        footer.innerHTML = '<a id="footer-terms-link">Terms & Privacy Policy / शर्तें और गोपनीयता</a>';
        return footer;
    }

    // Create and insert the consent banner (just above chat-footer/input area), privacy footer, and modal
    const consentBanner = createConsentBanner();
    const chatFooter = document.querySelector('.chat-footer');
    chatContainer.insertBefore(consentBanner, chatFooter);
    const privacyFooter = createPrivacyFooterLink();
    chatContainer.appendChild(privacyFooter);
    const privacyModalOverlay = createPrivacyModal();

    const consentCheckbox = document.getElementById('consent-checkbox');
    const consentLabel = document.getElementById('consent-checkbox-label');

    // Privacy modal event listeners
    function openPrivacyModal() { privacyModalOverlay.classList.add('active'); }
    function closePrivacyModal() { privacyModalOverlay.classList.remove('active'); }
    document.getElementById('terms-link').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openPrivacyModal(); });
    document.getElementById('terms-link-hi').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openPrivacyModal(); });
    document.getElementById('footer-terms-link').addEventListener('click', openPrivacyModal);
    document.getElementById('privacy-modal-close').addEventListener('click', closePrivacyModal);
    document.getElementById('privacy-modal-accept').addEventListener('click', closePrivacyModal);
    privacyModalOverlay.addEventListener('click', (e) => { if (e.target === privacyModalOverlay) closePrivacyModal(); });

    // Consent checkbox handler — blocks chat until ticked
    function updateConsentState() {
        if (consentCheckbox.checked) {
            recordConsent();
            consentBanner.classList.add('consented');
            userInput.disabled = false;
            userInput.placeholder = 'Type your message here...';
            updateSendButtonState();
        } else {
            localStorage.removeItem('kgmuConsent');
            consentBanner.classList.remove('consented');
            userInput.disabled = true;
            userInput.placeholder = 'Please accept the Terms & Privacy Policy to chat';
            sendButton.disabled = true;
        }
    }

    consentCheckbox.addEventListener('change', updateConsentState);

    // Restore consent state from localStorage
    if (hasUserConsented()) {
        consentCheckbox.checked = true;
        consentBanner.classList.add('consented');
    } else {
        userInput.disabled = true;
        userInput.placeholder = 'Please accept the Terms & Privacy Policy to chat';
        sendButton.disabled = true;
    }

    // Flash the consent checkbox red + vibrate if user tries to send without consent
    function flashConsentRequired() {
        consentBanner.classList.remove('flash-required');
        void consentBanner.offsetWidth; // force reflow to restart animation
        consentBanner.classList.add('flash-required');
        consentBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Device vibration for mobile
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => consentBanner.classList.remove('flash-required'), 1500);
    }

    // Also shake when user taps on the disabled input area
    userInput.addEventListener('focus', () => {
        if (!hasUserConsented()) {
            flashConsentRequired();
            userInput.blur();
        }
    });

    // --- Dynamic Typing Messages ---
    const typingMessages = [
        "Just a moment...",
        "Looking that up for you...",
        "Searching KGMU info...",
        "Almost there...",
        "Fetching the best answer...",
        "Hold on, finding details...",
        "Working on it...",
        "One moment please..."
    ];
    let typingMessageInterval = null;

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


// API key is now securely stored on Cloudflare Workers proxy
const PROXY_URL = "https://kgmu-gemini-proxy.akaakayeye.workers.dev";


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
        // DPDP Act compliance: only store data after user has consented
        if (!hasUserConsented()) return;
        try {
            const today = new Date();
            const dateString = today.toISOString().split('T')[0];
            const randomField = generateRandomFieldName();
            const qaData = {
                question: question,
                answer: answer,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                consent: true,
                consentTimestamp: localStorage.getItem('kgmuConsentTime') || new Date().toISOString()
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
        // Check if timer should still be running (non-bypassable via localStorage)
        const lastMsgTime = parseInt(localStorage.getItem('kgmuLastMsgTime') || '0');
        const elapsed = Date.now() - lastMsgTime;
        if (lastMsgTime > 0 && elapsed < 20000) {
            // Resume timer with remaining time
            startTimerWithDuration(Math.ceil((20000 - elapsed) / 1000));
        } else if (!timerStarted) {
            // First open ever — start 20s timer
            startTimer();
            timerStarted = true;
        }
        userInput.focus();
    });

    closeButton.addEventListener('click', () => {
        chatContainer.classList.remove('active');
        chatButton.style.display = 'flex';
        // Do NOT stop timer — it persists via localStorage
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
        addBotMessage("Hello! I'm KGMU Assistant — an AI tool for university-related queries. My responses are generated from publicly available KGMU website data and are not official or medical advice.\n\nनमस्ते! मैं KGMU सहायक हूँ — विश्वविद्यालय संबंधी प्रश्नों के लिए एक AI उपकरण। मेरे उत्तर KGMU वेबसाइट से AI-जनित हैं और आधिकारिक या चिकित्सा सलाह नहीं हैं।\n\nHow can I help you? | मैं कैसे मदद कर सकता हूँ?");
        userInput.focus();
        // Don't stop timer if it's running — non-bypassable via New Chat
        if (!isTimerRunning) {
            // If timer not running, check localStorage for recent message
            const lastMsgTime = parseInt(localStorage.getItem('kgmuLastMsgTime') || '0');
            const elapsed = Date.now() - lastMsgTime;
            if (lastMsgTime > 0 && elapsed < 20000) {
                startTimerWithDuration(Math.ceil((20000 - elapsed) / 1000));
            }
        }
        awaitingResponse = false;
        updateSendButtonState();
    }

    function updateSendButtonState() {
        sendButton.disabled = !hasUserConsented() || awaitingResponse || isTimerRunning || userInput.value.trim() === '';
    }

    // --- MAIN MESSAGE HANDLING ---
    async function sendMessage() {
        // Block if consent not given
        if (!hasUserConsented()) {
            flashConsentRequired();
            return;
        }
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

            console.log("Sending request to proxy:", JSON.stringify(requestBody, null, 2));

            const response = await fetch(PROXY_URL, {
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
        typingDiv.innerHTML = `
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <div class="typing-status-text" id="typing-status-text">Just a moment...</div>
        `;
        chatBody.appendChild(typingDiv);
        scrollToBottom();

        // Rotate through dynamic messages
        let msgIndex = 0;
        const statusEl = typingDiv.querySelector('#typing-status-text');
        typingMessageInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % typingMessages.length;
            if (statusEl) {
                statusEl.style.opacity = '0';
                setTimeout(() => {
                    statusEl.textContent = typingMessages[msgIndex];
                    statusEl.style.opacity = '1';
                }, 200);
            }
            scrollToBottom();
        }, 2500);
    }

    function removeTypingIndicator() {
        if (typingMessageInterval) {
            clearInterval(typingMessageInterval);
            typingMessageInterval = null;
        }
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

    // Timer functions — non-bypassable, persisted via localStorage
    function startTimer() {
        startTimerWithDuration(20);
    }

    function startTimerWithDuration(seconds) {
        stopTimer();
        let timeLeft = seconds;
        localStorage.setItem('kgmuLastMsgTime', String(Date.now() - (20 - timeLeft) * 1000));
        timerDisplay.textContent = `Next reply in: ${timeLeft}s`;
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
        localStorage.setItem('kgmuLastMsgTime', String(Date.now()));
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

    // On load, check if timer should still be running from a previous session
    const savedLastMsgTime = parseInt(localStorage.getItem('kgmuLastMsgTime') || '0');
    if (savedLastMsgTime > 0) {
        const elapsedOnLoad = Date.now() - savedLastMsgTime;
        if (elapsedOnLoad < 20000) {
            startTimerWithDuration(Math.ceil((20000 - elapsedOnLoad) / 1000));
            timerStarted = true;
        }
    }
});