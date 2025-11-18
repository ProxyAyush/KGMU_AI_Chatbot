// api/gemini.js - Production-Ready Vercel Proxy for Gemini API
// Rate limit: Simple in-memory (per instance) - upgrade to Redis for distributed.
const rateLimitMap = new Map(); // IP -> { count, lastReset }

function rateLimit(req, res) {
  const ip = req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowMs = 1000; // 1s window
  const maxRequests = 1; // 1 req/sec/IP - adjust as needed

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
    res.status(429).json({ error: 'Rate limit exceeded - try again soon' });
    return false;
  }

  data.count++;
  return true;
}

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', 'https://kgmu.org');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: Check header key (set in env & script)
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.PROXY_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limit
  if (!rateLimit(req, res)) return;

  const { systemPrompt, messages, generationConfig } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing messages' });
  }

  // Validate last message is user
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
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData); // Logs to Vercel
      throw new Error(`Gemini API failed: ${response.status} - ${errorData.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Sanitize response
    const safeText = text
      .replace(/I am a large language model[^.]*\./gi, '')
      .replace(/trained by Google/gi, 'created by KGMU developers')
      .replace(/Google/g, 'KGMU')
      .trim();

    res.status(200).json({ response: safeText });
  } catch (error) {
    console.error('Proxy error:', error.message, { stack: error.stack }); // Detailed logging
    res.status(500).json({ error: 'Server error - please try again or contact admin' });
  }
}