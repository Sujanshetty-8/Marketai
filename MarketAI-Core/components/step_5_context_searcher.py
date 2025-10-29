# components/step_5_context_searcher.py
import httpx
import json
import asyncio
from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI # Use LangChain's integration
from config import GOOGLE_API_KEY, SERPER_API_KEY

# --- Initialize LLM using LangChain's integration ---
# Use a fast model like Flash for summarization, or Pro if needed
try:
    if GOOGLE_API_KEY:
        # Use the specific model name confirmed to work
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", # Or "gemini-1.5-pro-latest"
            google_api_key=GOOGLE_API_KEY,
            temperature=0, # Low temperature for factual summarization
            convert_system_message_to_human=True # Good practice
        )
        print("LangChain ChatGoogleGenerativeAI Client Initialized in context_searcher.")
    else:
        print("ERROR: GOOGLE_API_KEY not found in config for context_searcher.")
        llm = None
except Exception as e:
    print(f"ERROR: Failed to initialize ChatGoogleGenerativeAI in context_searcher: {e}")
    llm = None
# --- End LLM Init ---

# Template remains the same
search_prompt_template = """
Based ONLY on the following search results snippets, answer the user's query.
Do not add information not present in the snippets. Be concise and directly answer the query.

Search Results Snippets:
{search_results}

User Query: {query}
Answer:"""
search_prompt = ChatPromptTemplate.from_template(search_prompt_template)

# Output parser remains the same
parser = StrOutputParser()

# --- Define the LangChain Chain: Prompt -> LLM -> String Output ---
# Only create the chain if the LLM initialized successfully
search_chain = search_prompt | llm | parser if llm else None

# --- Search Function (Helper) ---
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
# --- End Search Function ---

# --- Main Analysis Function ---
async def search_local_context(location: str, business_type: str, event: Optional[str] = None) -> dict:
    """Searches for local events and competitor types, then summarizes using the LLM chain."""
    print("--- Running Step 5: Context Searcher ---")
    event_query = f"major local events festivals happening in {location}"
    if event:
        event_query += f" around {event}"
    competitor_query = f"types of competitors for a {business_type} in {location}"

    print(f"  Query 1 (Events): {event_query}")
    print(f"  Query 2 (Competitors): {competitor_query}")

    print(">>> Calling asyncio.gather for searches...")
    try:
        event_snippets, competitor_snippets = await asyncio.gather(
            search_google(event_query),
            search_google(competitor_query)
        )
    except Exception as gather_error:
        print(f"!!! ERROR DURING asyncio.gather: {gather_error} !!!")
        event_snippets = "Search gather failed."
        competitor_snippets = "Search gather failed."

    print(">>> asyncio.gather DONE <<<")
    print("  Raw Event Snippets:", repr(event_snippets))
    print("  Raw Competitor Snippets:", repr(competitor_snippets))

    # --- Summarize Event Snippets using LLM Chain ---
    event_summary = "No specific events found or search/LLM failed."
    if search_chain and event_snippets and isinstance(event_snippets, str) and "failed" not in event_snippets.lower() and "configured" not in event_snippets.lower() and "found" not in event_snippets.lower():
        try:
            print(">>> Invoking LangChain LLM for Event Summary...")
            # Use LangChain's ainvoke
            event_summary = await search_chain.ainvoke({
                "search_results": event_snippets,
                "query": f"Summarize the main local events or festivals mentioned for {location} based on the snippets."
            })
            print(">>> LangChain Event Summary DONE <<<")
        except Exception as e:
            print(f"!!! Error invoking LangChain chain for event summary: {e} !!!")
            event_summary = f"Error summarizing event search results: {type(e).__name__}"
    elif not search_chain:
        print(">>> Skipping LLM for Event Summary: LLM chain not initialized. <<<")
        event_summary = "LLM chain unavailable for event summary."
    else:
         print(">>> Skipping LLM for Event Summary due to invalid/failed search snippets. <<<")

    # --- Summarize Competitor Snippets using LLM Chain ---
    competitor_summary = "Could not determine competitor types or search/LLM failed."
    if search_chain and competitor_snippets and isinstance(competitor_snippets, str) and "failed" not in competitor_snippets.lower() and "configured" not in competitor_snippets.lower() and "found" not in competitor_snippets.lower():
        try:
            print(">>> Invoking LangChain LLM for Competitor Summary...")
            # Use LangChain's ainvoke
            competitor_summary = await search_chain.ainvoke({
                "search_results": competitor_snippets,
                "query": f"Briefly list the main types of competitors mentioned for a {business_type} in {location} based on the snippets."
            })
            print(">>> LangChain Competitor Summary DONE <<<")
        except Exception as e:
            print(f"!!! Error invoking LangChain chain for competitor summary: {e} !!!")
            competitor_summary = f"Error summarizing competitor search results: {type(e).__name__}"
    elif not search_chain:
        print(">>> Skipping LLM for Competitor Summary: LLM chain not initialized. <<<")
        competitor_summary = "LLM chain unavailable for competitor summary."
    else:
        print(">>> Skipping LLM for Competitor Summary due to invalid/failed search snippets. <<<")

    print("Step 5 Output (Function End):")
    final_context = {
        "local_events_summary": event_summary.strip() if isinstance(event_summary, str) else "Summary Error or Unavailable",
        "competitor_types_summary": competitor_summary.strip() if isinstance(competitor_summary, str) else "Summary Error or Unavailable"
    }
    print(f"  Returning Context: {final_context}")
    return final_context

