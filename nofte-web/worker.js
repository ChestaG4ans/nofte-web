/**
 * NOFTe API - Cloudflare Worker
 * Features: AI Chat (Groq) + Auth + Inventory Demo
 */

// Simple in-memory storage (for demo - use KV/D1 in production)
const users = new Map();
const tokens = new Map();

// Generate simple token
function generateToken(email) {
    const token = btoa(`${email}:${Date.now()}`);
    tokens.set(token, { email, created: Date.now() });
    return token;
}

// Validate token
function validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const data = tokens.get(token);
    if (!data) return null;
    // Token valid for 7 days
    if (Date.now() - data.created > 7 * 24 * 60 * 60 * 1000) {
        tokens.delete(token);
        return null;
    }
    return data.email;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ============================================
    // AUTH ENDPOINTS
    // ============================================

    // Register
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
          return new Response(JSON.stringify({ detail: "Nama, email, dan password wajib diisi" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (password.length < 8) {
          return new Response(JSON.stringify({ detail: "Password minimal 8 karakter" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (users.has(email)) {
          return new Response(JSON.stringify({ detail: "Email sudah terdaftar" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Save user (in production, hash the password!)
        users.set(email, { name, email, password });

        // Generate token and login
        const token = generateToken(email);
        return new Response(JSON.stringify({
          access_token: token,
          token_type: "bearer"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ detail: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Login
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json();

        if (!email || !password) {
          return new Response(JSON.stringify({ detail: "Email dan password wajib diisi" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const user = users.get(email);
        if (!user || user.password !== password) {
          return new Response(JSON.stringify({ detail: "Email atau password salah" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const token = generateToken(email);
        return new Response(JSON.stringify({
          access_token: token,
          token_type: "bearer"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ detail: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Get current user
    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const email = validateToken(request.headers.get("Authorization"));
      if (!email) {
        return new Response(JSON.stringify({ detail: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const user = users.get(email);
      if (!user) {
        return new Response(JSON.stringify({ detail: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        name: user.name,
        email: user.email
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ============================================
    // INVENTORY ENDPOINTS (Demo)
    // ============================================

    const inventory = [
      { id: 1, name: "Tomat", quantity: 5, unit: "buah", expiry_days: 2, status: "critical" },
      { id: 2, name: "Bayam", quantity: 200, unit: "gram", expiry_days: 1, status: "critical" },
      { id: 3, name: "Telur", quantity: 6, unit: "buah", expiry_days: 3, status: "soon" },
      { id: 4, name: "Susu", quantity: 1, unit: "liter", expiry_days: 5, status: "soon" },
      { id: 5, name: "Ayam", quantity: 500, unit: "gram", expiry_days: 7, status: "fresh" },
      { id: 6, name: "Nasi", quantity: 2, unit: "piring", expiry_days: 1, status: "critical" },
    ];

    // Get inventory
    if (url.pathname === "/inventory" && request.method === "GET") {
      return new Response(JSON.stringify(inventory), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get scan history (demo)
    if (url.pathname === "/history" && request.method === "GET") {
      const history = [
        { id: 1, item: "Tomat", status: "fresh", date: "2024-01-15" },
        { id: 2, item: "Bayam", status: "soon", date: "2024-01-14" },
        { id: 3, item: "Wortel", status: "critical", date: "2024-01-13" },
      ];
      return new Response(JSON.stringify(history), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get expiry items (demo)
    if (url.pathname === "/expiry" && request.method === "GET") {
      const expiry = inventory.filter(item => item.expiry_days <= 3);
      return new Response(JSON.stringify(expiry), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ============================================
    // AI CHAT ENDPOINT
    // ============================================

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { message } = await request.json();

        if (!message) {
          return new Response(JSON.stringify({ error: "Pesan kosong" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Call Groq API
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "Kamu adalah asisten dapur pintar bernama NOFTe. Kamu membantu pengguna mengelola bahan makanan, memberikan saran resep, dan tips memasak. Selalu jawab dalam Bahasa Indonesia yang sopan dan ramah."
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 500,
            temperature: 0.7,
          })
        });

        if (!groqResponse.ok) {
          const error = await groqResponse.text();
          console.error("Groq API Error:", error);
          return new Response(JSON.stringify({ error: "AI service error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const data = await groqResponse.json();
        const reply = data.choices[0].message.content;

        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        console.error("Worker Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Health check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "NOFTe API (Cloudflare Worker)",
        features: ["AI Chat", "Auth", "Inventory Demo"]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Not found
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
