# components/step_10_visual_prompter.py
import json
import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI # Use LangChain integration
from config import GOOGLE_API_KEY

# --- Configure Google AI & Initialize Model ---
try:
    if GOOGLE_API_KEY:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=GOOGLE_API_KEY
        )
        print("LangChain ChatGoogleGenerativeAI Client Initialized in visual_prompter (gemini-1.5-flash).")
    else:
        print("ERROR: GOOGLE_API_KEY not found in config for visual_prompter.")
        llm = None
except Exception as e:
    print(f"ERROR: Failed to initialize ChatGoogleGenerativeAI in visual_prompter: {e}")
    llm = None
# --- End LLM Init ---


# --- Define Desired JSON Output Structure ---
class VisualPrompts(BaseModel):
    visual_prompts: list[str] = Field(description="List of 2 concise but descriptive text prompts suitable for an AI image generation model (like DALL-E 3 or Stable Diffusion), reflecting the campaign angle and audience in an Indian context.", max_items=2)

# --- Setup Output Parser ---
parser = JsonOutputParser(pydantic_object=VisualPrompts)

# --- Define the Prompt Template ---
visual_prompt_template = """
You are an AI visual concept artist specializing in marketing visuals for Indian MSMEs.
Based on the campaign angle, target audience, and text snippets, generate 2 concise but descriptive text prompts suitable for direct use in an AI image generation model (like DALL-E 3 or Stable Diffusion). The prompts should describe visuals that are engaging, culturally relevant (Indian context if applicable), and clearly aligned with the campaign's message. Focus on visual elements, style, and mood.

Campaign Angle: {campaign_angle}
Target Audience Persona: {audience_persona}
Generated Text Snippets (for context): {creative_content}

Describe 2 distinct visual concepts as prompts.

**Output Format Instructions:**
Strictly follow this JSON format:
{format_instructions}

Generate the visual prompts JSON:
"""

# --- Create LangChain Prompt ---
visual_prompt = ChatPromptTemplate.from_template(
    visual_prompt_template,
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# --- Create the LangChain Chain ---
visual_chain = visual_prompt | llm | parser if llm else None

# --- Define the Asynchronous Function ---
async def generate_visual_prompts(campaign_angle: str, audience_persona: dict, creative_content: dict) -> dict:
    """
    Generates visual concept prompts using the LangChain chain.
    """
    print("--- Running Step 10: Visual Prompter (LangChain) ---")
    if not visual_chain:
         return {"error": "Visual prompt generation chain not initialized."}

    try:
        # Prepare input
        chain_input = {
            "campaign_angle": campaign_angle,
            "audience_persona": json.dumps(audience_persona, default=str),
            "creative_content": json.dumps(creative_content, default=str)
        }

        print(">>> Invoking LangChain chain for Visual Prompts...")
        # Invoke the chain
        result = await visual_chain.ainvoke(chain_input)

        print(">>> LangChain Visual Prompts DONE <<<")
        print("Step 10 Output:", result)
        # Result should be {"visual_prompts": [...]}
        return result
    except Exception as e:
        print(f"ERROR in Visual Prompt Generation (LangChain): {e}")
        raw_output = None
        if hasattr(e, 'llm_output'): raw_output = e.llm_output
        elif hasattr(e, 'response'): raw_output = e.response
        return {"error": f"Failed to generate visual prompts via LangChain: {type(e).__name__}", "details": str(e), "raw_output": raw_output}

# ... (Optional Test Block) ...