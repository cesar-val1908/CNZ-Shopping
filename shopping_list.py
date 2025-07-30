import json
import os
import requests
import re
from dotenv import load_dotenv
from openai import OpenAI

# Load API keys from .env
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

def build_prompt(event_type, rejected_items, accepted_items, count=1):
    if count == 1:
        prompt = f"""
You are a helpful shopping assistant. A user is preparing for an {event_type}.

Recommend one essential item that is NOT in the following list:
{json.dumps(rejected_items + accepted_items)}

Respond with ONLY this JSON object:
{{
  "item": "Item name",
  "reason": "Why it's needed"
}}
"""
    else:
        prompt = f"""
You are a helpful shopping assistant. A user is preparing for an {event_type}.

Recommend {count} essential items. Do NOT include any of the following:
{json.dumps(rejected_items + accepted_items)}

Respond ONLY with a JSON array like this:
[
  {{
    "item": "Item name",
    "reason": "Why it's needed"
  }},
  ...
]
Always respond with a complete valid JSON object or array as shown. Do NOT output partial or malformed JSON or raw text.

"""
    return prompt.strip()

def get_real_product_data(query):
    params = {
        "engine": "google_shopping",
        "q": query,
        "api_key": SERPAPI_KEY
    }
    try:
        response = requests.get("https://serpapi.com/search", params=params)
        results = response.json()
        products = results.get("shopping_results", [])

        prices = []
        image_url = None

        for i, product in enumerate(products[:5]):
            price_str = product.get("price", "")
            match = re.search(r"\$([\d,]+\.\d{2})", price_str)
            if match:
                prices.append(float(match.group(1).replace(",", "")))
                if not image_url:
                    image_url = product.get("thumbnail")

        if prices:
            return {
                "price_low": min(prices),
                "price_high": max(prices),
                "image": image_url
            }
        else:
            return {"price_low": None, "price_high": None, "image": image_url}
    except Exception as e:
        print("Error fetching product data:", e)
        return {"price_low": None, "price_high": None, "image": None}

def clean_item(raw_item):
    if isinstance(raw_item, dict):
        item_name = raw_item.get("item")
        reason = raw_item.get("reason", "No description provided.")
        price_low = raw_item.get("price_low")
        price_high = raw_item.get("price_high")
        if not item_name or not isinstance(item_name, str) or not item_name.strip():
            return None
        return {
            "item": item_name.strip(),
            "reason": reason.strip() if reason else "No description provided.",
            "price_low": price_low,
            "price_high": price_high
        }
    return None

def recommend_items(event, accepted, rejected, count=1):
    prompt = build_prompt(event, accepted, rejected, count)
    messages = [
        {"role": "system", "content": "You're a helpful shopping assistant."},
        {"role": "user", "content": prompt}
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7
        )
        raw = response.choices[0].message.content.strip()

        # Try JSON parsing first
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                items = [data]
            elif isinstance(data, list):
                items = data
            else:
                print("Unexpected GPT response format (not dict or list):")
                print(raw)
                return []
        except json.JSONDecodeError:
            # Fallback: parse lines manually (with or without price info)
            items = []
            for line in raw.splitlines():
                line = line.strip()
                if not line:
                    continue
                # Try price range parse
                m = re.match(r"-?\s*(.+?):\s*(.+?)\s*\(from\s*\$?([\d.]+)\s*-\s*\$?([\d.]+)\)", line)
                if m:
                    item, reason, low, high = m.groups()
                    items.append({
                        "item": item.strip(),
                        "reason": reason.strip(),
                        "price_low": float(low),
                        "price_high": float(high)
                    })
                else:
                    # Parse without price
                    m2 = re.match(r"-?\s*(.+?):\s*(.+)", line)
                    if m2:
                        item, reason = m2.groups()
                        items.append({
                            "item": item.strip(),
                            "reason": reason.strip(),
                            "price_low": None,
                            "price_high": None
                        })

            if not items:
                print("Unexpected format from GPT:")
                print(raw)
                return []

        # Clean and filter out invalid items
        cleaned_items = []
        for raw_item in items:
            cleaned = clean_item(raw_item)
            if cleaned and cleaned["item"] not in accepted + rejected:
                cleaned_items.append(cleaned)

        return cleaned_items

    except Exception as e:
        print("Error generating item:", e)
        return []

def print_item(item):
    if item['price_low'] is not None and item['price_high'] is not None:
        if item['price_low'] == item['price_high']:
            price_str = f"(${item['price_low']:.2f})"
        else:
            price_str = f"(from ${item['price_low']:.2f} - ${item['price_high']:.2f})"
    else:
        price_str = "(price not available)"
    print(f"- {item['item']}: {item['reason']} {price_str}")

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
        product_info = get_real_product_data(item["item"])
        item.update(product_info)
        accepted_items.append(item)
        print_item(item)

    while True:
        more = input("\nGenerate another item? (y/n): ").strip().lower()
        if more != "y":
            break
        more_items = recommend_items(event, accepted_items, rejected_items, count=1)
        if not more_items:
            print("No more items generated.")
            break
        item = more_items[0]
        product_info = get_real_product_data(item["item"])
        item.update(product_info)
        accepted_items.append(item)
        print_item(item)

    print("\n--- Final Shopping List ---")
    for item in accepted_items:
        print_item(item)

if __name__ == "__main__":
    shopping_list_run()
