# KGMU_AI_Chatbot
A chatbot for King George's Medical University, Lucknow (My Alma Mater)

Demo link

https://proxyayush.github.io/KGMU_AI_Chatbot/



CDN CACHE TROUBLESHOOTING PROMPT



The CDN (jsDelivr) is serving an old version of script6.js from my GitHub repo.

Setup:
- Repo: ProxyAyush/KGMU_AI_Chatbot
- File: script6.js  
- CDN URL: https://cdn.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js
- Purge URL: https://purge.jsdelivr.net/gh/ProxyAyush/KGMU_AI_Chatbot@main/script6.js

Follow CDN_CACHE_TROUBLESHOOTING.md in my repo to:
1. Verify issue (compare GitHub vs CDN content)
2. Check cache headers (age, x-cache, etag)
3. Purge multiple times (hits different edge servers)
4. Verify purge worked

Don't guess - run actual curl commands to verify.