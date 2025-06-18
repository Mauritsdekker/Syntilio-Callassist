"""
Patient dossier voor Karel Groenendijk
Dit is een fictief dossier voor testdoeleinden
"""

from openai import OpenAI
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

client = OpenAI(api_key=api_key)

PATIENT_DOSSIER = {
    "patient_id": "P123456",
    "naam": "Karel Groenendijk",
    "geboortedatum": "15-07-1960",
    "geslacht": "Man",
    "adres": "Kastanjelaan 42, 1234 AB Amsterdam",
    "telefoon": "+31638880128",
    "huisarts": "Dr. J. de Vries",
    "huisarts_telefoon": "020-7654321",
    
    "medische_geschiedenis": [
        {
            "datum": "2020-05-15",
            "diagnose": "Type 2 Diabetes Mellitus",
            "behandeling": "Metformine 1000mg 2x daags",
            "status": "Actief"
        },
        {
            "datum": "2019-11-20",
            "diagnose": "Hypertensie",
            "behandeling": "Amlodipine 5mg 1x daags",
            "status": "Actief"
        },
        {
            "datum": "2018-03-10",
            "diagnose": "COPD",
            "behandeling": "Salbutamol inhalator, gebruik bij benauwdheid",
            "status": "Actief"
        }
    ],
    
    "allergieen": [
        {
            "stof": "Penicilline",
            "reactie": "Anafylactische shock",
            "ernst": "Hoog"
        }
    ],
    
    "medicatie": [
        {
            "naam": "Metformine",
            "dosering": "1000mg",
            "frequentie": "2x daags",
            "reden": "Type 2 Diabetes"
        },
        {
            "naam": "Amlodipine",
            "dosering": "5mg",
            "frequentie": "1x daags",
            "reden": "Hypertensie"
        },
        {
            "naam": "Salbutamol inhalator",
            "dosering": "100mcg/dosis",
            "frequentie": "Bij benauwdheid",
            "reden": "COPD"
        }
    ],
    
    "laatste_controles": [
        {
            "datum": "2024-01-15",
            "type": "Diabetes controle",
            "resultaat": "HbA1c: 7.2% (licht verhoogd)",
            "actie": "Dosering Metformine aangepast"
        },
        {
            "datum": "2024-01-15",
            "type": "Bloeddruk controle",
            "resultaat": "145/85 mmHg",
            "actie": "Amlodipine dosering verhoogd"
        }
    ],
    
    "risicofactoren": [
        "Roken (gestopt 2018)",
        "Overgewicht (BMI 28)",
        "Sedentaire levensstijl",
        "Familiegeschiedenis hart- en vaatziekten"
    ],
    
    "sociale_situatie": {
        "woonsituatie": "Alleenstaand",
        "mobiliteit": "Beperkt door COPD",
        "zorgbehoefte": "Geen formele zorg",
        "ondersteuning": "Dochter woont in de buurt, helpt met boodschappen",
        "apparaten": "Medido medicijndispenser, bloeddrukmeter, glucometer"
    },
    
    "voorkeuren": {
        "taal": "Nederlands",
        "religie": "Christelijk",
        "wensen_medische_zorg": "Geen reanimatie bij terminale situatie"
    }
}

async def generate_ecd_summary(websocket=None):
    """
    Genereert een ECD samenvatting van het patiëntendossier met behulp van OpenAI
    Zal de volledige samenvatting sturen, zonder streaming.
    """
    try:
        if websocket:
            # Send initial message to indicate summary generation has started
            await websocket.send_text(json.dumps({
                "type": "ecd_summary_start"
            }))

        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{
                "role": "system",
                "content": "Je bent een medisch assistent die ECD samenvattingen maakt."
            }, {
                "role": "user",
                "content": f"""Maak een korte, professionele ECD samenvatting van dit patiëntendossier.
Gebruik medische terminologie en focus op de belangrijkste punten.
Formatteer de samenvatting in het volgende formaat, waarbij je een emoji MOET gebruiken voor elk kopje:

SAMENVATTING:
[Korte samenvatting van de belangrijkste medische situatie]

ACTIEVE PROBLEMEN:
- [Lijst van actieve problemen]

MEDICATIE:
- [Lijst van actuele medicatie]

BELANGRIJKE AANDACHTSPUNTEN:
- [Lijst van belangrijke aandachtspunten]

Patiëntendossier:
{get_patient_context()}"""
            }],
            stream=False, # Set stream to False
            temperature=0.7
        )
        
        full_response = response.choices[0].message.content
        
        if websocket:
            try:
                # Send complete message with full summary
                await websocket.send_text(json.dumps({
                    "type": "ecd_summary_complete",
                    "summary": full_response
                }))
                print("Sent complete summary")  # Debug logging
            except Exception as e:
                print(f"Error sending ECD summary complete: {e}")
                raise
            
        return full_response
            
    except Exception as e:
        print(f"Error generating ECD summary: {str(e)}")
        if websocket:
            try:
                await websocket.send_text(json.dumps({
                    "type": "ecd_summary_error",
                    "error": str(e)
                }))
            except:
                pass
        return "Fout bij genereren samenvatting"

def get_patient_context():
    """
    Retourneert een geformatteerde string met de relevante patiëntinformatie
    voor de triagist
    """
    dossier = PATIENT_DOSSIER
    
    context = f"""
PATIËNT DOSSIER: {dossier['naam']} (ID: {dossier['patient_id']})
Geboortedatum: {dossier['geboortedatum']}

ACTIEVE AANDOENINGEN:
{chr(10).join([f"- {m['diagnose']} (sinds {m['datum']}): {m['behandeling']}" for m in dossier['medische_geschiedenis'] if m['status'] == 'Actief'])}

ACTUELE MEDICATIE:
{chr(10).join([f"- {m['naam']} {m['dosering']} {m['frequentie']} ({m['reden']})" for m in dossier['medicatie']])}

ALLERGIEËN:
{chr(10).join([f"- {a['stof']}: {a['reactie']} ({a['ernst']})" for a in dossier['allergieen']])}

RECENTE CONTROLES:
{chr(10).join([f"- {c['datum']}: {c['type']} - {c['resultaat']}" for c in dossier['laatste_controles']])}

BELANGRIJKE RISICOFACTOREN:
{chr(10).join([f"- {factor}" for factor in dossier['risicofactoren']])}

SOCIALE SITUATIE:
- {dossier['sociale_situatie']['woonsituatie']}
- Mobiliteit: {dossier['sociale_situatie']['mobiliteit']}
- Ondersteuning: {dossier['sociale_situatie']['ondersteuning']}

VOORKEUREN:
- Taal: {dossier['voorkeuren']['taal']}
- Wensen medische zorg: {dossier['voorkeuren']['wensen_medische_zorg']}
"""
    return context 