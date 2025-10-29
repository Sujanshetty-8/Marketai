# components/step_4_trend_analyzer.py
import httpx
import json
import asyncio
from typing import Optional, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from config import GOOGLE_API_KEY, SERPER_API_KEY

# ✅ Use LangChain's official Google GenAI wrapper
from langchain_google_genai import ChatGoogleGenerativeAI

# --- Configure Google AI & Initialize Model (LangChain-compatible) ---
try:
    if GOOGLE_API_KEY:
        llm_model_trends = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            google_api_key=GOOGLE_API_KEY
        )
        print("✅ Google AI Client Configured in trend_analyzer (LangChain wrapper).")
    else:
        print("❌ ERROR: GOOGLE_API_KEY not found in config for trend_analyzer.")
        llm_model_trends = None
except Exception as e:
    print(f"❌ ERROR: Failed to configure Google AI in trend_analyzer: {e}")
    llm_model_trends = None

# --- Define Prompt & Chain ---
trend_summary_prompt_template = """
Based ONLY on the following search results snippets regarding marketing timing or interest for '{topic}' in '{location}', 
what is the best timing recommendation or current interest level for a marketing campaign? Be concise.

Search Results Snippets:
{search_results}

Concise Timing/Interest Summary:
"""

trend_summary_prompt = ChatPromptTemplate.from_template(trend_summary_prompt_template)
parser = StrOutputParser()

# ✅ Define LangChain pipeline (Prompt → LLM → Parser)
trend_summary_chain = (
    trend_summary_prompt | llm_model_trends | parser if llm_model_trends else None
)

# --- Helper: Google Search via Serper API ---
async def search_google_trends_helper(query: str) -> str:
    """Performs Google search using Serper API and returns snippets."""
    if not SERPER_API_KEY:
        print("⚠️ Warning: SERPER_API_KEY not found. Skipping search.")
        return "Search API key not configured."

    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query, "gl": "in", "hl": "en"})
    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, content=payload, timeout=10.0)
            response.raise_for_status()
            results = response.json()
            snippets = []

            if "answerBox" in results:
                snippets.append(results["answerBox"].get("snippet", "") or results["answerBox"].get("answer", ""))

            if "organic" in results:
                for item in results["organic"][:3]:
                    snippets.append(item.get("snippet", ""))

            filtered_snippets = filter(None, snippets)
            joined_snippets = "\n".join(filtered_snippets)
            if not joined_snippets:
                return "No relevant search result snippets found."

            return joined_snippets
    except Exception as e:
        print(f"❌ Error during search_google_trends_helper for query '{query}': {e}")
        return "Search request failed."

# --- Main Trend Analysis ---
async def analyze_trends_via_search(keywords: List[str], location: str, event: Optional[str] = None) -> dict:
    """
    Analyzes marketing timing and interest level using Google search + Gemini summarization.
    """
    print("--- Running Step 4: Trend Analyzer (via Search) ---")
    if not keywords:
        return {"timing_recommendation": "No keywords provided.", "related_queries": []}

    combined_keywords = " ".join([k for k in keywords if isinstance(k, str)][:3])
    timing_query = f"best time marketing campaign {combined_keywords} {event if event else ''} in {location}"
    interest_query = f"latest news {combined_keywords} offers promotions in {location}"

    print(f"🔍 Timing Query: {timing_query}")
    print(f"🔍 Interest Query: {interest_query}")

    try:
        timing_snippets, interest_snippets = await asyncio.gather(
            search_google_trends_helper(timing_query),
            search_google_trends_helper(interest_query),
        )
    except Exception as gather_error:
        print(f"❌ ERROR DURING asyncio.gather for trends search: {gather_error}")
        return {"timing_recommendation": "Search failed for trend analysis.", "related_queries": []}

    all_snippets = (timing_snippets or "") + "\n" + (interest_snippets or "")
    all_snippets = all_snippets.strip()

    if not all_snippets:
        return {"timing_recommendation": "No valid search results found.", "related_queries": []}

    timing_rec = "Could not infer timing from search results."
    if trend_summary_chain:
        try:
            print("🤖 Invoking Gemini LLM for Trend Summary...")
            chain_input = {
                "topic": combined_keywords,
                "location": location,
                "search_results": all_snippets,
            }

            timing_rec = trend_summary_chain.invoke(chain_input).strip()
            print("✅ Trend Summary Ready.")
        except Exception as e:
            print(f"❌ Error invoking LLM chain for trend summary: {e}")
            timing_rec = "Error summarizing trend search results."
    else:
        timing_rec = "LLM not available for trend summary."

    output = {
        "timing_recommendation": timing_rec,
        "related_queries": [],
    }

    print("📊 Step 4 Output (Search):", output)
    return output
