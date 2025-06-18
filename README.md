# Syntilio-Callassist

Een real-time AI-gestuurde spraakassistent voor medische triage en patiëntenzorg, ontwikkeld als prototype voor Syntilio.

## 🎯 Wat is Syntilio-Callassist?

Syntilio-Callassist is een prototype van een intelligente spraakassistent die zorgverleners ondersteunt tijdens telefoongesprekken met patiënten. Het systeem:

- **Real-time transcriptie** van gesprekken met Deepgram
- **Live analyse** van gespreksinhoud met OpenAI GPT-4
- **Automatische suggesties** voor vervolgvragen en acties
- **Protocol-gebaseerde begeleiding** voor levensbedreigende situaties
- **Professionele samenvattingen** voor ECD en overdracht naar wijkverpleging

## 🏗️ Architectuur

### Frontend (React/TypeScript)
- **React** met TypeScript voor type-veilige ontwikkeling
- **Tailwind CSS** voor moderne styling
- **Shadcn/ui** component library
- **WebSocket** verbindingen voor real-time communicatie

### Backend (Python/FastAPI)
- **FastAPI** voor snelle API ontwikkeling
- **WebSocket** server voor real-time audio streaming
- **OpenAI GPT-4.1-nano** voor AI analyses
- **Deepgram** voor spraak-naar-tekst conversie
- **PyAudio** voor audio capture

### AI/ML Componenten
- **OpenAI GPT-4.1-nano**: Gespreksanalyse, suggesties, samenvattingen
- **Deepgram**: Real-time spraakherkenning met diarisatie
- **Custom protocols**: Stapsgewijze begeleiding voor medische situaties

## 🚀 Installatie & Setup

### Vereisten
- Python 3.8+
- Node.js 18+
- OpenAI API key
- Deepgram API key

### Stap-voor-stap installatie

1. **Clone de repository**
   ```bash
   git clone https://github.com/Mauritsdekker/Syntilio-Callassist.git
   cd Syntilio-Callassist
   ```

2. **Backend setup**
   ```bash
   # Python dependencies installeren
   pip install -r requirements.txt
   
   # Environment variables instellen
   Maak een .env bestand aan in de hoofdmap
   # Vul je API keys in: OPENAI_API_KEY en DEEPGRAM_API_KEY
   ```

3. **Frontend setup**
   ```bash
   # Node dependencies installeren
   npm install
   ```

4. **Start de applicatie**
   ```bash
   # Terminal 1: Start de backend server
   python local_transcription_server.py
   
   # Terminal 2: Start de frontend development server
   npm run dev
   ```

5. **Open de applicatie**
   - Ga naar `http://localhost:8080` in je browser
   - Klik op "CallAssist" om deze te openen

## 🧪 Testen van het Prototype

### Basis functionaliteit testen
1. **Audio input testen**
   - Klik op CallAssist
   - Klik op "Start gesprek"
   - Spreek duidelijk in de microfoon
   - Controleer of transcriptie verschijnt

2. **AI analyse testen**
   - Praat over een medisch onderwerp
   - Kijk of suggesties verschijnen
   - Test de samenvatting functionaliteit

3. **Protocol systeem testen**
   - Zeg bijvoorbeeld "ik ben eenzaam" om het protocol te activeren. Zie andere triggerwoorden in protocols.py
   - Volg de stapsgewijze begeleiding


## ⚠️ Bekende Problemen & Limitaties

### Technische problemen
1. **Vertraging bij snel spreken**
   - Oorzaak: Buffer grootte en timing instellingen
   - Status: Gedeeltelijk opgelost, verder optimalisatie nodig
   - Workaround: Spreek langzamer en duidelijker

2. **Audio kwaliteit**
   - Microfoon instellingen kunnen transcriptie beïnvloeden
   - Achtergrondgeluiden kunnen interfereren
   - Status: Verbetering nodig

3. **WebSocket verbindingen**
   - Occasionele timeouts bij lange gesprekken
   - Status: Monitoring vereist

### Functionaliteit beperkingen
1. **Nederlandse taalondersteuning**
   - Deepgram ondersteunt Nederlands, maar kan variëren in accuraatheid
   - Medische terminologie kan problemen geven

2. **Protocol dekking**
   - Beperkt aantal protocollen geïmplementeerd
   - Niet alle medische situaties gedekt en gecheckt

### Performance issues
1. **API rate limits**
   - OpenAI en Deepgram hebben rate limits
   - Lange gesprekken kunnen vertragen

2. **Memory usage**
   - Lange gesprekken kunnen veel geheugen gebruiken
   - Periodieke cleanup nodig

## 🔧 Configuratie

### Environment variables
```env
OPENAI_API_KEY="your_openai_api_key"
DEEPGRAM_API_KEY="your_deepgram_api_key"
```

### Audio instellingen
- Sample rate: 16000 Hz
- Channels: 1 (mono)
- Chunk size: 1024 bytes

## 📊 Monitoring & Logging

Het systeem logt:
- WebSocket verbindingen
- API calls naar OpenAI en Deepgram
- Transcriptie accuraatheid
- Error messages

## 🚧 Ontwikkeling


### Bijdragen
Dit is een prototype ontwikkeld door Maurits Dekker, namens TU Delft, voor Syntilio. 

## 📄 Licentie

Dit project is ontwikkeld voor Syntilio en is niet open source.

---

**Let op**: Dit is een prototype en is niet bedoeld voor productiegebruik in medische setting.
