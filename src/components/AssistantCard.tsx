import React, { useState } from 'react';
import { Share2, Settings, Mic, Trash2, X, Waves, Volume2 } from 'lucide-react';
import { TTS_PROVIDERS } from '@/config/providers';
import { ScrollArea, Tooltip, TooltipTrigger, TooltipContent, Button, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Slider } from '@/components/ui';
import { dailybotsApi } from '@/lib/api/client';
import { toast } from '@/components/ui/use-toast';

// Define types for voice settings and call state
type VoiceSettings = {
  speed: number;
  pitch: number;
  stability: number;
  volume: number;
};

type VoiceProvider = 'Cartesia' | 'ElevenLabs' | 'Google' | 'Amazon';

interface AssistantCardProps {
  id: string;
  name: string;
  modes?: string[];
  firstMessage?: string;
  systemPrompt?: string;
  provider?: string;
  model?: string;
  tools?: string[];
  voiceProvider?: VoiceProvider;
  voiceId?: string;
  voiceSettings?: Partial<VoiceSettings>;
  template?: any;
  onDelete?: () => void;
  onUpdate?: (assistant: any) => void;
  onVoiceUpdate?: (voiceConfig: any) => void;
}

interface CallState {
  isCallActive: boolean;
  isAssistantSpeaking: boolean;
  callTranscript: { role: string, content: string }[];
  daily?: any;
  sessionId?: string;
}

