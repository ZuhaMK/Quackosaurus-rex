import json
import os
from openai import OpenAI

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")
    client = None
else:
    client = OpenAI(api_key=api_key)

# System prompt
SYSTEM_PROMPT = """You are Dr. GPT, a friendly AI Financial Consultant.
You're an expert financial advisor who helps young people learn about money in a fun, engaging way.
Always:
- Keep responses concise and clear (max 5-7 bullet points or 2-3 short paragraphs).
- Be encouraging, supportive, and never judgmental.
- Use simple language that's easy to understand.
- When appropriate, use analogies (like comparing money to video game points or treats).
"""

# Chat history - stored in memory (will reset on each function invocation)
# For production, consider using a database or external storage
# Note: In a serverless environment, this will reset between invocations
chat_history = []

def handler(event, context):
    """Netlify serverless function handler for chat endpoint"""
    
    # Enable CORS
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    }
    
    # Handle preflight OPTIONS request
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
    
    # Only allow POST
    if event.get("httpMethod") != "POST":
        return {
            "statusCode": 405,
            "headers": headers,
            "body": json.dumps({"error": "Method not allowed"})
        }
    
    if not client:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": "OpenAI API not configured. Please set OPENAI_API_KEY in Netlify environment variables."})
        }
    
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        user_message = body.get("message", "").strip()
        reset = body.get("reset", False)
        
        # Initialize chat history if empty
        if not chat_history:
            chat_history.append({"role": "system", "content": SYSTEM_PROMPT})
        
        # Handle reset
        if reset:
            chat_history.clear()
            chat_history.append({"role": "system", "content": SYSTEM_PROMPT})
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"reply": "Chat history reset! How can I help you today? ✨"})
            }
        
        if not user_message:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Empty message"})
            }
        
        # Add user message
        chat_history.append({"role": "user", "content": user_message})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=chat_history,
            temperature=0.7,
            max_tokens=300
        )
        
        reply = response.choices[0].message.content.strip()
        chat_history.append({"role": "assistant", "content": reply})
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"reply": reply})
        }
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": f"Sorry, I encountered an error: {str(e)}"})
        }

