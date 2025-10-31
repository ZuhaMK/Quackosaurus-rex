#!/usr/bin/env bash
set -e

# Create a virtual environment in .venv and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "\nSetup complete. Activate the virtual environment with:\n  source .venv/bin/activate"
