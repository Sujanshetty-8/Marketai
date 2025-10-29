# components/step_2_ner_extractor.py
import spacy
import json # For potentially pretty printing if testing directly

# Load the spaCy model once when the module is imported
# This assumes 'en_core_web_sm' was downloaded successfully after installation
try:
    nlp = spacy.load("en_core_web_sm")
    print("spaCy model 'en_core_web_sm' loaded successfully.")
except OSError:
    print("ERROR: spaCy model 'en_core_web_sm' not found.")
    print("Please run: python -m spacy download en_core_web_sm")
    # Define nlp as None so the function can handle the error gracefully
    nlp = None

def extract_entities(goal_description: str) -> dict:
    """
    Extracts named entities and potential keywords from the campaign goal description.
    """
    print("--- Running Step 2: NER Extractor ---")
    if not nlp:
        print("spaCy model not loaded. Skipping entity extraction.")
        return {"error": "spaCy model not available"}

    if not isinstance(goal_description, str) or not goal_description.strip():
        print("Warning: Empty or invalid goal description provided.")
        return {} # Return empty dict for empty input

    doc = nlp(goal_description)
    entities = {
        "locations": [],
        "events": [],
        "products_services": [], # Typically tagged as PRODUCT or sometimes ORG/WORK_OF_ART
        "target_groups": [], # Often tagged as PERSON or NORP (Nationalities/Groups)
        "dates_times": [], # DATE, TIME
        "orgs": [], # ORG (Organizations, companies)
        "misc_keywords": [] # Other potentially relevant nouns/proper nouns
    }

    processed_texts = set() # To avoid duplicates from different entity types

    # Extract named entities identified by spaCy
    for ent in doc.ents:
        label = ent.label_
        text = ent.text.strip().lower()
        if not text or text in processed_texts: # Skip empty or already processed
            continue

        processed_texts.add(text) # Add to processed set

        if label in ["GPE", "LOC"]: # Geographical Entity, Location
            entities["locations"].append(text)
        elif label == "EVENT":
            entities["events"].append(text)
        elif label == "PRODUCT":
            entities["products_services"].append(text)
        elif label in ["PERSON", "NORP"]: # Person (can include groups), Nationalities/Religious/Political groups
            entities["target_groups"].append(text)
        elif label in ["DATE", "TIME"]:
            entities["dates_times"].append(text)
        elif label == "ORG":
            entities["orgs"].append(text)
        # You can add more specific label mappings if needed (e.g., MONEY, QUANTITY)
        else:
             # Add other relevant entity types if useful, otherwise ignore
             pass
             # entities["misc_keywords"].append(f"{text} ({label})") # Optional: include label

    # Extract potential keywords (nouns/proper nouns) not caught as named entities
    for token in doc:
        # Check if it's a noun or proper noun, not a stop word, and not already captured
        if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop and token.lemma_.lower() not in processed_texts:
            keyword = token.lemma_.lower() # Use lemma for base form
            entities["misc_keywords"].append(keyword)
            processed_texts.add(keyword) # Add lemma to avoid duplicates

            # Simple check for offer terms (could be improved)
            if "discount" in keyword or "sale" in keyword or "offer" in keyword or "%" in token.text:
                if "offer_terms" not in entities: entities["offer_terms"] = []
                entities["offer_terms"].append(token.text) # Keep original text for offers

    # Basic deduplication again just in case lemmas matched original entities etc.
    for key in entities:
        entities[key] = sorted(list(set(entities[key])))

    print("Step 2 Output:", entities)
    return entities

