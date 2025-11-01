from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__, template_folder="Web", static_folder="Web")
CORS(app)  # Enable CORS for API requests

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")
    client = None
else:
    client = OpenAI(api_key=api_key)

# ---- System prompt (style & guardrails) ----
SYSTEM_PROMPT = """You are Dr. GPT, a friendly AI Financial Consultant.
You're an expert financial advisor who helps young people learn about money in a fun, engaging way.

FORMATTING GUIDELINES (STRICTLY FOLLOW):
- ONLY use these three formatting options:
  * **Bold text** (using **text**) for emphasis on important points
  * Bullet points (using - or *) for lists
  * Line breaks (single line break for new line)
- DO NOT use any other formatting:
  * NO italics (*text* or _text_)
  * NO headings (# Header)
  * NO code blocks (`code` or ```code```)
  * NO numbered lists (1., 2., 3.)
  * NO blockquotes (> text)
  * NO other markdown syntax
- Keep formatting simple and minimal - only use bold, bullets, and line breaks

CONTENT GUIDELINES:
- Keep responses concise and clear (max 5-7 bullet points or 2-3 short paragraphs)
- Be encouraging, supportive, and never judgmental
- Use simple language that's easy to understand
- When appropriate, use analogies (like comparing money to video game points or treats)
- Structure information clearly with headings and lists when helpful
"""

# ---- Chat history (simple global for one player/session) ----
chat_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

def append(role: str, content: str):
    chat_history.append({"role": role, "content": content})

@app.route("/")
def home():
    return render_template("startPage.html")

@app.route("/chat", methods=["POST"])
def chat():
    if not client:
        return jsonify({"error": "OpenAI API not configured. Please set OPENAI_API_KEY in .env file."}), 500
    
    try:
        data = request.get_json(force=True) or {}
        user_message = data.get("message", "").strip()
        reset = data.get("reset", False)

        # Optional: reset the conversation (keeps only the system message)
        if reset:
            chat_history.clear()
            chat_history.append({"role": "system", "content": SYSTEM_PROMPT})
            return jsonify({"reply": "Chat history reset! How can I help you today? 🦆✨"})

        if not user_message:
            return jsonify({"error": "Empty message"}), 400

        append("user", user_message)

        # Call OpenAI Chat Completions API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # or "gpt-4" if you have access
            messages=chat_history,
            temperature=0.7,
            max_tokens=300
        )

        reply = response.choices[0].message.content.strip()
        append("assistant", reply)

        return jsonify({"reply": reply})

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": f"Sorry, I encountered an error: {str(e)}"}), 500

@app.route("/reset_api", methods=["POST"])
def reset():
    chat_history.clear()
    chat_history.append({"role": "system", "content": SYSTEM_PROMPT})
    return jsonify({"ok": True, "message": "Chat history reset."})

# Serve static files
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory("Web", path)



if __name__ == "__main__":
    print("Flask server is running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
