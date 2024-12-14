import React, { useState } from 'react';
import { X } from 'lucide-react';
import TemplateSelection from './TemplateSelection';
import CustomizeAssistant from './CustomizeAssistant';
import VoiceSelection from './VoiceSelection';
import ConfigureTools from './ConfigureTools';
import ReviewCreate from './ReviewCreate';
import WizardProgress from './WizardProgress';
import { Assistant, LLMProvider, VoiceProvider } from '@/types/assistant';

interface AssistantWizardProps {
  onClose: () => void;
  onCreate: (assistant: Partial<Assistant>) => Promise<Assistant | null>;
  isCreating: boolean;
}

const wizardSteps = [
  { number: 1, title: 'Template' },
  { number: 2, title: 'Customize' },
  { number: 3, title: 'Voice' },
  { number: 4, title: 'Tools' },
  { number: 5, title: 'Review' }
];

const AssistantWizard: React.FC<AssistantWizardProps> = ({
  onClose,
  onCreate,
  isCreating
}) => {
  const [step, setStep] = useState(1);
  const [assistant, setAssistant] = useState<Partial<Assistant>>({
    name: '',
    systemPrompt: 'You are a helpful AI assistant.',
    firstMessage: 'Hello! How can I help you today?',
    provider: 'OPEN_AI' as LLMProvider,
    model: 'gpt-3.5-turbo',
    language: 'en',
    tools: [],
    voiceProvider: 'CARTESIA' as VoiceProvider,
    voiceId: '',
    voiceSettings: {
      speed: 1,
      pitch: 1,
      stability: 0.75,
      volume: 0.75,
      sampleRate: 24000
    }
  });

  const handleTemplateSelect = (template: any) => {
    setAssistant(prev => ({
      ...prev,
      ...template
    }));
    setStep(2);
  };

  const handleCustomize = (customData: Partial<Assistant>) => {
    setAssistant(prev => ({
      ...prev,
      ...customData
    }));
    setStep(3);
  };

  const handleVoiceSelect = (voiceData: Partial<Assistant>) => {
    setAssistant(prev => ({
      ...prev,
      ...voiceData
    }));
    setStep(4);
  };

  const handleToolsSelect = (toolsData: { id: string; config: any }[]) => {
    setAssistant(prev => ({
      ...prev,
      tools: toolsData.map(t => t.id)
    }));
    setStep(5);
  };

  const handleCreate = async () => {
    try {
      const payload: Partial<Assistant> = {
        name: assistant.name,
        systemPrompt: assistant.systemPrompt,
        firstMessage: assistant.firstMessage,
        provider: assistant.provider as LLMProvider,
        model: assistant.model,
        language: assistant.language || 'en',
        tools: (assistant.tools || []).filter(tool => 
          ['Calendar Integration', 'Scraping Tool', 'Send SMS'].includes(tool)
        ),
        voiceProvider: assistant.voiceProvider as VoiceProvider,
        voiceId: assistant.voiceId || 'professional_male',
        voiceSettings: {
          speed: 1,
          pitch: 1,
          stability: 0.75,
          volume: 0.75,
          sampleRate: 24000
        }
      };

      console.log('Creating assistant with payload:', payload);
      const createdAssistant = await onCreate(payload);
      if (createdAssistant) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating assistant:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create Assistant</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <WizardProgress currentStep={step} steps={wizardSteps} />

          <div className="mt-8">
            {step === 1 && (
              <TemplateSelection onSelect={handleTemplateSelect} onBack={onClose} />
            )}
            {step === 2 && (
              <CustomizeAssistant
                formData={assistant}
                onNext={handleCustomize}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <VoiceSelection
                formData={assistant}
                onNext={handleVoiceSelect}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <ConfigureTools
                formData={assistant}
                onNext={handleToolsSelect}
                onBack={() => setStep(3)}
              />
            )}
            {step === 5 && (
              <ReviewCreate
                formData={assistant}
                onBack={() => setStep(4)}
                onSubmit={handleCreate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantWizard;