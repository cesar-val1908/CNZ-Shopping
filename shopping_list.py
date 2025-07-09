import json
import os
import requests
import re
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

accepted_items = []
rejected_items = []

def build_prompt(event_type, rejected_items, accepted_items):
    prompt = f"""
You are a helpful shopping assistant. A user is preparing for an {event_type}.

Recommend **only one** essential item at a time. DO NOT repeat any of the following items:

{json.dumps(rejected_items)}, {json.dumps(accepted_items)}

Format your response as JSON like this:
{{
  "item": "Item name",
  "reason": "Why it's needed"
}}

DO NOT include anything other than the JSON object. No text. No markdown. No comments.
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
        # first_link = "https://example.com"

        for product in products[:5]:  # Use top 5 products
            price_str = product.get("price", "")
            match = re.search(r"\$([\d,]+\.\d{2})", price_str)
            if match:
                price = float(match.group(1).replace(",", ""))
                prices.append(price)
            # if first_link == "https://example.com":
            #     first_link = product.get("link", first_link)

        if prices:
            low = min(prices)
            high = max(prices)
            if low == high:
                price_range = f"${low:.2f}"
            else:
                price_range = f"from ${low:.2f} - ${high:.2f}"
        else:
            price_range = "N/A"

        return {
            "price": price_range,
            # "link": first_link
        }

    except Exception as e:
        print("Error getting real product info:", e)
        return {
            "price": "N/A",
            # "link": "https://example.com"
        }

def recommend_next_item(event_type):
    prompt = build_prompt(event_type, rejected_items, [item["item"] for item in accepted_items])

    messages = [
        {"role": "system", "content": "You're a smart shopping assistant."},
        {"role": "user", "content": prompt}
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7
    )

    try:
        item_data = json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError:
        print("Error parsing GPT response.")
        return None

    # Add real product info
    product_info = get_real_product_data(item_data["item"])
    item_data.update(product_info)
    return item_data

if __name__ == "__main__":
    # Get user input
    event = input("What event are you shopping for? (e.g. back to school): ").strip()
    while True:
        try:
            max_items = int(input("How many items would you like to be shown?: ").strip())
            break
        except ValueError:
            print("Please enter a valid number.")

    # Suggest items
    for _ in range(max_items):
        item = recommend_next_item(event)
        if not item:
            break

        print(f"\nSuggested: {item['item']} - {item['reason']} ({item['price']})")
        # print(f"Link: {item['link']}")
        user_input = input("Do you want this item? (yes/no): ").strip().lower()

        if user_input == "yes":
            accepted_items.append(item)
        else:
            rejected_items.append(item["item"])

    # Final list
    print("\nFinal Shopping List:")
    for item in accepted_items:
        print(f"- {item['item']}: {item['reason']} ({item['price']})")
        # print(f"  {item['link']}")

    # Reset
    accepted_items.clear()
    rejected_items.clear()
