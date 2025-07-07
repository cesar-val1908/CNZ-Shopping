import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


with open('prompts/compare.txt', 'r', encoding='utf-8') as file:
    prompt = file.read()   

conversation_history = []

def ai_bot_response(user_message):
    ai_prompt = prompt
    
    messages = [
        {
        "role": "system",
        "content": ai_prompt
        },
        *conversation_history
    ]
    
    messages.extend(conversation_history) 
    messages.append({"role": "user", "content": user_message})

    tools = [
        {
            "type": "web_search_preview"
        }
    ]
    
    response = client.responses.create(
        model="gpt-4o-mini",  #****Change to gpt-4o to get the full accuracy of the model****
        input=messages,
        max_output_tokens=10000,
        tools = tools,
    )
    # print("OpenAI API Raw Response:", response) # Keep this for detailed debugging
    print(response.output_text)

# Todo:
# search_product():   Return in a JSON structure.



user_message1 = input("Start Here:")

ai_bot_response(user_message1)