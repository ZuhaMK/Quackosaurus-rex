import json
import os
from openai import OpenAI

# System prompt
SYSTEM_PROMPT = """You are Dr. GPT, a friendly AI Financial Consultant.
You're an expert financial advisor who helps young people learn about money in a fun, engaging way.
Always:
- Keep responses concise and clear (max 5-7 bullet points or 2-3 short paragraphs).
- Be encouraging, supportive, and never judgmental.
- Use simple language that's easy to understand.
- When appropriate, use analogies (like comparing money to video game points or treats).
"""

# Chat history - shared state (resets per function invocation)
chat_history = []

def handler(event, context):
    """Netlify serverless function handler for reset endpoint"""
    
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
    
    try:
        # Reset chat history
        chat_history.clear()
        chat_history.append({"role": "system", "content": SYSTEM_PROMPT})
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"ok": True, "message": "Chat history reset."})
        }
        
    except Exception as e:
        print(f"Error in reset endpoint: {str(e)}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": f"Error resetting chat: {str(e)}"})
        }

