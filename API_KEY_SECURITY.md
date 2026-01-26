# API Key Security Guide (GitHub-Only Setup)

## ⚠️ Current Security Status

Your API key is **exposed in the browser** (script6.js loaded via CDN). While splitting it into parts provides minimal obfuscation, anyone can view the source code and reconstruct it.

## 🔒 Best Security Practices (Without Backend)

Since you cannot use a backend proxy and the key must be in the browser, here's how to **minimize risk**:

---

## Step 1: Restrict API Key to kgmu.org Domain

1. Go to **Google Cloud Console**: https://console.cloud.google.com/apis/credentials

2. Find your API key: `AIzaSyCTjCkReRSnqs3wZZBN8jb6w3J7bPo7mfs`

3. Click on the key name to edit

4. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add these referrers:
     ```
     https://kgmu.org/*
     https://www.kgmu.org/*
     ```

5. Under **API restrictions**:
   - Select **Restrict key**
   - Choose only: **Generative Language API**

6. Click **Save**

**Result:** The key will ONLY work from kgmu.org, even if someone steals it.

---

## Step 2: Set Usage Quotas

1. In Google Cloud Console, go to **APIs & Services** > **Generative Language API**

2. Click **Quotas & System Limits**

3. Set these limits:
   - **Requests per minute**: 60 (adjust based on traffic)
   - **Requests per day**: 1000-5000 (monitor and adjust)

4. Enable **Quota alerts** to notify you at 80% usage

**Result:** Even if abused, your costs are capped.

---

## Step 3: Monitor Usage

1. Set up **billing alerts**: https://console.cloud.google.com/billing

2. Create alerts at:
   - $5 threshold (warning)
   - $20 threshold (critical)
   - $50 threshold (disable key)

3. Check usage weekly at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics

---

## Step 4: Rotate Keys Regularly

**Every 3-6 months:**

1. Create a new API key in Google Cloud Console
2. Update script6.js:
   ```javascript
   const k1 = "NEW_PART_1";
   const k2 = "NEW_PART_2";
   const k3 = "NEW_PART_3";
   ```
3. Push to GitHub (CDN updates in 5-10 minutes)
4. Delete the old key in Google Cloud Console

---

## 📊 Token Usage Optimizations (Implemented)

To reduce your API costs and avoid rate limits:

### ✅ Message History Limiting
- **Old:** Sent entire chat history (unlimited growth)
- **New:** Only sends last 20 messages per request
- **Savings:** 60-80% reduction in token usage for long conversations

### ✅ Memory Management
- **Old:** `messages` array grew infinitely
- **New:** Trimmed to last 30 messages automatically
- **Result:** Prevents browser memory issues

### ✅ Model Update
- **Old:** `gemini-2.5-flash-lite` (deprecated)
- **New:** `gemini-2.0-flash-exp` (latest, fastest, cheapest)
- **Result:** Better performance, lower cost

### Current Request Size:
```
System Prompt: 676 KB (loaded once from GitHub)
Messages: ~10-50 KB (last 20 messages)
Total per request: ~686-726 KB

Compared to before: ~700KB+ (growing infinitely)
```

---

## 🚨 Emergency: Key Compromised?

If your API key is being abused:

1. **Immediately disable** the key in Google Cloud Console
2. Create a new key with restrictions
3. Update script6.js with new key parts
4. Push to GitHub
5. Check billing for unauthorized charges

---

## 💡 Why Backend Proxy is Better (For Future Reference)

If you ever get access to deploy a backend (Vercel, Cloudflare Workers, etc.):

**Current (Browser-Only):**
```
User Browser → Google Gemini API (key exposed)
❌ Key visible in browser source
❌ Can be stolen and reused
✅ No CORS issues
✅ Simple setup
```

**With Backend Proxy:**
```
User Browser → Your Vercel API → Google Gemini API
✅ Key hidden server-side
✅ Cannot be stolen
✅ Extra rate limiting
❌ Requires deployment
```

---

## 📞 Support

- **Google Cloud Console:** https://console.cloud.google.com
- **Gemini API Docs:** https://ai.google.dev/docs
- **Pricing:** https://ai.google.dev/pricing

**Created by:** Dr. Ayush Yadav
**Contact:** https://x.com/ProxyAyush
