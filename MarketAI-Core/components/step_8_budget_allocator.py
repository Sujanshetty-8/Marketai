# components/step_8_budget_allocator.py
import json # Used only if parsing complex previous_results needed

def allocate_budget(total_budget: int, recommended_channels: list[str], previous_results: dict) -> dict:
    """
    Allocates the total budget across recommended channels using rule-based logic.
    Simple MVP: Splits mostly equally, with a basic boost for previously successful channels.
    """
    print("--- Running Step 8: Budget Allocator ---")
    split = {}
    num_channels = len(recommended_channels)

    if num_channels == 0 or total_budget <= 0:
        print("Step 8 Output: No channels or budget to allocate.")
        return {"budget_split": {}}

    # --- Basic Logic to Identify potentially high ROI channel from summary ---
    high_roi_channel = None
    if previous_results and "previous_campaign_summary" in previous_results:
        summary = previous_results["previous_campaign_summary"]
        if "highest Conversion Rate" in summary:
            parts = summary.split(" had the highest Conversion Rate")
            if len(parts) > 0:
                words_before = parts[0].split()
                if words_before:
                    potential_channel = words_before[-1]
                    # Check if this potential channel is in our current recommendations
                    for rec_channel in recommended_channels:
                         # Simple check if the name is contained (e.g., "Pamphlets" matches "Pamphlets")
                        if potential_channel in rec_channel:
                             high_roi_channel = rec_channel
                             break
        if high_roi_channel:
             print(f"  (Budget logic: Identified '{high_roi_channel}' as potentially high ROI from past results.)")

    # --- Allocation Logic ---
    base_allocation = total_budget // num_channels
    remainder = total_budget % num_channels
    adjusted_allocations = {}

    # Initial equal split + remainder distribution
    for i, channel in enumerate(recommended_channels):
        adjusted_allocations[channel] = base_allocation + (1 if i < remainder else 0)

    # Apply boost if high ROI channel found and more than one channel
    if high_roi_channel and high_roi_channel in adjusted_allocations and num_channels > 1:
        # Calculate boost relative to base, capped at making it ~50% higher than base max
        max_boost = base_allocation // 2
        intended_boost = int(adjusted_allocations[high_roi_channel] * 0.2) # Try 20% boost
        boost_amount = min(max_boost, intended_boost)

        # Calculate how much to take from other channels proportionally
        total_other_budget = total_budget - adjusted_allocations[high_roi_channel]
        if total_other_budget > 0:
            actual_boost_taken = 0
            reductions = {}
            for channel in recommended_channels:
                if channel != high_roi_channel:
                    # Reduce proportionally, but don't take more than, say, 30%
                    proportion = adjusted_allocations[channel] / total_other_budget
                    reduction = min(int(boost_amount * proportion), int(adjusted_allocations[channel] * 0.3))
                    reductions[channel] = reduction
                    actual_boost_taken += reduction

            # Apply reductions and boost
            if actual_boost_taken > 0:
                 print(f"  (Budget logic: Boosting '{high_roi_channel}' by {actual_boost_taken}, reducing others proportionally)")
                 adjusted_allocations[high_roi_channel] += actual_boost_taken
                 for channel, reduction in reductions.items():
                     adjusted_allocations[channel] -= reduction

    # Final check to ensure total matches exactly
    current_total = sum(adjusted_allocations.values())
    diff = total_budget - current_total
    if diff != 0 and adjusted_allocations:
         # Add/remove difference from the channel with the largest allocation
         target_channel = max(adjusted_allocations, key=adjusted_allocations.get)
         adjusted_allocations[target_channel] += diff
         print(f"  (Budget logic: Final adjustment of {diff} applied to '{target_channel}')")

    # Ensure no channel has negative budget (safety check)
    for channel in adjusted_allocations:
        if adjusted_allocations[channel] < 0: adjusted_allocations[channel] = 0
    # Recalculate diff if negatives were zeroed (rare case)
    current_total = sum(adjusted_allocations.values())
    diff = total_budget - current_total
    if diff != 0 and adjusted_allocations:
         target_channel = max(adjusted_allocations, key=adjusted_allocations.get)
         adjusted_allocations[target_channel] += diff


    print(f"Step 8 Output: Budget Split - {adjusted_allocations}")
    return {"budget_split": adjusted_allocations}