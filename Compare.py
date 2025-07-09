#modifed compare.py so that it can input two items and return a comparison
import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

def get_comparison(item1, item2):
    with open('prompts/compare.txt', 'r', encoding='utf-8') as file:
        prompt = file.read()

    user_message = f"Compare {item1} and {item2}"

    messages = [
        {
            "role": "system",
            "content": prompt
        },
        {
            "role": "user",
            "content": user_message
        }
    ]

    tools = [
        {
            "type": "web_search_preview"
        }
    ]
    
    response = client.responses.create(
        model="gpt-4o",  #****Change to gpt-4o for best results****
        input=messages,
        tools = tools
    )


    return json.loads(response.output_text)
