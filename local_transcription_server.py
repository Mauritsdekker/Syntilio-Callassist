from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import websockets
import argparse
import wave
import pyaudio
import aiohttp
import sys
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from collections import deque
from openai import OpenAI
from patient_dossier import get_patient_context, generate_ecd_summary
import threading
from protocols import get_relevant_protocols, ProtocolType

# Load environment variables
load_dotenv()

print("INFO: Running local_transcription_server v2 with diarization, utterance logging and live suggestions")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

# Initialize the client exactly like example.py
client = OpenAI(api_key=api_key)

# Conversation buffer settings
CONVERSATION_BUFFER_SIZE = 50  # Increased from 20 to 100 utterances to ensure we have enough data for summary
CONVERSATION_BUFFER_TIME = 300  # Increased from 60 to 300 seconds (5 minutes) to capture full conversation
SUGGESTION_INTERVAL = 5  # Seconds between suggestion updates

# Add keepalive settings
KEEPALIVE_INTERVAL = 10  # Reduced from 10 to 5 seconds
KEEPALIVE_TIMEOUT = 5   # Reduced from 5 to 3 seconds

class ConversationBuffer:
    def __init__(self):
        self.utterances = deque(maxlen=CONVERSATION_BUFFER_SIZE)
        self.last_suggestion_time = datetime.now()
        self.patient_context = get_patient_context()  # Store patient context once
        self.ecd_summary = "Samenvatting wordt geladen..."  # Initial placeholder
        self.suggestions = []  # Store suggestions
    
    def add_utterance(self, speaker, text, timestamp):
        self.utterances.append({
            'speaker': speaker,
            'text': text,
            'timestamp': timestamp
        })
    
    def get_recent_conversation(self):
        # Get utterances from the last CONVERSATION_BUFFER_TIME seconds
        cutoff_time = datetime.now() - timedelta(seconds=CONVERSATION_BUFFER_TIME)
        recent = [u for u in self.utterances if u['timestamp'] > cutoff_time]
        return recent
    
    def format_for_ai(self):
        recent = self.get_recent_conversation()
        if not recent:
            return ""
        
        formatted = []
        for u in recent:
            speaker = f"Speaker {u['speaker']}" if u['speaker'] is not None else "Unknown"
            formatted.append(f"{speaker}: {u['text']}")
        
        return "\n".join(formatted)

    def get_full_transcript(self):
        """Get the complete transcript formatted for the summary"""
        formatted = []
        for u in self.utterances:
            speaker = f"Speaker {u['speaker']}" if u['speaker'] is not None else "Unknown"
            timestamp = u['timestamp'].strftime('%H:%M:%S')
            formatted.append(f"[{timestamp}] {speaker}: {u['text']}")
        return "\n".join(formatted)

