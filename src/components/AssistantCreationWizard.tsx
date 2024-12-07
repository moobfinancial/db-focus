import React, { useState, useEffect } from 'react';
import { 
  LANGUAGES, 
  LLM_PROVIDERS, 
  TTS_PROVIDERS, 
  PRESET_CHARACTERS 
} from '@/config/rtvi.config';
import { VoiceAssistant } from './VoiceAssistant';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { dailyBotsApi } from '@/api/dailybots';
import { toast } from './toast';

interface AssistantConfig {
  name: string;
  language: string;
  llmProvider: string;
  llmModel: string;
  ttsProvider: string;
  ttsVoice: string;
  character: string;
  customPrompt?: string;
}

interface Voice {
  id: string;
  name: string;
  description: string;
  language: string;
  gender: string;
  style: string;
  provider: string;
  previewUrl: string;
}

export function AssistantCreationWizard() {
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig>({
    name: '',
    language: 'en',
    llmProvider: 'openai',
    llmModel: 'gpt-4-turbo',
    ttsProvider: 'eleven-labs',
    ttsVoice: 'rachel',
    character: 'DB Focus Assistant',
    customPrompt: ''
  });

  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  useEffect(() => {
    async function fetchVoicesForProvider() {
      try {
        setIsLoadingVoices(true);
        const fetchedVoices = await dailyBotsApi.getVoices(assistantConfig.ttsProvider);
        
        const transformedVoices: Voice[] = fetchedVoices.map(voice => ({
          id: voice.id,
          name: voice.name,
          description: voice.description || '',
          language: voice.language,
          gender: voice.gender,
          style: voice.style,
          provider: voice.provider,
          previewUrl: voice.previewUrl || ''
        }));

        setVoices(transformedVoices);
        
        // If current selected voice is not in new voices, reset to first voice
        if (!transformedVoices.some(v => v.id === assistantConfig.ttsVoice)) {
          handleConfigChange('ttsVoice', transformedVoices[0]?.id || '');
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch voices for the selected provider",
          variant: "destructive"
        });
      } finally {
        setIsLoadingVoices(false);
      }
    }

    fetchVoicesForProvider();
  }, [assistantConfig.ttsProvider]);

  const handleConfigChange = (field: keyof AssistantConfig, value: string) => {
    setAssistantConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAssistant = async () => {
    try {
      // Prepare the complete assistant configuration
      const assistantData = {
        name: assistantConfig.name,
        firstMessage: assistantConfig.customPrompt || '',
        systemPrompt: `You are a ${assistantConfig.character} assistant. ${assistantConfig.customPrompt || ''}`,
        voiceProvider: assistantConfig.ttsProvider,
        voiceId: assistantConfig.ttsVoice,
        voiceSettings: {
          speed: 1,  // Default speed
          pitch: 1,  // Default pitch
          volume: 0.75,  // Default volume
          stability: 0.75  // Default stability
        },
        llmProvider: assistantConfig.llmProvider,
        llmModel: assistantConfig.llmModel
      };

      // Call the API to create the assistant
      const response = await fetch('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assistantData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assistant');
      }

      const createdAssistant = await response.json();

      // Show success toast
      toast({
        title: "Success",
        description: `Assistant "${createdAssistant.name}" created successfully`
      });

      // Close the wizard and potentially refresh the assistants list
      // onClose && onClose();
    } catch (error) {
      console.error('Assistant creation error:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create assistant',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Create New Assistant</h2>
      
      {/* Name */}
      <div>
        <Label>Assistant Name</Label>
        <input 
          type="text" 
          value={assistantConfig.name}
          onChange={(e) => handleConfigChange('name', e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Enter assistant name"
        />
      </div>

      {/* Language */}
      <div>
        <Label>Language</Label>
        <Select 
          value={assistantConfig.language}
          onValueChange={(value) => handleConfigChange('language', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LLM Provider */}
      <div>
        <Label>LLM Provider</Label>
        <Select 
          value={assistantConfig.llmProvider}
          onValueChange={(value) => handleConfigChange('llmProvider', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select LLM Provider" />
          </SelectTrigger>
          <SelectContent>
            {LLM_PROVIDERS.map(provider => (
              <SelectItem key={provider.name} value={provider.name.toLowerCase()}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LLM Model */}
      <div>
        <Label>LLM Model</Label>
        <Select 
          value={assistantConfig.llmModel}
          onValueChange={(value) => handleConfigChange('llmModel', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select LLM Model" />
          </SelectTrigger>
          <SelectContent>
            {LLM_PROVIDERS.find(p => p.name.toLowerCase() === assistantConfig.llmProvider)
              ?.models.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </div>

      {/* TTS Provider */}
      <div>
        <Label>Text-to-Speech Provider</Label>
        <Select 
          value={assistantConfig.ttsProvider}
          onValueChange={(value) => handleConfigChange('ttsProvider', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select TTS Provider" />
          </SelectTrigger>
          <SelectContent>
            {TTS_PROVIDERS.map(provider => (
              <SelectItem key={provider.name} value={provider.name.toLowerCase()}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TTS Voice */}
      <div>
        <Label>TTS Voice</Label>
        <Select 
          value={assistantConfig.ttsVoice}
          onValueChange={(value) => handleConfigChange('ttsVoice', value)}
          disabled={isLoadingVoices}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select TTS Voice" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingVoices ? (
              <div className="p-2 text-center">Loading voices...</div>
            ) : voices.length > 0 ? (
              voices.map(voice => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name} ({voice.gender}, {voice.style})
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-center">No voices available</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Character Preset */}
      <div>
        <Label>Character Preset</Label>
        <Select 
          value={assistantConfig.character}
          onValueChange={(value) => handleConfigChange('character', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Character Preset" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_CHARACTERS.map(character => (
              <SelectItem key={character.name} value={character.name}>
                {character.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Prompt */}
      <div>
        <Label>Custom Prompt (Optional)</Label>
        <Textarea 
          value={assistantConfig.customPrompt}
          onChange={(e) => handleConfigChange('customPrompt', e.target.value)}
          placeholder="Enter a custom system prompt for your assistant"
          className="w-full"
        />
      </div>

      {/* Preview and Test */}
      <div className="flex items-center space-x-4">
        <Button onClick={handleCreateAssistant}>Create Assistant</Button>
        <VoiceAssistant 
          initialConfig={assistantConfig} 
          mode="preview" 
        />
      </div>
    </div>
  );
}
