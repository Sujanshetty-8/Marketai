# components/step_6_persona_generator.py
import json
import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field # Import directly from Pydantic
from langchain_google_genai import ChatGoogleGenerativeAI # Use LangChain's integration
from config import GOOGLE_API_KEY

# --- Initialize LLM using LangChain's integration ---
try:
    if GOOGLE_API_KEY:
        # Use the specific model name confirmed to work via LangChain
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", # <--- Use the confirmed working model name
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7, # Slightly higher temp for persona generation
            convert_system_message_to_human=True
        )
        print("LangChain ChatGoogleGenerativeAI Client Initialized in persona_generator (gemini-1.5-flash).")
    else:
        print("ERROR: GOOGLE_API_KEY not found in config for persona_generator.")
        llm = None
except Exception as e:
    print(f"ERROR: Failed to initialize ChatGoogleGenerativeAI in persona_generator: {e}")
    llm = None
# --- End LLM Init ---

# --- Define Desired JSON Output Structure ---
class AudiencePersona(BaseModel):
    segment_name: str = Field(description="A brief, descriptive name for this specific target audience segment (e.g., 'Tech-Savvy Young Professionals in Bangalore').")
    description: str = Field(description="A 2-3 sentence description covering key demographics (age range, occupation if relevant) and psychographics (lifestyle, values, interests) specific to the location and campaign context.")
    key_pain_points: list[str] = Field(description="List 2-3 primary problems, needs, or desires this audience has that the campaign's product/service/offer can directly address.")
    preferred_channels: list[str] = Field(description="Suggest 2-3 specific marketing channels (online and/or offline) where this segment is most likely reachable and receptive in the given location, informed by past results if available.")
    motivation_triggers: list[str] = Field(description="List 1-2 key factors that would motivate this audience to act on the campaign offer (e.g., 'Value for Money', 'Convenience', 'Social Proof', 'Exclusivity', 'Aligns with Sustainability Values').")

# --- Setup Output Parser ---
parser = JsonOutputParser(pydantic_object=AudiencePersona)

# --- Define the Prompt Template ---
persona_prompt_template = """
You are an expert MSME market researcher specializing in creating actionable audience personas for hyper-local Indian marketing campaigns.
Synthesize all the following information to generate ONE detailed target audience persona specifically for the described campaign.

**CRITICAL INSTRUCTION:** Pay close attention to `Previous Campaign Results`. Use these results to refine the persona's description and especially their `preferred_channels` and `motivation_triggers` based on what demonstrably worked or didn't work before for this user.

**User Goal & Input Details:**
{user_input}

**Extracted Key Entities (from Goal):**
{entities}

**Local Trends & Timing Data:**
{trend_data}

**Local Context (Events, Competitors):**
{local_context}

**Previous Campaign Results (Use this for refinement):**
{previous_results}

**Output Format Instructions:**
Strictly follow this JSON format:
{format_instructions}

Generate the detailed audience persona JSON based *only* on the provided information:
"""

# --- Create LangChain Prompt ---
persona_prompt = ChatPromptTemplate.from_template(
    persona_prompt_template,
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# --- Create the LangChain Chain ---
# Only create the chain if the LLM initialized successfully
persona_chain = persona_prompt | llm | parser if llm else None

# --- Define the Asynchronous Function ---
async def generate_persona(user_input: dict, entities: dict, trend_data: dict, local_context: dict, previous_results: dict) -> dict:
    """
    Generates the Audience Persona JSON using the LangChain chain.
    """
    print("--- Running Step 6: Persona Generator (LangChain) ---") # Updated print
    if not persona_chain:
         # Handle case where LLM or chain failed initialization
         return {"error": "Persona generation chain not initialized."}

    try:
        # Prepare inputs as JSON strings for safety in the prompt
        chain_input = {
            "user_input": json.dumps(user_input, default=str),
            "entities": json.dumps(entities, default=str),
            "trend_data": json.dumps(trend_data, default=str),
            "local_context": json.dumps(local_context, default=str),
            "previous_results": json.dumps(previous_results, default=str)
        }

        print(">>> Invoking LangChain chain for Persona...")
        # Invoke the chain asynchronously using LangChain's method
        result = await persona_chain.ainvoke(chain_input)

        print(">>> LangChain Persona DONE <<<") # Updated print
        print("Step 6 Output:", result)
        # Result should already be a parsed dictionary from JsonOutputParser
        return result
    except Exception as e:
        print(f"ERROR in Persona Generation (LangChain): {e}")
        # Log full traceback for debugging if needed
        # import traceback
        # traceback.print_exc()
        # Check if the error might be related to parsing and include raw output
        raw_output = None
        if hasattr(e, 'llm_output'): # LangChain sometimes attaches raw output to errors
             raw_output = e.llm_output
        elif hasattr(e, 'response'): # Or might be in a response attribute
             raw_output = e.response

        return {"error": f"Failed to generate persona via LangChain: {type(e).__name__}", "details": str(e), "raw_output": raw_output}

# ... (Optional Test Block remains the same) ...