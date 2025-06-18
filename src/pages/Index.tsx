import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Phone, Video, Users, FileText, Calendar, ChevronDown, ChevronRight, Edit, Send, Mic, MicOff } from 'lucide-react';
import RealTimeAIAssistant from '@/components/RealTimeAIAssistant';

const Index = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    medicalNotes: true,
    clientNetwork: false,
    appointments: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 grid grid-cols-3 gap-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-gray-400 rounded-sm"></div>
              ))}
            </div>
            <span className="text-lg font-medium text-gray-800">Syntilio Console</span>
            <div className="relative group">
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                <span>Cases</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-3 py-2 text-sm text-gray-600 bg-gray-50 border-b border-gray-200">
                  <span className="font-medium">00001049</span>
                  <span className="ml-2 text-gray-500">(Huidig)</span>
                </div>
                <button className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 text-left">
                  + Nieuw case
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">00001049 | Case</span>
            <button className="text-gray-400">×</button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isAssistantOpen ? 'mr-96' : ''}`}>
          <div className="p-6">
            {/* Case Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Case</h1>
                    <p className="text-lg text-gray-700">Karel Groenendijk</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-1" />
                    Volgen
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="w-4 h-4 mr-1" />
                    Start Video Call
                  </Button>
                  <Button variant="outline" size="sm">
                    Eigenaar wijzigen
                  </Button>
                  <Button variant="outline" size="sm">
                    Dossier
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Casenummer</label>
                  <p className="text-gray-900">00001049</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Melding</label>
                  <p className="text-gray-900">Medido Alarm Timeout</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prioriteit</label>
                  <p className="text-gray-900">Medium</p>
                </div>
              </div>

              {/* Status Bar */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-600 text-white text-center py-2 rounded-md font-medium">
                  Nieuw
                </div>
                <div className="bg-gray-100 text-gray-600 text-center py-2 rounded-md">
                  In Behandeling
                </div>
                <div className="bg-gray-100 text-gray-600 text-center py-2 rounded-md">
                  In Afwachting
                </div>
                <div className="bg-gray-100 text-gray-600 text-center py-2 rounded-md">
                  Afgesloten
                </div>
              </div>

              {/* Tags */}
              <div className="flex space-x-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  🏥 Resuscitatie
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  🔥 Agressieve hond
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  ⚠️ Drager MRSA
                </Badge>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-3 gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Cliëntgegevens
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Naam</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">Mr. Karel Groenendijk</span>
                        <Edit className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Telefoon</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">+31638880128</span>
                        <Edit className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Geboortedatum</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">15-07-1960</span>
                        <Edit className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">E-mail</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">karel@nl.com</span>
                        <Edit className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Case Notes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-purple-600" />
                    Case Notities
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Melding</div>
                    <div className="text-sm text-gray-900">Medido Alarm Timeout</div>
                    <div className="text-sm text-gray-600 mt-3">Beschrijving</div>
                    <div className="text-sm text-gray-900">-</div>
                  </div>
                </CardContent>
              </Card>

              {/* Protocols */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-purple-600" />
                    Protocollen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium">Medicatie Gemist</div>
                          <div className="text-xs text-gray-600">Evalueer de urgentie van deze melding</div>
                        </div>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expandable Sections */}
            <div className="mt-6 space-y-4">
              {/* Medical Notes */}
              <Card>
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => toggleSection('medicalNotes')}
                >
                  <CardTitle className="text-base font-medium flex items-center">
                    {expandedSections.medicalNotes ? 
                      <ChevronDown className="w-4 h-4 mr-2" /> : 
                      <ChevronRight className="w-4 h-4 mr-2" />
                    }
                    Medische Notities
                  </CardTitle>
                </CardHeader>
                {expandedSections.medicalNotes && (
                  <CardContent>
                    <p className="text-sm text-gray-700">
                      Situatie in beheer bij KATS bewaking. Mnr. heeft LAT-relatie, partner woont in 
                      Schoonhoven is aantal vaste dagen in de week bij mnr. Mnr. is bekend met de ziekte van 
                      Alzheimer. Mnr. gaat 1 dag in de week , donderdag, naar dagbesteding Activite plus
                    </p>
                  </CardContent>
                )}
              </Card>

              {/* Client Network */}
              <Card>
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => toggleSection('clientNetwork')}
                >
                  <CardTitle className="text-base font-medium flex items-center">
                    {expandedSections.clientNetwork ? 
                      <ChevronDown className="w-4 h-4 mr-2" /> : 
                      <ChevronRight className="w-4 h-4 mr-2" />
                    }
                    Patiënt Netwerk
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Appointments */}
              <Card>
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => toggleSection('appointments')}
                >
                  <CardTitle className="text-base font-medium flex items-center">
                    {expandedSections.appointments ? 
                      <ChevronDown className="w-4 h-4 mr-2" /> : 
                      <ChevronRight className="w-4 h-4 mr-2" />
                    }
                    Patiënt Afspraken
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Communication Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base font-medium">Rapportage ECD</CardTitle>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm">Nieuw</Button>
                  <Button variant="outline" size="sm">Geschiedenis</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Type your message here..."
                  className="min-h-[100px] mb-4"
                />
                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Send className="w-4 h-4 mr-2" />
                    Versturen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Real-time AI Assistant Panel */}
        <RealTimeAIAssistant 
          isOpen={isAssistantOpen} 
          onToggle={() => setIsAssistantOpen(!isAssistantOpen)} 
        />
      </div>
    </div>
  );
};

export default Index;
