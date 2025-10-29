# components/step_7_strategy_recommender.py
import json
import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI # Use LangChain's integration
from config import GOOGLE_API_KEY

# --- Initialize LLM using LangChain's integration ---
# Use a strong reasoning model. Pro is better for strategy than Flash.
try:
    if GOOGLE_API_KEY:
        # Use the specific model name confirmed to work
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", # <--- Using Pro for better reasoning
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3, # Lower temp for more deterministic strategy
            convert_system_message_to_human=True
        )
        print("LangChain ChatGoogleGenerativeAI Client Initialized in strategy_recommender (gemini-1.5-pro-latest).")
    else:
        print("ERROR: GOOGLE_API_KEY not found in config for strategy_recommender.")
        llm = None
except Exception as e:
    print(f"ERROR: Failed to initialize ChatGoogleGenerativeAI in strategy_recommender: {e}")
    llm = None
# --- End LLM Init ---

# --- Define Desired JSON Output Structure ---
class CampaignStrategy(BaseModel):
    recommended_channels: list[str] = Field(description="List of 1-3 marketing channels recommended for this campaign (e.g., 'Facebook Local Ads', 'Pamphlets', 'WhatsApp Promotion').")
    budget_split: dict = Field(description="Dictionary allocating the total budget across recommended channels (e.g., {'Facebook Local Ads': 3000, 'Pamphlets': 2000}). Ensure integer values that sum exactly to the total budget provided.")
    campaign_angle: str = Field(description="A short, catchy strategic theme or angle for the campaign based on goals, audience, and competitor context.")
    justification: str = Field(description="A 2-3 sentence explanation justifying the channel and budget choices, explicitly referencing audience insights, local context, competitor notes, and previous results if available.")

# --- Setup Output Parser ---
parser = JsonOutputParser(pydantic_object=CampaignStrategy)

# --- Define the Prompt Template ---
strategy_prompt_template = """
You are a data-driven marketing strategist specializing in low-budget (~₹5k-20k INR), hyper-local campaigns for Indian MSMEs (like cafes, local shops).
Analyze the following inputs to recommend the optimal channel mix, specific budget split (must sum exactly to total budget), and a core campaign angle.

**Input Data:**
- User Input & Goal: {user_input}
- Audience Persona: {audience_persona}
- Local Context & Trends: {local_context}
- Previous Campaign Results: {previous_results}
- Total Budget: {total_budget} INR
- User Channel Preference: {channel_preference}

**Instructions:**
1.  **Channel Mix:**
    * If User Preference is 'Online Only', recommend 1-3 online channels suitable for the budget and audience.
    * If User Preference is 'Offline Only', recommend 1-3 offline channels suitable for the budget and audience (e.g., Pamphlets, Local Banners, In-store Signage).
    * If User Preference is 'Both' OR 'AI Recommend', **you MUST recommend at least ONE online channel AND at least ONE offline channel**, aiming for a total of 2-3 channels overall, provided the budget feasibly supports this mix. If budget is extremely low (e.g., < ₹3000), prioritize the single most impactful channel based on context and past results.
    * Choose *specific* channels (e.g., 'Facebook Local Ads', 'Instagram Stories Ads', 'WhatsApp Broadcast (Manual)', 'Pamphlet Distribution near Colleges', 'Banner at Local Market').
2.  **Budget Split:** Allocate the `{total_budget}` INR across the `recommended_channels`. Ensure budget values are integers and sum **exactly** to the total budget.
3.  **Past Results:** **Heavily weight** your channel and budget recommendations based on the `Previous Campaign Results`. Prioritize channels with proven high conversion rates. Explicitly mention how past results influenced your decision in the justification. If past results are unavailable, rely on audience preferences and general MSME best practices.
4.  **Justification:** Provide a 2-3 sentence rationale explaining the channel choices and budget split, referencing the audience, context, budget constraints, and *especially* past performance.
5.  **Campaign Angle:** Suggest a short, catchy strategic theme for the campaign.

**Output Format Instructions:**
Strictly follow this JSON format:
{format_instructions}

Generate the campaign strategy JSON:
"""

# --- Create LangChain Prompt ---
strategy_prompt = ChatPromptTemplate.from_template(
    strategy_prompt_template,
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# --- Create the LangChain Chain ---
strategy_chain = strategy_prompt | llm | parser if llm else None

# --- Define the Asynchronous Function ---
async def generate_strategy(user_input: dict, audience_persona: dict, local_context: dict, previous_results: dict) -> dict:
    """
    Generates the Campaign Strategy JSON using the LangChain chain.
    """
    print("--- Running Step 7: Strategy Recommender (LangChain) ---")
    if not strategy_chain:
         return {"error": "Strategy generation chain not initialized."}

    try:
        total_budget = user_input.get('budget', 5000) # Get cleaned budget
        channel_preference = user_input.get('channel_preference', 'AI Recommend')

        # Prepare inputs
        chain_input = {
            "user_input": json.dumps(user_input, default=str),
            "audience_persona": json.dumps(audience_persona, default=str),
            "local_context": json.dumps(local_context, default=str),
            "previous_results": json.dumps(previous_results, default=str),
            "total_budget": total_budget,
            "channel_preference": channel_preference
        }

        print(">>> Invoking LangChain chain for Strategy...")
        # Invoke the chain asynchronously
        result = await strategy_chain.ainvoke(chain_input)

        # --- Post-Processing: Ensure Budget Sums Correctly ---
        # LLMs might make small rounding errors with budget splits.
        if isinstance(result, dict) and 'budget_split' in result and result['budget_split']:
            calculated_total = sum(result['budget_split'].values())
            budget_diff = total_budget - calculated_total

            if budget_diff != 0:
                print(f"Adjusting budget split total by {budget_diff} from {calculated_total} to {total_budget}")
                # Add/subtract the difference to the largest allocated channel
                if result['budget_split']: # Check if not empty
                    largest_channel = max(result['budget_split'], key=result['budget_split'].get)
                    result['budget_split'][largest_channel] += budget_diff
                    # Ensure no negative budgets after adjustment (unlikely but possible)
                    if result['budget_split'][largest_channel] < 0:
                        # Fallback: Re-split equally if adjustment fails badly
                         print("Warning: Budget adjustment failed, re-splitting equally.")
                         num_channels = len(result['recommended_channels'])
                         base = total_budget // num_channels
                         rem = total_budget % num_channels
                         new_split = {}
                         for i, ch in enumerate(result['recommended_channels']):
                             new_split[ch] = base + (1 if i < rem else 0)
                         result['budget_split'] = new_split

        print(">>> LangChain Strategy DONE <<<")
        print("Step 7 Output:", result)
        return result
    except Exception as e:
        print(f"ERROR in Strategy Generation (LangChain): {e}")
        # import traceback # Uncomment for detailed debugging
        # traceback.print_exc()
        raw_output = None
        if hasattr(e, 'llm_output'): raw_output = e.llm_output
        elif hasattr(e, 'response'): raw_output = e.response
        return {"error": f"Failed to generate strategy via LangChain: {type(e).__name__}", "details": str(e), "raw_output": raw_output}

