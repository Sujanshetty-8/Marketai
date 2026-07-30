# utils/search_engine.py
import httpx
import json
from config import SERPER_API_KEY

async def search_google(query: str) -> str:
    """Asynchronously performs a Google search using Serper API and returns extracted snippets."""
    if not SERPER_API_KEY:
        print("Warning: SERPER_API_KEY not found. Skipping search.")
        return "Search API key not configured."

    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query, "gl": "in", "hl": "en"})
    headers = {'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json'}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, content=payload, timeout=10.0)
            response.raise_for_status()
            results = response.json()
            snippets = []
            if "answerBox" in results:
                snippets.append(results["answerBox"].get("snippet", "") or results["answerBox"].get("answer", ""))
            if "organic" in results:
                for item in results["organic"][:3]: # Limit snippets
                    snippets.append(item.get("snippet", ""))
            filtered_snippets = filter(None, snippets)
            joined_snippets = "\n".join(filtered_snippets)
            if not joined_snippets: return "No relevant search result snippets found."
            return joined_snippets
    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred during search for query '{query}': {e.response.status_code} - {e.response.text}")
        return f"Search failed with status: {e.response.status_code}"
    except httpx.RequestError as e:
        print(f"An error occurred while requesting search results for query '{query}': {e}")
        return "Search request failed."
    except Exception as e:
        print(f"An unexpected error occurred during search for query '{query}': {e}")
        return "Unexpected error during search."
