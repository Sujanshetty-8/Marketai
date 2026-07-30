# utils/rag_engine.py
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import GOOGLE_API_KEY

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_data")

_vectorstore = None

def get_embeddings():
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY missing in config.py")
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=GOOGLE_API_KEY
    )

def initialize_rag():
    """
    Initializes Chroma DB. If files exist in knowledge_data and db is not indexed, indexes them.
    """
    global _vectorstore
    
    try:
        embeddings = get_embeddings()
    except Exception as e:
        print(f"RAG WARNING: Embedding service initialization failed: {e}. RAG queries will fallback to keyword matching.")
        return False
        
    if os.path.exists(DB_DIR) and len(os.listdir(DB_DIR)) > 0:
        print("RAG: Loading existing vector database from", DB_DIR)
        _vectorstore = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
        return True

    print("RAG: Creating new vector database at", DB_DIR)
    if not os.path.exists(KNOWLEDGE_DIR):
        print("RAG ERROR: knowledge_data directory does not exist.")
        return False

    documents_content = []
    for filename in os.listdir(KNOWLEDGE_DIR):
        if filename.endswith(".txt"):
            filepath = os.path.join(KNOWLEDGE_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                documents_content.append(f.read())

    if not documents_content:
        print("RAG WARNING: No text documents found in knowledge_data.")
        return False

    # Text Splitting
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    texts = text_splitter.create_documents(documents_content)

    # Index
    try:
        _vectorstore = Chroma.from_documents(texts, embeddings, persist_directory=DB_DIR)
        print(f"RAG: Indexed {len(texts)} chunks successfully in ChromaDB.")
        return True
    except Exception as ex:
        print(f"RAG ERROR: Failed to index documents in Chroma DB: {ex}")
        return False

def query_rag(query: str, k: int = 2) -> str:
    """
    Queries the vector database. Fallback to basic string matching if Chroma DB fails.
    """
    global _vectorstore
    
    if _vectorstore is None:
        initialized = initialize_rag()
        if not initialized or _vectorstore is None:
            # Fallback to local keyword search
            return mock_keyword_search(query)

    try:
        results = _vectorstore.similarity_search(query, k=k)
        if not results:
            return "No relevant marketing instructions retrieved."
        return "\n\n".join([doc.page_content for doc in results])
    except Exception as e:
        print(f"RAG Query failed, falling back to keyword search: {e}")
        return mock_keyword_search(query)

def mock_keyword_search(query: str) -> str:
    """
    Lightweight fallback search in case ChromaDB has issue or API key fails.
    """
    if not os.path.exists(KNOWLEDGE_DIR):
        return "No marketing context available."
        
    query_words = [w.lower() for w in query.split() if len(w) > 3]
    chunks = []
    
    for filename in os.listdir(KNOWLEDGE_DIR):
        if filename.endswith(".txt"):
            filepath = os.path.join(KNOWLEDGE_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                # Split content by double newline into small paragraphs
                paras = content.split("\n\n")
                for p in paras:
                    p_lower = p.lower()
                    score = sum(1 for word in query_words if word in p_lower)
                    if score > 0:
                        chunks.append((score, p))
                        
    if not chunks:
        return "Standard MSME marketing guidelines apply."
        
    # Sort by score descending and take top 2
    chunks.sort(key=lambda x: x[0], reverse=True)
    return "\n\n".join([c[1] for c in chunks[:2]])
