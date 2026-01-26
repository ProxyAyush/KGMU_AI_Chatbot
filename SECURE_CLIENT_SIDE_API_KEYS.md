# Securing Client-Side API Keys (No Backend Available)

## The Problem

When an API key must exist in client-side JavaScript (browser):
- ✅ Users can view page source and see it
- ✅ Obfuscation (splitting k1/k2/k3) provides ZERO real security
- ❌ GitHub Secrets only work in GitHub Actions (server-side)
- ❌ No way to truly "hide" a client-side API key

## The Solution: Restrict the Key (Not Hide It)

Since you can't hide it, make it useless to attackers:

---

## Step-by-Step: Secure Your Gemini API Key

### 1. Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

### 2. Find Your API Key
Look for: `AIzaSyAzjgiWB_iWZhdCV3Ow-2JBro78BvKA2Dw` (your current key)

### 3. Click "Edit" (pencil icon)

### 4. Set Application Restrictions

**Choose:** HTTP referrers (web sites)

**Add these URLs:**
```
https://kgmu.org/*
https://www.kgmu.org/*
http://localhost:* (for testing only, remove later)
```

**What this does:**
- ✅ Key ONLY works when called from kgmu.org
- ✅ If someone steals it, they can't use it from their website
- ✅ Requests from other domains get rejected instantly

### 5. Set API Restrictions

**Choose:** Restrict key

**Select APIs:**
- ✅ Generative Language API (Gemini)
- ❌ Uncheck everything else

**What this does:**
- ✅ Key can ONLY call Gemini API
- ✅ Can't be used to access other Google services
- ✅ Limits damage if compromised

### 6. Set Quota Limits

Go to: **Quotas & System Limits**

Set reasonable limits:
```
Requests per day: 1000-5000 (adjust based on traffic)
Requests per minute: 60
```

**What this does:**
- ✅ Caps your costs even if abused
- ✅ Prevents runaway API charges

### 7. Enable Billing Alerts

Go to: https://console.cloud.google.com/billing

Create alerts:
```
$5 - Warning email
$20 - Critical email
$50 - Emergency (disable key manually)
```

### 8. Click "Save"

---

## Result: Minimal Risk

**Before restrictions:**
- ❌ Anyone with key can use it anywhere
- ❌ Unlimited costs possible
- ❌ Can access all your Google APIs

**After restrictions:**
- ✅ Key only works on kgmu.org
- ✅ Only calls Gemini API
- ✅ Costs capped at quota limits
- ✅ 90% less risk

---

## Why This is Better Than Hiding

**Hiding (doesn't work):**
```javascript
const k1 = "part1"; // User opens DevTools → sees this
const k2 = "part2"; // Takes 2 seconds to reconstruct
const k3 = "part3"; // KEY STOLEN
```

**Restricting (actually works):**
```javascript
const API_KEY = "AIza..."; // User sees this
// But key is restricted to kgmu.org only
// If they try to use it elsewhere → 403 Forbidden
// If they try to use other APIs → 403 Forbidden
```

---

## GitHub Features That Don't Help

### ❌ GitHub Secrets
- Only accessible in GitHub Actions (CI/CD)
- NOT accessible from JavaScript files
- NOT served via CDN

### ❌ Private Repos
- CDN (jsdelivr) needs public access to serve files
- Making repo private breaks the CDN

### ❌ Environment Variables
- Only work in server-side environments
- Not available in static files

### ❌ .gitignore
- Prevents committing secrets locally
- But key must be in the committed file for CDN to serve it

---

## Alternative: Use a Backend Proxy (Future Option)

If you ever get ability to deploy a backend:

```
Browser → Your Vercel/Cloudflare Serverless Function → Google API
          (API key stored server-side, truly hidden)
```

**Free options:**
- Vercel (free tier: 100GB/month)
- Cloudflare Workers (free tier: 100k requests/day)
- Netlify Functions (free tier: 125k requests/month)

But this requires:
- Deploying backend code
- Changing script6.js to call your proxy instead of Google
- Managing environment variables

---

## Monitoring & Maintenance

### Weekly Check:
1. Google Cloud Console → APIs & Services → Metrics
2. Check request count and patterns
3. Look for suspicious spikes

### Monthly:
1. Rotate API key (create new, update script6.js, delete old)
2. Review billing

### If Key is Compromised:
1. **Immediately disable** key in Google Cloud Console
2. Create new key with restrictions
3. Update script6.js
4. Push to GitHub
5. Purge CDN: `https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js`

---

## Summary

**Question:** Can I use GitHub free features to secure my API key?

**Answer:** No, but you don't need to. Instead of hiding it (impossible for client-side code), **restrict it**:

1. ✅ Domain restrictions (only kgmu.org)
2. ✅ API restrictions (only Gemini)
3. ✅ Quota limits (cap costs)
4. ✅ Billing alerts (monitor usage)

This makes the key "secure enough" for public websites that need client-side API access.

---

## References

- Google Cloud API Key Best Practices: https://cloud.google.com/docs/authentication/api-keys
- Restricting API Keys: https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions
- Gemini API Docs: https://ai.google.dev/docs
