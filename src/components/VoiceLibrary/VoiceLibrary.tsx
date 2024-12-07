import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { VoiceCard } from './VoiceCard';
import { VoiceFilters } from './VoiceFilters';
import { AddVoiceCloneModal } from './AddVoiceCloneModal';
import { VoiceDetailsModal } from './VoiceDetailsModal';
import type { Voice, Provider } from './types';
import { cartesiaApi } from '@/lib/api/cartesia';
import { elevenLabsApi } from '@/lib/api/elevenlabs';
import { toast } from "@/components/ui/use-toast";

const allLanguages = [
  "English", "Spanish (Spain)", "Spanish (Mexico)", "French (France)", "French (Canada)",
  "German", "Italian", "Japanese", "Korean", "Portuguese (Brazil)", "Portuguese (Portugal)",
  "Russian", "Chinese (Mandarin)", "Chinese (Cantonese)"
];

const allProviders: Provider[] = [
  { name: "Talkai247", status: "Included", languages: ["English"] },
  { name: "11Labs", status: "Premium", languages: ["English"] },
  { name: "Playht", status: "Premium", languages: ["English"] },
  { name: "Deepgram", status: "Included", languages: ["English"] },
  { name: "Azure", status: "Included", languages: allLanguages },
  { name: "Cartesia", status: "Premium", languages: allLanguages },
];

const initialVoices: Voice[] = [
  { 
    id: 1,
    name: "Emma",
    gender: "Female",
    nationality: "British",
    language: "English",
    provider: "Talkai247",
    traits: ["Friendly", "Professional"]
  },
  {
    id: 2,
    name: "James",
    gender: "Male",
    nationality: "American",
    language: "English",
    provider: "11Labs",
    traits: ["Deep", "Authoritative"]
  }
];

export function VoiceLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [showAddVoiceModal, setShowAddVoiceModal] = useState(false);
  const [showVoiceDetailsModal, setShowVoiceDetailsModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        // Fetch voices from all providers
        const [elevenLabsVoices, cartesiaVoices] = await Promise.all([
          elevenLabsApi.getVoices().catch(error => {
            console.error('Error fetching ElevenLabs voices:', error);
            return [];
          }),
          cartesiaApi.getVoices().catch(error => {
            console.error('Error fetching Cartesia voices:', error);
            return [];
          })
        ]);

        // Format and combine voices
        const formattedVoices = [
          ...elevenLabsVoices.map(voice => ({
            id: voice.voice_id,
            name: voice.name,
            gender: voice.labels.gender || 'Unknown',
            nationality: voice.labels.accent || 'Various',
            language: 'English',
            provider: '11Labs',
            traits: Object.values(voice.labels).filter(Boolean) as string[],
            isCloned: false,
            audioUrl: voice.preview_url
          })),
          ...cartesiaVoices.map(voice => ({
            id: voice.id,
            name: voice.name,
            gender: voice.gender,
            nationality: voice.nationality,
            language: voice.language,
            provider: 'Cartesia',
            traits: voice.traits,
            isCloned: false,
            audioUrl: voice.audioUrl
          }))
        ];

        setVoices(formattedVoices);
      } catch (error) {
        console.error('Error fetching voices:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch voices from providers',
          variant: 'destructive'
        });
      }
    };

    fetchVoices();
  }, []);

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         voice.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         voice.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLanguage = selectedLanguage === "All Languages" || voice.language === selectedLanguage;
    
    // Normalize provider names for comparison
    const normalizedVoiceProvider = voice.provider.toLowerCase().replace(/\s+/g, '');
    const normalizedSelectedProvider = selectedProvider.toLowerCase().replace(/\s+/g, '');
    const matchesProvider = selectedProvider === "All Providers" || 
                           normalizedVoiceProvider === normalizedSelectedProvider;
    
    console.log('Filtering voice:', {
      voice: voice.name,
      provider: voice.provider,
      selectedProvider,
      normalizedVoiceProvider,
      normalizedSelectedProvider,
      matchesProvider
    });
    
    return matchesSearch && matchesLanguage && matchesProvider;
  });

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
    setShowVoiceDetailsModal(true);
  };

  const handleAddVoice = (voiceData: any) => {
    const newVoice: Voice = {
      id: Date.now(),
      name: voiceData.name,
      gender: "Custom",
      nationality: "Custom",
      language: "English",
      provider: "Custom",
      traits: ["Custom"],
      isCloned: true,
      audioUrl: voiceData.audioUrl
    };
    setVoices([...voices, newVoice]);
    setShowAddVoiceModal(false);
  };

  return (
    <div className="p-8 bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-teal-400">Voice Library</h2>
          <p className="text-gray-400">Browse and manage AI voices</p>
        </div>
        <Button 
          onClick={() => setShowAddVoiceModal(true)} 
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Voice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <VoiceFilters
            searchQuery={searchQuery}
            selectedLanguage={selectedLanguage}
            selectedProvider={selectedProvider}
            onSearchChange={setSearchQuery}
            onLanguageChange={setSelectedLanguage}
            onProviderChange={setSelectedProvider}
            languages={allLanguages}
            providers={allProviders}
          />
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVoices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                onSelect={handleVoiceSelect}
              />
            ))}
          </div>
        </div>
      </div>

      <AddVoiceCloneModal
        isOpen={showAddVoiceModal}
        onClose={() => setShowAddVoiceModal(false)}
        onAddVoice={handleAddVoice}
      />

      <VoiceDetailsModal
        voice={selectedVoice}
        isOpen={showVoiceDetailsModal}
        onClose={() => setShowVoiceDetailsModal(false)}
        providers={allProviders}
      />
    </div>
  );
}