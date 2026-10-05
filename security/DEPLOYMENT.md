# Current deployment: Turnstile removed

The owner requested removal of the chatbot Turnstile challenge and explicitly confirmed deployment. The matching Worker was deployed manually as active version `f20a8613` on 6 October 2026 IST. The frontend now sends only `message` and `history`; it does not load Turnstile. The Worker does not require a Turnstile token or secret. Existing unused Turnstile variables can remain. Rate limiter bindings, exact origin checks, input caps, server-owned prompts, safe rendering and Firebase Enterprise App Check initialization remain. Keep App Check enforcement off pending live storage verification. The earlier HTTP 503 requires response/log diagnosis if it remains.

The historical setup notes below describe the earlier Turnstile version and are retained as deployment history; do not re-enable Turnstile when deploying the current files.

---

# Deployment status and gate

This branch prepares a coordinated security update for KGMU. It is not ready to merge until the existing Cloudflare Worker and Firebase configuration are prepared.

## Protected code

The CSS/site fixes, consent interface, premade responses, mobile/fullscreen behavior and cooldown functions in script6.js are preserved. The latest-updates parser, generated prompt, latest_updates.json and existing workflows are unchanged. The Worker reads the existing prompt directly.

## Required before merge

- Cloudflare: back up existing Worker version/settings; configure TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY for kgmu.org/www.kgmu.org; retain GEMINI_API_KEY and FIREBASE_API_KEY; add CHAT_RATE_LIMITER and GLOBAL_RATE_LIMITER bindings from wrangler.jsonc; reconcile any pre-existing routes/settings.
- Firebase: back up current rules; register the web app for reCAPTCHA Enterprise App Check; set the public FIREBASE_APP_CHECK_SITE_KEY on the Worker. The Turnstile and App Check site keys are different.
- Pass the security-checks workflow. The browser tests check malicious answer rendering and protected source regions. Firestore tests use demo-kgmu-hardening only and never the live database. Live enforcement still requires separate checking.
- Confirm model access with check-models.py and the existing Gemini key. Never commit keys.
- In a coordinated maintenance window deploy the Worker and merge the frontend; let the existing CDN purge run. Cached old clients will fail securely until reload.
- The tested QA-CHATBOT rules were published on 2026-10-05. Keep overlapping broad allow rules removed. Integrate only this collection's block if other apps share the Firebase project. Confirm successful new-client writes, then enable Firestore App Check enforcement.
- Verify desktop/mobile chat, consent, premade answers, AI answer, safe notice link, cooldown, storage and latest-updates freshness on kgmu.org.

## Limits

App Check does not prove Q&A authenticity or user identity. The original daily-document storage format retains document-size/contention limits. Rate-limit bindings are approximate and local to Cloudflare locations; set upstream quotas/alerts separately. Existing privacy wording, retention and deletion procedures need institution-approved corrections. The mutable @main site loader still requires repository controls. Do not call this fully deployed or fully audited while these checks remain open.

The public wrangler.jsonc contains placeholders only. The production keys stay in their existing secret stores. Do not deploy placeholders.
