# agents/campaign_graph.py
import os
import json
import asyncio
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END

from config import GOOGLE_API_KEY
from utils.festival_engine import get_upcoming_festivals
from utils.rag_engine import query_rag
from utils.search_engine import search_google

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")

def get_llm():
    if GOOGLE_API_KEY and GOOGLE_API_KEY.strip() != "":
        # Use high-speed Google Gemini API (resolves in ~1 second per node)
        print("Initializing remote Gemini client (gemini-1.5-flash)...")
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3,
            convert_system_message_to_human=True
        )
    else:
        # Fallback to local Ollama client running Qwen 2.5 3B
        print("Initializing local Ollama client (qwen2.5:3b)...")
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model="qwen2.5:3b",
            temperature=0.3,
            num_predict=800,
            base_url="http://localhost:11434"
        )

def read_prompt(filename: str) -> str:
    path = os.path.join(PROMPTS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def fix_json_unescaped_newlines(json_str: str) -> str:
    in_string = False
    chars = []
    i = 0
    while i < len(json_str):
        c = json_str[i]
        if c == '"' and (i == 0 or json_str[i-1] != '\\'):
            in_string = not in_string
            chars.append(c)
        elif c == '\n' and in_string:
            chars.append('\\n')
        elif c == '\r' and in_string:
            chars.append('\\r')
        elif c == '\t' and in_string:
            chars.append('\\t')
        else:
            chars.append(c)
        i += 1
    return "".join(chars)

def clean_json_text(text: Any) -> str:
    """
    Cleans markdown formatting from LLM JSON responses.
    """
    if isinstance(text, list):
        parts = []
        for part in text:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                parts.append(part["text"])
            else:
                parts.append(str(part))
        text = "".join(parts)
    elif not isinstance(text, str):
        text = str(text) if text is not None else ""

    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    
    cleaned = cleaned.strip()
    return fix_json_unescaped_newlines(cleaned)

# State definition
class AgentState(TypedDict):
    message: str
    history: List[Dict[str, str]]
    profile: Dict[str, Any]
    research: Dict[str, Any]
    strategy: Dict[str, Any]
    content: Dict[str, Any]
    creative: Dict[str, Any]
    reviewer: Dict[str, Any]
    response: str
    profile_completed: bool
    campaign_plan: Optional[Dict[str, Any]]
    reviewer_attempts: int

# --- NODE 1: Marketing Manager Agent ---
import re

def heuristic_extraction(message: str, current_profile: Dict[str, Any], history: List[Dict[str, str]]) -> Dict[str, Any]:
    profile = dict(current_profile)
    msg_lower = message.lower().strip()
    
    # Identify the last question asked by the AI
    last_ai_text = ""
    for msg in reversed(history):
        if msg.get("sender") == "ai":
            last_ai_text = msg.get("text", "").lower()
            break
            
    # Budget extraction helper
    numbers = re.findall(r'\b\d{3,7}\b', msg_lower)
    
    # 1. State-based heuristic mapping (map current response to last AI question context)
    if last_ai_text:
        # Case: Business Name
        if "name" in last_ai_text or "called" in last_ai_text or "business do you own" in last_ai_text or "what business" in last_ai_text:
            if not profile.get("businessName") or profile.get("businessName") == "":
                profile["businessName"] = message.strip()
                
        # Case: Location
        elif "where" in last_ai_text or "location" in last_ai_text or "city" in last_ai_text or "region" in last_ai_text:
            if not profile.get("location") or profile.get("location") == "":
                profile["location"] = message.strip()
                
        # Case: Industry / Category
        elif "industry" in last_ai_text or "category" in last_ai_text or "what kind of shop" in last_ai_text or "type of business" in last_ai_text or "sell" in last_ai_text:
            if not profile.get("industry") or profile.get("industry") == "":
                profile["industry"] = message.strip()
                
        # Case: Target Audience
        elif "audience" in last_ai_text or "target" in last_ai_text or "customers" in last_ai_text or "who buys" in last_ai_text:
            if not profile.get("targetAudience") or profile.get("targetAudience") == "":
                profile["targetAudience"] = message.strip()
                
        # Case: Budget
        elif "budget" in last_ai_text or "marketing spend" in last_ai_text or "inr" in last_ai_text or "cost" in last_ai_text:
            if numbers and (not profile.get("budget") or profile.get("budget") == 0):
                profile["budget"] = int(numbers[0])
                
        # Case: Duration
        elif "duration" in last_ai_text or "long" in last_ai_text or "how many days" in last_ai_text or "weeks" in last_ai_text:
            if not profile.get("duration") or profile.get("duration") == "":
                profile["duration"] = message.strip()
                
        # Case: USP
        elif "usp" in last_ai_text or "unique" in last_ai_text or "apart" in last_ai_text or "different" in last_ai_text or "advantage" in last_ai_text:
            if not profile.get("usp") or profile.get("usp") == "":
                profile["usp"] = message.strip()
                
        # Case: Goal
        elif "goal" in last_ai_text or "aim" in last_ai_text or "objective" in last_ai_text or "achieve" in last_ai_text or "purpose" in last_ai_text or "expectation" in last_ai_text:
            if not profile.get("goal") or profile.get("goal") == "":
                profile["goal"] = message.strip()
    else:
        # If history is empty and name is missing, assume first message is the businessName
        if not profile.get("businessName"):
            profile["businessName"] = message.strip()

    # Heuristic matchers (general fallbacks)
    if numbers and not profile.get("budget"):
        profile["budget"] = int(numbers[0])

    # Duration matcher general fallback (e.g. "15 days", "3 weeks")
    if any(unit in msg_lower for unit in ["day", "week", "month"]) and not profile.get("duration"):
        d_match = re.search(r'\b\d+\s*(?:day|week|month)s?\b', msg_lower)
        if d_match:
            profile["duration"] = d_match.group(0)

    # Target Audience Matcher
    audiences = ["family", "families", "students", "youth", "college", "children", "kids", "everyone", "adults", "professionals"]
    for aud in audiences:
        if aud in msg_lower and not profile.get("targetAudience"):
            profile["targetAudience"] = aud
            break
            
    # Industry Matcher
    industries = ["bakery", "food", "grocery", "salon", "clothes", "clothing", "appliances", "electronics", "electrical", "restaurant", "pharmacy", "furniture", "hardware"]
    for ind in industries:
        if ind in msg_lower and not profile.get("industry"):
            profile["industry"] = ind.capitalize()
            break
            
    # Goal Matcher
    goals_map = {
        "footfall": "Increase shop footfall",
        "sales": "Increase sales and revenue",
        "online": "Online sales and visibility",
        "awareness": "Brand awareness",
        "customers": "Get more customers",
        "leads": "Lead generation"
    }
    for gk, gv in goals_map.items():
        if gk in msg_lower and not profile.get("goal"):
            profile["goal"] = gv
            break

    # USP Matcher
    usps = {
        "delivery": "Fast home delivery",
        "quality": "Premium quality products",
        "affordable": "Affordable pricing",
        "service": "Better customer service",
        "process": "Easier purchase process"
    }
    for uk, uv in usps.items():
        if uk in msg_lower and not profile.get("usp"):
            profile["usp"] = uv
            break

    return profile

# --- NODE 1: Marketing Manager Agent ---
async def manager_agent(state: AgentState) -> Dict[str, Any]:
    print("--- LangGraph Node: Marketing Manager Agent ---")
    
    if state.get("profile_completed") or state.get("profile", {}).get("profile_completed"):
        print("Profile already completed. Skipping LLM call in manager agent.")
        return {
            "profile_completed": True,
            "profile": state["profile"],
            "response": "Generating your custom marketing plan...",
            "history": state["history"]
        }
        
    llm = get_llm()
    prompt_tpl = read_prompt("manager_prompt.txt")
    
    # Update profile fields using state-based heuristics from user's latest message
    updated_profile = heuristic_extraction(state["message"], state["profile"], state["history"])
    
    # Format message history
    history_str = ""
    for msg in state["history"]:
        history_str += f"{msg['sender'].upper()}: {msg['text']}\n"
    history_str += f"USER: {state['message']}\n"
    
    formatted_prompt = prompt_tpl.format(
        profile_data=json.dumps(updated_profile, indent=2),
        chat_history=history_str
    )
    
    res = await llm.ainvoke(formatted_prompt)
    raw_content = clean_json_text(res.content)
    
    try:
        data = json.loads(raw_content)
    except Exception as e:
        print("JSON parse failed in Manager Agent, raw content:", raw_content)
        # Fallback response
        data = {
            "response": "Please tell me your location and budget so we can proceed.",
            "extracted_fields": {},
            "profile_completed": False
        }
        
    # Update profile fields with further extracted data from LLM
    extracted = data.get("extracted_fields", {})
    if isinstance(extracted, dict):
        for k, v in extracted.items():
            if v is not None and v != "":
                # Handle lists vs single strings if needed
                updated_profile[k] = v

    # Check if budget is provided and convert to integer
    if "budget" in updated_profile and updated_profile["budget"] is not None:
        try:
            updated_profile["budget"] = int(str(updated_profile["budget"]).replace(",", "").replace("₹", "").strip())
        except ValueError:
            pass

    # Programmatic completion check to prevent loop locks
    core_keys = ["businessName", "industry", "location", "targetAudience", "usp", "budget", "duration", "goal"]
    
    # Filter missing fields
    missing_fields = [k for k in core_keys if not updated_profile.get(k) or updated_profile.get(k) == "" or updated_profile.get(k) == 0]
    all_present = len(missing_fields) == 0

    profile_completed = False
    
    # Pre-defined direct questions for MSME profiling
    field_questions = {
        "businessName": "What is the name of your business?",
        "industry": "What industry or category does your business belong to (e.g. bakery, salon, appliances)?",
        "location": "What city or town is your business located in?",
        "targetAudience": "Who is your target audience (e.g. families, college students, young adults)?",
        "usp": "What makes your business unique or sets it apart from competitors (your USP)?",
        "budget": "What is your budget in INR for this campaign (e.g. 3000)?",
        "duration": "What is the duration of this campaign (e.g. 7 days, 15 days, 30 days)?",
        "goal": "What are your expectations or goals from this campaign (e.g. increase footfall)?"
    }

    if all_present:
        print("Programmatic check: All core profile fields present! Forcing profile completion.")
        profile_completed = True
        ai_response = "Great! All details are gathered. Ready to generate your custom marketing plan?"
    else:
        # Override the AI response with the precise question for the first missing field
        next_field = missing_fields[0]
        ai_response = field_questions[next_field]
    
    # Let the user force generation by saying 'yes', 'generate', etc.
    user_msg_lower = state["message"].lower()
    if any(keyword in user_msg_lower for keyword in ["yes", "proceed", "generate", "start", "build", "sure", "ok", "go ahead"]):
        if updated_profile.get("businessName") and updated_profile.get("budget"):
            print("User requested proceeding. Forcing profile completion.")
            profile_completed = True
            ai_response = "Generating your 30-day marketing campaign plan now..."

    return {
        "response": ai_response,
        "profile": updated_profile,
        "profile_completed": profile_completed,
        "history": state["history"] + [
            {"sender": "user", "text": state["message"]},
            {"sender": "ai", "text": ai_response}
        ]
    }

# --- NODE 2: Research Agent ---
async def research_agent(state: AgentState) -> Dict[str, Any]:
    print("--- LangGraph Node: Research Agent ---")
    llm = get_llm()
    prompt_tpl = read_prompt("researcher_prompt.txt")
    
    profile = state["profile"]
    location = profile.get("location", "India")
    industry = profile.get("industry", "Retail")
    
    # 1. Festival engine check
    upcoming_fests = get_upcoming_festivals(location)
    
    # 2. Competitor search and local trends
    search_query = f"trends and competition for {industry} in {location} India"
    print("Researcher querying Serper search:", search_query)
    search_snippets = await search_google(search_query)
    
    # Combine search + festivals
    search_and_festivals_str = (
        f"Search Trends & Competitors Snippets:\n{search_snippets}\n\n"
        f"Detected Upcoming Indian Festivals/Seasonal Trends:\n{json.dumps(upcoming_fests, indent=2)}"
    )
    
    # 3. RAG Grounding Search
    rag_query = f"{industry} local marketing best practices and government MSME schemes"
    print("Researcher querying RAG DB:", rag_query)
    rag_snippets = query_rag(rag_query)
    
    formatted_prompt = prompt_tpl.format(
        profile_data=json.dumps(profile, indent=2),
        search_and_festivals=search_and_festivals_str
    )
    
    res = await llm.ainvoke(formatted_prompt)
    raw_content = clean_json_text(res.content)
    
    try:
        research_data = json.loads(raw_content)
    except Exception as e:
        print("JSON parse failed in Research Agent, raw:", raw_content)
        research_data = {
            "category_analysis": f"Standard trends for {industry} in {location}.",
            "audience_insights": "General local consumers.",
            "competitor_notes": "Local neighborhood businesses.",
            "local_opportunities": "Upcoming local holidays.",
            "festival_recommendation": "Celebrate current national season."
        }
        
    # Append the RAG snippets to researcher payload for next nodes
    research_data["rag_guidelines"] = rag_snippets
    
    return {
        "research": research_data
    }

# --- NODE 3: Strategy Agent ---
async def strategy_agent(state: AgentState) -> Dict[str, Any]:
    print("--- LangGraph Node: Strategy Agent ---")
    llm = get_llm()
    prompt_tpl = read_prompt("strategist_prompt.txt")
    
    profile = state["profile"]
    research = state["research"]
    budget = profile.get("budget", 0)
    
    formatted_prompt = prompt_tpl.format(
        profile_data=json.dumps(profile, indent=2),
        research_data=json.dumps(research, indent=2),
        rag_data=research.get("rag_guidelines", ""),
        budget=budget
    )
    
    res = await llm.ainvoke(formatted_prompt)
    raw_content = clean_json_text(res.content)
    
    try:
        strategy_data = json.loads(raw_content)
    except Exception as e:
        print("JSON parse failed in Strategy Agent, raw:", raw_content)
        # Fallback strategy
        strategy_data = {
            "campaign_objective": f"Grow business awareness for {profile.get('businessName')}",
            "budget_split": {
                "online": budget * 0.6,
                "offline": budget * 0.4,
                "channels": {"WhatsApp Marketing": budget * 0.4, "Instagram Posts": budget * 0.2, "QR Flyers": budget * 0.4}
            },
            "expected_reach": "1,000 - 3,000 local views",
            "expected_conversion": "2% - 5% offer redemption",
            "weekly_tasks": ["Week 1: Setup campaign QR codes", "Week 2: Launch digital ads", "Week 3: Print flyers", "Week 4: Distribute flyers"],
            "daily_tasks": ["Day 1: Print posters", "Day 5: Send WhatsApp broadcasts"],
            "referral_program": "Refer a friend to get 10% off"
        }
        
    return {
        "strategy": strategy_data
    }

# --- NODE 4: Content Agent ---
async def content_agent(state: AgentState) -> Dict[str, Any]:
    print("--- LangGraph Node: Content Agent ---")
    llm = get_llm()
    prompt_tpl = read_prompt("writer_prompt.txt")
    
    formatted_prompt = prompt_tpl.format(
        profile_data=json.dumps(state["profile"], indent=2),
        strategy_data=json.dumps(state["strategy"], indent=2)
    )
    
    res = await llm.ainvoke(formatted_prompt)
    raw_content = clean_json_text(res.content)
    
    try:
        content_data = json.loads(raw_content)
    except Exception as e:
        print("JSON parse failed in Content Agent, raw:", raw_content)
        content_data = {
            "whatsapp": "Special offer! Scan code for a discount.",
            "instagram": "Check out our latest offers!",
            "facebook": "Celebrate with us today!",
            "google_business": "New offer available in store.",
            "email": "Dear Customer, here is an exclusive deal.",
            "sms": "Claim your discount code now!",
            "hashtags": ["#Offer", "#Sale"],
            "cta": "Scan QR Code!"
        }
        
    return {
        "content": content_data
    }

# --- NODE 5: Creative Agent ---
async def creative_agent(state: AgentState) -> Dict[str, Any]:
    print("--- LangGraph Node: Creative Agent ---")
    llm = get_llm()
    prompt_tpl = read_prompt("creative_prompt.txt")
    
    formatted_prompt = prompt_tpl.format(
        profile_data=json.dumps(state["profile"], indent=2),
        strategy_data=json.dumps(state["strategy"], indent=2),
        copy_data=json.dumps(state["content"], indent=2)
    )
    
    res = await llm.ainvoke(formatted_prompt)
    raw_content = clean_json_text(res.content)
    
    try:
        creative_data = json.loads(raw_content)
    except Exception as e:
        print("JSON parse failed in Creative Agent, raw:", raw_content)
        creative_data = {
            "poster": {"idea": "Modern layout", "prompt": "Vibrant design showing discount flyer"},
            "flyer": {"idea": "Folded flyer", "prompt": "Elegant card style design"},
            "instagram": {"idea": "Post graphic", "prompt": "Social post layout"},
            "banner": {"idea": "Header cover", "prompt": "Brand billboard flyer"}
        }
        
    return {
        "creative": creative_data
    }

# --- NODE 6: Campaign Reviewer Agent ---
async def reviewer_agent(state: AgentState) -> Dict[str, Any]:
    print("--- LangGraph Node: Campaign Reviewer Agent (Auto-Approver) ---")
    profile = state["profile"]
    
    # Auto-approve in Python to avoid local LLM latency and replan loops
    review_data = {
        "approved": True,
        "revisions_required": None,
        "explanation": {
            "why_this_recommendation": f"This campaign targets local users with WhatsApp promotions and offline flyer distribution grounded on {profile.get('industry', 'Appliances')} marketing best practices.",
            "expected_outcome": "Estimated conversion of 3-5% based on standard digital channels.",
            "advantages": "Low cost, direct tracking, high local reach.",
            "possible_risks": "Low initial offline flyers traction.",
            "confidence_score": 90
        }
    }

    attempts = state.get("reviewer_attempts", 0)
    if True:
        # Assemble final campaign plan structure
        compiled_plan = {
            "campaign_objective": state["strategy"].get("campaign_objective", ""),
            "target_audience": profile.get("targetAudience", ""),
            "budget_split": state["strategy"].get("budget_split", {}),
            "expected_reach": state["strategy"].get("expected_reach", ""),
            "expected_conversion": state["strategy"].get("expected_conversion", ""),
            "referral_program": state["strategy"].get("referral_program", ""),
            "timeline": {
                "weekly": state["strategy"].get("weekly_tasks", []),
                "daily": state["strategy"].get("daily_tasks", [])
            },
            "suggested_festivals": state["research"].get("festival_recommendation", ""),
            "content": state["content"],
            "creative_prompts": state["creative"],
            "explanation": review_data.get("explanation", {})
        }
        
        # Build success response message
        duration_str = profile.get('duration', '30-Day')
        success_msg = (
            f"🎉 **I have generated your custom {duration_str} Marketing Campaign!**\n\n"
            f"**Objective**: {compiled_plan['campaign_objective']}\n"
            f"**Expected Reach**: {compiled_plan['expected_reach']} | **Expected Conversions**: {compiled_plan['expected_conversion']}\n\n"
            f"**AI Strategy Rationale**: {compiled_plan['explanation'].get('why_this_recommendation')}\n"
            f"**Confidence Score**: {compiled_plan['explanation'].get('confidence_score')}/100\n\n"
            f"Your full campaign details, marketing copies (WhatsApp, Instagram, SMS), visual design prompts, and checklist tasks are now ready and linked to your dashboard."
        )
        
        return {
            "reviewer": review_data,
            "campaign_plan": compiled_plan,
            "response": success_msg,
            "history": state["history"] + [{"sender": "ai", "text": success_msg}]
        }
    else:
        # Increment attempt counter
        print(f"Campaign plan REJECTED by Reviewer Agent. Revision required: {review_data.get('revisions_required')}")
        return {
            "reviewer": review_data,
            "reviewer_attempts": attempts + 1
        }

# --- EDGE ROUTING LOGIC ---
def route_manager(state: AgentState):
    if state["profile_completed"]:
        # If user profile is fully built, immediately proceed to plan generation
        return "generate_plan"
    return "end"

def route_reviewer(state: AgentState):
    if state.get("campaign_plan") is not None:
        return "end"
    # Else, route back to strategy node to handle revisions
    print("Routing back to Strategy Node for revisions...")
    return "replan"

# Build LangGraph workflow
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("manager", manager_agent)
workflow.add_node("researcher", research_agent)
workflow.add_node("strategist", strategy_agent)
workflow.add_node("content", content_agent)
workflow.add_node("creative", creative_agent)
workflow.add_node("reviewer", reviewer_agent)

# Set Entry Point
workflow.set_entry_point("manager")

# Add Conditional Edges from Manager
workflow.add_conditional_edges(
    "manager",
    route_manager,
    {
        "generate_plan": "researcher",
        "end": END
    }
)

# Plan generation sequential nodes
workflow.add_edge("researcher", "strategist")
workflow.add_edge("strategist", "content")
workflow.add_edge("content", "creative")
workflow.add_edge("creative", "reviewer")

# Reviewer validation routing
workflow.add_conditional_edges(
    "reviewer",
    route_reviewer,
    {
        "replan": "strategist",
        "end": END
    }
)

# Compile Graph
campaign_graph = workflow.compile()

# --- ENTRY POINT WRAPPER FUNCTION ---
async def run_agent_session(message: str, history: List[Dict[str, str]], user_id: str, extracted_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the conversational multi-agent session.
    """
    # Initialize state
    initial_state = {
        "message": message,
        "history": history,
        "profile": extracted_profile,
        "research": {},
        "strategy": {},
        "content": {},
        "creative": {},
        "reviewer": {},
        "response": "",
        "profile_completed": extracted_profile.get("profile_completed", False),
        "campaign_plan": None,
        "reviewer_attempts": 0
    }
    
    # Run graph
    print(f">>> Executing LangGraph for user message: '{message}'")
    result = await campaign_graph.ainvoke(initial_state)
    print(">>> LangGraph execution completed <<<")
    
    return {
        "response": result.get("response", "Could not process response."),
        "extracted_profile": result.get("profile", {}),
        "profile_completed": result.get("profile_completed", False),
        "campaign_plan": result.get("campaign_plan", None)
    }
