import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Volume2, Filter } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { cartesiaApi } from '@/lib/api/cartesia';
import { useToast } from "@/components/ui/use-toast";

interface Voice {
  id: string;
  name: string;
  description?: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  style?: string;
  provider: string;
  previewUrl?: string;
}

interface VoiceSelectionProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function VoiceSelection({ formData, onNext, onBack }: VoiceSelectionProps) {
  const { toast } = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [providers, setProviders] = useState<string[]>(['Cartesia']);
  const [selectedProvider, setSelectedProvider] = useState<string>(
    formData?.voiceProvider?.toLowerCase() || 'cartesia'
  );
  const [selectedVoice, setSelectedVoice] = useState<string>(
    formData?.voiceId || ''
  );
  const [volume, setVolume] = useState<number>(
    formData?.voiceSettings?.volume ? formData.voiceSettings.volume * 100 : 75
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Filtering options
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [styleFilter, setStyleFilter] = useState<string>('');

  const MOCK_VOICES: Voice[] = [
    { 
      id: 'mock-male-1', 
      name: 'Professional Male', 
      description: 'A professional male voice',
      language: 'English',
      gender: 'male',
      style: 'professional',
      provider: 'mock',
      previewUrl: '' 
    },
    { 
      id: 'mock-female-1', 
      name: 'Friendly Female', 
      description: 'A friendly female voice',
      language: 'English',
      gender: 'female',
      style: 'friendly',
      provider: 'mock',
      previewUrl: '' 
    }
  ];

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const cartesiaVoices = await cartesiaApi.getVoices();

        // Transform Cartesia voices to match our Voice interface
        const transformedVoices: Voice[] = cartesiaVoices.map(voice => ({
          id: voice.id,
          name: voice.name,
          description: voice.traits?.join(', '),
          language: voice.language,
          gender: voice.gender as 'male' | 'female' | 'neutral',
          style: voice.nationality,
          provider: 'Cartesia',
          previewUrl: voice.audioUrl
        }));

        // Ensure at least mock voices are available
        const finalVoices = transformedVoices.length > 0 
          ? transformedVoices 
          : MOCK_VOICES;

        setVoices(finalVoices);
        setIsLoading(false);

        // Ensure a voice is selected
        if (!selectedVoice && finalVoices.length > 0) {
          setSelectedVoice(finalVoices[0].id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch voices. Using mock data.",
          variant: "destructive"
        });

        // Fallback to mock voices
        setVoices(MOCK_VOICES);
        setSelectedProvider('mock');
        setSelectedVoice(MOCK_VOICES[0].id);
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const handleNext = () => {
    // Ensure a voice is selected before proceeding
    if (!selectedVoice) {
      toast({
        title: "Voice Selection Required",
        description: "Please select a voice before continuing.",
        variant: "destructive"
      });
      return;
    }

    const selectedVoiceObj = voices.find(v => v.id === selectedVoice);
    
    onNext({
      voiceId: selectedVoice,
      voiceName: selectedVoiceObj?.name || 'Default Voice',
      voiceProvider: selectedProvider,
      volume
    });
  };

  // Filter voices based on selected provider and other filters
  const filteredVoices = voices.filter(voice => 
    (selectedProvider ? voice.provider === selectedProvider : true) &&
    (languageFilter ? voice.language.toLowerCase().includes(languageFilter.toLowerCase()) : true) &&
    (genderFilter ? voice.gender === genderFilter : true) &&
    (styleFilter ? voice.style?.toLowerCase().includes(styleFilter.toLowerCase()) : true)
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Voice</h2>
      
      {/* Provider Selection */}
      <div className="space-y-2">
        <Label>Voice Provider</Label>
        <Select 
          value={selectedProvider} 
          onValueChange={setSelectedProvider}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map(provider => (
              <SelectItem 
                key={provider} 
                value={provider}
                // Ensure non-empty value
                className={!provider ? 'hidden' : ''}
              >
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <Label>Voice</Label>
        <Select 
          value={selectedVoice} 
          onValueChange={setSelectedVoice}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {filteredVoices.map(voice => (
              <SelectItem 
                key={voice.id} 
                value={voice.id}
              >
                {voice.name} - {voice.language} {voice.gender ? `(${voice.gender})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Volume</Label>
          <Volume2 className="text-gray-500" />
        </div>
        <Slider 
          value={[volume]} 
          onValueChange={(val) => setVolume(val[0])} 
          min={0} 
          max={100} 
          step={1} 
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}