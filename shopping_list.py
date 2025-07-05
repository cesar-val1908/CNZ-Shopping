import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

accepted_items = []
rejected_items = []

def build_prompt(event_type, rejected_items):
    prompt = f"""
You are a helpful shopping assistant. A user is preparing for an {event_type}.

Recommend **only one** essential item at a time. DO NOT repeat any of the following items:

{json.dumps(rejected_items)}, {json.dumps(accepted_items)}


Format your response as JSON like this:
{{
  "item": "Item name",
  "reason": "Why it's needed",
  "price": "$X",
  "link": "https://example.com"
}}

DO NOT include anything other than the JSON object. No text. No markdown. No comments.
"""
    return prompt.strip()

def recommend_next_item(event_type):
    prompt = build_prompt(event_type, rejected_items)

    messages = [
        {"role": "system", "content": "You're a smart shopping assistant."},
        {"role": "user", "content": prompt}
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7
    )

    raw = response.choices[0].message.content.strip()
    print("RAW GPT RESPONSE:\n", raw)

    try:
        item_data = json.loads(raw)
        return item_data
    except json.JSONDecodeError:
        print("Error parsing JSON.")
        return None

if __name__ == "__main__":
    event = "back to school"
    max_items = 5  # for example for right now

    for _ in range(max_items):
        item = recommend_next_item(event)
        if not item:
            break

        print(f"\nSuggested: {item['item']} - {item['reason']} ({item['price']})")
        user_input = input("Do you want this item? (yes/no): ").strip().lower()

        if user_input == "yes":
            accepted_items.append(item)
        else:
            rejected_items.append(item['item'])

    print("\n Final Shopping List:")
    for item in accepted_items:
        print(f"- {item['item']}: {item['reason']} ({item['price']})")

    # Clear lists if needed
    accepted_items.clear()
    rejected_items.clear()
