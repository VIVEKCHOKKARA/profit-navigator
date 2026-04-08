const express = require("express");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You are an AI business analyst for a small business analytics dashboard called Profit Navigator. 
You help business owners understand their sales data, expenses, product performance, and provide actionable business advice. 
Keep answers concise, practical, and data-driven. Use bullet points and clear formatting. 
When discussing numbers, use currency formatting.`;

// POST /api/chat — streams SSE response from OpenAI
router.post("/", async (req, res) => {
  const { messages, session_id = "default" } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || "OpenAI error" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullContent = "";

    response.body.on("data", (chunk) => {
      const text = chunk.toString();
      res.write(text);

      // Accumulate content for saving to DB
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullContent += content;
        } catch {}
      }
    });

    response.body.on("end", async () => {
      res.end();
      // Save assistant message to Supabase
      if (fullContent) {
        await supabase.from("chat_messages").insert({
          role: "assistant",
          content: fullContent,
          session_id,
        });
      }
    });

    response.body.on("error", (err) => {
      console.error("Stream error:", err);
      res.end();
    });
  } catch (e) {
    console.error("Chat error:", e);
    return res.status(500).json({ error: e.message || "Chat failed" });
  }
});

module.exports = router;
