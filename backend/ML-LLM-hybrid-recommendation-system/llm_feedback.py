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
    As a homeless shelter management expert with expertise in data-driven decision making, analyze this situation and provide QUANTITATIVE, SPECIFIC recommendations:

    SHELTER DATA:
    - Shelter: {rec.get('shelter_name', '')}
    - Predicted occupancy: {rec.get('predicted_occupancy', '')} beds
    - Capacity: {rec.get('capacity', '')} beds
    - Excess: {rec.get('excess', '')} beds over capacity ({rec.get('excess_percentage', '')}% over capacity)
    - Severity: {rec.get('severity', '')}
    - Capacity utilization: {rec.get('capacity_utilization_rate', '')}%

    HISTORICAL CONTEXT (if available):
    - Average occupancy: {rec.get('avg_occupancy', 'N/A')} beds
    - Maximum historical occupancy: {rec.get('max_occupancy', 'N/A')} beds
    - Average daily influx: {rec.get('avg_daily_influx', 'N/A')} beds/day
    - Maximum daily influx: {rec.get('max_daily_influx', 'N/A')} beds/day
    - Seasonal peak factor: {rec.get('seasonal_peak_factor', 'N/A')}x average
    - Occupancy volatility: {rec.get('occupancy_volatility', 'N/A')} beds

    Based on this data, provide SPECIFIC, QUANTITATIVE recommendations with exact numbers:

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
       - What medical supplies to stock?

    5. FINANCIAL PROJECTIONS:
       - Estimated additional costs
       - Required emergency funding
       - Resource allocation budget

    IMPORTANT: Provide specific numbers and calculations. Base your recommendations on the excess capacity prediction and typical shelter resource usage patterns. Use realistic multipliers based on the severity level.
    """

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API error: {e}", file=sys.stderr)
        return generate_fallback_recommendations(rec)

def generate_fallback_recommendations(rec):
    """Generate fallback recommendations when OpenAI API is not available"""
    excess = rec.get('excess', 0)
    severity = rec.get('severity', 'LOW')
    predicted_occupancy = rec.get('predicted_occupancy', 0)
    capacity = rec.get('capacity', 0)
    
    # Calculate realistic resource requirements
    base_meals_per_person = 3
    base_staff_hours_per_person = 8
    base_funding_per_person = 50
    base_hygiene_kits_per_person = 1
    
    # Adjust based on severity
    severity_multiplier = 1.5 if severity == 'HIGH' else 1.2 if severity == 'MEDIUM' else 1.0
    
    additional_meals = max(1, int(excess * base_meals_per_person * severity_multiplier))
    additional_staff_hours = max(1, int(excess * base_staff_hours_per_person * severity_multiplier))
    additional_funding = max(1, int(excess * base_funding_per_person * severity_multiplier))
    additional_hygiene_kits = max(1, int(excess * base_hygiene_kits_per_person * severity_multiplier))
    
    # Calculate overflow and partner arrangements
    overflow_beds = excess + (5 if severity == 'HIGH' else 2 if severity == 'MEDIUM' else 0)
    partner_beds = excess + (10 if severity == 'HIGH' else 5 if severity == 'MEDIUM' else max(0, excess - 2))
    temp_accommodations = excess if severity == 'HIGH' else (excess // 2 if severity == 'MEDIUM' else 0)
    
    # Calculate staffing requirements
    additional_staff = max(1, excess // (2 if severity == 'HIGH' else 3 if severity == 'MEDIUM' else 5))
    volunteer_hours = excess * (8 if severity == 'HIGH' else 6 if severity == 'MEDIUM' else 4)
    
    # Calculate financial projections
    estimated_costs = additional_funding * 2
    emergency_funding = additional_funding * 4
    resource_budget = additional_funding * 6
    
    recommendations = {
        'LOW': f"""1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: {excess}
   - Extra meals to prepare: {additional_meals} (3 per person × {excess} people × {severity_multiplier:.1f}x multiplier)
   - Additional staff hours required: {additional_staff_hours} hours
   - Additional funding needed: ${additional_funding}

2. CAPACITY PLANNING:
   - Overflow beds to set up: {overflow_beds}
   - Partner shelter beds to reserve: {partner_beds}
   - Temporary accommodations to arrange: {temp_accommodations}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: {additional_staff}
   - Extra volunteer hours required: {volunteer_hours} hours
   - Specific roles needing additional coverage: Overnight staff

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: {additional_hygiene_kits}
   - Extra food to order: {additional_meals} meals
   - Medical supplies to stock: Basic first aid supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: ${estimated_costs}
   - Required emergency funding: ${emergency_funding}
   - Resource allocation budget: ${resource_budget}

CALCULATION BASIS:
- Severity multiplier: {severity_multiplier:.1f}x
- Base meals per person: {base_meals_per_person}
- Base staff hours per person: {base_staff_hours_per_person}
- Base funding per person: ${base_funding_per_person}""",
        
        'MEDIUM': f"""1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: {excess}
   - Extra meals to prepare: {additional_meals} (3 per person × {excess} people × {severity_multiplier:.1f}x multiplier)
   - Additional staff hours required: {additional_staff_hours} hours
   - Additional funding needed: ${additional_funding}

2. CAPACITY PLANNING:
   - Overflow beds to set up: {overflow_beds}
   - Partner shelter beds to reserve: {partner_beds}
   - Temporary accommodations to arrange: {temp_accommodations}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: {additional_staff}
   - Extra volunteer hours required: {volunteer_hours} hours
   - Specific roles needing additional coverage: Overnight staff, kitchen staff

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: {additional_hygiene_kits}
   - Extra food to order: {additional_meals} meals
   - Medical supplies to stock: Enhanced first aid supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: ${estimated_costs}
   - Required emergency funding: ${emergency_funding}
   - Resource allocation budget: ${resource_budget}

CALCULATION BASIS:
- Severity multiplier: {severity_multiplier:.1f}x
- Base meals per person: {base_meals_per_person}
- Base staff hours per person: {base_staff_hours_per_person}
- Base funding per person: ${base_funding_per_person}""",
        
        'HIGH': f"""1. RESOURCE ALLOCATION:
   - Additional blankets/sleeping bags needed: {excess}
   - Extra meals to prepare: {additional_meals} (3 per person × {excess} people × {severity_multiplier:.1f}x multiplier)
   - Additional staff hours required: {additional_staff_hours} hours
   - Additional funding needed: ${additional_funding}

2. CAPACITY PLANNING:
   - Overflow beds to set up: {overflow_beds}
   - Partner shelter beds to reserve: {partner_beds}
   - Temporary accommodations to arrange: {temp_accommodations}

3. STAFFING REQUIREMENTS:
   - Additional staff members needed: {additional_staff}
   - Extra volunteer hours required: {volunteer_hours} hours
   - Specific roles needing additional coverage: All staff roles

4. SUPPLY CHAIN:
   - Additional hygiene kits needed: {additional_hygiene_kits}
   - Extra food to order: {additional_meals} meals
   - Medical supplies to stock: Comprehensive medical supplies

5. FINANCIAL PROJECTIONS:
   - Estimated additional costs: ${estimated_costs}
   - Required emergency funding: ${emergency_funding}
   - Resource allocation budget: ${resource_budget}

CALCULATION BASIS:
- Severity multiplier: {severity_multiplier:.1f}x
- Base meals per person: {base_meals_per_person}
- Base staff hours per person: {base_staff_hours_per_person}
- Base funding per person: ${base_funding_per_person}"""
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
