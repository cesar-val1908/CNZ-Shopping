import os
from flask import Flask, jsonify, request, session, render_template
import json  # use Python’s json for parsing
from openai import OpenAI
from waitress import serve
from dotenv import load_dotenv
from Compare import get_comparison

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)
app.secret_key = os.urandom(24) 

with open('prompts/chatbot.txt', 'r', encoding='utf-8') as file:
    prompt = file.read()

def ai_bot_response(user_message, conversation_history):
    messages = [
        {"role": "system", "content": prompt},
        *conversation_history,
        {"role": "user", "content": user_message},
    ]

    # Define function tools as before
    tools = [
    {
        "type": "function",
        "name": "createMultipleChoice",
        "description": "Create a multiple choice question for the user.",
        "parameters": {
            "type": "object",
            "properties": {
                "question": {"type": "string", "description": "The question to ask the user."},
                "reason": {"type": "string", "description": "The reason for asking this question."},
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "A list of options for the user to choose from."
                }
            },
            "required": ["question", "reason", "options"]
        }
    },
    {
        "type": "function",
        "name": "createSliderQuestion",
        "description": "Create a question with a slider for a numerical range.",
        "parameters": {
            "type": "object",
            "properties": {
                "question": {"type": "string", "description": "The question to ask the user."},
                "reason": {"type": "string", "description": "The reason for asking this question."},
                "min": {"type": "integer", "description": "The minimum value for the slider."},
                "max": {"type": "integer", "description": "The maximum value for the slider."}
            },
            "required": ["question", "reason", "slider_range", "min", "max"]
        }
    },
    {
        "type": "function",
        "name": "createOpenEndedQuestion",
        "description": "Create an open-ended question for the user.",
        "parameters": {
            "type": "object",
            "properties": {
                "question": {"type": "string", "description": "The question to ask the user."},
                "reason": {"type": "string", "description": "The reason for asking this question."}
            },
            "required": ["question", "reason"]
        }
    },
    {
        "type": "function",
        "name": "createRecommendations",
        "description": "Create a list of product recommendations.",
        "parameters": {
            "type": "object",
            "properties": {
                "recommendations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string", "description": "Product Name and short description."},
                            "specs": {"type": "string", "description": "Product specifications."},
                            "price": {"type": "string", "description": "Product price."},
                            "ratings": {"type": "string", "description": "Product ratings."}
                        },
                        "required": ["text", "specs", "price", "ratings"]
                    }
                }
            },
            "required": ["recommendations"]
        }
    },
    {"type": "web_search_preview"}
    ]


    

    response = client.responses.create(
        model="gpt-4o",
        input=messages,
        tools=tools
    )

    # Check for a function_call event in the response
    function_event = None
    for output_event in response.output:
        if output_event.type == "function_call":
            function_event = output_event
            break

    if function_event:
        function_name = function_event.name
        function_args = json.loads(function_event.arguments)
        if function_name == "createMultipleChoice":
            return json.dumps({
                "type": "question_multiple_choice",
                "question": function_args.get("question"),
                "reasoning": function_args.get("reason"),
                "options": function_args.get("options")
            })
        elif function_name == "createSliderQuestion":
            return json.dumps({
                "type": "question_slider",
                "question": function_args.get("question"),
                "reasoning": function_args.get("reason"),
                "min": function_args.get("min"),
                "max": function_args.get("max")
            })
        elif function_name == "createOpenEndedQuestion":
            return json.dumps({
                "type": "question_open_ended",
                "question": function_args.get("question"),
                "reasoning": function_args.get("reason")
            })
        elif function_name == "createRecommendations":
            return json.dumps({
                "type": "recommendations_list",
                "recommendations": function_args.get("recommendations")
            })

    # If no function was called, return text content
    return response.output_text


@app.route("/")
def home():
    session['conversation_history'] = []
    return render_template("index.html")


@app.route("/compare", methods=["GET"])
def compare_page():
    return render_template("compare.html")


@app.route("/compare", methods=["POST"])
def compare_items():
    data = request.json
    item1 = data.get("item1")
    item2 = data.get("item2")

    if not item1 or not item2:
        return jsonify({"error": "Please provide both items for comparison."}), 400

    try:
        comparison_result = get_comparison(item1, item2)
        return jsonify({"comparison": comparison_result})
    except Exception as e:
        print(f"Error during comparison: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route("/get_response", methods=["POST"])
def get_response():
    data = request.json
    user_input = data.get("user_input")
    conversation_history = session.get('conversation_history', [])

    bot_response = ai_bot_response(user_input, conversation_history)

    # Update history and return the assistant's reply
    conversation_history.append({"role": "user", "content": user_input})
    conversation_history.append({"role": "assistant", "content": bot_response})
    session['conversation_history'] = conversation_history
    return jsonify({"response": bot_response})


if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found. Please set it in .env.")
    else:
        serve(app, host='0.0.0.0', port=8000)
