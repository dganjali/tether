import json
import openai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set your OpenAI API key here or via environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_llm_feedback(rec):
    prompt = f"""
    As a homeless shelter management expert with expertise in data-driven decision making, analyze this situation:

    SHELTER DATA:
    - Shelter: {rec.get('shelter_name', '')}
    - Program: {rec.get('program_name', '')}
    - Date: {rec.get('date', '')}
    - Predicted occupancy: {rec.get('predicted_occupancy', '')} beds
    - Capacity: {rec.get('capacity', '')} beds
    - Excess: {rec.get('excess', '')} beds over capacity ({rec.get('excess_percentage', '')}% over capacity)
    - Severity: {rec.get('severity', '')}
    - Capacity utilization: {rec.get('capacity_utilization_rate', '')}%

    HISTORICAL CONTEXT:
    - Average occupancy: {rec.get('avg_occupancy', '')} beds
    - Maximum historical occupancy: {rec.get('max_occupancy', '')} beds
    - Average daily influx: {rec.get('avg_daily_influx', '')} beds/day
    - Maximum daily influx: {rec.get('max_daily_influx', '')} beds/day
    - Seasonal peak factor: {rec.get('seasonal_peak_factor', '')}x average
    - Occupancy volatility: {rec.get('occupancy_volatility', '')} beds

    CONTEXT:
    - Reasoning: {rec.get('reasoning', '')}
    - Action items: {rec.get('action_items', '')}

    Please provide QUANTITATIVE, DATA-DRIVEN recommendations with specific numbers based on the excess capacity prediction:

    1. RESOURCE ALLOCATION (with specific quantities):
       - How many additional blankets/sleeping bags needed?
       - How many extra meals to prepare?
       - How many additional staff hours required?
       - How much additional funding needed?

    2. CAPACITY PLANNING:
       - How many overflow beds to set up?
       - How many partner shelter beds to reserve?
       - How many temporary accommodations to arrange?

    3. STAFFING REQUIREMENTS:
       - How many additional staff members needed?
       - How many extra volunteer hours required?
       - What specific roles need additional coverage?

    4. SUPPLY CHAIN:
       - How many additional hygiene kits needed?
       - How much extra food to order?
       - How many medical supplies to stock?

    5. FINANCIAL PROJECTIONS:
       - Estimated additional costs
       - Required emergency funding
       - Resource allocation budget

    Base your recommendations on the excess capacity prediction and typical shelter resource usage patterns. Provide specific numbers and calculations where possible.
    """

    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",  # or "gpt-4" if available
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.7,
    )
    return response.choices[0].message.content

def main():
    # Load recommendations from modeling.py output
    with open("recommendations.json", "r") as f:
        recs = json.load(f)

    enhanced = []
    for rec in recs[:10]:  # Limit for demo/testing
        print(f"Processing: {rec.get('shelter_name', '')} - {rec.get('program_name', '')} on {rec.get('date', '')}")
        llm_feedback = get_llm_feedback(rec)
        rec['llm_feedback'] = llm_feedback
        enhanced.append(rec)
        print(llm_feedback)
        print("-" * 80)

    # Save enhanced recommendations
    with open("recommendations_llm.json", "w") as f:
        json.dump(enhanced, f, indent=2)
    print("Saved enhanced recommendations to recommendations_llm.json")

if __name__ == "__main__":
    main() 
