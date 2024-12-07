"use client";

import { useState, useEffect, useRef } from 'react';
import { DailyTransport } from "@daily-co/realtime-ai-daily";
import { RTVIClient, LLMHelper } from "realtime-ai";
import { 
  defaultBotProfile, 
  defaultMaxDuration, 
  defaultServices, 
  defaultConfig,
  LLM_PROVIDERS,
  TTS_PROVIDERS
} from '@/config/rtvi.config';

interface VoiceAssistantProps {
  assistantData?: {
    id?: string;
    name?: string;
    llmProvider?: string;
    llmModel?: string;
    ttsProvider?: string;
    ttsVoice?: string;
    systemPrompt?: string;
  };
  onVoiceConfigUpdate?: (config: any) => void;
}

export function VoiceAssistant({ 
  assistantData, 
  onVoiceConfigUpdate 
}: VoiceAssistantProps) {
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<any>({});
  const voiceClientRef = useRef<RTVIClient | null>(null);

  useEffect(() => {
    if (voiceClientRef.current) return;

    // Determine providers and models based on assistant data or defaults
    const llmProvider = assistantData?.llmProvider || defaultServices.llm.provider;
    const llmModel = assistantData?.llmModel || 
      LLM_PROVIDERS.find(p => p.name.toLowerCase() === llmProvider)?.models[0].value;
    
    const ttsProvider = assistantData?.ttsProvider || defaultServices.tts.provider;
    const ttsVoice = assistantData?.ttsVoice || 
      TTS_PROVIDERS.find(p => p.name.toLowerCase() === ttsProvider)?.voices[0].value;

    const config = {
      llmProvider,
      llmModel,
      ttsProvider,
      ttsVoice,
      systemPrompt: assistantData?.systemPrompt
    };

    setVoiceConfig(config);

    const voiceClient = new RTVIClient({
      transport: new DailyTransport(),
      params: {
        baseUrl: import.meta.env.VITE_API_URL || "/api",
        requestData: {
          services: {
            llm: {
              provider: config.llmProvider,
              model: config.llmModel
            },
            tts: {
              provider: config.ttsProvider,
              voice: config.ttsVoice
            }
          },
          config: [
            ...defaultConfig,
            ...(config.systemPrompt ? [{
              type: "system",
              content: config.systemPrompt
            }] : [])
          ],
        },
      },
      timeout: 15000,
    });

    const llmHelper = new LLMHelper({});
    voiceClient.registerHelper("llm", llmHelper);

    voiceClientRef.current = voiceClient;
    setIsReady(true);

    // Notify parent component about voice configuration
    if (onVoiceConfigUpdate) {
      onVoiceConfigUpdate(config);
    }
  }, [assistantData, onVoiceConfigUpdate]);

  const handleStartVoiceInteraction = async () => {
    if (!voiceClientRef.current) return;

    try {
      setIsListening(true);
      console.log("Starting voice interaction");
      await voiceClientRef.current.start();
    } catch (error) {
      console.error("Voice interaction error:", error);
      setIsListening(false);
    }
  };

  const handleStopVoiceInteraction = async () => {
    if (!voiceClientRef.current) return;

    try {
      await voiceClientRef.current.stop();
      setIsListening(false);
    } catch (error) {
      console.error("Stop voice interaction error:", error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {isReady ? (
        <>
          <button 
            onClick={handleStartVoiceInteraction}
            className="bg-blue-500 text-white p-2 rounded"
            disabled={isListening}
          >
            {isListening ? 'Listening...' : 'Start Voice'}
          </button>
          {isListening && (
            <button 
              onClick={handleStopVoiceInteraction}
              className="bg-red-500 text-white p-2 rounded"
            >
              Stop
            </button>
          )}
        </>
      ) : (
        <p>Initializing Voice Assistant...</p>
      )}
    </div>
  );
}
