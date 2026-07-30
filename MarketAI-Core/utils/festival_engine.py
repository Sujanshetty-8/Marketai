# utils/festival_engine.py
from datetime import datetime
from typing import List, Dict

FESTIVALS = [
    # National Festivals
    {"name": "Diwali", "type": "national", "months": [10, 11], "description": "Festival of Lights. Mass consumer spending, gift-buying, electronics, sweets, clothing discounts."},
    {"name": "Holi", "type": "national", "months": [3], "description": "Festival of Colors. Apparel, food items, retail promotions, colors/water toys."},
    {"name": "Independence Day", "type": "national", "months": [8], "description": "National holiday (Aug 15). Freedom sales, patriotism-themed discounts, tricolor decorations."},
    {"name": "Republic Day", "type": "national", "months": [1], "description": "National holiday (Jan 26). Republic Day sales, community campaigns."},
    {"name": "New Year Sale", "type": "national", "months": [12, 1], "description": "Year-end clearing sales, calendar gifts, fitness goals marketing."},
    {"name": "Raksha Bandhan", "type": "national", "months": [8], "description": "Sibling celebration. Sweets, gifts, jewelry, apparel, custom packaging campaigns."},
    {"name": "Dussehra / Vijayadashami", "type": "national", "months": [9, 10], "description": "Victory of good over evil. Buying new assets (cars, electronics, houses), gold purchase promotions."},
    {"name": "Eid al-Fitr", "type": "national", "months": [3, 4, 5], "description": "End of Ramadan. Apparel, sweets, food delivery, family feast discounts."},
    {"name": "Christmas Sale", "type": "national", "months": [12], "description": "Gifts, decoration, baking items, winter apparel promotions."},
    
    # Regional/State Festivals
    {"name": "Onam", "type": "regional", "regions": ["kerala", "south india"], "months": [8, 9], "description": "Harvest festival of Kerala. Traditional wear, heavy retail shopping, feasts/catering promotions."},
    {"name": "Pongal", "type": "regional", "regions": ["tamil nadu", "south india"], "months": [1], "description": "Harvest festival of Tamil Nadu. Sweet rice preparations, farm products, apparel discounts."},
    {"name": "Ugadi / Gudi Padwa", "type": "regional", "regions": ["karnataka", "maharashtra", "andhra pradesh", "telangana", "south india"], "months": [3, 4], "description": "Deccan New Year. Buying gold, home appliances, traditional clothing, sweets."},
    {"name": "Durga Puja", "type": "regional", "regions": ["west bengal", "east india", "kolkata"], "months": [9, 10], "description": "Massive celebration in Bengal. High apparel buying, restaurant dining discounts, corporate gifting."},
    {"name": "Ganesh Chaturthi", "type": "regional", "regions": ["maharashtra", "karnataka", "mumbai", "goa"], "months": [8, 9], "description": "Ganesh festival. Modak sweets, home decor, eco-friendly promotions, community banners."},
    {"name": "Chhath Puja", "type": "regional", "regions": ["bihar", "uttar pradesh", "north india"], "months": [10, 11], "description": "Devotional festival. Fruits, traditional groceries, travel/transport offers."},
    {"name": "Baisakhi", "type": "regional", "regions": ["punjab", "north india"], "months": [4], "description": "Harvest festival of Punjab. Agro-products, heavy equipment discounts, Punjabi food festivals."},
    
    # Seasonal Trends
    {"name": "Wedding Season", "type": "seasonal", "months": [11, 12, 1, 2], "description": "Apparel, jewelry, makeup artists, event management, catering, printing invites promotions."},
    {"name": "Back to School", "type": "seasonal", "months": [5, 6], "description": "Stationery, bags, shoes, uniforms, tutoring class discounts."},
    {"name": "Monsoon Clearance", "type": "seasonal", "months": [7, 8], "description": "Clearance sales, umbrellas, raincoats, indoor games promotions."}
]

def get_upcoming_festivals(location: str, campaign_start_date: str = None) -> List[Dict]:
    """
    Returns upcoming festivals and seasonal trends matching the location and campaign start date.
    """
    # Parse month
    target_month = None
    if campaign_start_date:
        try:
            # Try to parse standard ISO format (e.g., "2026-10-25")
            dt = datetime.strptime(campaign_start_date.split('T')[0], "%Y-%m-%d")
            target_month = dt.month
        except Exception:
            target_month = datetime.now().month
    else:
        target_month = datetime.now().month

    loc_lower = location.lower()
    matches = []

    for f in FESTIVALS:
        # Check month match
        month_matches = target_month in f["months"]
        
        # Check region match
        region_matches = False
        if f["type"] == "national" or f["type"] == "seasonal":
            region_matches = True
        elif "regions" in f:
            for r in f["regions"]:
                if r in loc_lower or loc_lower in r:
                    region_matches = True
                    break
        
        if month_matches and region_matches:
            matches.append(f)
            
    return matches
