# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import traceback

from fastapi.middleware.cors import CORSMiddleware

# New Agents and RAG imports
from agents.campaign_graph import run_agent_session
from utils.rag_engine import initialize_rag

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to initialize RAG
@app.on_event("startup")
def startup_event():
    print("--- Startup: Initializing RAG System ---")
    initialize_rag()

# Input model for conversational AI Consultant
class ChatInput(BaseModel):
    message: str
    history: List[Dict[str, str]]
    user_id: str
    extracted_profile: Dict[str, Any]

@app.post("/chat")
async def chat_endpoint(input_data: ChatInput):
    try:
        print("--- /chat endpoint called ---")
        print(f"User Message: {input_data.message}")
        print(f"Extracted Profile state: {input_data.extracted_profile}")
        
        result = await run_agent_session(
            message=input_data.message,
            history=input_data.history,
            user_id=input_data.user_id,
            extracted_profile=input_data.extracted_profile
        )
        return result
    except Exception as e:
        print(f"ERROR in chat_endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "MarketAI Engine API is running!"}