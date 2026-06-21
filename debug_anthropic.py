import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("ANTHROPIC_API_KEY")
if not key:
    print("DEBUG: No ANTHROPIC_API_KEY found in .env")
else:
    client = anthropic.Anthropic(api_key=key)
    try:
        print("DEBUG: Checking available models...")
        # Check if models resource exists
        if hasattr(client, 'models'):
            models = client.models.list()
            print("DEBUG: Your key has access to these models:")
            for m in models.data:
                print(f" - {m.id}")
        else:
            print("DEBUG: SDK too old to list models. Trying Haiku fallback...")
            raise Exception("No list models method")
    except Exception as e:
        print(f"DEBUG: Could not list models: {e}")
        try:
            client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1,
                messages=[{"role": "user", "content": "hi"}]
            )
            print("DEBUG: SUCCESS: Claude 3 Haiku works.")
        except Exception as e2:
            print(f"DEBUG: FAILURE: Haiku also failed: {e2}")
