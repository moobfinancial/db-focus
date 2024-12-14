import React, { useState } from 'react';
import { X } from 'lucide-react';
import TemplateSelection from './TemplateSelection';
import CustomizeAssistant from './CustomizeAssistant';
import ConfigureTools from './ConfigureTools';
import ReviewCreate from './ReviewCreate';
import WizardProgress from './WizardProgress';

interface Assistant {
  id: string;
  name: string;
  modes?: string[];
  firstMessage?: string;
  systemPrompt?: string;
  provider?: string;
  model?: string;
  tools?: string[];
  voiceProvider?: string;
  voiceId?: string;
  voiceSettings?: {
    speed?: number;
    pitch?: number;
    stability?: number;
    volume?: number;
  };
}

interface AssistantWizardProps {
  onClose: () => void;
  onComplete: (assistant: Assistant) => void;
}

const wizardSteps = [
  { number: 1, title: 'Choose Template' },
  { number: 2, title: 'Customize' },
  { number: 3, title: 'Configure Tools' },
  { number: 4, title: 'Review' }
];

export default function AssistantWizard({ onClose, onComplete }: AssistantWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    firstMessage: '',
    systemPrompt: '',
    tools: [],
    template: null,
    voiceProvider: 'Cartesia',
    voiceId: 'professional_male',
    voiceSettings: {
      speed: 1,
      pitch: 1,
      stability: 0.75,
      volume: 0.75
    }
  });

  const handleTemplateSelect = (template: any) => {
    setFormData({
      ...formData,
      name: template.name,
      firstMessage: template.firstMessage,
      systemPrompt: template.systemPrompt,
      tools: template.tools,
      template
    });
    setCurrentStep(2);
  };

  const handleCustomization = (data: any) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3);
  };

  const handleToolsConfig = (tools: any) => {
    setFormData({ ...formData, tools });
    setCurrentStep(4);
  };

  const handleCreate = () => {
    const assistant: Assistant = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || 'Unnamed Assistant',
      modes: ['Web', 'Voice'],
      firstMessage: formData.firstMessage || '',
      systemPrompt: formData.systemPrompt || '',
      provider: 'dailybots',  
      model: 'dailybots-default',  
      tools: formData.tools || [],
      voiceProvider: formData.voiceProvider || 'Cartesia',
      voiceId: formData.voiceId || 'professional_male',
      voiceSettings: {
        speed: formData.voiceSettings?.speed || 1,
        pitch: formData.voiceSettings?.pitch || 1,
        stability: formData.voiceSettings?.stability || 0.75,
        volume: formData.voiceSettings?.volume || 0.75
      }
    };

    console.log('Wizard Creating Assistant:', assistant);

    // Defensive check before creating
    if (!assistant.name || !assistant.id) {
      console.error('Cannot create assistant: Missing critical details', assistant);
      return;
    }

    onComplete(assistant);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[800px] max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-teal-400">
              Create your new Assistant - Step {currentStep} of 4
            </h2>
            <X 
              className="cursor-pointer text-gray-400 hover:text-white" 
              onClick={onClose}
            />
          </div>
          <div className="mt-6">
            <WizardProgress steps={wizardSteps} currentStep={currentStep} />
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 1 && (
            <TemplateSelection
              onNext={handleTemplateSelect}
              onClose={onClose}
            />
          )}

          {currentStep === 2 && (
            <CustomizeAssistant
              formData={formData}
              onNext={handleCustomization}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <ConfigureTools
              formData={formData}
              onNext={handleToolsConfig}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <ReviewCreate
              formData={formData}
              onBack={() => setCurrentStep(3)}
              onSubmit={handleCreate}
            />
          )}
        </div>
      </div>
    </div>
  );
}