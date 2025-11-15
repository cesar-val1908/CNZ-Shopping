# Agent Guidelines for CNZ Shopping Repository

This document outlines the essential commands and code style guidelines for AI agents operating within this repository.

## 1. Build/Lint/Test Commands

*   **Install Dependencies:** `pip install -r requirements.txt`
*   **Run Development Server:** `./scripts/run.sh dev`
*   **Run Production Server:** `./scripts/run.sh`
*   **Run All Tests:** `pytest` (assuming pytest is installed)
*   **Run a Single Test File:** `pytest <path_to_test_file>` (e.g., `pytest reviews_sum_test.py`)

## 2. Code Style Guidelines (Python)

*   **Imports:** Place imports at the top of the file, grouped by standard library, third-party, and local imports.
*   **Formatting:** Adhere to PEP 8 guidelines.
*   **Naming Conventions:**
    *   Variables and functions: `snake_case`
    *   Classes: `PascalCase`
*   **Error Handling:** Utilize `try...except` blocks for robust error management.
*   **Type Hinting:** Use type hints for function arguments and return values where appropriate.

## 3. Environment Variables and API Keys

Create a `.env` file in the project root with the following:

```
OPENAI_API_KEY="your-api-key-here"
SERPAPI_KEY="your-api-key-here"
HTTP_PORT=5899
```
