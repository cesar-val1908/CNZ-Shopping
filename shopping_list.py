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

# Cache to avoid duplicate SerpAPI calls
product_cache = {}


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
    "reason": "Why it's needed"
  }}
]
```"""

    return base.strip()


def get_real_product_data(query):
    # Check cache first
    if query in product_cache:
        return product_cache[query]

    params = {"engine": "google_shopping", "q": query, "api_key": SERPAPI_KEY}
    try:
        response = requests.get("https://serpapi.com/search", params=params, timeout=10)
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

        result = {
            "price_low": min(prices) if prices else None,
            "price_high": max(prices) if prices else None,
            "image": image_url,
        }
        product_cache[query] = result  # Save to cache
        return result
    except Exception as e:
        print("Error fetching product data:", e)
        return {"price_low": None, "price_high": None, "image": None}


def clean_item(raw_item):
    try:
        return {
            "item": raw_item["item"].strip(),
            "reason": raw_item.get("reason", "No description provided.").strip(),
            "price_low": raw_item.get("price_low"),
            "price_high": raw_item.get("price_high"),
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

    item = items[0]
    product_info = get_real_product_data(item["item"])
    item.update(product_info)

    price_low = item.get("price_low")
    price_high = item.get("price_high")

    if price_low is not None and price_high is not None:
        if price_low == price_high:
            item["price"] = f"${price_low:.2f}"
        else:
            item["price"] = f"from ${price_low:.2f} - ${price_high:.2f}"
    else:
        item["price"] = "(price not available)"

    return item


def print_item(item):
    if item["price_low"] is not None and item["price_high"] is not None:
        if item["price_low"] == item["price_high"]:
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
