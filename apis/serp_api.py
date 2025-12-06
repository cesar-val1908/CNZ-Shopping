import requests
import os
from dotenv import load_dotenv

load_dotenv()

def search_serp_products(query):
    url = "https://serpapi.com/search.json"
    params = {
        "q": query,
        "engine": "google_shopping",
        "api_key": os.getenv("SERPAPI_KEY")
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    return None

def get_serp_image_url(product_name):
    url = "https://serpapi.com/search.json"
    params = {
        "q": product_name,
        "tbm": "isch",  # Image search
        "ijn": "0",     # First page of results
        "api_key": os.getenv("SERPAPI_KEY")
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        if "images_results" in data and len(data["images_results"]) > 0:
            return data["images_results"][0].get("original")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image from SerpAPI: {e}")
        return None
