import os
from flask import Flask, jsonify, request, session, render_template
import json  # use Python’s json for parsing
from openai import OpenAI
from waitress import serve
from dotenv import load_dotenv
from Compare import get_comparison
from shopping_list import get_real_product_data


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

    tools = [
        {
            "type": "function",
            "name": "createMultipleChoice",
            "description": "Create a multiple choice question for the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "reason": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"}
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
                    "question": {"type": "string"},
                    "reason": {"type": "string"},
                    "min": {"type": "integer"},
                    "max": {"type": "integer"}
                },
                "required": ["question", "reason", "min", "max"]
            }
        },
        {
            "type": "function",
            "name": "createOpenEndedQuestion",
            "description": "Create an open-ended question for the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "reason": {"type": "string"}
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
                                "text": {"type": "string"},
                                "specs": {"type": "string"},
                                "price": {"type": "string"},
                                "ratings": {"type": "string"}
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

    for output_event in response.output:
        if output_event.type == "function_call":
            function_name = output_event.name
            function_args = json.loads(output_event.arguments)

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
                recommendations = function_args.get("recommendations", [])
                # Add product images from SerpAPI
                for rec in recommendations:
                    product_info = get_real_product_data(rec["text"])
                    rec["image"] = product_info.get("image")  # Add image URL

                return json.dumps({
                    "type": "recommendations_list",
                    "recommendations": recommendations
                })

    return response.output_text



@app.route("/")
def home():
    session['conversation_history'] = []
    return render_template("index.html")


@app.route("/compare", methods=["GET"])
def compare_page():
    return render_template("compare.html")


@app.route("/compare-items", methods=["POST"])
def compare_items():
    data = request.json
    items = data.get("items", [])

    try:
        comparison_result = get_comparison(items)
        return jsonify(comparison_result)  
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


@app.route("/shopping-list", methods=["GET"])
def shopping_list_page():
    return render_template("shopping_list.html")

@app.route("/get_shopping_list_item", methods=["POST"])
def get_shopping_list_item():
    data = request.json
    event = data.get("event")
    rejected = data.get("rejected", [])
    accepted = data.get("accepted", [])
    try:
        # You may need to refactor shopping_list.py to expose recommend_next_item for import
        from shopping_list import recommend_next_item
        item = recommend_next_item(event, accepted, rejected)
        return jsonify(item)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found. Please set it in .env.")
    else:
        serve(app, host='0.0.0.0', port=8000)
