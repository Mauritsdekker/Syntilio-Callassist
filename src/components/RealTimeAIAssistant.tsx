import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Phone, AlertTriangle, CheckCircle, Clock, FileText, User, X, Info, HelpCircle, ChevronUp, ChevronDown, PlayCircle, Copy, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { useAudioRecording } from '@/hooks/useAudioRecording'; // Removed
// import { useCallSession } from '@/hooks/useCallSession'; // Removed
import { SpeechToText } from '@/lib/speech-to-text';

// Removed Patient interface as it's no longer tied to useCallSession hook here
// interface Patient { ... }

interface RealTimeAIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  // Removed patient, duration, startSession, endSession, loadPatientData props
  // as these are now handled differently or simulated for visual effect
}

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: string | null;
  timestamp: number;
}

interface Suggestion {
  type: 'warning' | 'info' | 'question' | 'protocol';
  text: string;
  priority: 'high' | 'medium' | 'low';
  ecdReference?: string;
  ecdReferenceDate?: string;
  ecdReferenceSource?: string;
  protocol_id?: string;
  protocol_type?: string;
  protocol_description?: string;
  steps?: Array<{
    title: string;
    description: string;
    action: string;
    icon?: string;
    example_questions?: string[];
  }>;
  example_questions?: string[];
}

interface ECDSection {
  text: string;
  source?: {
    text: string;
    timestamp: number;
  };
}

