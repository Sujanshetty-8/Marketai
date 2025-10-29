# components/step_3_db_retriever.py
import json # Optional, for pretty printing if testing directly

def get_previous_results(user_id: str) -> dict:
    """
    MOCK FUNCTION: Simulates fetching previous campaign results for a user.
    In a real application, this would query a database.
    """
    print("--- Running Step 3: DB Retriever (Mock) ---")
    print(f"Fetching previous results for user_id: {user_id}")

    # --- Mock Data Logic ---
    # Return sample data only for a specific test user ID
    if user_id == "user123_with_history": # Use a specific ID for testing the feedback loop later
        mock_data = {
            "previous_campaign_summary": "Last campaign (Diwali Sale): Facebook Ads (Budget: 3k INR, Clicks: 45, Conversions: 8, Rate: 17.8%), Pamphlets (Budget: 2k INR, Scans: 15, Conversions: 5, Rate: 33.3%). Pamphlets had higher Conversion Rate."
            # In a real DB query, you might return more structured data like:
            # "results": [
            #     {"channel": "Facebook Ads", "budget": 3000, "clicks": 45, "conversions": 8},
            #     {"channel": "Pamphlets", "budget": 2000, "scans": 15, "conversions": 5}
            # ]
        }
        print("Step 3 Output (Mock): Found previous results.")
        return mock_data
    else:
        # For any other user ID, return no history
        print("Step 3 Output (Mock): No previous results found.")
        return {"previous_campaign_summary": "No previous campaign data found."}

# --- Example Test Block (Optional) ---
# if __name__ == "__main__":
#     results1 = get_previous_results("user123_with_history")
#     print("\n--- Test User with History ---")
#     print(json.dumps(results1, indent=2))

#     results2 = get_previous_results("new_user_456")
#     print("\n--- Test User without History ---")
#     print(json.dumps(results2, indent=2))