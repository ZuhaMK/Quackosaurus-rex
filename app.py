from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "finance-duck-advice" / "Web"

app = Flask(__name__, template_folder="Web")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---- System prompt (style & guardrails) ----
SYSTEM_PROMPT = """
You are DUCKBOT, a friendly financial assistant 🦆💰
Your job is to teach players financial literacy in simple, interactive ways.
Always:
- Answer using **structured bullet points** and clean **Markdown** formatting.
- Use **emojis** to make learning fun and engaging.
- Keep responses short (max 5 bullets).
- End each answer with a quick motivational line or tip. ✨
"""

# ---- Chat history (simple global for one player/session) ----
chat_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

def append(role: str, content: str):
    chat_history.append({"role": role, "content": content})

@app.route("/")
def home():
    return render_template("chat.html")

@app.route("/chat", methods=["POST"])   # <-- decorator was missing
def chat():
    data = request.get_json(force=True) or {}
    user_message = data.get("message", "").strip()
    reset = data.get("reset", False)

    # Optional: reset the conversation (keeps only the system message)
    if reset:
        chat_history.clear()
        chat_history.append({"role": "system", "content": SYSTEM_PROMPT})

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    append("user", user_message)

        # ---- Call the Responses API (consistent, modern endpoint) ----
    response = client.responses.create(
        model="gpt-5",   # use a valid model
        input=chat_history
    )

    reply = response.output_text or "Sorry, I couldn't generate a response."
    append("assistant", reply)

    return jsonify({"reply": reply})

    # except Exception as e:
    #     return jsonify({"error": str(e)}), 500

@app.route("/reset_api", methods=["POST"])
def reset():
    chat_history.clear()
    chat_history.append({"role": "system", "content": SYSTEM_PROMPT})
    return jsonify({"ok": True, "message": "Chat history reset."})



if __name__ == "__main__":
    print("Flask server is running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
