// api/gemini.js - Production Ready Vercel Proxy (1:1 Request Ratio)
// Key is now in URL → /api/gemini/your-secret-key
// No X-Api-Key header → No OPTIONS preflight → Exactly 1 invocation per message
// Updated: November 17, 2025

const rateLimitMap = new Map(); // IP → { count, lastReset }

function rateLimit(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 1000;     // 1 second window
  const maxRequests = 1;     // 1 request per second per IP

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  const data = rateLimitMap.get(ip);
  if (now - data.lastReset > windowMs) {
    data.count = 1;
    data.lastReset = now;
    return true;
  }

  if (data.count >= maxRequests) {
    return false;
  }

  data.count++;
  return true;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://kgmu.org');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight instantly (still needed for some browsers, but now super cheap)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // === KEY IS NOW IN THE URL PATH ===
  // Example: https://kgmu-ai-chatbot.vercel.app/api/gemini/kgmu-prod-2025-secure-key-9f8e3d2a1c5b7e
  const url = req.url || '';
  const pathSegments = url.split('/');
  const providedKey = pathSegments[pathSegments.length - 1];

  const VALID_KEY = 'kgmu-prod-2025-secure-key-9f8e3d2a1c5b7e'; // ← Change if you want

  if (providedKey !== VALID_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limiting
  if (!rateLimit(req)) {
    return res.status(429).json({ error: 'Rate limit exceeded - try again soon' });
  }

  const { systemPrompt, messages, generationConfig } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing messages' });
  }

  if (messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Message history must end with user input' });
  }

  try {
    const requestBody = {
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt || 'You are an AI assistant for KGMU.' }]
      },
      contents: messages,
      generationConfig: generationConfig || {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API failed: ${geminiResponse.status} - ${errorData.error?.message || 'Unknown'}`);
    }

    const data = await geminiResponse.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Sanitize output
    const safeText = text
      .replace(/I am a large language model[^.]*\./gi, '')
      .replace(/trained by Google/gi, 'created by KGMU developers')
      .replace(/Google/g, 'KGMU')
      .trim();

    return res.status(200).json({ response: safeText });

  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: 'Server error - please try again or contact admin' });
  }
}