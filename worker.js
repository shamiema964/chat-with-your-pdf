// Cloudflare Worker: Groq proxy for "Chat With Your PDF" (by Shamiema Shahzad)
// Secret needed: GROQ_API_KEY (Settings -> Variables and Secrets -> type: Secret)

const ALLOWED_ORIGINS = [
  "https://shamiemashahzad.netlify.app",
  "https://mimixpanda-chat-with-your-pdf.static.hf.space",
  "https://mimixpanda-chat-with-your-pdf.hf.space",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

const MODEL = "openai/gpt-oss-20b";   // llama-3.1-8b-instant band ho chuka hai
const MAX_CONTEXT_CHARS = 6000;
const MAX_QUESTION_CHARS = 500;

const SYSTEM_PROMPT =
  "You answer questions using ONLY the provided context from the user's document. " +
  "If the answer is not in the context, say exactly: 'I could not find this in the document.' " +
  "Keep answers short and clear.";

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    const question = String(body.question || "").trim();
    const context = String(body.context || "").trim();
    if (!question || !context) return json({ error: "Missing question or context" }, 400, origin);
    if (question.length > MAX_QUESTION_CHARS) return json({ error: "Question too long" }, 400, origin);
    if (context.length > MAX_CONTEXT_CHARS) return json({ error: "Context too long" }, 400, origin);

    if (!env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY secret is missing");
      return json({ error: "Server key missing" }, 500, origin);
    }

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + env.GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          max_tokens: 1000,          // gpt-oss "sochta" bhi hai, isliye zyada tokens
          reasoning_effort: "low",   // jaldi aur chhota jawab
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error("Groq error", res.status, detail);   // Observability mein asli error dikhega
        return json({ error: "LLM service error", status: res.status, detail: detail.slice(0, 300) }, 502, origin);
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.trim() || "No answer returned.";
      return json({ answer }, 200, origin);
    } catch (e) {
      console.error("Worker exception", String(e));
      return json({ error: "LLM service unavailable" }, 502, origin);
    }
  },
};