export default function AssistantCard(props: AssistantCardProps) {
  // Comprehensive prop validation
  console.group('AssistantCard Rendering');
  console.log('Raw Props Received:', props);

  // Defensive check for props
  if (!props || Object.keys(props).length === 0) {
    console.error('CRITICAL: No props or empty props provided to AssistantCard');
    console.groupEnd();
    return null;
  }

  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    isAssistantSpeaking: false,
    callTranscript: []
  });

  const [activeTab, setActiveTab] = useState('model');

  // Destructure with comprehensive fallbacks
  const {
    id = crypto.randomUUID(),
    name = 'Unnamed Assistant',
    modes = ['Web', 'Voice'],
    firstMessage = '',
    systemPrompt = '',
    provider = 'openai',
    model = 'gpt-3.5-turbo',
    tools = [],
    voiceProvider = 'Cartesia',
    voiceId = 'professional_male',
    voiceSettings = {
      speed: 1,
      pitch: 1,
      stability: 0.75,
      volume: 0.75
    },
    template = null,
    onDelete = () => {
      console.warn('No onDelete handler provided');
    },
    onUpdate = () => {
      console.warn('No onUpdate handler provided');
    },
    onVoiceUpdate = () => {
      console.warn('No onVoiceUpdate handler provided');
    }
  } = props;

  // Comprehensive logging
  console.log('Processed Props:', {
    id,
    name,
    modes,
    firstMessage,
    systemPrompt,
    provider,
    model,
    tools,
    voiceProvider,
    voiceId,
    voiceSettings,
    template
  });

  // Validate critical props
  if (!name || !id) {
    console.error('CRITICAL: Missing name or ID in AssistantCard', { name, id });
    console.groupEnd();
    return null;
  }

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately since we only needed it for permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  };

  const handleMicrophoneClick = async () => {
    // Request microphone permission first
    const hasMicPermission = await requestMicrophonePermission();
    if (!hasMicPermission) {
      // Show user-friendly notification
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to start a voice conversation with the assistant.",
        variant: "destructive",
      });
      return;
    }

    // If we have permission, start the call
    startCall();
  };

  const startCall = async () => {
    try {
      setCallState(prev => ({
        ...prev,
        isCallActive: true,
        callTranscript: []
      }));

      const result = await dailybotsApi.startConversation(id, {
        maxDuration: 300,
        pauseThreshold: 1000,
        silenceThreshold: 500,
        voiceSettings
      });

      if (!result.success) {
        console.error('Start call error:', result.error);
        setCallState(prev => ({
          ...prev,
          isCallActive: false
        }));
        return;
      }

      setCallState(prev => ({
        ...prev,
        daily: result.daily,
        sessionId: result.sessionId
      }));
    } catch (error) {
      console.error('Start call error:', error);
      setCallState(prev => ({
        ...prev,
        isCallActive: false
      }));
    }
  };

  const endCall = async () => {
    try {
      if (callState.sessionId && callState.daily) {
        await dailybotsApi.endConversation(callState.sessionId, callState.daily);
      }
      setCallState(prev => ({
        ...prev,
        isCallActive: false,
        daily: undefined,
        sessionId: undefined
      }));
    } catch (error) {
      console.error('End call error:', error);
    }
  };

  const renderTestTab = () => (
    <div className="space-y-4 flex flex-col items-center justify-center">
      {/* Call Transcript (optional, can be a scrollable area) */}
      {callState.callTranscript.length > 0 && (
        <ScrollArea className="h-[200px] w-full bg-gray-900 rounded-lg p-4 mb-4">
          {callState.callTranscript.map((entry, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg mb-2 ${
                entry.role === 'user' ? 'bg-gray-700 text-right' : 'bg-teal-900/50'
              }`}
            >
              {entry.content}
            </div>
          ))}
        </ScrollArea>
      )}

      {/* Call Controls */}
      <div className="flex items-center space-x-4">
        {/* Mic Icon to Start Call */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleMicrophoneClick}
              disabled={callState.isCallActive}
              className={`h-16 w-16 ${callState.isCallActive ? 'opacity-50' : 'hover:bg-teal-100'}`}
            >
              {callState.isCallActive ? (
                <Mic className="h-8 w-8 text-teal-500 animate-pulse" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{callState.isCallActive ? 'Call in Progress' : 'Start Voice Call'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Assistant Speaking Animation */}
        {callState.isAssistantSpeaking && (
          <div className="flex items-center space-x-2">
            <div className="animate-bounce">
              <Volume2 className="h-6 w-6 text-teal-500" />
            </div>
            <span className="text-sm text-teal-500">Assistant is speaking...</span>
          </div>
        )}

        {/* End Call Button */}
        {callState.isCallActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={endCall}
                className="h-12 w-12 bg-red-600 hover:bg-red-700"
              >
                <X className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>End Call</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );

  const renderVoiceTab = () => {
    return (
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label>Voice Provider</Label>
          <Select
            value={voiceProvider}
            onValueChange={(value: VoiceProvider) => onVoiceUpdate?.({ voiceProvider: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice provider" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(TTS_PROVIDERS).map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Voice</Label>
          <Select
            value={voiceId}
            onValueChange={(value: string) => onVoiceUpdate?.({ voiceId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {TTS_PROVIDERS[voiceProvider as VoiceProvider]?.map((voice) => (
                <SelectItem key={voice} value={voice}>
                  {voice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Speed</Label>
            <Slider
              min={0.5}
              max={2.0}
              step={0.1}
              value={[voiceSettings?.speed || 1]}
              onValueChange={([value]) => onVoiceUpdate?.({ voiceSettings: { ...voiceSettings, speed: value } })}
            />
          </div>

          <div className="space-y-2">
            <Label>Pitch</Label>
            <Slider
              min={0.5}
              max={2.0}
              step={0.1}
              value={[voiceSettings?.pitch || 1]}
              onValueChange={([value]) => onVoiceUpdate?.({ voiceSettings: { ...voiceSettings, pitch: value } })}
            />
          </div>

          <div className="space-y-2">
            <Label>Stability</Label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[voiceSettings?.stability || 0.75]}
              onValueChange={([value]) => onVoiceUpdate?.({ voiceSettings: { ...voiceSettings, stability: value } })}
            />
          </div>

          <div className="space-y-2">
            <Label>Volume</Label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[voiceSettings?.volume || 0.75]}
              onValueChange={([value]) => onVoiceUpdate?.({ voiceSettings: { ...voiceSettings, volume: value } })}
            />
          </div>
        </div>
      </div>
    );
  };

  console.groupEnd();

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">{name}</h2>
          <span className="text-gray-400 text-sm">{id}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onDelete}
            className="p-2 hover:bg-[#2a2f3e] rounded-lg"
            aria-label="Delete assistant"
          >
            <Trash2 size={20} className="text-gray-400" />
          </button>
          <button className="p-2 hover:bg-[#2a2f3e] rounded-lg">
            <Settings size={20} className="text-gray-400" />
          </button>
          <button className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c]">
            Test {name}
          </button>
          <button className="px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488]">
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'model' ? renderTestTab() : renderVoiceTab()}
      </div>
    </div>
  );
}