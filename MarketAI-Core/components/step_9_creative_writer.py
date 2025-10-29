# components/step_9_creative_writer.py
import json
import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field, create_model # Use create_model for dynamic Pydantic
from langchain_google_genai import ChatGoogleGenerativeAI # Use LangChain integration
from config import GOOGLE_API_KEY

# --- Configure Google AI & Initialize Model ---
try:
    if GOOGLE_API_KEY:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.8,
            google_api_key=GOOGLE_API_KEY
        )
        print("LangChain ChatGoogleGenerativeAI Client Initialized in creative_writer (gemini-1.5-flash).")
    else:
        print("ERROR: GOOGLE_API_KEY not found in config for creative_writer.")
        llm = None
except Exception as e:
    print(f"ERROR: Failed to initialize ChatGoogleGenerativeAI in creative_writer: {e}")
    llm = None
# --- End LLM Init ---

# --- Define function to dynamically create Pydantic model and parser ---
# --- FIX: Added campaign_angle as argument ---
def create_creative_parser_and_prompt(channels: list[str], campaign_angle: str):
    fields = {}
    prompt_channels_section = ""
    field_descriptions = {}

    safe_channels = channels if channels else ["default_channel"]

    for channel in safe_channels:
        key_name = channel.lower().replace(" ", "_").replace("-", "_").replace("&","and").replace(".","") + "_copy"
        # --- FIX: Use campaign_angle argument in f-string ---
        description = f"Generate 1-2 concise, compelling marketing copy text snippets suitable ONLY for the '{channel}' channel. Incorporate the campaign angle '{campaign_angle}' and target the audience described. Include placeholders like [Shop Name], [Offer Details], [Dates], [Address]. Explicitly mention where to place the tracking link or QR code scan instruction."
        fields[key_name] = (str, Field(..., description=description))
        field_descriptions[key_name] = description
        prompt_channels_section += f"- **{channel} (JSON key: `{key_name}`)**: {description}\n"

    DynamicCreativeContent = create_model("DynamicCreativeContent", **fields)
    parser = JsonOutputParser(pydantic_object=DynamicCreativeContent)

    creative_prompt_template = f"""
You are a creative copywriter specializing in short, engaging, and actionable content for hyper-local Indian MSME marketing campaigns.
Generate concise, compelling, and channel-specific marketing copy based on the following:

Campaign Angle: {{campaign_angle}}
Target Audience Persona: {{audience_persona}} # Use insights like pain points
Recommended Channels for Copy Generation: {", ".join(safe_channels)}
Key Message Guidance: Focus on audience pain points (e.g., value, convenience) and the campaign angle. Keep it brief and include a clear call to action related to the tracking mechanism (link/QR).

**Instructions:**
1.  Generate relevant copy for **ALL** requested channels. Do not output 'N/A'.
2.  Use placeholders like `[Shop Name]`, `[Offer Details]`, `[Dates]`, `[Address]` where logical.
3.  Ensure copy for each channel includes instructions related to the tracking link or QR code.
4.  Keep copy concise and impactful, suitable for the channel (e.g., very short for Signage, engaging for Instagram).

Generate copy ONLY for the following channels (use the specified JSON key names in your output):
{prompt_channels_section}

**Output Format Instructions:**
Strictly follow this JSON format:
{{format_instructions}}

Generate the creative content JSON:
"""
    prompt = ChatPromptTemplate.from_template(
        creative_prompt_template,
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    return prompt, parser

# --- Define the Asynchronous Function ---
async def generate_creative(campaign_angle_input: str, audience_persona: dict, recommended_channels: list[str]) -> dict:
    """
    Generates channel-specific creative copy using the LangChain chain.
    """
    # --- FIX: Removed global lines ---
    # global campaign_angle
    # campaign_angle = campaign_angle_input

    print("--- Running Step 9: Creative Writer (LangChain) ---")

    if not llm:
        return {"error": "LLM not initialized for creative writing."}
    if not recommended_channels:
        print("Step 9 Output: No channels provided, returning empty content.")
        return {"channel_copy": {}}

    try:
        # --- FIX: Pass campaign_angle_input directly ---
        creative_prompt, creative_parser = create_creative_parser_and_prompt(recommended_channels, campaign_angle_input)
        # Recreate the chain
        creative_chain = creative_prompt | llm | creative_parser

        # Prepare input
        chain_input = {
            "campaign_angle": campaign_angle_input, # Use the input directly
            "audience_persona": json.dumps(audience_persona, default=str),
        }

        print(">>> Invoking LangChain chain for Creative Content...")
        # Invoke the chain
        result = await creative_chain.ainvoke(chain_input)

        print(">>> LangChain Creative Content DONE <<<")
        print("Step 9 Output:", result)
        # Wrap result in a standard key
        return {"channel_copy": result}
    except Exception as e:
        print(f"ERROR in Creative Generation (LangChain): {e}")
        raw_output = None
        if hasattr(e, 'llm_output'): raw_output = e.llm_output
        elif hasattr(e, 'response'): raw_output = e.response
        return {"error": f"Failed to generate creative content via LangChain: {type(e).__name__}", "details": str(e), "raw_output": raw_output}

# ... (Optional Test Block) ...