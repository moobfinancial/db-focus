import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from 'lucide-react';
import { VoiceCard } from './VoiceCard';
import { VoiceFilters } from './VoiceFilters';
import { AddVoiceCloneModal } from './AddVoiceCloneModal';
import { VoiceDetailsModal } from './VoiceDetailsModal';
import { toast } from "@/components/ui/use-toast";
import { elevenLabsApi } from '@/lib/api/elevenlabs';
import { cartesiaApi } from '@/lib/api/cartesia';
import type { Voice, Provider } from './types';

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

export default function VoiceLibraryTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddVoiceModal, setShowAddVoiceModal] = useState(false);
  const [showVoiceDetailsModal, setShowVoiceDetailsModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        setIsLoading(true);
        
        // Fetch voices from different providers
        const [elevenLabsVoices, cartesiaVoices] = await Promise.all([
          elevenLabsApi.getVoices(),
          cartesiaApi.getVoices()
        ]);

        // Transform ElevenLabs voices
        const transformedElevenLabsVoices: Voice[] = elevenLabsVoices.map(v => ({
          id: v.voice_id,
          name: v.name,
          gender: v.labels.gender || 'Not specified',
          nationality: v.labels.accent || 'Not specified',
          language: 'English',
          provider: '11Labs',
          traits: Object.values(v.labels).filter(Boolean) as string[],
          previewUrl: v.preview_url
        }));

        // Transform Cartesia voices
        const transformedCartesiaVoices: Voice[] = cartesiaVoices.map(v => ({
          id: v.id,
          name: v.name,
          gender: v.gender,
          nationality: 'Not specified',
          language: v.language,
          provider: 'Cartesia',
          traits: v.description ? [v.description] : [],
          previewUrl: v.preview_url
        }));

        // Combine all voices
        const allVoices = [
          ...transformedElevenLabsVoices,
          ...transformedCartesiaVoices
        ];

        setVoices(allVoices);
      } catch (error) {
        console.error('Error fetching voices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch voices. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchVoices();
  }, []);

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         voice.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         voice.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLanguage = selectedLanguage === "All Languages" || voice.language === selectedLanguage;
    const matchesProvider = selectedProvider === "All Providers" || voice.provider === selectedProvider;
    return matchesSearch && matchesLanguage && matchesProvider;
  });

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
    setShowVoiceDetailsModal(true);
  };

  const handleAddVoice = (voiceData: any) => {
    const newVoice: Voice = {
      id: Date.now().toString(),
      name: voiceData.name,
      gender: "Custom",
      nationality: "Custom",
      language: "English",
      provider: "Custom",
      traits: ["Custom"],
      isCloned: true,
      previewUrl: voiceData.audioUrl
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
            onSearchChange={setSearchQuery}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            languages={allLanguages}
            providers={allProviders}
          />
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          ) : filteredVoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVoices.map((voice) => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  onSelect={handleVoiceSelect}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No voices found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      <AddVoiceCloneModal
        isOpen={showAddVoiceModal}
        onClose={() => setShowAddVoiceModal(false)}
        onSubmit={handleAddVoice}
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