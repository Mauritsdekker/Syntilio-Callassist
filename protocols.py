"""
Protocol definitions for the AI assistant
"""

from typing import List, Dict, Any
from enum import Enum

class ProtocolType(Enum):
    LIFE_THREATENING = "life_threatening"
    SOCIAL = "social"
    APPOINTMENT = "appointment"

class Protocol:
    def __init__(
        self,
        id: str,
        type: ProtocolType,
        title: str,
        description: str,
        steps: List[Dict[str, Any]],
        keywords: List[str]
    ):
        self.id = id
        self.type = type
        self.title = title
        self.description = description
        self.steps = steps
        self.keywords = keywords

# Define the protocols
PROTOCOLS = [
    Protocol(
        id="life_threatening_1",
        type=ProtocolType.LIFE_THREATENING,
        title="Levensbedreigende Situatie",
        description="Protocol voor het handelen bij levensbedreigende situaties",
        steps=[
            {
                "title": "Beoordeel bewustzijn (AVPU)",
                "description": "Controleer of de patiënt Alert, Reageert op Verbale prikkels, Reageert op Pijn, of Niet Reageert (Unresponsive).",
                "action": "check_consciousness",
                "icon": "Info",
                "example_questions": [
                    "Is de patiënt bij bewustzijn?",
                    "Reageert de patiënt op verbale prikkels?",
                    "Reageert de patiënt op pijnprikkels?",
                    "Is de patiënt volledig bewusteloos?"
                ]
            },
            {
                "title": "Beoordeel ademhaling (Kijk, Luister, Voel)",
                "description": "Kijk naar borstbewegingen, luister naar ademgeluiden en voel of er luchtstroom is.",
                "action": "check_breathing",
                "icon": "HelpCircle",
                "example_questions": [
                    "Ziet u borstbewegingen?",
                    "Hoort u ademgeluiden?",
                    "Voelt u luchtstroom?",
                    "Is de ademhaling normaal?"
                ]
            },
            {
                "title": "Activeer spoedzorg (Bel 112)",
                "description": "Bel direct 112. Geef duidelijk de locatie, situatie en patiëntstatus door.",
                "action": "call_emergency",
                "icon": "Phone",
                "example_questions": [
                    "Moet er direct 112 gebeld worden?",
                    "Wat is de exacte locatie?",
                    "Wat is de huidige situatie?",
                    "Wat is de status van de patiënt?"
                ]
            },
            {
                "title": "Start reanimatie (indien nodig)",
                "description": "Start direct met borstcompressies en mond-op-mond beademing indien de patiënt bewusteloos is en niet normaal ademt.",
                "action": "start_cpr",
                "icon": "AlertTriangle",
                "example_questions": [
                    "Is reanimatie nodig?",
                    "Is de patiënt bewusteloos?",
                    "Ademt de patiënt normaal?",
                    "Wanneer is de reanimatie gestart?"
                ]
            }
        ],
        keywords=["niet ademen", "bewusteloos", "hartstilstand", "ernstige pijn", "bloedverlies"]
    ),
    Protocol(
        id="social_1",
        type=ProtocolType.SOCIAL,
        title="Sociale Ondersteuning",
        description="Protocol voor het ondersteunen bij sociale problematiek",
        steps=[
            {
                "title": "Inventariseer sociale situatie",
                "description": "Bespreek de huidige woonsituatie, de aanwezigheid van een sociaal netwerk en dagelijkse activiteiten.",
                "action": "assess_social_situation",
                "icon": "User",
                "example_questions": [
                    "Hoe is uw woonsituatie momenteel?",
                    "Heeft u een sociaal netwerk om u heen?",
                    "Welke dagelijkse activiteiten doet u?",
                    "Heeft u hulp nodig bij dagelijkse taken?"
                ]
            },
            {
                "title": "Bespreek psychosociale aspecten",
                "description": "Vraag naar gevoelens van eenzaamheid, somberheid of angst, en de impact hiervan op het dagelijks leven.",
                "action": "discuss_psychosocial",
                "icon": "HelpCircle",
                "example_questions": [
                    "Voelt u zich vaak eenzaam?",
                    "Heeft u last van sombere gevoelens?",
                    "Ervaart u angst of zorgen?",
                    "Hoe beïnvloedt dit uw dagelijks leven?"
                ]
            },
            {
                "title": "Identificeer beschikbare hulpmiddelen",
                "description": "Bespreek de mogelijkheden van lokale buurtcentra, welzijnsorganisaties of specifieke sociale initiatieven.",
                "action": "identify_resources",
                "icon": "FileText",
                "example_questions": [
                    "Kent u de lokale buurtcentra?",
                    "Heeft u contact met welzijnsorganisaties?",
                    "Zijn er sociale initiatieven in uw buurt?",
                    "Welke hulpmiddelen zou u willen gebruiken?"
                ]
            },
            {
                "title": "Adviseer en/of verwijs",
                "description": "Geef concrete adviezen en verwijs indien nodig door naar de juiste instanties of contactpersonen.",
                "action": "advise_refer",
                "icon": "CheckCircle",
                "example_questions": [
                    "Welke instanties kunnen u helpen?",
                    "Wilt u doorverwezen worden?",
                    "Welke vorm van ondersteuning heeft uw voorkeur?",
                    "Heeft u al contact met hulpverleners?"
                ]
            },
            {
                "title": "Maak vervolgafspraak",
                "description": "Plan een vervolggesprek om de situatie te monitoren en te evalueren of de geboden ondersteuning afdoende is.",
                "action": "schedule_followup",
                "icon": "Clock",
                "example_questions": [
                    "Wanneer kunnen we een vervolggesprek plannen?",
                    "Wat is een goed moment voor u?",
                    "Wilt u telefonisch of persoonlijk contact?",
                    "Zijn er specifieke onderwerpen voor het vervolggesprek?"
                ]
            }
        ],
        keywords=["eenzaam", "geen contact", "sociale isolatie", "hulp nodig", "ondersteuning", "welzijn"]
    ),
    Protocol(
        id="appointment_1",
        type=ProtocolType.APPOINTMENT,
        title="Afspraken Plannen",
        description="Protocol voor het plannen van zorgafspraken",
        steps=[
            {
                "title": "Bepaal zorgbehoefte",
                "description": "Identificeer de specifieke zorgbehoefte van de patiënt (bijv. huisartsbezoek, specialist, thuiszorg).",
                "action": "assess_care_needs",
                "icon": "FileText",
                "example_questions": [
                    "Voor welke zorg heeft u een afspraak nodig?",
                    "Is dit voor de huisarts of een specialist?",
                    "Heeft u thuiszorg nodig?",
                    "Wat is de urgentie van de afspraak?"
                ]
            },
            {
                "title": "Overleg patiëntvoorkeuren",
                "description": "Bespreek gewenste data, tijden en eventuele voorkeuren voor zorgverleners of locaties.",
                "action": "discuss_preferences",
                "icon": "User",
                "example_questions": [
                    "Wat zijn uw voorkeuren voor datum en tijd?",
                    "Heeft u een voorkeur voor een bepaalde zorgverlener?",
                    "Welke locatie heeft uw voorkeur?",
                    "Zijn er bijzonderheden waar we rekening mee moeten houden?"
                ]
            },
            {
                "title": "Check beschikbaarheid",
                "description": "Controleer beschikbare tijdsloten in het agenda-systeem of bij de betreffende zorgverlener.",
                "action": "check_availability",
                "icon": "Clock",
                "example_questions": [
                    "Welke tijden komen het beste uit?",
                    "Is er voldoende tijd voor het consult?",
                    "Moet er rekening gehouden worden met wachttijden?",
                    "Zijn er alternatieve tijden mogelijk?"
                ]
            },
            {
                "title": "Bevestig afspraak",
                "description": "Maak de afspraak definitief en bevestig de datum, tijd, locatie en eventuele voorbereidingen met de patiënt.",
                "action": "confirm_appointment",
                "icon": "CheckCircle",
                "example_questions": [
                    "Is deze datum en tijd goed voor u?",
                    "Wilt u een bevestiging ontvangen?",
                    "Zijn er voorbereidingen nodig?",
                    "Wilt u een herinnering voor de afspraak?"
                ]
            },
            {
                "title": "Stuur herinnering (optioneel)",
                "description": "Adviseer de patiënt een herinnering in te stellen of bied aan om een digitale afspraakbevestiging te sturen.",
                "action": "send_reminder",
                "icon": "Info",
                "example_questions": [
                    "Wilt u een herinnering ontvangen?",
                    "Via welk kanaal wilt u de herinnering?",
                    "Wanneer moet de herinnering worden verstuurd?",
                    "Wilt u een digitale bevestiging?"
                ]
            }
        ],
        keywords=["afspraak maken", "planning", "thuiszorg", "bezoek", "agenda", "consult"]
    )
]

def get_relevant_protocols(conversation_text: str) -> List[Protocol]:
    """
    Analyzes the conversation text and returns a list of relevant protocols
    """
    relevant_protocols = []
    
    for protocol in PROTOCOLS:
        # Check if any of the protocol's keywords are in the conversation
        if any(keyword.lower() in conversation_text.lower() for keyword in protocol.keywords):
            relevant_protocols.append(protocol)
    
    return relevant_protocols

def get_protocol_by_id(protocol_id: str) -> Protocol:
    """
    Returns a protocol by its ID
    """
    for protocol in PROTOCOLS:
        if protocol.id == protocol_id:
            return protocol
    return None 