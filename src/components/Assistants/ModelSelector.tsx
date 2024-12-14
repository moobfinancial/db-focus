import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROVIDERS } from '@/config/providers';
import { Label } from "@/components/ui/label";
import { LLMProvider } from '@/types/assistant';

interface ModelSelectorProps {
  selectedProvider: LLMProvider;
  selectedModel: string;
  onProviderChange: (provider: LLMProvider) => void;
  onModelChange: (model: string) => void;
}

export function ModelSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange
}: ModelSelectorProps) {
  const [filteredModels, setFilteredModels] = useState<Array<{ id: string; name: string; }>>([]);

  useEffect(() => {
    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    if (provider && provider.mockModels) {
      const models = provider.mockModels.map(model => ({
        id: model.id,
        name: model.name
      }));
      setFilteredModels(models);
      
      // If no model is selected or the current model doesn't belong to this provider,
      // select the first available model
      if (!selectedModel || !provider.mockModels.find(m => m.id === selectedModel)) {
        onModelChange(provider.mockModels[0].id);
      }
    }
  }, [selectedProvider, selectedModel, onModelChange]);

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.mockModels?.find(m => m.id === selectedModel);

  return (
    <div className="space-y-4">
      <div>
        <Label>LLM Provider</Label>
        <Select
          value={selectedProvider}
          onValueChange={(value) => onProviderChange(value as LLMProvider)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a provider">
              {currentProvider?.name || selectedProvider}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Model</Label>
        <Select
          value={selectedModel}
          onValueChange={onModelChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model">
              {currentModel?.name || selectedModel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filteredModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}