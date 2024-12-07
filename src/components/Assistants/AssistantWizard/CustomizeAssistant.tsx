import React, { useState } from 'react';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { 
  LLM_PROVIDERS, 
  TTS_PROVIDERS 
} from '@/config/rtvi.config';

interface CustomizeAssistantProps {
  formData: {
    name?: string;
    firstMessage?: string;
    systemPrompt?: string;
    voiceProvider?: string;
    voiceId?: string;
    voiceSettings?: {
      speed?: number;
      pitch?: number;
      stability?: number;
      volume?: number;
    };
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function CustomizeAssistant({ formData, onNext, onBack }: CustomizeAssistantProps) {
  const [name, setName] = useState(formData.name || '');
  const [firstMessage, setFirstMessage] = useState(formData.firstMessage || '');
  const [systemPrompt, setSystemPrompt] = useState(formData.systemPrompt || '');
  
  // Voice Configuration State
  const [voiceProvider, setVoiceProvider] = useState(formData.voiceProvider || 'Cartesia');
  const [voiceId, setVoiceId] = useState(formData.voiceId || 'professional_male');
  const [voiceSettings, setVoiceSettings] = useState(formData.voiceSettings || {
    speed: 1,
    pitch: 1,
    stability: 0.75,
    volume: 0.75
  });

  const handleNextStep = () => {
    onNext({
      name,
      firstMessage,
      systemPrompt,
      voiceProvider,
      voiceId,
      voiceSettings
    });
  };

  // Update the voice provider and reset voice ID when provider changes
  const handleVoiceProviderChange = (provider: string) => {
    setVoiceProvider(provider);
    // Reset to first voice of the new provider
    const defaultVoice = TTS_PROVIDERS.find(p => p.name === provider)?.voices[0].value || 'professional_male';
    setVoiceId(defaultVoice);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white mb-2">Assistant Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
          placeholder="Enter assistant name"
        />
      </div>

      <div>
        <label className="block text-white mb-2">First Message</label>
        <textarea
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 h-32"
          placeholder="Enter the first message your assistant will say"
        />
      </div>

      <div>
        <label className="block text-white mb-2">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 h-48"
          placeholder="Enter the system prompt that defines your assistant's behavior"
        />
      </div>

      {/* TTS Provider Selection */}
      <div>
        <label className="block text-white mb-2">Voice Provider</label>
        <select
          value={voiceProvider}
          onChange={(e) => handleVoiceProviderChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        >
          {TTS_PROVIDERS.map(provider => (
            <option key={provider.name} value={provider.name}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      {/* TTS Voice Selection */}
      <div>
        <label className="block text-white mb-2">Voice</label>
        <select
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        >
          {TTS_PROVIDERS.find(p => p.name === voiceProvider)?.voices.map(voice => (
            <option key={voice.value} value={voice.value}>
              {voice.label}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-white mb-2">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.speed}
            onChange={(e) => setVoiceSettings({...voiceSettings, speed: parseFloat(e.target.value)})}
            className="w-full"
          />
          <span className="text-white text-sm">{voiceSettings.speed.toFixed(1)}</span>
        </div>
        <div>
          <label className="block text-white mb-2">Pitch</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.pitch}
            onChange={(e) => setVoiceSettings({...voiceSettings, pitch: parseFloat(e.target.value)})}
            className="w-full"
          />
          <span className="text-white text-sm">{voiceSettings.pitch.toFixed(1)}</span>
        </div>
        <div>
          <label className="block text-white mb-2">Stability</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.stability}
            onChange={(e) => setVoiceSettings({...voiceSettings, stability: parseFloat(e.target.value)})}
            className="w-full"
          />
          <span className="text-white text-sm">{voiceSettings.stability.toFixed(1)}</span>
        </div>
        <div>
          <label className="block text-white mb-2">Volume</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.volume}
            onChange={(e) => setVoiceSettings({...voiceSettings, volume: parseFloat(e.target.value)})}
            className="w-full"
          />
          <span className="text-white text-sm">{voiceSettings.volume.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}