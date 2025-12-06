import os
import asyncio
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# -------------------------------------------
# STEP 1: Compile results using compare.txt
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
# STEP 2: Main concurrent comparison function
# -------------------------------------------
async def compare_items_concurrently(items: list[dict]):
    # Load compare prompt
    with open("prompts/compare2.txt", "r", encoding="utf-8") as f:
        compare_prompt = f.read()

    # Compile results into final comparison JSON
    comparison = await compile_comparison(items, compare_prompt)

    # Print final compiled comparison for debugging
    print("=== Final comparison JSON ===")
    print(json.dumps(comparison, indent=2))

    return comparison


# -------------------------------------------
# STEP 3: Sync wrapper
# -------------------------------------------
def get_comparison(items):
    return asyncio.run(compare_items_concurrently(items))
