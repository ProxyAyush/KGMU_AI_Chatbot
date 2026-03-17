export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var origin = request.headers.get("Origin") || "";
    var allowedOrigin = /^https?:\/\/(www\.)?([a-z0-9-]+\.)?kgmu\.org$/i.test(origin);

    if (request.method === "OPTIONS") {
      if (!allowedOrigin) {
        return new Response("Forbidden", {status: 403});
      }
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // Firebase config endpoint
    if (url.pathname === "/firebase-config") {
      if (!allowedOrigin) {
        return new Response("Forbidden", {status: 403});
      }
      return new Response(JSON.stringify({
        apiKey: env.FIREBASE_API_KEY,
        authDomain: "kgmu-ai-chatbot.firebaseapp.com",
        projectId: "kgmu-ai-chatbot",
        storageBucket: "kgmu-ai-chatbot.appspot.com",
        messagingSenderId: "1052783262438",
        appId: "1:1052783262438:web:1ebc1720b1dc6346921927",
        measurementId: "G-PK9K94MB8X"
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Gemini proxy endpoint
    if (request.method !== "POST") {
      return new Response("Method not allowed", {status: 405});
    }

    if (!allowedOrigin) {
      return new Response("Forbidden", {status: 403});
    }

    var body = await request.json();
    var models = ["gemini-3.1-flash-lite-preview", "gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
    var lastErr = "";

    for (var i = 0; i < models.length; i++) {
      var model = models[i];
      var apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + env.GEMINI_API_KEY;

      try {
        var resp = await fetch(apiUrl, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(body)
        });

        if (resp.status === 429 || resp.status === 503) {
          lastErr = model;
          continue;
        }

        var data = await resp.json();
        if (data.error && data.error.code === 429) {
          lastErr = model;
          continue;
        }

        return new Response(JSON.stringify(data), {
          status: resp.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      } catch (e) {
        lastErr = model;
        continue;
      }
    }

    return new Response(JSON.stringify({error: "All models failed"}), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin
      }
    });
  }
};
