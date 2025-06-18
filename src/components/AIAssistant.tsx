import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mic, MicOff, Phone, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface TranscriptEntry {
  id: string;
  speaker: 'triagist' | 'patient';
  text: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  type: 'warning' | 'info' | 'question';
  text: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onToggle }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Mock patient data
  const patientData = {
    name: "Karel Groenendijk",
    age: 63,
    medications: ["Flunarizine 20mg"],
    lastContact: "10 mei 2025",
    conditions: ["Alzheimer", "Mantelzorg dagelijks"],
    allergies: ["Geen bekende allergieën"]
  };

  useEffect(() => {
    if (isCallActive && isListening) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCallActive, isListening]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here we would typically send the audioBlob to a backend for Whisper processing
        console.log('Audio recorded:', audioBlob);
        // For now, we just log the blob and clear the chunks
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setIsCallActive(true);

      // Remove simulation timeouts
      // setTimeout(() => { ... }, 2000);
      // setTimeout(() => { ... }, 5000);
      // setTimeout(() => { ... }, 8000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
      setIsCallActive(false);
      // Optionally show an error message to the user
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setIsCallActive(false);
    setCallDuration(0);
    // The onstop event handler will process the final audio chunk
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'question':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSuggestionColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed right-6 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg z-50"
          size="lg"
        >
          <Phone className="w-5 h-5 mr-2" />
          Gespreksassistent
        </Button>
      )}

      {/* Assistant Panel */}
      <div className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Gespreksassistent</h2>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                ×
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Gesprek met: mevrouw Jansen – 06 12345678
            </p>
            <div className="flex items-center mt-2">
              <Clock className="w-4 h-4 mr-1 text-gray-500" />
              <span className="text-sm font-mono">{formatTime(callDuration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              {!isListening ? (
                <Button 
                  onClick={startListening}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start gesprek
                </Button>
              ) : (
                <Button 
                  onClick={stopListening}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop gesprek
                </Button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Live Transcript */}
                {transcript.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Live transcriptie</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {transcript.map((entry) => (
                        <div key={entry.id} className="text-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={entry.speaker === 'triagist' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}>
                              {entry.speaker === 'triagist' ? '🧑‍⚕️ Triagist' : '👤 Patiënt'}
                            </Badge>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{entry.text}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Gespreksuggesties:</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {suggestions.map((suggestion) => (
                        <div 
                          key={suggestion.id} 
                          className={`p-2 rounded-lg border text-xs ${getSuggestionColor(suggestion.priority)}`}
                        >
                          <div className="flex items-start space-x-2">
                            {getSuggestionIcon(suggestion.type)}
                            <span>{suggestion.text}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Patient Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">ECD informatie:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>• Mevrouw gebruikt flunarizine 20mg</div>
                    <div>• Recente valmelding: {patientData.lastContact}</div>
                    <div>• Mantelzorg komt dagelijks langs</div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full text-left justify-start bg-orange-50 hover:bg-orange-100 border-orange-200"
                  >
                    Open ECD
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-left justify-start bg-orange-50 hover:bg-orange-100 border-orange-200"
                  >
                    Voitijde Toevoegen
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