const RealTimeAIAssistant: React.FC<RealTimeAIAssistantProps> = ({ isOpen, onToggle }) => {
  const { toast } = useToast();

  // Removed state related to useCallSession: sessionId, patient
  // Removed state related to useAudioRecording: isRecording, recordingError

  const [isListening, setIsListening] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const speechToTextRef = useRef<SpeechToText | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [patientName, setPatientName] = useState('Karel Groenendijk');
  const [patientPhone, setPatientPhone] = useState('+31638880128');
  const [ecdSummary, setEcdSummary] = useState<string>('');
  const [isEcdSummaryLoading, setIsEcdSummaryLoading] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [isConversationSummaryLoading, setIsConversationSummaryLoading] = useState(false);
  const [showSummaryChoice, setShowSummaryChoice] = useState(false);
  const [summaryType, setSummaryType] = useState<'report' | 'followup' | null>(null);
  
  // Remove refs for streaming
  // const summaryBufferRef = useRef<string>('');
  // const animationFrameRef = useRef<number>();
  const summaryElementRef = useRef<HTMLDivElement>(null);

  // Add state for transcript collapse
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  // Add new state for active protocol
  const [activeProtocol, setActiveProtocol] = useState<Suggestion | null>(null);
  const [protocolStep, setProtocolStep] = useState<number>(0);

  // Add useEffect to log ecdSummary and isEcdSummaryLoading
  useEffect(() => {
    console.log('ECD Summary state:', { ecdSummary, isEcdSummaryLoading });
  }, [ecdSummary, isEcdSummaryLoading]);

  // Add useEffect to handle component unmount
  useEffect(() => {
    return () => {
      // Clean up WebSocket connection when component unmounts
      if (speechToTextRef.current) {
        speechToTextRef.current.stop();
      }
    };
  }, []);

  // Simulate patient data structure if AI analysis or other parts still rely on it
  const simulatedPatient = {
    name: patientName,
    // Add other patient properties here if needed by analyzeConversation or UI
    // Example: medical_conditions: ['Astma'], medications: [{ name: 'Inhaler', dosage: '2 puffs', frequency: 'daily' }]
    medical_conditions: [],
    medications: [],
    care_notes: []
  };
  // Simulate a session ID if debug info needs one
  const simulatedSessionId = isCallActive ? 'simulated-session-123' : null;

  const [ecdSections, setEcdSections] = useState<ECDSection[]>([]);
  const [selectedSource, setSelectedSource] = useState<{ text: string; timestamp: number } | null>(null);
  const [selectedEcdReference, setSelectedEcdReference] = useState<string | null>(null);

  // Function to update summary text directly
  // const updateSummaryText = (text: string) => {
  //   if (summaryElementRef.current) {
  //     summaryElementRef.current.textContent = text;
  //   }
  // };

  // Function to flush buffer and update UI
  // const flushBuffer = () => {
  //   if (summaryBufferRef.current) {
  //     const text = summaryBufferRef.current;
  //     summaryBufferRef.current = '';
  //     updateSummaryText(text);
  //     setEcdSummary(text); // Update state for persistence
  //   }
  // };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      // if (animationFrameRef.current) {
      //   cancelAnimationFrame(animationFrameRef.current);
      // }
    };
  }, []);
 

  // Effect for call duration timer - now tied to isCallActive
  useEffect(() => {
    console.log('isCallActive changed:', isCallActive);
    if (isCallActive) {
      console.log('Call is active, starting call duration timer.');
      callDurationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

    } else {
      console.log('Call is inactive, clearing call duration timer.');
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
      setCallDuration(0); // Reset duration when call ends
    }

    return () => {
      console.log('Component unmounting or isCallActive changing, performing timer cleanup.');
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
    };
  }, [isCallActive]);

   // Effect for SpeechToText WebSocket connection
   useEffect(() => {
       // Cleanup SpeechToText on component unmount or call ending
       return () => {
         console.log('Component unmounting or call ending, stopping SpeechToText.');
         if (speechToTextRef.current) {
           speechToTextRef.current.stop();
           speechToTextRef.current = null;
         }
       };
     }, []); // This effect runs once on mount and cleans up on unmount

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    try {
      setError(null);
      setTranscript([]);
      setSuggestions([]);
      setEcdSummary('Samenvatting wordt geladen...');
      setIsEcdSummaryLoading(true);
      // summaryBufferRef.current = ''; // Removed streaming buffer

      // Initialize SpeechToText
      speechToTextRef.current = new SpeechToText(
        (data) => {
          console.log('Received data from SpeechToText:', data);

          if (data.type === 'transcript') {
          const { transcript: newTranscriptText, is_final, speaker } = data;
            console.log('Processing transcript:', { newTranscriptText, is_final, speaker });

          // Use a unique ID for each final transcript, or a consistent ID for the interim
          const entryId = is_final ? Date.now().toString() + Math.random() : 'interim-transcript';

          setTranscript(prev => {
              // If this is an interim result, replace the previous interim result
              if (!is_final) {
                return prev.filter(entry => entry.id !== 'interim-transcript')
                  .concat([{
                id: entryId,
                    text: newTranscriptText,
                    speaker: speaker !== null ? `Speaker ${speaker}` : 'Unknown',
                    timestamp: Date.now()
                  }]);
              }

              // For final results, add as new entry
              return prev.concat([{
                id: entryId,
                text: newTranscriptText,
                speaker: speaker !== null ? `Speaker ${speaker}` : 'Unknown',
                timestamp: Date.now()
              }]);
            });
          } else if (data.type === 'suggestions') {
            console.log('Received suggestions:', data.suggestions);
            // Update suggestions when received from server
            setSuggestions(data.suggestions.map((s: any) => ({
              type: s.type,
              text: s.text,
              priority: s.priority,
              ecdReference: s.ecdReference,
              ecdReferenceDate: s.ecdReferenceDate,
              ecdReferenceSource: s.ecdReferenceSource,
              protocol_id: s.protocol_id,
              protocol_type: s.protocol_type,
              protocol_description: s.protocol_description,
              steps: s.steps,
              example_questions: s.example_questions || [] // Make sure to include example_questions
            })));
          } else if (data.type === 'ecd_summary_start') {
            console.log('Starting ECD summary generation...');
            setIsEcdSummaryLoading(true);
            // summaryBufferRef.current = ''; // Removed streaming buffer
            setEcdSummary('Samenvatting wordt geladen...'); // Set initial loading text
          } else if (data.type === 'ecd_summary_chunk') {
            // Removed streaming chunk handling
            // console.log('Received ECD summary chunk:', data.chunk);
            // summaryBufferRef.current += data.chunk;
            // if (animationFrameRef.current) {
            //   cancelAnimationFrame(animationFrameRef.current);
            // }
            // animationFrameRef.current = requestAnimationFrame(flushBuffer);
          } else if (data.type === 'ecd_summary_complete') {
            console.log('ECD summary generation complete');
            setIsEcdSummaryLoading(false);
            if (data.summary) {
              // summaryBufferRef.current = data.summary; // Removed streaming buffer
              // flushBuffer(); // No longer flushing, direct set
              setEcdSummary(data.summary);
            }
          } else if (data.type === 'ecd_summary_error') {
            console.error('Error generating ECD summary:', data.error);
            setIsEcdSummaryLoading(false);
            toast({
              title: "Fout bij genereren samenvatting",
              description: data.error,
              variant: "destructive",
            });
          } else if (data.type === 'conversation_summary_start') {
            console.log('Starting conversation summary generation...');
            setIsConversationSummaryLoading(true);
            setConversationSummary('Gesprekssamenvatting wordt gegenereerd...');
          } else if (data.type === 'conversation_summary_complete') {
            console.log('Conversation summary generation complete');
            setIsConversationSummaryLoading(false);
            if (data.summary) {
              setConversationSummary(data.summary);
            }
          } else if (data.type === 'conversation_summary_error') {
            console.error('Error generating conversation summary:', data.error);
            setIsConversationSummaryLoading(false);
            toast({
              title: "Fout bij genereren gesprekssamenvatting",
              description: data.error,
              variant: "destructive",
            });
          }
        },
        (error) => {
          console.error('SpeechToText error:', error);
          setError(error);
          toast({
            title: "Fout bij spraakherkenning",
            description: error,
            variant: "destructive",
          });
        }
      );

      // Start the transcription
      await speechToTextRef.current.connect();
      setIsListening(true);
      setIsCallActive(true);

      // Start call duration timer - This was already moved inside handleStartCall
      // but putting it here again to be explicit about the flow.
      // Ensure only one interval is running.
      if (callDurationIntervalRef.current) {
           clearInterval(callDurationIntervalRef.current);
         }
      callDurationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting call:', error);
      setError('Fout bij starten van het gesprek');
      setIsListening(false);
      setIsCallActive(false);
      if (callDurationIntervalRef.current) {
           clearInterval(callDurationIntervalRef.current);
         }
      setCallDuration(0);
      toast({
        title: "Fout bij starten gesprek",
        description: "Er is een fout opgetreden bij het starten van het gesprek",
        variant: "destructive",
      });
    }
  };

  const handleStopCall = async () => {
    try {
      if (speechToTextRef.current) {
        // Stop recording but keep the connection alive
        await speechToTextRef.current.stopRecording();
        // Show summary choice instead of immediately generating summary
        setShowSummaryChoice(true);
      }
    } catch (error) {
      console.error('Error stopping call:', error);
    } finally {
      setIsListening(false);
      setIsCallActive(false);
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
      setCallDuration(0);
    }
  };

  const handleGenerateSummary = async (type: 'report' | 'followup') => {
    try {
      console.log('Generating summary of type:', type);
      setSummaryType(type);
      setIsConversationSummaryLoading(true);
      setConversationSummary('Samenvatting wordt gegenereerd...');
      setShowSummaryChoice(false);

      if (speechToTextRef.current) {
        const message = {
          type: 'stop_recording',
          summary_type: type
        };
        console.log('Sending message:', message);
        await speechToTextRef.current.sendMessage(message);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Fout bij genereren samenvatting",
        description: "Er is een fout opgetreden bij het genereren van de samenvatting",
        variant: "destructive",
      });
    }
  };

  const handleStartProtocol = (protocol: Suggestion) => {
    console.log('Starting protocol with data:', protocol); // Add debug logging
    setActiveProtocol({
      ...protocol,
      example_questions: protocol.example_questions || [] // Ensure example_questions are included
    });
    setProtocolStep(0);
  };

  const handleNextProtocolStep = () => {
    setProtocolStep(prev => prev + 1);
  };

  const handleEndProtocol = () => {
    setActiveProtocol(null);
    setProtocolStep(0);
  };

  const getSuggestionIcon = (suggestionType: string, protocolType?: string) => {
    switch (suggestionType) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'question':
        return <HelpCircle className="w-4 h-4 text-blue-500" />;
      case 'protocol':
        switch (protocolType) {
          case 'life_threatening':
            return <AlertTriangle className="w-4 h-4 text-red-500" />;
          case 'social':
            return <User className="w-4 h-4 text-green-500" />;
          case 'appointment':
            return <Clock className="w-4 h-4 text-green-500" />;
          default:
            return <PlayCircle className="w-4 h-4 text-green-500" />;
        }
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  const getSpeakerLabel = (speaker: string | null) => {
    if (speaker === 'Speaker 0') return '🧑‍⚕️ Triagist';
    if (speaker === 'Speaker 1') return '👤 Patiënt';
    return 'Onbekend';
  };

  // Update the ECD summary handling
  const handleEcdSummaryChunk = (chunk: string) => {
    // Parse the chunk to extract sections and their sources
    const sections = chunk.split('\n\n').map(section => {
      const [text, sourceText] = section.split(' [Bron: ');
      return {
        text: text.trim(),
        source: sourceText ? {
          text: sourceText.replace(']', '').trim(),
          timestamp: Date.now() // In reality, this should come from the actual transcript timestamp
        } : undefined
      };
    });
    setEcdSections(prev => [...prev, ...sections]);
  };

  const iconComponents: { [key: string]: React.ElementType } = {
    AlertTriangle,
    Info,
    Phone,
    HelpCircle,
    User,
    FileText,
    CheckCircle,
    Clock,
    PlayCircle // Keep PlayCircle for the default protocol icon
  };

  // Add debug logging to see what's happening with the suggestions
  useEffect(() => {
    if (suggestions.length > 0) {
      console.log('Current suggestions:', suggestions);
    }
  }, [suggestions]);

  // Add debug logging for active protocol
  useEffect(() => {
    if (activeProtocol) {
      console.log('Active protocol:', activeProtocol);
    }
  }, [activeProtocol]);

  // Add handler for AI Assist window close
  const handleClose = async () => {
    try {
      if (speechToTextRef.current) {
        await speechToTextRef.current.stop();
      }
    } catch (error) {
      console.error('Error closing connection:', error);
    } finally {
      onToggle();
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed right-6 bottom-6 bg-gradient-to-r from-purple-500 to-orange-500 hover:bg-gradient-to-r hover:from-purple-600 hover:to-orange-600 text-white shadow-lg z-50 h-14 px-6"
          size="lg"
        >
          <Phone className="w-5 h-5 mr-2" />
          CallAssist
        </Button>
      )}

      <div className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-300 z-40 rounded-tl-4 rounded-tr-4 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-orange-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">CallAssist</h2>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                ×
              </Button>
            </div>

            {!isCallActive ? ( // Show inputs when call is not active
              <div className="space-y-2">
                <select
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    // Update phone number based on selection
                    switch(e.target.value) {
                      case 'Huisarts':
                        setPatientPhone('+31201234567');
                        break;
                      case 'Beschikbare medewerker':
                        setPatientPhone('+31612345678');
                        break;
                      case 'Karel Groenendijk':
                        setPatientPhone('+31638880128');
                        break;
                    }
                  }}
                  disabled={isCallActive}
                  className="w-full p-2 border rounded-md bg-white text-sm"
                >
                  <option value={patientName}>{patientName}</option>
                  <option value="Huisarts">Huisarts</option>
                  <option value="Beschikbare medewerker">Beschikbare medewerker</option>
                </select>
                <Input
                  placeholder="Telefoon nummer"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  disabled={isCallActive} // Disable inputs when call is active
                />
              </div>
            ) : ( // Show session info when call is active
              <div>
                <p className="text-sm text-gray-600">
                  Gesprek met: {patientName} {/* Use local state patient name */}
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 mr-1 text-gray-500" />
                  <span className="text-sm font-mono">{formatTime(callDuration)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              {!isCallActive ? ( // Show Start button when call is not active
                <Button
                  onClick={handleStartCall}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-orange-500 hover:bg-gradient-to-r hover:from-purple-600 hover:to-orange-600"
                  disabled={!patientName.trim() || !patientPhone.trim()} // Disable if name or phone is empty
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Start gesprek
                </Button>
              ) : ( // Show End button when call is active
                <Button
                  onClick={handleStopCall}
                  variant="destructive"
                  className="flex-1"
                >
                  <Phone className="w-4 h-4 mr-2 rotate-180" /> {/* Rotated icon for hanging up */}
                  Beëindig gesprek
                </Button>
              )}
            </div>
          </div>

          {/* Content Area - Visible when isCallActive is true */}
          {isCallActive && ( // Only show content area when call is active
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Live Transcript - Only show if there are transcript entries */}
                  {transcript.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Live transcriptie</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                            className="h-6 w-6 p-0"
                          >
                            {isTranscriptExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className={`space-y-2 transition-all duration-200 ${isTranscriptExpanded ? 'max-h-[300px]' : 'max-h-[100px]'} overflow-y-auto`}>
                        {transcript.map((entry, index) => {
                          // Only show the last entry when collapsed
                          if (!isTranscriptExpanded && index !== transcript.length - 1) {
                            return null;
                          }
                          return (
                          <div key={entry.id} className="text-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant={entry.speaker === 'Speaker 0' ? 'default' : 'secondary'}>
                                {getSpeakerLabel(entry.speaker)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className={`text-gray-700 leading-relaxed`}>{entry.text}</p>
                          </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Active Protocol Card - Moved here */}
                  {activeProtocol && (
                    <Card className="mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span>Actief Protocol</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEndProtocol}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div key={activeProtocol.protocol_id}>
                          <h3 className="font-medium text-sm mb-2">{activeProtocol.text}</h3>
                          <div className="space-y-2">
                            {activeProtocol.steps?.slice(protocolStep, protocolStep + 1).map((step, stepIndex) => {
                              const IconComponent = step.icon ? iconComponents[step.icon] : null;
                              return (
                                <div
                                  key={stepIndex}
                                  className={`p-2 rounded-lg border ${
                                    stepIndex === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start">
                                    {IconComponent && <IconComponent className="w-8 h-8 mr-2 mt-0 text-gray-600" />}
                                    <div>
                                      <p className="font-medium text-xs">{step.title}</p>
                                      <p className="text-xs text-gray-600">{step.description}</p>
                                    </div>
                                  </div>
                                  {/* Display example questions for this specific step */}
                                  {step.example_questions && step.example_questions.length > 0 && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                      <h4 className="font-medium text-xs mb-1">Voorbeeldvragen:</h4>
                                      <ul className="list-disc list-inside ml-2 space-y-1">
                                        {step.example_questions.map((question, index) => (
                                          <li key={index} className="text-xs text-gray-600">{question}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <div className="flex justify-end mt-2">
                                    {protocolStep > 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setProtocolStep(prev => Math.max(0, prev - 1))}
                                        className="h-6 text-xs mr-2"
                                      >
                                        Vorige
                                      </Button>
                                    )}
                                    {protocolStep < (activeProtocol.steps?.length || 0) - 1 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextProtocolStep}
                                        className="h-6 text-xs"
                                      >
                                        Volgende
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Suggestions - Only show if there are suggestions */}
                  {suggestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">AI Suggesties ({suggestions.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded-lg border text-xs ${getPriorityColor(suggestion.priority)}`}
                          >
                            <div className="flex items-start space-x-2">
                              {getSuggestionIcon(suggestion.type, suggestion.protocol_type)}
                              <div className="flex-1">
                              <span>{suggestion.text}</span>
                                {suggestion.type === 'protocol' && (
                                  <div className="mt-2">
                                    <p className="text-gray-600 text-xs mb-1">{suggestion.protocol_description}</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => handleStartProtocol(suggestion)}
                                    >
                                      Start Protocol
                                    </Button>
                                  </div>
                                )}
                                {suggestion.ecdReference && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 ml-2 hover:bg-gray-100"
                                          onClick={() => {}}
                                        >
                                          <FileText className="h-4 w-4 text-gray-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs p-2 text-xs">
                                        <p className="font-semibold">Bronvermelding:</p>
                                        <p>{suggestion.ecdReference}</p>
                                        <p className="text-gray-500 mt-1">Datum: {suggestion.ecdReferenceDate || 'N/A'}</p>
                                        <p className="text-gray-500">Bron: {suggestion.ecdReferenceSource || 'ECD Patiëntinformatie'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Patient Information - Show using local/simulated data */} {/* Only show patient info card if there's a patient name */}
                  {patientName && (
                    <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-medium flex items-center">
                         <User className="w-4 h-4 mr-2" />
                         Patiënt informatie
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-2 text-sm">
                       <div><strong>Naam:</strong> {patientName}</div>
                       <div><strong>Telefoon:</strong> {patientPhone}</div>
                       {/* Add other patient info here if you have it */}
                       {simulatedPatient.medical_conditions && simulatedPatient.medical_conditions.length > 0 && (
                         <div><strong>Condities:</strong> {simulatedPatient.medical_conditions.join(', ')}</div>
                       )}
                       {simulatedPatient.medications && Array.isArray(simulatedPatient.medications) && simulatedPatient.medications.length > 0 && (
                         <div>
                           <strong>Medicatie:</strong>
                           <ul className="list-disc list-inside ml-2">
                             {simulatedPatient.medications.map((med: any, index) => (
                               <li key={index}>
                                 {med.name} {med.dosage} - {med.frequency}
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}
                       {simulatedPatient.care_notes && simulatedPatient.care_notes.length > 0 && (
                         <div>
                           <strong>Zorgnotities:</strong>
                           <ul className="list-disc list-inside ml-2">
                             {simulatedPatient.care_notes.slice(0, 3).map((note, index) => (
                               <li key={index} className="text-xs">{note}</li>
                              ))}
                           </ul>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                  )}

                  {/* Dynamische ECD Samenvatting */}
                  {(ecdSummary.length > 0 || isEcdSummaryLoading) && (
                    <Card data-ecd-summary>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          ECD Samenvatting
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-gray-700">
                        <div ref={summaryElementRef} className={`whitespace-pre-wrap ${isEcdSummaryLoading ? 'animate-pulse' : ''}`}>
                          {ecdSummary}
                          {selectedEcdReference && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="text-xs text-blue-600 font-medium mb-1">Bron uit ECD:</div>
                              <div className="text-sm">{selectedEcdReference}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

           {/* Display general error message if any */} {/* Only show error message if error state is not null */}
           {error && (
             <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
               <div className="flex items-center justify-center space-x-2">
                 <AlertTriangle className="w-4 h-4 text-red-500" />
                 <span className="text-sm font-medium text-red-700">{error}</span>
               </div>
             </div>
           )}

           {/* Add Conversation Summary section */}
           {(conversationSummary.length > 0 || isConversationSummaryLoading) && (
             <Card className="flex-1 overflow-hidden">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium flex items-center justify-between">
                   <div className="flex items-center">
                     <FileText className="w-4 h-4 mr-2" />
                     Gesprekssamenvatting
                   </div>
                   {conversationSummary && !isConversationSummaryLoading && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => {
                         navigator.clipboard.writeText(conversationSummary);
                         toast({
                           title: "Samenvatting gekopieerd",
                           description: "De gesprekssamenvatting is naar het klembord gekopieerd",
                         });
                       }}
                       className="h-6 w-6 p-0"
                     >
                       <Copy className="h-4 w-4" />
                     </Button>
                   )}
                 </CardTitle>
               </CardHeader>
               <CardContent className="flex-1 overflow-hidden">
                 <ScrollArea className="h-[calc(100vh-20rem)]">
                   <div className={`whitespace-pre-wrap text-sm text-gray-700 ${isConversationSummaryLoading ? 'animate-pulse' : ''}`}>
                     {conversationSummary}
                   </div>
                 </ScrollArea>
               </CardContent>
             </Card>
           )}

           {/* Summary Choice Dialog */}
           {showSummaryChoice && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
               <Card className="w-96">
                 <CardHeader>
                   <CardTitle className="text-lg">Kies type samenvatting</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <Button
                     className="w-full"
                     onClick={() => handleGenerateSummary('report')}
                   >
                     <FileText className="w-4 h-4 mr-2" />
                     Rapportage genereren
                   </Button>
                   <Button
                     className="w-full"
                     onClick={() => handleGenerateSummary('followup')}
                   >
                     <MessageSquare className="w-4 h-4 mr-2" />
                     Bericht voor opvolging opstellen
                   </Button>
                 </CardContent>
               </Card>
             </div>
           )}
        </div>
      </div>
    </>
  );
};

export default RealTimeAIAssistant;