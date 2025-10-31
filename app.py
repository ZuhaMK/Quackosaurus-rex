from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "finance-duck-advice" / "Web"

app = Flask(__name__, template_folder="Web", static_folder="Web")
CORS(app)
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


    try:
        # ---- Call the OpenAI Chat Completions API (Corrected) ----
        response = client.chat.completions.create(
            # Use a currently valid model name
            model="gpt-3.5-turbo",
            # The parameter for history must be named 'messages'
            messages=chat_history
        )

        # Access the content from the correct response structure
        reply = response.choices[0].message.content

        #Ensure the reply is not empty
        if not reply:
            reply = "Sorry, the model didn't generate a response."

        #Append to history and return json upon succes
        append("assistant", reply)
        return jsonify({"reply": reply})

    except Exception as e:
        # ⚠️ This is crucial: Log the actual error to your terminal
        print(f"OpenAI API Error or General Exception: {e}")
        # Return an immediate error to the frontend if the API call fails
        return jsonify({"error": "Server failed to get AI response."}), 500

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

if not os.getenv("OPENAI_API_KEY"):
    print("ERROR: OpenAI API Key not loaded!")


if __name__ == "__main__":
    print("Flask server is running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
