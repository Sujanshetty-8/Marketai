# components/step_1_input_parser.py
from pydantic import BaseModel, validator
from typing import Optional

# Keep the Pydantic model here for validation, but main.py defines the API input model
class _CampaignInputInternal(BaseModel):
    business_type: str
    location: str
    goal_description: str
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    budget_fixed: Optional[int] = None
    channel_preference: str
    user_id: str

    @validator('channel_preference')
    def check_channel_preference(cls, v):
        allowed = ["Online", "Offline", "Both", "AI Recommend"]
        if v not in allowed:
            raise ValueError(f"channel_preference must be one of {allowed}")
        return v

def parse_input(raw_input: dict) -> dict:
    print("--- Running Step 1: Input Parser ---")
    try:
        # Validate input using internal model first
        validated_input = _CampaignInputInternal(**raw_input)
        cleaned_data = validated_input.dict()

        # Standardize budget
        if cleaned_data.get('budget_fixed') is not None:
            cleaned_data['budget'] = cleaned_data['budget_fixed']
        elif cleaned_data.get('budget_min') is not None and cleaned_data.get('budget_max') is not None:
            cleaned_data['budget'] = (cleaned_data['budget_min'] + cleaned_data['budget_max']) // 2
        elif cleaned_data.get('budget_min') is not None:
            cleaned_data['budget'] = cleaned_data['budget_min']
        else:
            # Set a default budget if none provided or handle as error
            cleaned_data['budget'] = 5000 # Default if no budget info
            print("Warning: No budget provided, defaulting to 5000.")
            # raise ValueError("Budget information (fixed, min/max, or min) is required.")

        # Remove redundant fields for cleaner downstream processing
        cleaned_data.pop('budget_min', None)
        cleaned_data.pop('budget_max', None)
        cleaned_data.pop('budget_fixed', None)

        print("Step 1 Output: ", cleaned_data)
        return cleaned_data
    except Exception as e:
        print(f"Error during input parsing: {e}")
        # Re-raise or return an error structure
        raise ValueError(f"Input Parsing Failed: {e}")