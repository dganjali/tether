import json
import openai
import os
import sys
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

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # or "gpt-4" if available
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API error: {e}", file=sys.stderr)
        return generate_fallback_recommendations(rec)

def generate_fallback_recommendations(rec):
    """Generate fallback recommendations when OpenAI API is not available"""
    excess = rec.get('excess', 0)
    severity = rec.get('severity', 'LOW')
    
    recommendations = {
        'LOW': f"""1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: {excess}
   - Extra meals to prepare: {excess * 3}
   - Additional staff hours required: {excess * 8}
   - Additional funding needed: ${excess * 50}

2. CAPACITY PLANNING:
   - Overflow beds to set up: {excess}
   - Partner shelter beds to reserve: {max(0, excess - 2)}
   - Temporary accommodations to arrange: 0

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: {max(1, excess // 5)}
   - Extra volunteer hours required: {excess * 4}
   - Specific roles needing additional coverage: Overnight staff

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: {excess}
   - Extra food to order: {excess * 3} meals
   - Medical supplies to stock: Basic first aid supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: ${excess * 100}
   - Required emergency funding: ${excess * 200}
   - Resource allocation budget: ${excess * 300}""",
        
        'MEDIUM': f"""1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: {excess}
   - Extra meals to prepare: {excess * 3}
   - Additional staff hours required: {excess * 12}
   - Additional funding needed: ${excess * 75}

2. CAPACITY PLANNING:
   - Overflow beds to set up: {excess + 2}
   - Partner shelter beds to reserve: {excess + 5}
   - Temporary accommodations to arrange: {max(1, excess // 2)}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: {max(1, excess // 3)}
   - Extra volunteer hours required: {excess * 6}
   - Specific roles needing additional coverage: Overnight staff, kitchen staff

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: {excess + 2}
   - Extra food to order: {excess * 4} meals
   - Medical supplies to stock: Enhanced first aid supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: ${excess * 150}
   - Required emergency funding: ${excess * 300}
   - Resource allocation budget: ${excess * 450}""",
        
        'HIGH': f"""1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: {excess}
   - Extra meals to prepare: {excess * 3}
   - Additional staff hours required: {excess * 16}
   - Additional funding needed: ${excess * 100}

2. CAPACITY PLANNING:
   - Overflow beds to set up: {excess + 5}
   - Partner shelter beds to reserve: {excess + 10}
   - Temporary accommodations to arrange: {excess}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: {max(1, excess // 2)}
   - Extra volunteer hours required: {excess * 8}
   - Specific roles needing additional coverage: All staff roles

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: {excess + 5}
   - Extra food to order: {excess * 5} meals
   - Medical supplies to stock: Comprehensive medical supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: ${excess * 200}
   - Required emergency funding: ${excess * 400}
   - Resource allocation budget: ${excess * 600}"""
    }
    
    return recommendations.get(severity, recommendations['LOW'])

def main():
    # Check if input data is provided as command line argument
    if len(sys.argv) > 1:
        try:
            # Parse the JSON input from command line
            input_data = json.loads(sys.argv[1])
            llm_feedback = get_llm_feedback(input_data)
            print(llm_feedback)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON input: {e}", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"Error processing input: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Original functionality for batch processing
        try:
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
        except FileNotFoundError:
            print("recommendations.json not found. Please run modeling.py first.", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main() 
