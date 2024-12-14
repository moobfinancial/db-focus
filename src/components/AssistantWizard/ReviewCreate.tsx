import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Assistant } from '@/types/assistant';
import { PROVIDERS } from '@/config/providers';

interface ReviewCreateProps {
  formData: Partial<Assistant>;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ReviewCreate({ formData, onBack, onSubmit }: ReviewCreateProps) {
  const selectedProvider = PROVIDERS.find(p => p.id === formData.provider);
  const selectedModel = selectedProvider?.mockModels?.find(m => m.id === formData.model);

  return (
    <div className="space-y-4">
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-white font-medium mb-2">Assistant Details</h3>
        <div className="space-y-2">
          <div>
            <span className="text-gray-400 text-sm">Name:</span>
            <p className="text-white">{formData.name}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">First Message:</span>
            <p className="text-white">{formData.firstMessage}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">System Prompt:</span>
            <p className="text-white">{formData.systemPrompt}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-white font-medium mb-2">LLM Configuration</h3>
        <div className="space-y-2">
          <div>
            <span className="text-gray-400 text-sm">Provider:</span>
            <p className="text-white">{selectedProvider?.name || formData.provider}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Model:</span>
            <p className="text-white">{selectedModel?.name || formData.model}</p>
          </div>
        </div>
      </div>

      {formData.voiceId && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Voice Configuration</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400 text-sm">Provider:</span>
              <p className="text-white">{formData.voiceProvider}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Selected Voice:</span>
              <p className="text-white">{formData.voiceId}</p>
            </div>
            {formData.voiceSettings && (
              <>
                <div>
                  <span className="text-gray-400 text-sm">Volume:</span>
                  <p className="text-white">{(formData.voiceSettings.volume * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Speed:</span>
                  <p className="text-white">{formData.voiceSettings.speed}x</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Pitch:</span>
                  <p className="text-white">{formData.voiceSettings.pitch}x</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {formData.tools && formData.tools.length > 0 && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Selected Tools</h3>
          <div className="flex flex-wrap gap-2">
            {formData.tools.map((toolId: string, index: number) => {
              const toolName = {
                'calendar': 'Calendar Integration',
                'scraping': 'Scraping Tool',
                'sms': 'Send SMS'
              }[toolId] || toolId;
              return (
                <Badge key={index} variant="secondary" className="bg-gray-600">
                  {toolName}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Create Assistant
        </button>
      </div>
    </div>
  );
}