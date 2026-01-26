# KGMU AI Chatbot - Secure Deployment Guide

## 🔐 Security Overview

This project uses a **backend proxy** to keep your Gemini API key secure. The API key is **never exposed** to the browser.

### Architecture:
```
User Browser (kgmu.org)
    ↓ (calls with PROXY_API_KEY)
Vercel Serverless Function (/api/gemini)
    ↓ (calls with GEMINI_API_KEY)
Google Gemini API
```

---

## 📋 Prerequisites

1. **Vercel Account** (free): https://vercel.com/signup
2. **Gemini API Key**: https://makersuite.google.com/app/apikey
3. **Git/GitHub**: Your code repository

---

## 🚀 Deployment Steps

### Step 1: Install Vercel CLI (Optional but recommended)

```bash
npm install -g vercel
```

### Step 2: Deploy to Vercel

**Option A: Via GitHub (Recommended)**

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Vercel will auto-detect the `api/` folder

**Option B: Via CLI**

```bash
cd /path/to/KGMU_AI_Chatbot
vercel
```

Follow the prompts to deploy.

### Step 3: Set Environment Variables on Vercel

1. Go to your project on Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Name | Value | Notes |
|------|-------|-------|
| `GEMINI_API_KEY` | `AIzaSyCTjCkReRSnqs3wZZBN8jb6w3J7bPo7mfs` | Your actual Gemini API key |
| `PROXY_API_KEY` | Generate a secure random string | Used for frontend auth |

**Generate a secure PROXY_API_KEY:**
```bash
# On Linux/Mac:
openssl rand -base64 32

# Or use online: https://www.random.org/strings/
```

4. Click **Save**
5. Redeploy (Vercel will prompt you)

### Step 4: Update script6.js

After deployment, Vercel will give you a URL like: `https://kgmu-ai-chatbot.vercel.app`

Update these lines in `script6.js`:

```javascript
// Line 103-104
const PROXY_ENDPOINT = 'https://kgmu-ai-chatbot.vercel.app/api/gemini'; // Replace with YOUR Vercel URL
const PROXY_API_KEY = 'paste-your-PROXY_API_KEY-here'; // Same as set in Vercel
```

### Step 5: Deploy Updated script6.js to KGMU Website

Upload the updated `script6.js` to your kgmu.org website.

---

## ✅ Testing

1. Open browser console on kgmu.org
2. Send a message in the chatbot
3. Check for these logs:
   - ✅ "Sending request to proxy"
   - ✅ "Proxy Response: {response: '...'}"
   - ❌ No CORS errors
   - ❌ No 401 Unauthorized errors

---

## 🔒 Security Features

✅ **API Key Hidden**: Gemini API key stored only on Vercel (server-side)
✅ **CORS Protection**: Only allows requests from kgmu.org and www.kgmu.org
✅ **Proxy Authentication**: Requires X-Api-Key header to prevent abuse
✅ **Rate Limiting**: 1 request per second per IP (configurable)
✅ **GitHub Safe**: No secrets committed to repository

---

## 🛠️ Configuration Options

### Adjust Rate Limits (api/gemini.js)

```javascript
// Line 8-9
const windowMs = 1000;     // Time window (1000ms = 1 second)
const maxRequests = 1;     // Max requests per window per IP
```

### Change Allowed Origins (api/gemini.js)

```javascript
// Line 34
const allowedOrigins = ['https://kgmu.org', 'https://www.kgmu.org', 'https://test.kgmu.org'];
```

### Adjust Response Length (script6.js)

```javascript
// Line 340
maxOutputTokens: 1024  // Increase for longer responses (costs more)
```

---

## 📊 Monitoring

### View Logs on Vercel:
1. Go to your project dashboard
2. Click **Deployments** → Select deployment → **Functions**
3. Click on `/api/gemini` to see logs

### Common Errors:

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Wrong PROXY_API_KEY | Check script6.js matches Vercel env var |
| `CORS error` | Wrong origin | Add origin to allowedOrigins array |
| `429 Rate limit` | Too many requests | Increase maxRequests or windowMs |
| `500 Server error` | Gemini API issue | Check Vercel logs for details |

---

## 💰 Cost Estimate (Free Tier)

- **Vercel**: 100GB bandwidth/month (free)
- **Gemini API**: See pricing at https://ai.google.dev/pricing
- **Estimated**: ~$0-5/month for moderate traffic

---

## 🔄 Updating

When you update `api/gemini.js`:

```bash
git add api/gemini.js
git commit -m "Update proxy logic"
git push

# Vercel auto-deploys from GitHub
# Or manually: vercel --prod
```

---

## ⚠️ Important Security Notes

1. **NEVER commit `.env` file** to GitHub (already in .gitignore)
2. **Regenerate keys** if accidentally exposed
3. **Monitor usage** on Vercel and Google Cloud Console
4. **Rotate PROXY_API_KEY** periodically for security

---

## 📞 Support

Created by: Dr. Ayush Yadav
- Twitter: https://x.com/ProxyAyush
- LinkedIn: https://linkedin.com/in/ayush-yadav-kgmu

For Vercel issues: https://vercel.com/docs
For Gemini API issues: https://ai.google.dev/docs
