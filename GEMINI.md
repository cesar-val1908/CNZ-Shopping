# Project Overview

This project is a Python-based web application that serves as a shopping assistant. It provides a chatbot interface to help users find products, a tool to compare different items, and a feature to generate a shopping list for a specific event.

The application is built using the Flask web framework and integrates with the OpenAI API for natural language processing and the SerpAPI for retrieving real-time product information.

The project is structured as follows:

-   `main.py`: The main Flask application file that defines the routes and handles requests.
-   `chatbot.py`: Contains the logic for the chatbot, including the interaction with the OpenAI API.
-   `Compare.py`: Implements the item comparison functionality, fetching and compiling data from the web.
-   `shopping_list.py`: Manages the shopping list feature, recommending items and retrieving product details.
-   `templates/`: Contains the HTML templates for the web pages.
-   `static/`: Holds the static assets like CSS and JavaScript files.
-   `prompts/`: Stores the text prompts used to instruct the OpenAI models.
-   `requirements.txt`: Lists the Python dependencies for the project.
-   `Dockerfile` and `docker-compose.yml`: Used for containerizing the application.

# Building and Running

To run this project, you need to have Python and Docker installed.

1.  **Set up the environment:**
    -   Create a virtual environment: `python -m venv venv`
    -   Activate the virtual environment: `source venv/bin/activate`
    -   Install the dependencies: `pip install -r requirements.txt`

2.  **Configure API keys:**
    -   Create a `.env` file in the project root.
    -   Add your OpenAI and SerpAPI keys to the `.env` file:
        ```
        OPENAI_API_KEY="your-api-key-here"
        SERPAPI_KEY="your-api-key-here"
        ```

3.  **Run the application:**
    -   Execute the run script: `./scripts/run.sh`
    -   The application will be available at `http://0.0.0.0:5899`.

Alternatively, you can use Docker to run the application:

1.  **Build and run the Docker container:**
    -   `docker-compose up --build`

# Development Conventions

-   The project follows a modular structure, with different functionalities separated into different files.
-   The backend is written in Python using the Flask framework.
-   The frontend is composed of HTML templates with JavaScript for interactive elements.
-   The application uses environment variables to manage sensitive information like API keys.
-   Prompts for the AI models are stored in separate text files for better organization and maintainability.
