# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
import asyncio # Important for async operations
import traceback # For detailed error logging


from components.step_1_input_parser import parse_input
from components.step_2_ner_extractor import extract_entities 
from components.step_3_db_retriever import get_previous_resultsP
from components.step_4_trend_analyzer import analyze_trends_via_search
from components.step_5_context_searcher import search_local_context
from components.step_6_persona_generator import generate_persona
from components.step_7_strategy_recommender import generate_strategy
from components.step_8_budget_allocator import allocate_budget 
from components.step_9_creative_writer import generate_creative 
from components.step_10_visual_prompter import generate_visual_prompts
# --- End Imports ---

app = FastAPI()

# --- Add CORS (Essential for testing from web tools) ---
from fastapi.middleware.cors import CORSMiddleware
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- End CORS ---

# Input Model
class ApiInput(BaseModel):
    business_type: str
    location: str
    goal_description: str
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    budget_fixed: Optional[int] = None
    channel_preference: str
    user_id: str

# Output Model (Define the final structure you want)
class CampaignPlan(BaseModel):
    # Define the structure based on your desired output JSON
    campaign_overview: dict
    channel_recommendations: list
    feedback_loop_note: str

@app.post("/generate_plan", response_model=CampaignPlan) # Add response_model for validation
async def run_pipeline(input_data: ApiInput):
    print("--- Raw Input Data Received ---")
    raw_input_dict = input_data.dict()
    print(json.dumps(raw_input_dict, indent=2))
    print("-------------------------------")

    final_plan = {} # Initialize

    try:
        print("\n--- Starting Pipeline ---")

        # === Step 1: Parse Input ===
        cleaned_input = parse_input(raw_input_dict)
        print("Step 1 DONE. Output:", cleaned_input)

        # === Step 2: Extract Entities ===
        entities = extract_entities(cleaned_input['goal_description'])
        print("Step 2 DONE. Output:", entities)

        # === Step 3: Get Previous Results ===
        previous_results = get_previous_results(cleaned_input['user_id'])
        print("Step 3 DONE. Output:", previous_results)

        # === Step 4: Analyze Trends ===
        trend_keywords = entities.get('products_services', []) + entities.get('misc_keywords', [])
        trend_data = await analyze_trends_via_search(trend_keywords, cleaned_input['location'])
        print("Step 4 DONE. Output:", trend_data)

        # === Step 5: Search Local Context ===
        events_list = entities.get('events', [])
        first_event = events_list[0] if events_list else None
        local_context = await search_local_context(
            str(cleaned_input.get('location', '')),
            str(cleaned_input.get('business_type', '')),
            first_event
        )
        print("Step 5 DONE. Output:", local_context)

        # === Step 6: Generate Persona ===
        audience_persona = await generate_persona(
             cleaned_input, entities, trend_data, local_context, previous_results
        )
        print("Step 6 DONE. Output:", audience_persona)
        if isinstance(audience_persona, dict) and audience_persona.get("error"): raise ValueError(f"Persona Generation Failed: {audience_persona.get('details')}")

        # === Step 7: Generate Strategy ===
        campaign_strategy = await generate_strategy(
             cleaned_input, audience_persona, local_context, previous_results
        )
        print("Step 7 DONE. Output:", campaign_strategy)
        if isinstance(campaign_strategy, dict) and campaign_strategy.get("error"): raise ValueError(f"Strategy Generation Failed: {campaign_strategy.get('details')}")

        # === Step 8: Allocate Budget ===
        recommended_channels = campaign_strategy.get('recommended_channels', [])
        print("Step 7a: Recommended Channels:", recommended_channels)
        budget_allocation_result = allocate_budget(
             cleaned_input.get('budget', 0),
             recommended_channels,
             previous_results
        )
        print("Step 8 DONE. Output:", budget_allocation_result)
        budget_split = budget_allocation_result.get("budget_split", {})
        print("Step 8a: Derived Budget Split:", budget_split)

        # === Step 9: Generate Creative Content ===
        creative_content = await generate_creative(
             campaign_strategy.get('campaign_angle', 'Default Angle'),
             audience_persona,
             recommended_channels
        )
        print("Step 9 DONE. Output:", creative_content)
        if isinstance(creative_content, dict) and creative_content.get("error"): raise ValueError(f"Creative Generation Failed: {creative_content.get('details')}")

        # === Step 10: Generate Visual Prompts ===
        visual_prompts_result = await generate_visual_prompts(
             campaign_strategy.get('campaign_angle', 'Default Angle'),
             audience_persona,
             creative_content
        )
        print("Step 10 DONE. Output:", visual_prompts_result)
        visual_prompts = visual_prompts_result.get("visual_prompts", [])
        print("Step 10a: Derived Visual Prompts List:", visual_prompts)
        if isinstance(visual_prompts_result, dict) and visual_prompts_result.get("error"): raise ValueError(f"Visual Prompt Generation Failed: {visual_prompts_result.get('details')}")

        # === Step 11: Final Aggregation ===
        print("--- Starting Aggregation ---")
        # (Build the final_plan dictionary using .get() safely as before)
        final_plan = {
            "campaign_overview": {
                "suggested_theme_name": campaign_strategy.get('campaign_angle', 'Generated Campaign'),
                "strategic_angle": campaign_strategy.get('campaign_angle', 'N/A'),
                "primary_target_audience": audience_persona,
                "timing_recommendation": trend_data.get('timing_recommendation', 'N/A'),
                "competitor_note": local_context.get('competitor_types_summary', 'N/A')
            },
            "channel_recommendations": [],
            "feedback_loop_note": previous_results.get("previous_campaign_summary", "No past data used.")
        }
        print("--- Entering Channel Loop ---")
        for channel in recommended_channels:
             channel_copy_key = channel.lower().replace(" ", "_").replace("-", "_") + "_copy"
             suggested_copy = creative_content.get('channel_copy', {}).get(channel_copy_key, "N/A")
             visual_prompt = visual_prompts[0] if visual_prompts else "No visual prompt generated."

             channel_rec = {
                 "channel_name": channel,
                 "allocated_budget": budget_split.get(channel, 0),
                 "target_audience_specifics": {"details": f"Targeting based on persona for {channel}"}, # Placeholder
                 "content": {
                     "suggested_copy": suggested_copy,
                     "visual_prompt": visual_prompt,
                     "call_to_action": f"Engage via {channel}!" # Placeholder
                 },
                 "tracking_info": { # Placeholder
                     "type": "link" if "Ads" in channel or "Online" in channel else "qr_code"
                 }
             }
             final_plan["channel_recommendations"].append(channel_rec)
        print("--- Exited Channel Loop ---")

        # --- Validate Final Output ---
        try:
            validated_plan = CampaignPlan(**final_plan) # Validate against output model
            final_plan = validated_plan.dict() # Convert back to dict if needed
        except Exception as validation_error:
             print(f"!!! FINAL PLAN VALIDATION ERROR: {validation_error} !!!")
             # Decide how to handle - maybe return error or a simplified plan
             raise HTTPException(status_code=500, detail=f"Generated plan structure invalid: {validation_error}")


        print("--- Final Plan Output ---")
        print(json.dumps(final_plan, indent=2))
        print("-----------------------")

        print("--- Pipeline Finished ---")
        return final_plan

    except ValueError as ve: # Catch manual ValueErrors (like persona gen failure)
         print(f"!!! Pipeline Step Error: {ve} !!!")
         raise HTTPException(status_code=500, detail=str(ve))
    except HTTPException as he: # Re-raise FastAPI HTTP exceptions
        raise he
    except Exception as e:
        print(f"!!! UNEXPECTED Pipeline Error: {e} !!!")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {type(e).__name__}")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "MarketAI Engine API is running!"}