def ecd_summary_worker(client_ws, stop_event):
    """Worker thread for generating ECD summary"""
    try:
        print(f"[Backend] Starting ECD summary generation in background at {datetime.now().strftime('%H:%M:%S.%f')}")
        # Create a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Run the summary generation in the new event loop
        summary_content = loop.run_until_complete(generate_ecd_summary(client_ws))
        print(f"[Backend] ECD summary generation completed at {datetime.now().strftime('%H:%M:%S.%f')}. Length: {len(summary_content)}")
    except Exception as e:
        print(f"[Backend] Error generating ECD summary: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
        try:
            loop = asyncio.get_event_loop()
            loop.run_until_complete(client_ws.send_text(json.dumps({
                "type": "ecd_summary_error",
                "error": str(e)
            })))
        except:
            pass
    finally:
        loop.close()

async def get_ai_suggestions(conversation_text, patient_context, client_ws, conversation_buffer):
    if not conversation_text:
        return []
    
    try:
        print(f"[Backend] Requesting AI suggestions for conversation (first 100 chars): {conversation_text[:100]}... at {datetime.now().strftime('%H:%M:%S.%f')}")
        
        # Check for relevant protocols
        relevant_protocols = get_relevant_protocols(conversation_text)
        
        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{
                "role": "system",
                "content": "Je bent een AI-assistent voor medische triagisten. Analyseer het gesprek en geef suggesties."
            }, {
                "role": "user",
                "content": f"""BELANGRIJKE PATIËNTINFORMATIE:
{patient_context}

INSTRUCTIES:
- Gebruik de patiëntinformatie om relevante suggesties te geven
- Let op mogelijke interacties met bestaande medicatie
- Geef korte, praktische suggesties
- Focus op veiligheid en protocollen
- Gebruik Nederlandse taal, niveau B1
- Categoriseer als: warning (rood), info (geel), question (blauw)
- Prioriteit: high, medium, low

BELANGRIJK: Voor de 'ecdReference', **MOET** je een *exacte, ongewijzigde zin* uit het verstrekte PATIËNTDOSSIER kopiëren. **PARAFASEER NOOIT. GEBRUIK DE ZIN LETTERLIJK, WOORD VOOR WOORD.**
Bijvoorbeeld, als de zin in het dossier is: "Salbutamol inhalator, gebruik bij benauwdheid", dan moet de 'ecdReference' exact die zin zijn, dus: "Salbutamol inhalator, gebruik bij benauwdheid".

Antwoord ALLEEN met een JSON array in dit exacte formaat:
[{{"type": "warning", "text": "Suggestie tekst", "priority": "high", "ecdReference": "Exacte zin uit ECD als bron", "ecdReferenceDate": "JJJJ-MM-DD", "ecdReferenceSource": "Bron uit ECD (bijv. Patiëntinformatie ECD P123456)"}}]

Analyseer dit gesprek en geef suggesties:
{conversation_text}"""
            }]
        )
        
        if response.choices[0].message.content:
            try:
                suggestions = json.loads(response.choices[0].message.content)
                
                # Add protocol suggestions if any are relevant
                for protocol in relevant_protocols:
                    protocol_suggestion = {
                        "type": "protocol",
                        "text": f"Relevant protocol: {protocol.title}",
                        "priority": "high" if protocol.type == ProtocolType.LIFE_THREATENING else "medium",
                        "protocol_id": protocol.id,
                        "protocol_type": protocol.type.value,
                        "protocol_description": protocol.description,
                        "steps": protocol.steps  # The steps already contain their own example_questions
                    }
                    suggestions.append(protocol_suggestion)
                
                # Store suggestions in conversation buffer
                conversation_buffer.suggestions = suggestions
                
                print(f"[Backend] Received suggestions: {suggestions} at {datetime.now().strftime('%H:%M:%S.%f')}")
                # Send complete suggestions to frontend
                await client_ws.send_text(json.dumps({
                    "type": "suggestions",
                    "suggestions": suggestions
                }))
                return suggestions
            except json.JSONDecodeError:
                print(f"[Backend] Error parsing suggestions JSON: {response.choices[0].message.content} at {datetime.now().strftime('%H:%M:%S.%f')}")
                return []
            
        return []
            
    except Exception as e:
        print(f"[Backend] Error getting AI suggestions: {str(e)} at {datetime.now().strftime('%H:%M:%S.%f')}")
        return []

