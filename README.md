# 🦆 Quackosaurus-rex

A first-person interactive game designed to help players build financial literacy.

## 🎮 Game Concept

Players step into the shoes (or wings!) of a duck who experiences a typical day in her life. Through her journey, players encounter a variety of financial challenges and decisions.

The game teaches important concepts such as saving, budgeting, credit management, and debt awareness by presenting players with multiple options — only one of which is financially smart. Players learn by recognizing the best choice and seeing the consequences of their decisions.


## 🏠 Game World & Locations

The game features three main locations, each designed to teach specific lessons:
Home – Start your day and prepare for your financial activities.
Bank – Solve financial issues through two interactive rooms:
Budgeting & Saving Room – Learn how to manage income, expenses, and savings.
Debt & Credit Room – Understand loans, credit, and responsible borrowing.
Bank Reception – A hub connecting the two rooms.
Finance Advice Building – Consult a virtual assistant (ChatGPT) to receive personalized financial guidance and advice.

## 🐤 Characters

Main Character: The Duck – the player’s avatar navigating the game world.
Bank Receptionist (dinosaur): Guides the player through bank activities.
Robot Advisor (ChatGPT): Provides financial advice and answers questions in the Finance Advice Building.

## 🎨 Art & Assets

The game requires the following visual elements:

Backgrounds:
Duck’s Home
Bank Reception
Budgeting & Saving Room
Debt & Credit Room
Finance Advice Building

Characters:
Duck (main character)
Bank Receptionist (dinosaur)
Robot Advisor (ChatGPT)

## 📚 Learning Objectives

By playing the game, users will:

- Identify financially smart choices in daily life scenarios.
- Learn how to budget, save and plan expenses.
- Understand credit, loans and managing debt.
- Gain confidence in seeking financial advice when needed.

## ⚙️ Setup (install dependencies)

If you don't have Flask, the OpenAI Python client, or python-dotenv installed, use the project-provided requirements and setup script.

1. Create and activate a virtual environment, and install dependencies:

	```bash
	# make the setup script executable (once)
	chmod +x setup.sh

	# run the setup script (creates .venv and installs requirements)
	./setup.sh
	```

2. Activate the virtual environment (on macOS / Linux):

	```bash
	source .venv/bin/activate
	```

3. Run the Flask app:

	```bash
	python finance-duck-advice/finance-duck-advice/app.py
	```

Notes:
- If you prefer manual installation, you can run `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt` instead of the script.
- The `OPENAI_API_KEY` should be set in your environment or a `.env` file in the `finance-duck-advice/finance-duck-advice/` folder. Example `.env` content:

  ```text
  OPENAI_API_KEY=sk-...your-key-here...
  ```
