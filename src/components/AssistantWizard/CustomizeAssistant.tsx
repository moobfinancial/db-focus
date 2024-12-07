import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cartesiaApi } from '@/lib/api/cartesia';
import { ModelSelector } from '../Assistants/ModelSelector';
import { PROVIDERS, ModelProvider, Model } from '@/config/providers';
import { Assistant, LLMProvider } from '@/types/assistant';

interface CustomizeAssistantProps {
  formData: Partial<Assistant>;
  onNext: (data: Partial<Assistant>) => void;
  onBack: () => void;
}

export default function CustomizeAssistant({ formData = {}, onNext, onBack }: CustomizeAssistantProps) {
  const [localFormData, setLocalFormData] = useState({
    name: formData?.name || '',
    firstMessage: formData?.firstMessage || '',
    systemPrompt: formData?.systemPrompt || 'You are a helpful AI assistant.',
    provider: formData?.provider || 'DAILY_BOTS',
    model: formData?.model || 'dailybots-default'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      ...formData,
      ...localFormData,
      provider: localFormData.provider as LLMProvider
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Assistant Name</Label>
        <Input
          id="name"
          value={localFormData.name}
          onChange={(e) => setLocalFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter a name for your assistant"
          required
        />
      </div>

      <div>
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={localFormData.systemPrompt || ''}
          onChange={(e) => setLocalFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
          placeholder="Enter the system prompt for your assistant"
          required
        />
      </div>

      <div>
        <Label htmlFor="firstMessage">First Message</Label>
        <Textarea
          id="firstMessage"
          value={localFormData.firstMessage || ''}
          onChange={(e) => setLocalFormData(prev => ({ ...prev, firstMessage: e.target.value }))}
          placeholder="Enter the first message your assistant will send"
          required
        />
      </div>

      <ModelSelector
        selectedProvider={localFormData.provider as LLMProvider}
        selectedModel={localFormData.model}
        onProviderChange={(provider) => {
          const selectedProvider = PROVIDERS.find(p => p.id === provider);
          setLocalFormData(prev => ({ 
            ...prev, 
            provider,
            // Set the first available model for the new provider
            model: selectedProvider?.mockModels?.[0]?.id || prev.model
          }));
        }}
        onModelChange={(model) => setLocalFormData(prev => ({ ...prev, model }))}
      />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Next
        </Button>
      </div>
    </form>
  );
}