async def sender(websocket, method, input_source):
    if method == 'wav':
        with wave.open(input_source, 'rb') as wav_file:
            while True:
                data = wav_file.readframes(1024)
                if not data:
                    break
                await websocket.send(data)
    elif method == 'mic':
        print(f"[Backend] Initializing PyAudio at {datetime.now().strftime('%H:%M:%S.%f')}")
        p = pyaudio.PyAudio()
        print(f"[Backend] PyAudio initialized. Opening stream... at {datetime.now().strftime('%H:%M:%S.%f')}")
        stream = p.open(format=pyaudio.paInt16,
                       channels=1,
                       rate=16000,
                       input=True,
                       frames_per_buffer=512)
        print(f"[Backend] PyAudio stream opened at {datetime.now().strftime('%H:%M:%S.%f')}.")
        try:
            print(f"[Backend] Starting microphone audio stream at {datetime.now().strftime('%H:%M:%S.%f')}.")
            while True:
                data = stream.read(1024)
                # print(f"Read {len(data)} bytes from mic") # Optional: detailed data logging
                await websocket.send(data)
        except KeyboardInterrupt:
            print(f"[Backend] Microphone stream stopped by user at {datetime.now().strftime('%H:%M:%S.%f')}.")
            stream.stop_stream()
            stream.close()
            p.terminate()
        except Exception as e:
            print(f"[Backend] Error in microphone sender: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
    elif method == 'url':
        async with aiohttp.ClientSession() as session:
            async with session.get(input_source) as response:
                while True:
                    chunk = await response.content.read(1024)
                    if not chunk:
                        break
                    await websocket.send(chunk)

async def send_keepalive(websocket):
    """Send periodic keepalive messages to keep the connection alive"""
    while True:
        try:
            await websocket.ping()
            await asyncio.sleep(KEEPALIVE_INTERVAL)
        except Exception as e:
            print(f"[Backend] Error sending keepalive: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
            break

async def suggestion_worker(conversation_buffer, client_ws, stop_event):
    """Background worker that periodically generates and sends suggestions"""
    last_suggestion_time = datetime.now()
    last_conversation_length = 0
    
    while not stop_event.is_set():
        try:
            current_time = datetime.now()
            current_conversation = conversation_buffer.get_recent_conversation()
            current_length = len(current_conversation)
            
            # Generate new suggestions if:
            # 1. We have new content (current_length > last_conversation_length)
            # 2. We haven't requested suggestions too recently (at least 5 seconds ago)
            if current_length > last_conversation_length and (current_time - last_suggestion_time).total_seconds() >= SUGGESTION_INTERVAL:
                print(f"[Backend] New content detected for suggestions: {current_length} utterances (previous: {last_conversation_length}) at {datetime.now().strftime('%H:%M:%S.%f')}")
                
                # Get recent conversation and generate suggestions
                conversation_text = conversation_buffer.format_for_ai()
                if conversation_text:
                    print(f"[Backend] Getting AI suggestions for conversation at {datetime.now().strftime('%H:%M:%S.%f')}")
                    # Pass conversation_buffer to get_ai_suggestions
                    suggestions = await get_ai_suggestions(conversation_text, conversation_buffer.patient_context, client_ws, conversation_buffer)
                    
                    # Update last suggestion time and conversation length
                    last_suggestion_time = current_time
                    last_conversation_length = current_length
            
            # Sleep for a short time to prevent busy waiting
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"[Backend] Error in suggestion worker: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
            await asyncio.sleep(1)  # Sleep before retrying

async def generate_conversation_summary(conversation_buffer: ConversationBuffer, client_ws: WebSocket, summary_type: str = 'report'):
    try:
        print(f"[Backend] Starting to generate {summary_type} summary at {datetime.now().strftime('%H:%M:%S.%f')}")
        
        # Notify client that summary generation has started
        await client_ws.send_text(json.dumps({
            "type": "conversation_summary_start"
        }))

        # Get the full transcript
        transcript = conversation_buffer.get_full_transcript()
        
        # Prepare the prompt based on summary type
        if summary_type == 'followup':
            system_prompt = """Je bent een ervaren zorgverlener die een professioneel overdrachtsbericht opstelt voor de opvolging (bijv. thuiszorg).
            Het bericht moet:
            - Professioneel en zakelijk zijn
            - Alle relevante medische en zorginformatie bevatten
            - Duidelijke instructies voor de opvolging bevatten
            - Concrete afspraken en vervolgstappen vermelden
            - Direct bruikbaar zijn voor de zorgverleners die de opvolging doen
            
            Gebruik professionele medische terminologie waar gepast, maar zorg dat het bericht duidelijk en volledig is."""
            
            user_prompt = f"""Maak een overdrachtsbericht voor de opvolging op basis van dit gesprek:

            {transcript}

            Formatteer het bericht EXACT als volgt:

            Geachte collega,

            SAMENVATTING
            [Korte, duidelijke samenvatting van het gesprek en de belangrijkste medische/zorgpunten]

            AFSPRAKEN
            [Lijst van gemaakte afspraken en overeenkomsten, inclusief data en tijden. ALLEEN ALS DEZE BENOEMT ZIJN IN HET GESPREK]

            INSTRUCTIES
            [Specifieke zorginstructies en aandachtspunten voor de opvolging]

            MEDICATIE
            [Actuele medicatie-overzicht, inclusief dosering, frequentie en eventuele wijzigingen]

            VOLGENDE STAPPEN
            [Concrete vervolgstappen en afspraken voor de opvolging. ALLEEN ALS DEZE BENOEMT ZIJN IN HET GESPREK]

            Met vriendelijke groet,
            [Naam zorgverlener]"""
        else:  # Default to report format
            system_prompt = """Je bent een ervaren medisch verslaggever die een professioneel ECD-verslag opstelt volgens de SOAP-methode.
            Focus op objectiviteit, feitelijke nauwkeurigheid en gebruik medische terminologie waar gepast.
            Zorg dat het verslag direct bruikbaar is voor zowel ECD-rapportage als overdracht naar wijkverpleging."""
            
            user_prompt = f"""Maak een professioneel ECD-verslag op basis van dit gesprek:

            {transcript}

            Formatteer het verslag als volgt:

            PATIËNTINFORMATIE
            [Basis patiëntgegevens en relevante medische informatie]

            REDEN VAN CONTACT
            [Aanleiding voor het gesprek]

            SUBJECTIEF
            [Klachten en symptomen zoals beschreven door de patiënt]

            OBJECTIEF
            [Waarnemingen en bevindingen]

            ASSESSMENT
            [Beoordeling en diagnose]

            PLAN
            [Behandelplan en vervolgstappen. Gebruik informatie benoemd in het gesprek]"""

        # Generate the summary using the appropriate prompt
        response = await generate_summary(system_prompt, user_prompt)
        
        if response:
            # Send the summary to the client
            await client_ws.send_text(json.dumps({
                "type": "conversation_summary_complete",
                "summary": response
            }))
            print(f"[Backend] {summary_type.capitalize()} summary generated and sent at {datetime.now().strftime('%H:%M:%S.%f')}")
        else:
            raise Exception("Failed to generate summary")

    except Exception as e:
        print(f"[Backend] Error generating {summary_type} summary: {e}")
        await client_ws.send_text(json.dumps({
            "type": "conversation_summary_error",
            "error": str(e)
        }))

async def connect_to_deepgram(client_ws: WebSocket):
    # Deepgram WebSocket URL with optimized settings for lower latency
    uri = f"wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=general&language=nl&diarize=true&utterances=true&interim_results=true"
    
    # Get Deepgram API key from environment variable
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise ValueError("DEEPGRAM_API_KEY environment variable not set")

    # Create stop event for suggestion worker here
    stop_event = asyncio.Event()

    # Initialize conversation buffer
    conversation_buffer = ConversationBuffer()

    # Initialize tasks and buffer as None
    sender_task = None
    keepalive_task = None
    suggestion_task = None
    deepgram_ws = None
    ecd_thread = None

    try:
        # First ensure any existing connections are closed
        if deepgram_ws is not None:
            try:
                await deepgram_ws.close()
                print(f"[Backend] Closed existing Deepgram connection at {datetime.now().strftime('%H:%M:%S.%f')}")
            except Exception as e:
                print(f"[Backend] Error closing existing Deepgram connection: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")

        # Connect to Deepgram with ping_interval and ping_timeout
        try:
            print(f"[Backend] Attempting to connect to Deepgram at {datetime.now().strftime('%H:%M:%S.%f')}")
            deepgram_ws = await asyncio.wait_for(
                websockets.connect(
                    uri,
                    additional_headers={"Authorization": f"Token {api_key}"},
                    ping_interval=KEEPALIVE_INTERVAL,
                    ping_timeout=KEEPALIVE_TIMEOUT,
                    close_timeout=5,
                    max_size=None,
                    max_queue=None
                ),
                timeout=10
            )
            print(f"[Backend] Connected to Deepgram WebSocket successfully at {datetime.now().strftime('%H:%M:%S.%f')}.")
        except asyncio.TimeoutError:
            print(f"[Backend] Timeout while connecting to Deepgram at {datetime.now().strftime('%H:%M:%S.%f')}")
            raise
        except Exception as e:
            print(f"[Backend] Error connecting to Deepgram: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
            raise
        
        # Start audio sender immediately
        sender_task = asyncio.create_task(sender(deepgram_ws, 'mic', None))
        print(f"[Backend] Started audio sender task at {datetime.now().strftime('%H:%M:%S.%f')}")
        
        # Start keepalive
        keepalive_task = asyncio.create_task(send_keepalive(deepgram_ws))
        print(f"[Backend] Started keepalive task at {datetime.now().strftime('%H:%M:%S.%f')}")
        
        # Start suggestion worker
        suggestion_task = asyncio.create_task(suggestion_worker(conversation_buffer, client_ws, stop_event))
        print(f"[Backend] Started suggestion worker task at {datetime.now().strftime('%H:%M:%S.%f')}")

        # Introduce a small delay before starting ECD summary thread
        await asyncio.sleep(0.1) # Add a small delay to allow Deepgram to start sending data
        print(f"[Backend] Starting ECD summary thread at {datetime.now().strftime('%H:%M:%S.%f')}")

        # Create a separate event loop for the ECD summary thread
        def run_ecd_summary():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                print(f"[Backend] Starting ECD summary generation in background thread at {datetime.now().strftime('%H:%M:%S.%f')}")
                loop.run_until_complete(generate_ecd_summary(client_ws))
                print(f"[Backend] ECD summary generation completed in background thread at {datetime.now().strftime('%H:%M:%S.%f')}")
            except Exception as e:
                print(f"[Backend] Error in ECD summary thread: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
                try:
                    loop.run_until_complete(client_ws.send_text(json.dumps({
                        "type": "ecd_summary_error",
                        "error": str(e)
                    })))
                except:
                    pass
            finally:
                loop.close()

        # Start ECD summary generation in a separate thread
        ecd_thread = threading.Thread(target=run_ecd_summary)
        ecd_thread.daemon = True
        ecd_thread.start()
        print(f"[Backend] ECD summary thread started (non-blocking) at {datetime.now().strftime('%H:%M:%S.%f')}")

        # Start processing transcriptions immediately
        print(f"[Backend] Starting transcription processing loop at {datetime.now().strftime('%H:%M:%S.%f')}")
        try:
            # Create a task for handling client messages
            async def handle_client_messages():
                while True:
                    try:
                        message = await client_ws.receive_text()
                        message_data = json.loads(message)
                        if message_data.get('type') == 'stop_recording':
                            summary_type = message_data.get('summary_type', 'report')
                            print(f"[Backend] Generating summary of type: {summary_type}")
                            await generate_conversation_summary(conversation_buffer, client_ws, summary_type)
                    except Exception as e:
                        print(f"[Backend] Error handling client message: {e}")
                        break

            # Start client message handler in background
            client_message_task = asyncio.create_task(handle_client_messages())

            while True:
                try:
                    # Receive transcription from Deepgram with timeout
                    response = await asyncio.wait_for(deepgram_ws.recv(), timeout=KEEPALIVE_TIMEOUT)
                    response_json = json.loads(response)
                    
                    # Only process Results type responses with non-empty transcripts
                    if (response_json.get('type') == 'Results' and 
                        'channel' in response_json and 
                        'alternatives' in response_json['channel'] and 
                        response_json['channel']['alternatives'] and
                        response_json['channel']['alternatives'][0].get('transcript')):
                        
                        alternative = response_json['channel']['alternatives'][0]
                        transcript = alternative.get('transcript', '')
                        is_final = response_json.get('is_final', False)
                        
                        # Only process non-empty transcripts
                        if transcript and transcript.strip():
                            # Get speaker info if available
                            speaker = None
                            if 'words' in alternative and alternative['words']:
                                speaker = alternative['words'][0].get('speaker')
                            
                            # Add to conversation buffer
                            conversation_buffer.add_utterance(speaker, transcript, datetime.now())
                            
                            # Send transcription to frontend immediately
                            try:
                                await client_ws.send_text(json.dumps({
                                    "type": "transcript",
                                    "transcript": transcript,
                                    "is_final": is_final,
                                    "speaker": speaker
                                }))
                                print(f"[Backend] Sent transcript to frontend: \"{transcript}\" (Speaker: {speaker}) at {datetime.now().strftime('%H:%M:%S.%f')}")
                            except Exception as e:
                                print(f"[Backend] Error sending transcript to frontend: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
                                raise

                except asyncio.TimeoutError:
                    print(f"[Backend] Timeout waiting for Deepgram response, sending keepalive at {datetime.now().strftime('%H:%M:%S.%f')}")
                    try:
                        await deepgram_ws.ping()
                    except Exception as e:
                        print(f"[Backend] Error sending keepalive: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
                        break
                except json.JSONDecodeError as e:
                    print(f"[Backend] Error decoding JSON from Deepgram: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
                except websockets.exceptions.ConnectionClosed as e:
                    print(f"[Backend] Deepgram WebSocket connection closed: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
                    break
                except Exception as e:
                    print(f"[Backend] Unexpected error in receive loop: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
                    if "close message has been sent" in str(e):
                        break
                    continue

        except Exception as e:
            print(f"[Backend] Error in receive loop: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
        finally:
            # Cancel client message handler
            if 'client_message_task' in locals():
                client_message_task.cancel()
                try:
                    await client_message_task
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f"[Backend] Error cleaning up client message task: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")

            print(f"[Backend] Cleaning up tasks and closing connection at {datetime.now().strftime('%H:%M:%S.%f')}")
            # Signal suggestion worker to stop
            stop_event.set()
            
            # Clean up tasks
            for task in [sender_task, keepalive_task, suggestion_task]:
                if task is not None:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                    except Exception as e:
                        print(f"[Backend] Error cleaning up task: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")

            # Clean up ECD thread
            if ecd_thread is not None and ecd_thread.is_alive():
                stop_event.set()
                ecd_thread.join(timeout=5)  # Wait up to 5 seconds for thread to finish

            # Close Deepgram connection if it exists
            if deepgram_ws is not None:
                try:
                    await deepgram_ws.close()
                    print(f"[Backend] Deepgram WebSocket connection closed at {datetime.now().strftime('%H:%M:%S.%f')}")
                except Exception as e:
                    print(f"[Backend] Error closing Deepgram connection: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")

    except Exception as e:
        print(f"[Backend] Error connecting to Deepgram: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
        # Ensure all tasks are cleaned up even if connection fails
        stop_event.set()
        for task in [sender_task, keepalive_task, suggestion_task]:
            if task is not None:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f"[Backend] Error cleaning up task: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
        
        # Clean up ECD thread
        if ecd_thread is not None and ecd_thread.is_alive():
            stop_event.set()
            ecd_thread.join(timeout=5)
        
        # Close Deepgram connection if it exists
        if deepgram_ws is not None:
            try:
                await deepgram_ws.close()
                print(f"[Backend] Deepgram WebSocket connection closed at {datetime.now().strftime('%H:%M:%S.%f')}")
            except Exception as e:
                print(f"[Backend] Error closing Deepgram connection: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
        raise

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"[Backend] WebSocket connection accepted at {datetime.now().strftime('%H:%M:%S.%f')}")
    try:
        await connect_to_deepgram(websocket)
    except Exception as e:
        print(f"[Backend] WebSocket error: {e} at {datetime.now().strftime('%H:%M:%S.%f')}")
        try:
            await websocket.send_text(json.dumps({
                "error": str(e)
            }))
        except:
            pass
    finally:
        print(f"[Backend] Closing WebSocket connection... at {datetime.now().strftime('%H:%M:%S.%f')}")
        try:
            await websocket.close()
        except:
            pass
        print(f"[Backend] WebSocket connection closed at {datetime.now().strftime('%H:%M:%S.%f')}")

async def generate_summary(system_prompt: str, user_prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{
                "role": "system",
                "content": system_prompt
            }, {
                "role": "user",
                "content": user_prompt
            }],
            stream=False,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"[Backend] Error generating summary with OpenAI: {e}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 