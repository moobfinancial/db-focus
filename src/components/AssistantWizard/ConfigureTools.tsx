import React from 'react';
import { Calendar, Globe, MessageSquare } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  icon: React.ElementType;
  configFields: string[];
}

interface ConfigureToolsProps {
  formData: any;
  onNext: (tools: { id: string; config: any }[]) => void;
  onBack: () => void;
}

export default function ConfigureTools({ formData, onNext, onBack }: ConfigureToolsProps) {
  const [selectedTools, setSelectedTools] = React.useState<string[]>(formData.tools || []);

  const tools: Tool[] = [
    {
      id: 'Calendar Integration',
      name: 'Calendar Integration',
      icon: Calendar,
      configFields: ['provider']
    },
    {
      id: 'Scraping Tool',
      name: 'Scraping Tool',
      icon: Globe,
      configFields: ['url']
    },
    {
      id: 'Send SMS',
      name: 'Send SMS',
      icon: MessageSquare,
      configFields: ['apiKey', 'fromNumber']
    }
  ];

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleNext = () => {
    onNext(selectedTools.map(toolId => ({
      id: toolId,
      config: {}
    })));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTools.includes(tool.id);
          return (
            <div
              key={tool.id}
              className={`p-6 rounded-lg cursor-pointer border-2 transition-colors ${
                isSelected
                  ? 'border-teal-600 bg-gray-700'
                  : 'border-transparent bg-gray-700 hover:border-gray-600'
              }`}
              onClick={() => toggleTool(tool.id)}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`${isSelected ? 'text-teal-400' : 'text-gray-400'}`} size={24} />
                <span className="text-white font-medium">{tool.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}