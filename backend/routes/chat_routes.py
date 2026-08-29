"""
Chat routes — history + SSE streaming via OpenAI.
"""
import os
import uuid
import json
import requests
from flask import Blueprint, request, jsonify, Response, stream_with_context
from db import query, execute

chat_bp = Blueprint("chat", __name__)

# Groq is OpenAI-compatible (same /chat/completions schema + SSE delta format),
# so the frontend stream parser works unchanged.
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = (
    "You are an AI business analyst for a small business analytics dashboard called Profit Navigator. "
    "You help business owners understand their sales data, expenses, product performance, and provide actionable business advice. "
    "Keep answers concise, practical, and data-driven. Use bullet points and clear formatting. "
    "When discussing numbers, use currency formatting. "
    "\n\n"
    "IMPORTANT — SCOPE RULE: You ONLY answer questions related to business, the user's shop, and this app. "
    "In-scope topics include: sales, revenue, expenses, profit and margins, products and inventory, "
    "pricing, customers, marketing, forecasting, anomalies, finance and accounting, business strategy and operations, "
    "and how to use the Profit Navigator dashboard itself. "
    "If a question is NOT business-related (for example: general knowledge or trivia, current events, celebrities, "
    "sports, jokes, riddles, poems or stories, math puzzles, programming help unrelated to their business, medical, "
    "legal or personal advice, or anything off-topic), you MUST politely decline in ONE short sentence and steer the "
    "user back to their business — for example: 'I can only help with your business and this dashboard. Try asking about "
    "your sales, expenses, products, or pricing.' Do NOT answer the off-topic question, even partially, and do not add "
    "extra commentary. If a request mixes business and non-business parts, answer only the business part. "
    "\n\n"
    "IMPORTANT — LANGUAGE RULE: Reply in the SAME language as the user's MOST RECENT message ONLY. "
    "Detect that message's language and script (for example Telugu, Hindi, Tamil, Gujarati, English, or Spanish) "
    "and write your ENTIRE reply in exactly that language and script. This also applies to the polite refusal above — "
    "decline in the user's own language. "
    "IGNORE the language of any earlier messages in this conversation — only the latest user message decides your reply language. "
    "If the latest message is in English, reply in English; if it is in Telugu, reply in Telugu, and so on."
)


@chat_bp.route("/history", methods=["GET"])
def chat_history():
    """GET /api/chat/history?session_id=default"""
    session_id = request.args.get("session_id", "default")
    rows = query(
        "SELECT role, content FROM chat_messages WHERE session_id = %s ORDER BY created_at ASC",
        (session_id,),
    )
    return jsonify(rows)


@chat_bp.route("/save", methods=["POST"])
def save_message():
    """POST /api/chat/save — save a single chat message."""
    body = request.get_json(force=True)
    mid = str(uuid.uuid4())
    execute(
        "INSERT INTO chat_messages (id, role, content, session_id) VALUES (%s, %s, %s, %s)",
        (mid, body["role"], body["content"], body.get("session_id", "default")),
    )
    return jsonify({"id": mid}), 201


@chat_bp.route("/", methods=["POST"])
def chat_stream():
    """POST /api/chat — stream SSE response from OpenAI, save assistant reply to MySQL."""
    body = request.get_json(force=True)
    messages = body.get("messages", [])
    session_id = body.get("session_id", "default")

    if not messages:
        return jsonify({"error": "messages array is required"}), 400

    api_key = (os.environ.get("GROQ_API_KEY") or "").strip().strip('"')
    if not api_key or api_key == "your_groq_api_key_here":
        return jsonify({
            "error": "GROQ_API_KEY is not set. Get a free key at "
                     "https://console.groq.com and put it in backend/.env, "
                     "then restart the backend."
        }), 500

    chat_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    def generate():
        full_content = ""
        try:
            resp = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": chat_messages,
                    "stream": True,
                },
                stream=True,
                timeout=60,
            )

            if resp.status_code != 200:
                detail = resp.text[:300]
                yield f"data: {json.dumps({'error': f'Groq error: {detail}'})}\n\n"
                return

            # Iterate raw bytes and decode each full line as UTF-8 ourselves.
            # Groq's SSE stream has no charset header, so requests' decode_unicode
            # would default to ISO-8859-1 and mangle non-ASCII text (e.g. Telugu,
            # Hindi). A newline byte (0x0A) never splits a UTF-8 multibyte char,
            # so decoding per complete line is safe.
            for raw in resp.iter_lines():
                if not raw:
                    continue
                line = raw.decode("utf-8", errors="replace")
                if not line.startswith("data: "):
                    continue
                json_str = line[6:].strip()
                if json_str == "[DONE]":
                    yield "data: [DONE]\n\n"
                    break
                yield f"{line}\n\n"
                try:
                    parsed = json.loads(json_str)
                    content = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if content:
                        full_content += content
                except json.JSONDecodeError:
                    pass

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        # Save assistant message to MySQL
        if full_content:
            mid = str(uuid.uuid4())
            try:
                execute(
                    "INSERT INTO chat_messages (id, role, content, session_id) VALUES (%s, %s, %s, %s)",
                    (mid, "assistant", full_content, session_id),
                )
            except Exception:
                pass  # Don't break the stream for a DB error

    return Response(
        stream_with_context(generate()),
        content_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
