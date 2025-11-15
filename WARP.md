# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Required Environment Variables (.env)
```bash
OPENAI_API_KEY="your-openai-api-key"
SERPAPI_KEY="your-serpapi-key" 
HTTP_PORT=5899
```

### Running the Application

#### Development Mode
```bash
# Run with Flask development server (auto-reload enabled)
./scripts/run.sh dev
```

#### Production Mode
```bash
# Run with Waitress WSGI server
./scripts/run.sh

# Or run directly with Python
python main.py
```

#### Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run specific container
docker run -p 5899:5000 --env-file .env cnz-shopping
```

### Testing
```bash
# Run review summarization test
python reviews_sum_test.py

# Run shopping list functionality directly
python shopping_list.py
```

## Architecture Overview

### Application Structure
CNZ-Shopping is a Flask-based AI-powered shopping assistant with three main interfaces:

1. **Conversational Chatbot** (`/`) - Interactive product recommendation through guided questioning
2. **Product Comparison** (`/compare`) - Side-by-side product comparison with real-time data
3. **Event-Based Shopping Lists** (`/shopping-list`) - Smart shopping list generation for specific events

### Core Components

#### Main Application (`main.py`)
- Flask web server with session management
- OpenAI function calling integration with custom tools for UI interactions
- Routes handling chatbot, comparison, and shopping list endpoints

#### AI Integration Layer
- **Chatbot Flow**: Uses OpenAI function calling with structured response tools (`createMultipleChoice`, `createSliderQuestion`, `createOpenEndedQuestion`, `createRecommendations`)
- **Comparison Engine** (`Compare.py`): GPT-4o with web search for real-time product comparisons 
- **Shopping List Generator** (`shopping_list.py`): Event-driven item recommendation with SerpAPI price integration

#### API Services (`apis/`)
- `openai.py`: OpenAI client wrapper for review summarization
- `serp_api.py`: SerpAPI integration for product search and pricing
- `review_summarizing.py`: Product review aggregation and analysis
- `sentiment.py`: TextBlob sentiment analysis

#### Prompt Engineering (`prompts/`)
- `chatbot.txt`: System prompt defining conversational rules and one-question-at-a-time flow
- `compare.txt`: Detailed instructions for structured product comparison with JSON schema

### Key Architectural Patterns

#### Function Calling UI Framework
The chatbot uses OpenAI's function calling to generate structured UI components instead of plain text responses. Each interaction type (multiple choice, slider, open-ended, recommendations) has a dedicated function schema.

#### Caching and Rate Limiting
- Product data caching in `shopping_list.py` to avoid duplicate SerpAPI calls
- Session-based conversation history management

#### External API Integration
- **OpenAI**: Primary AI processing using GPT-4o model with response streaming
- **SerpAPI**: Real-time product data, pricing, and image retrieval
- **TextBlob**: Local sentiment analysis for review processing

### Frontend Integration
- Static assets serve interactive JavaScript for each interface
- Templates use Flask's Jinja2 templating with AJAX for dynamic interactions
- Real-time product image and pricing integration from SerpAPI

### Data Flow
1. User input → Flask route → OpenAI function calling → Structured response
2. Product queries → SerpAPI → Cached results → Price/image enrichment
3. Comparison requests → Web search → GPT analysis → JSON comparison table
4. Shopping list events → AI item generation → SerpAPI enhancement → User presentation

## Development Notes

### OpenAI Integration
- Uses the newer `client.responses.create()` API with response streaming
- Function calling schema must match exactly with frontend JavaScript expectations
- System prompts enforce strict response formatting (JSON only, no markdown)

### API Key Management
- All API keys loaded from `.env` file via `python-dotenv`
- Development requires both OpenAI and SerpAPI keys for full functionality
- HTTP_PORT configurable for different deployment environments

### Error Handling
- Graceful fallbacks for API failures (cached data, generic responses)
- JSON parsing with fallback to plain text for malformed responses
- Timeout handling for external API calls (10-second timeout on SerpAPI)