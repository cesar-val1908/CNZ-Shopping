import json
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load API keys from .env
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_prompt(event_type, rejected_items, accepted_items, count=1):
    base = f"""
You are a helpful shopping assistant. A user is preparing for an {event_type}.

Recommend {count} essential item{"s" if count > 1 else ""}.
Do NOT include any of the following:
{json.dumps(rejected_items + accepted_items)}

Respond with ONLY valid JSON, enclosed in triple backticks, like this:
```json
[
  {{
    "item": "Item name",
    "reason": "Very short reason"
  }}
]
```
The 'reason' should be a very concise, 1-6 word explanation."""

    return base.strip()


def clean_item(raw_item):
    try:
        return {
            "item": raw_item["item"].strip(),
            "reason": raw_item.get("reason", "No description provided.").strip(),
        }
    except (KeyError, AttributeError):
        return None


def recommend_items(event, accepted, rejected, count=1):
    prompt = build_prompt(event, accepted, rejected, count)
    messages = [
        {"role": "system", "content": "You're a helpful shopping assistant."},
        {"role": "user", "content": prompt},
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.2,  # lower temp for consistency
        )
        raw = response.choices[0].message.content.strip()

        # Extract JSON if wrapped in ```
        if "```" in raw:
            raw = raw.split("```")[1]
            raw = raw.replace("json", "").strip()

        # Parse JSON
        data = json.loads(raw)
        if isinstance(data, dict):
            items = [data]
        elif isinstance(data, list):
            items = data
        else:
            print("Unexpected GPT response format:", raw)
            return []

        cleaned_items = []
        for raw_item in items:
            cleaned = clean_item(raw_item)
            if cleaned and cleaned["item"] not in accepted + rejected:
                cleaned_items.append(cleaned)

        return cleaned_items

    except Exception as e:
        print("Error generating item:", e)
        return []


def recommend_next_item(event, accepted, rejected):
    items = recommend_items(event, accepted, rejected, count=1)
    if not items:
        return {}

    return items[0]


def print_item(item):
    print(f"- {item['item']}: {item['reason']}")


def shopping_list_run():
    accepted_items = []
    rejected_items = []

    event = input("What event are you shopping for? (e.g. back to school): ").strip()

    print("\n--- Recommended Items ---")
    new_items = recommend_items(event, accepted_items, rejected_items, count=5)
    if not new_items:
        print("No recommendations received.")
        return

    for item in new_items:
        accepted_items.append(item)
        print_item(item)

    while True:
        more = input("\nGenerate another item? (y/n): ").strip().lower()
        if more != "y":
            break
        item = recommend_next_item(event, accepted_items, rejected_items)
        if not item:
            print("No more items generated.")
            break
        accepted_items.append(item)
        print_item(item)

    print("\n--- Final Shopping List ---")
    for item in accepted_items:
        print_item(item)


if __name__ == "__main__":
    shopping_list_run()
