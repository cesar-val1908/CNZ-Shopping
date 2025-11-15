import os
from flask import Flask, jsonify, request, session, render_template
from dotenv import load_dotenv
from Compare import get_comparison
from chatbot import ai_bot_response


load_dotenv()
print(f"OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY')}")

app = Flask(__name__)
app.secret_key = os.urandom(24)


@app.route("/")
def home():
    session["conversation_history"] = []
    return render_template("chatbot.html")


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
    conversation_history = session.get("conversation_history", [])

    bot_response = ai_bot_response(user_input, conversation_history)

    # Update history and return the assistant's reply
    conversation_history.append({"role": "user", "content": user_input})
    conversation_history.append({"role": "assistant", "content": bot_response})
    session["conversation_history"] = conversation_history
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
        app.run(host="0.0.0.0", port=8002, debug=True)
