import os
import asyncio
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# -------------------------------------------
# STEP 1: Per-item search using search_prompt.txt
# -------------------------------------------
async def get_item_data(item_name: str, search_prompt: str):
    messages = [
        {"role": "system", "content": search_prompt},
        {
            "role": "user",
            "content": f"Search for and return information about: {item_name}",
        },
    ]

    tools = [{"type": "web_search_preview"}]

    response = await client.responses.create(
        model="gpt-4o",
        input=messages,
        tools=tools,
    )

    raw_text = response.output_text.strip()

    # Remove wrapping triple backticks if they exist
    if raw_text.startswith("```") and raw_text.endswith("```"):
        raw_text = "\n".join(raw_text.split("\n")[1:-1])

    # Optionally remove any leading language specifier like 'json'
    if raw_text.lower().startswith("json"):
        raw_text = "\n".join(raw_text.split("\n")[1:])

    try:
        data = json.loads(raw_text)
        data["item"] = item_name  # ensure item name stays consistent
        print(f"[INFO] Successfully parsed JSON for {item_name}")
        return data
    except Exception as e:
        print(f"[ERROR] Failed to parse JSON for {item_name}: {e}")
        return {
            "item": item_name,
            "error": f"Failed to parse item JSON: {e}",
            "raw": raw_text,
        }


# -------------------------------------------
# STEP 2: Compile results using compare.txt
# -------------------------------------------
async def compile_comparison(item_results: list[dict], compare_prompt: str):
    messages = [
        {"role": "system", "content": compare_prompt},
        {
            "role": "user",
            "content": f"Using the following independently retrieved item data, compile the final JSON comparison:\n\n{json.dumps(item_results)}",
        },
    ]

    response = await client.responses.create(
        model="gpt-4o",
        input=messages,
    )

    raw_text = response.output_text.strip()

    # Remove wrapping triple backticks if they exist
    if raw_text.startswith("```") and raw_text.endswith("```"):
        raw_text = "\n".join(raw_text.split("\n")[1:-1])

    # Optionally remove any leading language specifier like 'json'
    if raw_text.lower().startswith("json"):
        raw_text = "\n".join(raw_text.split("\n")[1:])

    try:
        return json.loads(raw_text)
    except Exception as e:
        return {
            "error": f"Error parsing final comparison: {e}",
            "raw": raw_text,
        }


# -------------------------------------------
# STEP 3: Main concurrent comparison function
# -------------------------------------------
async def compare_items_concurrently(items: list[str]):
    # Load both prompts
    with open("prompts/search.txt", "r", encoding="utf-8") as f:
        search_prompt = f.read()

    with open("prompts/compare2.txt", "r", encoding="utf-8") as f:
        compare_prompt = f.read()

    # 1 Run all item searches concurrently
    item_tasks = [get_item_data(item, search_prompt) for item in items]
    item_results = await asyncio.gather(*item_tasks)

    # 2 Compile results into final comparison JSON

    # Print all item results for debugging
    print("=== All item search results ===")
    print(json.dumps(item_results, indent=2))

    # Compile results into final comparison JSON
    comparison = await compile_comparison(item_results, compare_prompt)

    # Print final compiled comparison for debugging
    print("=== Final comparison JSON ===")
    print(json.dumps(comparison, indent=2))

    return comparison


# -------------------------------------------
# STEP 4: Sync wrapper
# -------------------------------------------
def get_comparison(items):
    return asyncio.run(compare_items_concurrently(items))
