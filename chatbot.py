import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

with open("prompts/chatbot.txt", "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()


def ai_bot_response(msg, history):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *history,
        {"role": "user", "content": msg},
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
                    "options": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["question", "reason", "options"],
            },
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
                    "max": {"type": "integer"},
                },
                "required": ["question", "reason", "min", "max"],
            },
        },
        {
            "type": "function",
            "name": "createOpenEndedQuestion",
            "description": "Create an open-ended question for the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["question", "reason"],
            },
        },
        {
            "type": "function",
            "name": "addUserRequirement",
            "description": "Add a requirement to the user's requirements.",
            "parameters": {
                "type": "object",
                "properties": {"requirement": {"type": "string"}},
                "required": ["requirement"],
            },
        },
        {
            "type": "function",
            "name": "addUserConstraint",
            "description": "Add a constraint to the user's constraints.",
            "parameters": {
                "type": "object",
                "properties": {"constraint": {"type": "string"}},
                "required": ["constraint"],
            },
        },
        {
            "type": "function",
            "name": "addSources",
            "description": "Add sources/links with names and URLs for reference.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "url": {"type": "string"},
                            },
                            "required": ["name", "url"],
                        },
                    }
                },
                "required": ["sources"],
            },
        },
        {
            "type": "function",
            "name": "createUserReport",
            "description": "Send message of summarized findings and evaluation (one paragraph)",
            "parameters": {
                "type": "object",
                "properties": {"message": {"type": "string"}},
                "required": ["message"],
            },
        },
        {
            "type": "function",
            "name": "recommendations",
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
                                "ratings": {"type": "string"},
                            },
                            "required": ["text", "specs", "price", "ratings"],
                        },
                    }
                },
                "required": ["recommendations"],
            },
        },
    ]

    resp = client.responses.create(model="gpt-4o", input=messages, tools=tools)

    for event in resp.output:
        if event.type == "function_call":
            fn_name = event.name
            args = json.loads(event.arguments)

            match fn_name:
                case "createMultipleChoice":
                    return json.dumps(
                        {
                            "type": "question_multiple_choice",
                            "question": args.get("question"),
                            "reasoning": args.get("reason"),
                            "options": args.get("options"),
                        }
                    )

                case "createSliderQuestion":
                    return json.dumps(
                        {
                            "type": "question_slider",
                            "question": args.get("question"),
                            "reasoning": args.get("reason"),
                            "min": args.get("min"),
                            "max": args.get("max"),
                        }
                    )

                case "createOpenEndedQuestion":
                    return json.dumps(
                        {
                            "type": "question_open_ended",
                            "question": args.get("question"),
                            "reasoning": args.get("reason"),
                        }
                    )

                case "addUserRequirement":
                    requirement = args.get("requirement")
                    if "requirement added" in requirement.lower():
                        return json.dumps({"type": "noop"})
                    return json.dumps(
                        {
                            "type": "user_requirement",
                            "requirement": requirement,
                        }
                    )

                case "addUserConstraint":
                    constraint = args.get("constraint")
                    if "constraint added" in constraint.lower():
                        return json.dumps({"type": "noop"})
                    return json.dumps(
                        {
                            "type": "user_constraint",
                            "constraint": constraint,
                        }
                    )

                case "recommendations":
                    recs = args.get("recommendations", [])
                    return json.dumps(
                        {
                            "type": "recommendations_list",
                            "recommendations": recs,
                        }
                    )

                case "addSources":
                    return json.dumps(
                        {
                            "type": "sources",
                            "sources": args.get("sources", []),
                        }
                    )

                case "createUserReport":
                    return json.dumps(
                        {
                            "type": "user_report",
                            "message": args.get("message"),
                        }
                    )

    text = resp.output_text
    if text and text.strip().startswith("{"):
        try:
            decoder = json.JSONDecoder()
            obj, _ = decoder.raw_decode(text)

            # Transform all plain text JSON function outputs to expected types
            obj_type = obj.get("type", "")

            # Multiple choice questions
            if obj_type == "createMultipleChoice":
                obj["type"] = "question_multiple_choice"
                if "reason" in obj:
                    obj["reasoning"] = obj.pop("reason")

            # Slider questions
            elif obj_type == "createSliderQuestion":
                obj["type"] = "question_slider"
                if "reason" in obj:
                    obj["reasoning"] = obj.pop("reason")

            # Open-ended questions
            elif obj_type == "createOpenEndedQuestion":
                obj["type"] = "question_open_ended"
                if "reason" in obj:
                    obj["reasoning"] = obj.pop("reason")

            # User requirements
            elif obj_type == "addUserRequirement" and "requirement" in obj:
                obj["type"] = "user_requirement"

            # User constraints
            elif obj_type == "addUserConstraint" and "constraint" in obj:
                obj["type"] = "user_constraint"

            # Sources
            elif obj_type == "addSources" and "sources" in obj:
                obj["type"] = "sources"

            # User report (both camelCase and snake_case)
            elif (
                obj_type in ["createUserReport", "create_user_report"]
                and "message" in obj
            ):
                obj["type"] = "user_report"

            # Recommendations
            elif obj_type == "recommendations" and "recommendations" in obj:
                recs = obj.get("recommendations", [])
                obj["type"] = "recommendations_list"

            return json.dumps(obj)
        except json.JSONDecodeError:
            pass

    return json.dumps(
        {
            "type": "question_open_ended",
            "question": resp.output_text,
            "reasoning": "The previous message could not be parsed, please try again.",
            "original_message": msg,
        }
    )
