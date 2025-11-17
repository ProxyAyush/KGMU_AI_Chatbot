// app/api/gemini/[key]/route.js
// 1:1 Request Ratio Version (No Preflight!)
// Updated: November 17, 2025

const rateLimitMap = new Map(); // IP → { count, lastReset }

function rateLimit(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const windowMs = 1000;    // 1 second window
  const maxRequests = 1;    // 1 req/sec per IP (adjust as needed)

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
    return { allowed: false, retryAfter: 1 };
  }

  data.count++;
  return { allowed: true };
}

export async function POST(req, { params }) {
  const { key } = params;

  // === SECURITY: Change this secret key! Match it in your script.js ===
  const VALID_KEY = 'kgmu-prod-2025-secure-key-9f8e3d2a1c5b7e';

  if (key !== VALID_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Rate limit
  const rl = rateLimit(req);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded - try again soon' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': rl.retryAfter
      }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { systemPrompt, messages, generationConfig } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Invalid or missing messages' }), { status: 400 });
  }

  if (messages[messages.length - 1].role !== 'user') {
    return new Response(JSON.stringify({ error: 'Last message must be from user' }), { status: 400 });
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

    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error('Gemini API error:', err);
      throw new Error(err.error?.message || 'Gemini failed');
    }

    const data = await geminiRes.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const safeText = text
      .replace(/I am a large language model[^.]*\./gi, '')
      .replace(/trained by Google/gi, 'created by KGMU developers')
      .replace(/Google/g, 'KGMU')
      .trim();

    return new Response(JSON.stringify({ response: safeText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Proxy error:', error.message);
    return new Response(JSON.stringify({ error: 'Server error - please try again' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Optional: Block GET requests cleanly
export function GET() {
  return new Response('KGMU AI Proxy Active', { status: 200 });
}