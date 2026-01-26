# CDN Cache Troubleshooting Guide (jsDelivr)

## Problem: CDN serving old version of script6.js even after GitHub updates

---

## Step 1: Verify the Issue

**Check if GitHub has the latest code:**
```bash
curl -s "https://raw.githubusercontent.com/ProxyAyush/KGMU_AI_Chatbot/main/script6.js" | grep -A 3 "Split the key"
```

**Check what CDN is serving:**
```bash
curl -s "https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js" | grep -A 3 "Split the key"
```

**If they differ → CDN is cached**

---

## Step 2: Check CDN Cache Status

```bash
curl -I https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js
```

**Look for these headers:**
- `age: 0` → Fresh content ✅
- `age: 3600` → Cached for 1 hour ⏳
- `x-cache: HIT` → Serving from cache ❌
- `x-cache: MISS` → Fetched from origin ✅
- `etag: W/"XXXX"` → Version identifier (compare before/after purge)

---

## Step 3: Purge CDN Cache

**Single purge:**
```bash
curl "https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js"
```

**Expected response:**
```json
{
  "id": "...",
  "status": "finished",
  "paths": {
    "/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js": {
      "throttled": false,
      "providers": {
        "CF": true,
        "FY": true
      }
    }
  }
}
```

---

## Step 4: If Single Purge Doesn't Work

CDN has multiple edge servers. Purge multiple times to hit different nodes:

```bash
for i in 1 2 3; do
  curl -s "https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js"
  sleep 2
done
```

---

## Step 5: Verify Purge Success

**Check cache headers again:**
```bash
curl -I https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js 2>&1 | grep -E "(age|x-cache|etag)"
```

**Check actual content:**
```bash
curl -s "https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js" | grep -A 3 "Split the key"
```

**Should now match GitHub version** ✅

---

## Step 6: Force No-Cache Request (Testing Only)

```bash
curl -s "https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js" -H "Cache-Control: no-cache" | grep -A 3 "Split the key"
```

If this shows the new version but regular requests don't → some edge caches still have old content

---

## Alternative: Use Commit-Specific URL (Bypass Cache Entirely)

**Get latest commit SHA:**
```bash
git ls-remote origin main | head -1
```

**Use commit SHA in URL (never caches incorrectly):**
```
https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@<COMMIT_SHA>/script6.js
```

Example:
```
https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@42cd118/script6.js
```

---

## Understanding Cache TTL

jsDelivr cache headers:
```
cache-control: public, max-age=604800, s-maxage=43200
```

- `max-age=604800` → Browser cache: 7 days
- `s-maxage=43200` → Shared/CDN cache: 12 hours

**Worst case:** Wait 12 hours for automatic cache expiration

---

## Common Mistakes

❌ **Purging wrong URL:**
- Wrong: `https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot/script6.js` (missing @main)
- Right: `https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js`

❌ **Checking too soon:**
- Wait 2-3 seconds after purge before checking

❌ **Browser cache:**
- Clear browser cache or use incognito mode when testing
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## Quick Copy-Paste Troubleshooting Script

```bash
#!/bin/bash

echo "=== Checking GitHub source ==="
curl -s "https://raw.githubusercontent.com/ProxyAyush/KGMU_AI_Chatbot/main/script6.js" | grep -A 3 "Split the key"

echo -e "\n=== Checking CDN current version ==="
curl -s "https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js" | grep -A 3 "Split the key"

echo -e "\n=== Purging CDN cache (3x) ==="
for i in 1 2 3; do
  curl -s "https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js" | jq -r '.status // .error.message'
  sleep 2
done

echo -e "\n=== Checking CDN after purge ==="
sleep 3
curl -I "https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js" 2>&1 | grep -E "(age|x-cache|etag)"

echo -e "\n=== Verifying content ==="
curl -s "https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js" | grep -A 3 "Split the key"
```

---

## When to Escalate

If after multiple purges (5+ attempts over 10 minutes) the CDN still serves old content:

1. Check if you pushed to the correct branch (main)
2. Try purging the entire directory: `https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/`
3. Wait 12 hours for automatic cache expiration
4. Contact jsDelivr support: https://github.com/jsdelivr/jsdelivr/issues

---

## Summary for AI Assistant

**Prompt for new session:**
```
The CDN (jsDelivr) is serving an old version of script6.js from my GitHub repo.

Setup:
- Repo: ProxyAyush/KGMU_AI_Chatbot
- File: script6.js
- CDN URL: https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js
- Purge URL: https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js

Follow CDN_CACHE_TROUBLESHOOTING.md to:
1. Verify the issue (compare GitHub vs CDN)
2. Check cache headers (age, x-cache, etag)
3. Purge multiple times (hits different edge servers)
4. Verify purge success

Don't guess - run actual curl commands to check.
```
